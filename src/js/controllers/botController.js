'use strict';

angular.module('copayApp.controllers').controller('botController',
  function($stateParams, $scope, $rootScope, $timeout, configService, profileService, isCordova, go, correspondentListService) {
	
	var self = this;
	var bots = require('byteballcore/bots.js');
	var fc = profileService.focusedClient;
	$scope.backgroundColor = fc.backgroundColor;
	$scope.$root = $rootScope;
	
	var id = $stateParams.id;

	bots.getBotByID(id, function(bot){
		bot.description = correspondentListService.escapeHtmlAndInsertBr(bot.description);
		$scope.bot = bot;
		$timeout(function(){
			$scope.$digest();
		});
	})

	$scope.pair = function(bot) {
		var matches = bot.pairing_code.match(/^([\w\/+]+)@([\w.:\/-]+)#([\w\/+-]+)$/);
		var pubkey = matches[1];
		var hub = matches[2];
		var pairing_secret = matches[3];
		$scope.index.setOngoingProcess("pairing", true);
		correspondentListService.acceptInvitation(hub, pubkey, pairing_secret, function(err){
			$scope.index.setOngoingProcess("pairing", false);
		});
	}

	$scope.open = function(bot) {
		correspondentListService.setCurrentCorrespondent(bot.device_address, function(){
			go.path('correspondentDevices.correspondentDevice');
		});
	}
});