'use strict';

angular.module('copayApp.controllers').controller('editCorrespondentDeviceController',
  function($scope, $rootScope, $timeout, configService, profileService, isCordova, go, correspondentListService, $modal, animationService) {
	
	var self = this;
	
	var fc = profileService.focusedClient;
	$scope.backgroundColor = fc.backgroundColor;
	var correspondent = correspondentListService.currentCorrespondent;
	$scope.correspondent = correspondent;
	$scope.name = correspondent.name;
	$scope.hub = correspondent.hub;

	var prosaic_contract = require('ocore/prosaic_contract.js');
	prosaic_contract.getAllByStatus("accepted", function(contracts){
		$scope.contracts = [];
		contracts.forEach(function(contract){
			if (contract.peer_device_address === correspondent.device_address)
				$scope.contracts.push(contract);
		});
		$scope.contracts = contracts;
		$timeout(function(){
			$rootScope.$digest();
		});
	});

	$scope.showContract = function(hash){
		$rootScope.modalOpened = true;
		prosaic_contract.getByHash(hash, function(objContract){
			if (!objContract)
				throw Error("no contract found in database for hash " + hash);
			var ModalInstanceCtrl = function($scope, $modalInstance) {
				$scope.unit = objContract.unit;
				$scope.status = objContract.status;
				$scope.title = objContract.title;
				$scope.text = objContract.text;
				$scope.creation_date = objContract.creation_date;

				correspondentListService.populateScopeWithAttestedFields($scope, objContract.my_address, objContract.peer_address, function() {
					$timeout(function() {
						$rootScope.$apply();
					});
				});

				$timeout(function() {
					$rootScope.$apply();
				});

				$scope.close = function() {
					$modalInstance.dismiss('cancel');
				};

				$scope.expandProofBlock = function() {
					$scope.proofBlockExpanded = !$scope.proofBlockExpanded;
				};

				$scope.openInExplorer = correspondentListService.openInExplorer;
			};

			var modalInstance = $modal.open({
				templateUrl: 'views/modals/view-prosaic-contract.html',
				windowClass: animationService.modalAnimated.slideUp,
				controller: ModalInstanceCtrl,
				scope: $scope
			});

			var disableCloseModal = $rootScope.$on('closeModal', function() {
				modalInstance.dismiss('cancel');
			});

			modalInstance.result.finally(function() {
				$rootScope.modalOpened = false;
				disableCloseModal();
				var m = angular.element(document.getElementsByClassName('reveal-modal'));
				m.addClass(animationService.modalAnimated.slideOutDown);
			});
		});
	};

	$scope.save = function() {
		$scope.error = null;
		correspondent.name = $scope.name;
		correspondent.hub = $scope.hub;
		var device = require('ocore/device.js');
		device.updateCorrespondentProps(correspondent, function(){
			go.path('correspondentDevices.correspondentDevice');
		});
	};

	$scope.purge_chat = function() {
      var ModalInstanceCtrl = function($scope, $modalInstance, $sce, gettext) {
        $scope.title = $sce.trustAsHtml('Delete the whole chat history with ' + correspondent.name + '?');

        $scope.ok = function() {
          $modalInstance.close(true);
          go.path('correspondentDevices.correspondentDevice');

        };
        $scope.cancel = function() {
          $modalInstance.dismiss('cancel');
          go.path('correspondentDevices.correspondentDevice.editCorrespondentDevice');
        };
      };

      var modalInstance = $modal.open({
        templateUrl: 'views/modals/confirmation.html',
        windowClass: animationService.modalAnimated.slideUp,
        controller: ModalInstanceCtrl
      });

      modalInstance.result.finally(function() {
        var m = angular.element(document.getElementsByClassName('reveal-modal'));
        m.addClass(animationService.modalAnimated.slideOutDown);
      });

      modalInstance.result.then(function(ok) {
        if (ok) {
          	var chatStorage = require('ocore/chat_storage.js');
			chatStorage.purge(correspondent.device_address);
			correspondentListService.messageEventsByCorrespondent[correspondent.device_address] = [];
        }
        
      });
	}

	function setError(error){
		$scope.error = error;
	}

	
});
