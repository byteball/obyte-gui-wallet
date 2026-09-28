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

	function graphPoint(x, y) {
		return (Math.round(x * 10) / 10) + ' ' + (Math.round(y * 10) / 10);
	}

	function buildGraph(unit, parentUnits) {
		let parents = uniqueParentUnits(unit, parentUnits);
		const parentSpacing = parents.length === 2 ? 112 : (parents.length > 4 && parents.length % 2 === 0 ? 120 : 88);
		const width = Math.max(320, (parents.length - 1) * parentSpacing + 96);
		const rootX = width / 2;
		const sentY = 52;
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
				y: sentY
			},
			parents: parents,
			contextEdges: parents.reduce(function(edges, parent) {
				edges.push({
					path: 'M ' + (parent.x - 10) + ' 174 L ' + (parent.x - 24) + ' 216'
				});
				edges.push({
					path: 'M ' + (parent.x + 10) + ' 174 L ' + (parent.x + 24) + ' 216'
				});
				return edges;
			}, []),
			edges: parents.map(function(parent, index) {
				const startX = rootX + (parents.length === 1 ? 0 : -10 + index * 20 / (parents.length - 1));
				const startY = sentY + 14;
				const dx = parent.x - startX;
				const dy = parent.y - startY;
				const distance = Math.sqrt(dx * dx + dy * dy);
				const directionX = dx / distance;
				const directionY = dy / distance;
				const tipX = parent.x - directionX * 16;
				const tipY = parent.y - directionY * 16;
				const baseX = tipX - directionX * 10;
				const baseY = tipY - directionY * 10;
				const sideX = directionY * 6;
				const sideY = -directionX * 6;

				return {
					path: 'M ' + graphPoint(startX, startY) + ' L ' + graphPoint(baseX, baseY),
					arrowPath: 'M ' + graphPoint(baseX + sideX, baseY + sideY) + ' L ' + graphPoint(tipX, tipY) + ' L ' + graphPoint(baseX - sideX, baseY - sideY) + ' Z'
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
