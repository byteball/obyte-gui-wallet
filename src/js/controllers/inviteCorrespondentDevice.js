'use strict';

var eventBus = require('byteballcore/event_bus.js');

angular.module('copayApp.controllers').controller('inviteCorrespondentDeviceController',
  function($scope, $timeout, profileService, go, isCordova, correspondentListService, gettextCatalog) {
    
    var self = this;
    
    function onPaired(peer_address){
        correspondentListService.setCurrentCorrespondent(peer_address, function(bAnotherCorrespondent){
            go.path('correspondentDevices.correspondentDevice');
        });
    }
    
    var conf = require('byteballcore/conf.js');
	$scope.protocol = conf.program;
	$scope.qr_version = (conf.program === 'byteball') ? 5 : 6; // longer code doesn't fit into version 5
    $scope.isCordova = isCordova;
    var fc = profileService.focusedClient;
    $scope.color = fc.backgroundColor;
    

    $scope.$on('qrcode:error', function(event, error){
        console.log(error);
    });
    
    $scope.copyCode = function() {
        console.log("copyCode");
        //$scope.$digest();
        if (isCordova) {
            window.cordova.plugins.clipboard.copy($scope.code);
            window.plugins.toast.showShortCenter(gettextCatalog.getString('Copied to clipboard'));
        }
    };

    $scope.onTextClick = function ($event) {
        console.log("onTextClick");
        $event.target.select();
    };
    
    $scope.error = null;
    correspondentListService.startWaitingForPairing(function(pairingInfo){
        console.log("beginAddCorrespondent " + pairingInfo.pairing_secret);
        $scope.code = pairingInfo.device_pubkey + "@" + pairingInfo.hub + "#" + pairingInfo.pairing_secret;
        $scope.$digest();
        //$timeout(function(){$scope.$digest();}, 100);
        var eventName = 'paired_by_secret-'+pairingInfo.pairing_secret;
        eventBus.once(eventName, onPaired);
        $scope.$on('$destroy', function() {
            console.log("removing listener for pairing by our secret");
            eventBus.removeListener(eventName, onPaired);
        });
    });

    $scope.cancelAddCorrespondent = function() {
        go.path('correspondentDevices');
    };



  });
