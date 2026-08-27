'use strict';

const postSendDagConstants = require('ocore/constants.js');

angular.module('copayApp.services').factory('postSendDagService', function($modal, $rootScope, $timeout, animationService, go) {
	let activeModalInstance = null;

	function shortenUnit(unit) {
		return unit.slice(0, 7) + '\u2026';
	}

	function uniqueParentUnits(unit, parentUnits) {
		const seen = {};
		return parentUnits.filter(function(parentUnit) {
			if (typeof parentUnit !== 'string' || !parentUnit || parentUnit === unit || seen[parentUnit])
				return false;
			seen[parentUnit] = true;
			return true;
		});
	}

	function buildGraph(unit, parentUnits) {
		let parents = uniqueParentUnits(unit, parentUnits);
		const parentSpacing = parents.length <= 4 ? 88 : (parents.length % 2 ? 88 : 120);
		const width = Math.max(320, (parents.length - 1) * parentSpacing + 96);
		const rootX = width / 2;
		const parentY = 164;
		const firstParentX = (width - (parents.length - 1) * parentSpacing) / 2;

		parents = parents.map(function(parentUnit, index) {
			const x = parents.length === 1 ? rootX : firstParentX + index * parentSpacing;
			return {
				unit: parentUnit,
				shortUnit: shortenUnit(parentUnit),
				x: Math.round(x),
				y: parentY
			};
		});

		return {
			width: width,
			height: 214,
			scrollable: parents.length > 4,
			sent: {
				shortUnit: shortenUnit(unit),
				x: rootX,
				y: 42
			},
			parents: parents,
			contextEdges: parents.reduce(function(edges, parent) {
				edges.push({
					path: 'M ' + (parent.x - 10) + ' 174 L ' + (parent.x - 34) + ' 216'
				});
				edges.push({
					path: 'M ' + (parent.x + 10) + ' 174 L ' + (parent.x + 34) + ' 216'
				});
				return edges;
			}, []),
			edges: parents.map(function(parent) {
				return {
					path: 'M ' + rootX + ' 90 C ' + rootX + ' 112, ' + parent.x + ' 122, ' + parent.x + ' 145',
					arrowPath: 'M ' + (parent.x - 6) + ' 135 L ' + parent.x + ' 145 L ' + (parent.x + 6) + ' 135'
				};
			})
		};
	}

	function buildAnimation(parentCount) {
		return {
			sentDelay: 0.03,
			edgeStart: 0.14,
			edgeStep: parentCount > 1 ? Math.min(0.006, 0.06 / (parentCount - 1)) : 0
		};
	}

	function runOnce(callback) {
		let called = false;
		return function() {
			if (called)
				return;
			called = true;
			if (callback)
				callback();
		};
	}

	function centerGraph() {
		const viewport = document.querySelector('.post-send-dag-modal .post-send-dag-viewport');
		if (!viewport)
			return;
		const graph = viewport.querySelector('.post-send-dag-graph');
		const graphWidth = graph ? graph.getBoundingClientRect().width : 0;
		viewport.scrollLeft = Math.max(0, (graphWidth - viewport.clientWidth) / 2);
	}

	const root = {};

	root.open = function(options, onContinue) {
		options = options || {};
		const unit = options.unit;
		const parentUnits = Array.isArray(options.parentUnits) ? options.parentUnits : [];
		const continueOnce = runOnce(onContinue);

		if (typeof unit !== 'string' || !unit || !parentUnits.length || activeModalInstance) {
			continueOnce();
			return false;
		}

		const graph = buildGraph(unit, parentUnits);
		if (!graph.parents.length) {
			continueOnce();
			return false;
		}

		const ModalInstanceCtrl = function($scope, $modalInstance) {
			$scope.graph = graph;
			$scope.animation = buildAnimation(graph.parents.length);
			const testnet = postSendDagConstants.version.match(/t$/) ? 'testnet' : '';
			$scope.explorerUrl = 'https://' + testnet + 'explorer.obyte.org/#' + unit;
			$scope.continue = function() {
				$modalInstance.close('continue');
			};
			$scope.openInExplorer = function($event) {
				if ($event)
					$event.preventDefault();
				go.openExternalLink($scope.explorerUrl);
			};

			$timeout(centerGraph, 0);
		};

		$rootScope.modalOpened = true;
		try {
			activeModalInstance = $modal.open({
				templateUrl: 'views/modals/post-send-dag.html',
				windowClass: 'post-send-dag-modal',
				controller: ModalInstanceCtrl
			});
		}
		catch (e) {
			$rootScope.modalOpened = false;
			activeModalInstance = null;
			continueOnce();
			return false;
		}

		const modalInstance = activeModalInstance;
		const disableCloseModal = $rootScope.$on('closeModal', function() {
			modalInstance.dismiss('back');
		});

		modalInstance.result.finally(function() {
			disableCloseModal();
			$rootScope.modalOpened = false;
			if (activeModalInstance === modalInstance)
				activeModalInstance = null;
			const modalElements = angular.element(document.getElementsByClassName('reveal-modal'));
			modalElements.addClass(animationService.modalAnimated.slideOutDown);
			$timeout(continueOnce, 0);
		});

		return true;
	};

	return root;
});
