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
  var isTestnet = constants.version.match(/t$/);
  root.TIMESTAMPER_ADDRESS = isTestnet ? 'OPNUXBRSSQQGHKQNEPD2GLWQYEUY5XLD' : 'I2ADHGP4HL6J37NQAD73J7E5SKFIXJOT';
	
  var defaultConfig = {
	// wallet limits
	limits: {
		totalCosigners: 6
	},

	hub: (constants.alt === '2' && isTestnet) ? 'byteball.org/bb-test' : 'byteball.org/bb',

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
		unitValue: 1,
		unitDecimals: 0,
		unitCode: 'one',
		bbUnitName: 'blackbytes',
		bbUnitValue: 1,
		bbUnitDecimals: 0,
		bbUnitCode: 'one',
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
  autoUpdateWitnessesList: true
  };

  var configCache = null;


  root.getSync = function() {
	if (!configCache)
		throw new Error('configService#getSync called when cache is not initialized');
	return configCache;
  };

  root.get = function(cb) {

	storageService.getConfig(function(err, localConfig) {
	  configCache = migrateLocalConfig(localConfig);
	  $log.debug('Preferences read:', configCache);
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
		checkAndReplaceOldUnitCode(config.wallet.settings);
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
  
  if(window.config){
	  configCache = migrateLocalConfig(window.config);
  }else{
  	root.get(function() {});
  }
  
  function migrateLocalConfig(localConfig) {
	  if (localConfig) {
		  var _config = JSON.parse(localConfig);

		  //these ifs are to avoid migration problems
		  if (!_config.wallet) {
			  _config.wallet = defaultConfig.wallet;
		  }
		  if (!_config.wallet.settings.unitCode) {
			  _config.wallet.settings.unitCode = defaultConfig.wallet.settings.unitCode;
		  }
		  if (!_config.wallet.settings.unitValue){
			  if(_config.wallet.settings.unitToBytes){
				  configCache.wallet.settings.unitValue = configCache.wallet.settings.unitToBytes;
			  }else{
				  configCache.wallet.settings.unitValue = defaultConfig.wallet.settings.unitValue;
			  }
		  }
		  if (!_config.wallet.settings.bbUnitName) {
			  _config.wallet.settings.bbUnitName = defaultConfig.wallet.settings.bbUnitName;
		  }
		  if (!_config.wallet.settings.bbUnitValue) {
			  _config.wallet.settings.bbUnitValue = defaultConfig.wallet.settings.bbUnitValue;
		  }
		  if (!_config.wallet.settings.bbUnitDecimals) {
			  _config.wallet.settings.bbUnitDecimals = defaultConfig.wallet.settings.bbUnitDecimals;
		  }
		  if (!_config.wallet.settings.bbUnitCode) {
			  _config.wallet.settings.bbUnitCode = defaultConfig.wallet.settings.bbUnitCode;
		  }
		  if (!_config.pushNotifications) {
			  _config.pushNotifications = defaultConfig.pushNotifications;
		  }
		  if (!_config.hub)
			  _config.hub = defaultConfig.hub;
		  if (!_config.deviceName)
			  _config.deviceName = defaultConfig.getDeviceName();

		  checkAndReplaceOldUnitCode(_config.wallet.settings);
	  } else {
		  _config = lodash.clone(defaultConfig);
		  _config.deviceName = defaultConfig.getDeviceName();
	  }
	  return _config;
  }
  
  function checkAndReplaceOldUnitCode(setting) {
	  switch (setting.unitCode){
		  case 'byte':
				setting.unitCode = 'one';
				setting.unitValue = 1;
		  	break;
		  case 'kB':
				setting.unitCode = 'kilo';
				setting.unitValue = 1000;
		  	break;
		  case 'MB':
				setting.unitCode = 'mega';
				setting.unitValue = 1000000;
		  	break;
		  case 'GB':
				setting.unitCode = 'giga';
				setting.unitValue = 1000000000;
		  	break;
	  }
  }


  return root;
});
