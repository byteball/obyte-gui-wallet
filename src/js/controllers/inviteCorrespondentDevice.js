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

        function determineQRcodeVersionFromString( inputtext ) {
            // maximum characters per QR code version using ECC level m
            // source: http://www.qrcode.com/en/about/version.html
            var maxCharsforQRVersion = [0,14,26,42,62,84,106,122,152,180,213];
            var qrversion = 5;
            // find lowest version number that has enough space for our text
            for (var i = (maxCharsforQRVersion.length-1); i > 0 ; i--) {
                if ( maxCharsforQRVersion[i] >= inputtext.length)
                {
                    qrversion = i;
                }
            }

            return qrversion;
        }

        var qrstring = $scope.protocol + ":" +$scope.code;  //as passed to the qr generator in inviteCorrespondentDevice.html
        $scope.qr_version = determineQRcodeVersionFromString( qrstring );

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
