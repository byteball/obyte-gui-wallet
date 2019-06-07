'use strict';

angular.module('copayApp.controllers').controller('editCorrespondentDeviceController',
  function($scope, $rootScope, $timeout, configService, profileService, isCordova, go, correspondentListService, $modal, animationService, nodeWebkit, gettext, notification) {
	
	var self = this;
	
	var fc = profileService.focusedClient;
	$scope.backgroundColor = fc.backgroundColor;
	var correspondent = correspondentListService.currentCorrespondent;
	$scope.correspondent = correspondent;
	$scope.name = correspondent.name;
	$scope.hub = correspondent.hub;

	var indexScope = $scope.index;
	var db = require('ocore/db.js');
	
	function readAndSetPushNotificationsSetting(delay){
		db.query("SELECT push_enabled FROM correspondent_devices WHERE device_address=?", [correspondent.device_address], function(rows){
			if (rows.length === 0)
				return console.log("correspondent "+correspondent.device_address+" not found, probably already removed");
			$scope.pushNotifications = !!rows[0].push_enabled;
			
			$timeout(function(){
				$scope.$digest();
			}, delay || 0);
		});
	}
	
	$scope.updatePush = function(){
		console.log("push "+$scope.pushNotifications);
		var push_enabled = $scope.pushNotifications ? 1 : 0;
		var device = require('ocore/device.js');
		device.updateCorrespondentSettings(correspondent.device_address, {push_enabled: push_enabled}, function(err){
			setError(err);
			if (err)
				return readAndSetPushNotificationsSetting(100);
			db.query("UPDATE correspondent_devices SET push_enabled=? WHERE device_address=?", [push_enabled, correspondent.device_address]);
		});
	}
	
	if (indexScope.usePushNotifications)
		readAndSetPushNotificationsSetting();
	
	var prosaic_contract = require('ocore/prosaic_contract.js');
	var db = require('ocore/db.js');
	prosaic_contract.getAllByStatus("accepted", function(contracts){
		$scope.contracts = [];
		contracts.forEach(function(contract){
			if (contract.peer_device_address === correspondent.device_address)
				$scope.contracts.push(contract);
		});
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
				$scope.index = indexScope;
				$scope.unit = objContract.unit;
				$scope.status = objContract.status;
				$scope.title = objContract.title;
				$scope.text = objContract.text;
				$scope.creation_date = objContract.creation_date
				$scope.hash = objContract.hash;
				$scope.calculated_hash = prosaic_contract.getHash(objContract);
				$scope.calculated_hash_V1 = prosaic_contract.getHashV1(objContract);
				$scope.my_address = objContract.my_address;
				$scope.peer_address = objContract.peer_address;
				if (objContract.unit) {
					db.query("SELECT payload FROM messages WHERE app='data' AND unit=?", [objContract.unit], function(rows) {
						if (!rows.length)
							return;
						var payload = rows[0].payload;
						try {
							$scope.hash_inside_unit = JSON.parse(payload).contract_text_hash;
							$timeout(function() {
								$rootScope.$apply();
							});
						} catch (e) {}
					})
				};

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

				$scope.checkValidity = function() {
					$timeout(function() {
						$scope.validity_checked = true;
					}, 500);
				}

				$scope.copyToClipboard = function() {
					var sourcetext = document.getElementById('sourcetext');
					var text = sourcetext.value;
					sourcetext.selectionStart = 0;
					sourcetext.selectionEnd = text.length;
					notification.success(gettext('Copied to clipboard'));
					if (isCordova) {
						cordova.plugins.clipboard.copy(text);
					} else if (nodeWebkit.isDefined()) {
						nodeWebkit.writeToClipboard(text);
					}
				}
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
