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

  var constants = require('ocore/constants.js');
  var isTestnet = constants.version.match(/t$/);
  root.TIMESTAMPER_ADDRESS = isTestnet ? 'OPNUXBRSSQQGHKQNEPD2GLWQYEUY5XLD' : 'I2ADHGP4HL6J37NQAD73J7E5SKFIXJOT';
	root.backupExceedingAmountUSD = 10;
	
  root.oracles = {
		"FOPUBEUPBC6YLIQDLKL6EW775BMV7YOH": {
			name: "Bitcoin oracle",
			feedname_placeholder: "bitcoin_merkle or randomXXXXXX",
			feedvalue_placeholder: "e.g. 1LR5xew1X13okNYKRu7qA3uN4hpRH1Tfnn:0.5",
			instructions_url: "https://medium.com/obyte/making-p2p-great-again-episode-ii-bitcoin-exchange-d98adfbde2a5",
			feednames_filter: ["^bitcoin_merkle$", "^random[\\d]+$"],
			feedvalues_filter: ["^[13][a-km-zA-HJ-NP-Z1-9]{25,34}\\:[0-9\\.]+$", "^\\d{1,6}$"]
		},
		"JPQKPRI5FMTQRJF4ZZMYZYDQVRD55OTC" : {
			name: "Crypto exchange rates oracle",
			feedname_placeholder: "e.g. BTC_USD",
			feedvalue_placeholder: "e.g. 1234.56",
			instructions_url: "https://wiki.obyte.org/Oracle#Using_the_crypto-exchange-rates_oracle_in_a_smart_contract",
			feednames_filter: ["^[\\dA-Z]+_[\\dA-Z]+$"],
			feedvalues_filter: ["^[\\d\\.]+$"]
		},
		"GFK3RDAPQLLNCMQEVGGD2KCPZTLSG3HN" : {
			name: "Flight delay oracle",
			feedname_placeholder: "e.g. BA950-2018-12-25",
			feedvalue_placeholder: "e.g. 30",
			instructions_url: "https://wiki.obyte.org/Oracle#Flight_delays_tracker",
			feednames_filter: ["^[\\w\\d]+-\\d{4}-\\d{2}-\\d{2}$"],
			feedvalues_filter: ["^[\\d]+$"]
		},
		"TKT4UESIKTTRALRRLWS4SENSTJX6ODCW" : {
			name: "Sports betting oracle",
			feedname_placeholder: "e.g. BROOKLYNNETS_CHARLOTTEHORNETS_2018-03-21",
			feedvalue_placeholder: "e.g. BROOKLYNNETS",
			instructions_url: "https://wiki.obyte.org/Sports_betting",
			feednames_filter: ["^[\\w\\d]+_[\\w\\d]+_\\d{4}-\\d{2}-\\d{2}$"],
			feedvalues_filter: ["^[\\w\\d]+$"]
		},
		"I2ADHGP4HL6J37NQAD73J7E5SKFIXJOT" : {
			name: "Timestamp oracle",
			feedname_placeholder: "timestamp",
			feedvalue_placeholder: "e.g. 1541341626704",
			instructions_url: "https://wiki.obyte.org/Oracle",
			feednames_filter: ["^timestamp$"],
			feedvalues_filter: ["^\\d{13,}$"]
		}
	};

	root.privateTextcoinExt = 'coin';
	
  var defaultConfig = {
	// wallet limits
	limits: {
		totalCosigners: 6
	},

	hub: (constants.alt === '2' && isTestnet) ? 'obyte.org/bb-test' : 'obyte.org/bb',
	attestorAddresses: {
		email: 'H5EZTQE7ABFH27AUDTQFMZIALANK6RBG',
		reddit: 'OYW2XTDKSNKGSEZ27LMGNOPJSYIXHBHC',
		steem: 'JEDZYC2HMGDBIDQKG3XSTXUSHMCBK725',
		username: 'UENJPVZ7HVHM6QGVGT6MWOJGGRTUTJXQ'
	},
	realNameAttestorAddresses: [
		{ address: 'I2ADHGP4HL6J37NQAD73J7E5SKFIXJOT', name: 'Real name attestation bot (Jumio)' },
		{ address: 'OHVQ2R5B6TUR5U7WJNYLP3FIOSR7VCED', name: 'Real name attestation bot (Smart card, Mobile ID, Smart ID)' }
	],

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
	  singleAddress: false,
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
		},
	},

	// hidden assets: key = wallet id, value = set of assets (string: boolean)
	hiddenAssets: {},

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
	  if (newOpts.realNameAttestorAddresses)
	  	config.realNameAttestorAddresses = newOpts.realNameAttestorAddresses;
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
				_config.wallet.settings.unitValue = _config.wallet.settings.unitToBytes;
			}else{
				_config.wallet.settings.unitValue = defaultConfig.wallet.settings.unitValue;
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
		if (!_config.attestorAddresses) {
			_config.attestorAddresses = defaultConfig.attestorAddresses;
		}
		if (!_config.realNameAttestorAddresses) {
			_config.realNameAttestorAddresses = defaultConfig.realNameAttestorAddresses;
		}
		for (var attestorKey in defaultConfig.attestorAddresses){
			if (!(attestorKey in _config.attestorAddresses))
				_config.attestorAddresses[attestorKey] = defaultConfig.attestorAddresses[attestorKey];
		}
		if (!_config.hiddenAssets) {
			_config.hiddenAssets = defaultConfig.hiddenAssets;
		}
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
