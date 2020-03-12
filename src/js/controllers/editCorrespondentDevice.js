'use strict';

angular.module('copayApp.controllers').controller('editCorrespondentDeviceController',
  function($scope, $rootScope, $timeout, configService, profileService, isCordova, go, correspondentListService, correspondentService, $modal, animationService, nodeWebkit, gettext, notification) {
	
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
		$scope.prosaicContracts = [];
		contracts.forEach(function(contract){
			if (contract.peer_device_address === correspondent.device_address)
				$scope.prosaicContracts.push(contract);
		});
		$timeout(function(){
			$rootScope.$digest();
		});
	});

	var arbiter_contract = require('ocore/arbiter_contract.js');
	var db = require('ocore/db.js');
	arbiter_contract.getAllByStatus(["accepted", "paid"], function(contracts){
		$scope.arbiterContracts = [];
		contracts.forEach(function(contract){
			if (contract.peer_device_address === correspondent.device_address)
				$scope.arbiterContracts.push(contract);
		});
		$timeout(function(){
			$rootScope.$digest();
		});
	});

	$scope.showProsaicContract = function(hash){
		correspondentService.showProsaicContractOfferModal($scope, hash, false, function(){});
	};

	$scope.showArbiterContract = function(hash){
		correspondentService.showArbiterContractOfferModal($scope, hash, false, function(){});
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
        $scope.title = 'Delete the whole chat history with ' + correspondent.name + '?';

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
