'use strict';

angular.module('copayApp.controllers').controller('splashController',
  function($scope, $timeout, $log, configService, profileService, storageService, go, isCordova) {
	
	var self = this;
	
	this.saveDeviceName = function(){
		console.log('saveDeviceName: '+self.deviceName);
		var device = require('byteballcore/device.js');
		device.setDeviceName(self.deviceName);
		var opts = {deviceName: self.deviceName};
		configService.set(opts, function(err) {
			$timeout(function(){
				if (err)
					self.$emit('Local/DeviceError', err);
				self.bDeviceNameSet = true;
			});
		});
	};
   
	configService.get(function(err, config) {
		if (err)
			throw Error("failed to read config");
		self.deviceName = config.deviceName;
	});
	
	this.step = isCordova ? 'device_name' : 'wallet_type';
	this.wallet_type = 'light';
	
	this.setWalletType = function(){
		var bLight = (self.wallet_type === 'light');
		if (!bLight){
			self.step = 'device_name';
			return;
		}
		var fs = require('fs'+'');
		var desktopApp = require('byteballcore/desktop_app.js');
		var appDataDir = desktopApp.getAppDataDir();
		var userConfFile = appDataDir + '/conf.json';
		fs.writeFile(userConfFile, JSON.stringify({bLight: bLight}, null, '\t'), 'utf8', function(err){
			if (err)
				throw Error('failed to write conf.json: '+err);
			var conf = require('byteballcore/conf.js');
			if (!conf.bLight)
				throw Error("Failed to switch to light, please restart the app");
			self.step = 'device_name';
			$timeout(function(){
				$scope.$apply();
			});
		});
	};
	
	this.create = function(noWallet) {
		if (self.creatingProfile)
			return console.log('already creating profile');
		self.creatingProfile = true;
	//	saveDeviceName();

		$timeout(function() {
			profileService.create({noWallet: noWallet}, function(err) {
				if (err) {
					self.creatingProfile = false;
					$log.warn(err);
					self.error = err;
					$timeout(function(){
						$scope.$apply();
					});
					/*$timeout(function() {
						self.create(noWallet);
					}, 3000);*/
				}
			});
		}, 100);
	};

	this.init = function() {
		storageService.getDisclaimerFlag(function(err, val) {
			if (!val) go.path('preferencesGlobal.preferencesAbout.disclaimer');

			if (profileService.profile) {
				go.walletHome();
			}
		});
	};
  });
