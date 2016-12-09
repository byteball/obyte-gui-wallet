'use strict';

angular.module('copayApp.services').factory('configService', function(storageService, lodash, $log, isCordova) {
  var root = {};

	root.colorOpts = [
	  '#DD4B39',
	  '#F38F12',
	  '#FAA77F',
	  '#FADA58',
	  '#9EDD72',
	  '#77DADA',
	  '#4A90E2',
	  '#484ED3',
	  '#9B59B6',
	  '#E856EF',
	  '#FF599E',
	  '#7A8C9E',
	];
	
  var constants = require('byteballcore/constants.js');
  var defaultConfig = {
	// wallet limits
	limits: {
		totalCosigners: 6
	},

	hub: (constants.alt === '2' && constants.version.match(/t$/)) ? 'byteball.org/bb-test' : 'byteball.org/bb',
	  
	// requires bluetooth permission on android
	//deviceName: /*isCordova ? cordova.plugins.deviceName.name : */require('os').hostname(),
	  
	getDeviceName: function(){
		return isCordova ? cordova.plugins.deviceName.name : require('os').hostname();
	},

	// wallet default config
	wallet: {
	  requiredCosigners: 2,
	  totalCosigners: 3,
	  spendUnconfirmed: false,
	  reconnectDelay: 5000,
	  idleDurationMin: 4,
	  settings: {
		unitName: 'bytes',
		unitToBytes: 1,
		unitDecimals: 0,
		unitCode: 'byte',
		alternativeName: 'US Dollar',
		alternativeIsoCode: 'USD',
	  }
	},


	rates: {
	  url: 'https://insight.bitpay.com:443/api/rates',
	},
	  
	pushNotifications: {
	  enabled: true,
	  config: {
		android: {
		  senderID: '1036948132229',
		  icon: 'push',
		  iconColor: '#2F4053'
		},
		ios: {
		  alert: 'true',
		  badge: 'true',
		  sound: 'true',
		},
		windows: {},
	  }
	},
  };

  var configCache = null;


  root.getSync = function() {
	if (!configCache)
		throw new Error('configService#getSync called when cache is not initialized');
	return configCache;
  };

  root.get = function(cb) {

	storageService.getConfig(function(err, localConfig) {
	  if (localConfig) {
		configCache = JSON.parse(localConfig);

		//these ifs are to avoid migration problems
		if (!configCache.wallet) {
		  configCache.wallet = defaultConfig.wallet;
		}
		if (!configCache.wallet.settings.unitCode) {
		  configCache.wallet.settings.unitCode = defaultConfig.wallet.settings.unitCode;
		}
		if (!configCache.pushNotifications) {
		  configCache.pushNotifications = defaultConfig.pushNotifications;
		}
		if (!configCache.hub)
			configCache.hub = defaultConfig.hub;
		if (!configCache.deviceName)
			configCache.deviceName = defaultConfig.getDeviceName();
	  } else {
		configCache = lodash.clone(defaultConfig);
		configCache.deviceName = defaultConfig.getDeviceName();
	  };

	  $log.debug('Preferences read:', configCache)
	  return cb(err, configCache);
	});
  };

  root.set = function(newOpts, cb) {
	var config = defaultConfig;
	storageService.getConfig(function(err, oldOpts) {
	  if (lodash.isString(oldOpts)) {
		oldOpts = JSON.parse(oldOpts);
	  }
	  if (lodash.isString(config)) {
		config = JSON.parse(config);
	  }
	  if (lodash.isString(newOpts)) {
		newOpts = JSON.parse(newOpts);
	  }
	  lodash.merge(config, oldOpts, newOpts);
	  configCache = config;

	  storageService.storeConfig(JSON.stringify(config), cb);
	});
  };

  root.reset = function(cb) {
	configCache = lodash.clone(defaultConfig);
	storageService.removeConfig(cb);
  };

  root.getDefaults = function() {
	return lodash.clone(defaultConfig);
  };


  return root;
});
