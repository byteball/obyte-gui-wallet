'use strict';

var eventBus = require('ocore/event_bus.js');

angular.module('copayApp.controllers').controller('inviteCorrespondentDeviceController',
  function($scope, $rootScope, $timeout, profileService, go, isCordova, correspondentListService, gettextCatalog, electron) {	
    var self = this;
    var indexScope = $scope.index;

	self.isShownCopiedMessage = false;
    
    function onPaired(peer_address){
        correspondentListService.setCurrentCorrespondent(peer_address, function(bAnotherCorrespondent){
            go.path('correspondentDevices.correspondentDevice');
        });
    }
    
    var conf = require('ocore/conf.js');
    $scope.protocol = conf.program;
    $scope.isCordova = isCordova;
    var fc = profileService.focusedClient;
    $scope.color = fc.backgroundColor;
    

    $scope.$on('qrcode:error', function(event, error){
        console.log(error);
    });
    
    $scope.copyCode = function() {
		if (isCordova) {
			window.cordova.plugins.clipboard.copy($scope.code);
			window.plugins.toast.showShortCenter(gettextCatalog.getString('Copied to clipboard'));
		} else if (electron.isDefined()) {
			electron.writeToClipboard($scope.code);
			self.isShownCopiedMessage = true;

			setTimeout(() => {
				self.isShownCopiedMessage = false;
				$rootScope.$apply();
			}, 1250);
		}
    };

    $scope.onTextClick = function ($event) {
        console.log("onTextClick");
        $event.target.select();
    };
    
	$scope.shareCode = function() {
		if (isCordova) {
			if (isMobile.Android() || isMobile.Windows())
				window.ignoreMobilePause = true;
			window.plugins.socialsharing.share(conf.program + ':' + $scope.code, null, null, null);
		}
	};
	
    $scope.error = null;
    correspondentListService.startWaitingForPairing(function(pairingInfo){
        console.log("beginAddCorrespondent " + pairingInfo.pairing_secret);
        $scope.code = pairingInfo.device_pubkey + "@" + pairingInfo.hub + "#" + pairingInfo.pairing_secret;

        var qr_string = $scope.protocol + ":" +$scope.code;  // as passed to the qr generator in inviteCorrespondentDevice.html
        $scope.qr_version = indexScope.determineQRcodeVersionFromString( qr_string );

        $timeout(function(){
        	$scope.$digest();
        });
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
