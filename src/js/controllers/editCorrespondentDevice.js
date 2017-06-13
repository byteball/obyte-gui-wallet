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

	$scope.save = function() {
		$scope.error = null;
		correspondent.name = $scope.name;
		correspondent.hub = $scope.hub;
		var device = require('byteballcore/device.js');
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
          	var chatStorage = require('byteballcore/chat_storage.js');
			chatStorage.purge(correspondent.device_address);
			correspondentListService.messageEventsByCorrespondent[correspondent.device_address] = [];
        }
        
      });
	}

	function setError(error){
		$scope.error = error;
	}

	
});
