'use strict';

angular.module('copayApp.controllers').controller('acceptCorrespondentInvitationController',
  function($scope, $rootScope, $timeout, configService, profileService, isCordova, go, correspondentListService) {
	
	var self = this;
	console.log("acceptCorrespondentInvitationController");
	
	var fc = profileService.focusedClient;
	$scope.backgroundColor = fc.backgroundColor;
	
	$scope.beforeQrCodeScan = function() {
		console.log("beforeQrCodeScan");
		$scope.error = null;
	};

	$scope.onQrCodeScanned = function(data, pairingCodeForm) {
		console.log("onQrCodeScanned", data);
		handleCode(data);
	};


	$scope.pair = function() {
		$scope.error = null;
		handleCode($scope.code);
	};

	function handleCode(code){
		var conf = require('byteballcore/conf.js');
		var re = new RegExp('^'+conf.program+':', 'i');
		code = code.replace(re, '');
		var matches = code.match(/^([\w\/+]+)@([\w.:\/-]+)#([\w\/+-]+)$/);
		if (!matches)
			return setError("Invalid pairing code");
		var pubkey = matches[1];
		var hub = matches[2];
		var pairing_secret = matches[3];
		if (pubkey.length !== 44)
			return setError("Invalid pubkey length");
		//if (pairing_secret.length !== 12)
		//    return setError("Invalid pairing secret length");
		console.log(pubkey, hub, pairing_secret);
		self.setOngoingProcess("pairing");
		correspondentListService.acceptInvitation(hub, pubkey, pairing_secret, function(err){
			self.setOngoingProcess();
			if (err)
				$scope.error = err;
			// acceptInvitation() will already open chat window
			/*else
				go.path('correspondentDevices');*/
		});
	}
	
	function setError(error){
		$scope.error = error;
	}

	this.setOngoingProcess = function(name) {
		var self = this;

		if (isCordova) {
			if (name) {
				window.plugins.spinnerDialog.hide();
				window.plugins.spinnerDialog.show(null, name + '...', true);
			} else {
				window.plugins.spinnerDialog.hide();
			}
		} else {
			$scope.onGoingProcess = name;
			$timeout(function() {
				$rootScope.$apply();
			});
		};
	};
	
  });
