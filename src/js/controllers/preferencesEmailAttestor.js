'use strict';

angular.module('copayApp.controllers').controller('preferencesEmailAttestorController',
	function($scope, $timeout, configService, go){
		var ValidationUtils = require("byteballcore/validation_utils.js");
		var config = configService.getSync();
		this.emailAttestor = config.emailAttestor;
		var self = this;

		this.save = function() {
			if (self.emailAttestor !== '' && !ValidationUtils.isValidAddress(self.emailAttestor))
				return setError("new email attestor address is invalid");
			
			if (!self.emailAttestor)
				$scope.index.assocAddressesByEmail = {};

			configService.set({emailAttestor: self.emailAttestor}, function(err) {
				if (err) 
					return $scope.$emit('Local/DeviceError', err);
				$timeout(function(){
					go.path('preferencesGlobal');
				}, 50);
			});
		};

		function setError(error){
			console.log('err: '+error);
			self.error = error;
			$timeout(function(){
				$scope.$apply();
			}, 100);
		}
	
	}
);
