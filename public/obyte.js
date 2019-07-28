if (typeof Object.assign != 'function') {
	Object.assign = function (target, varArgs) {
	  if (target == null) {
		throw new TypeError('Cannot convert undefined or null to object');
	  }
	  
	  var to = Object(target);
	  for (var index = 1; index < arguments.length; index++) {
		var nextSource = arguments[index];
  
		if (nextSource != null) {
		  for (var nextKey in nextSource) {
			if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
			  to[nextKey] = nextSource[nextKey];
			}
		  }
		}
	  }
	  return to;
	};
  }
  
  var bwcModule = angular.module('bwcModule', []);
  //var Client = require('../node_modules/bitcore-wallet-client');
  console.log("before");
  //console.log("path="+require.resolve('./angular-bitcore-wallet-client/bitcore-wallet-client/index.js'));
  // we are in public/, require() from webkit context
  var Client = require('../angular-bitcore-wallet-client/bitcore-wallet-client/index.js');
  console.log("after");
  
  bwcModule.constant('MODULE_VERSION', '1.0.0');
  
  bwcModule.provider("bwcService", function() {
	var provider = {};
  
	provider.$get = function() {
	  var service = {};
  
	  service.getBitcore = function() {
		return Client.Bitcore;
	  };
  
	  service.getSJCL = function() {
		return Client.sjcl;
	  };
  
  
	  service.getUtils = function() {
		return Client.Utils;
	  };
  
	  service.getClient = function(walletData) {
		var bwc = new Client({});
		if (walletData)
		  bwc.import(walletData);
		return bwc;
	  };
		
	  return service;
	};
  
	return provider;
  });
  
  'use strict';
  
  var modules = [
	'ui.router',
	'angularMoment',
	'angular-carousel',
	'mm.foundation',
	'monospaced.qrcode',
	'monospaced.elastic',
	'gettext',
	'ngLodash',
	'uiSwitch',
	'bwcModule',
	'copayApp.filters',
	'copayApp.services',
	'copayApp.controllers',
	'copayApp.directives',
	'copayApp.addons',
	'ct.ui.router.extras'
  ];
  
  var copayApp = window.copayApp = angular.module('copayApp', modules);
  
  angular.module('copayApp.filters', []);
  angular.module('copayApp.services', []);
  angular.module('copayApp.controllers', []);
  angular.module('copayApp.directives', []);
  angular.module('copayApp.addons', []);
  
  
  'use strict';
  
  var unsupported, isaosp;
  var breadcrumbs = require('ocore/breadcrumbs.js');
  
  if (window && window.navigator) {
	var rxaosp = window.navigator.userAgent.match(/Android.*AppleWebKit\/([\d.]+)/);
	isaosp = (rxaosp && rxaosp[1] < 537);
	if (!window.cordova && isaosp)
	  unsupported = true;
	if (unsupported) {
	  window.location = '#/unsupported';
	}
  }
  
  
  //Setting up route
  angular
	.module('copayApp')
	.config(function(historicLogProvider, $provide, $logProvider, $stateProvider, $urlRouterProvider, $compileProvider, $qProvider) {
		$qProvider.errorOnUnhandledRejections(false);
	  $urlRouterProvider.otherwise('/');
  
	  $logProvider.debugEnabled(true);
	  $provide.decorator('$log', ['$delegate',
		function($delegate) {
		  var historicLog = historicLogProvider.$get();
  
		  ['debug', 'info', 'warn', 'error', 'log'].forEach(function(level) {
  
			var orig = $delegate[level];
			$delegate[level] = function() {
			  if (level == 'error')
				console.log(arguments);
  
			  var args = [].slice.call(arguments);
			  if (!Array.isArray(args)) args = [args];
			  args = args.map(function(v) {
				try {
				  if (typeof v == 'undefined') v = 'undefined';
				  if (!v) v = 'null';
				  if (typeof v == 'object') {
					if (v.message)
					  v = v.message;
					else
					  v = JSON.stringify(v);
				  }
				  // Trim output in mobile
				  if (window.cordova) {
					v = v.toString();
					if (v.length > 1000) {
					  v = v.substr(0, 997) + '...';
					}
				  }
				} catch (e) {
				  console.log('Error at log decorator:', e);
				  v = 'undefined';
				}
				return v;
			  });
			  try {
				if (window.cordova)
				  console.log(args.join(' '));
				historicLog.add(level, args.join(' '));
				orig.apply(null, args);
			  } catch (e) {
				console.log('ERROR (at log decorator):', e, args[0]);
			  }
			};
		  });
		  return $delegate;
		}
	  ]);
  
	  // whitelist 'chrome-extension:' for chromeApp to work with image URLs processed by Angular
	  // link: http://stackoverflow.com/questions/15606751/angular-changes-urls-to-unsafe-in-extension-page?lq=1
	  $compileProvider.imgSrcSanitizationWhitelist(/^\s*((ionic|https?|ftp|file|blob|chrome-extension):|data:image\/)/);
  
	  $stateProvider
		.state('splash', {
		  url: '/splash',
		  needProfile: false,
		  views: {
			'main': {
			  templateUrl: 'views/splash.html',
			}
		  }
		});
  
	  $stateProvider      
		.state('walletHome', {
		  url: '/',
		  walletShouldBeComplete: true,
		  needProfile: true,
		  deepStateRedirect: true,
		  sticky: true,
		  views: {
			'main': {
			  templateUrl: 'views/walletHome.html',
			},
		  }
		})
		.state('unsupported', {
		  url: '/unsupported',
		  needProfile: false,
		  views: {
			'main': {
			  templateUrl: 'views/unsupported.html'
			}
		  }
		})
		
		.state('create', {
		  url: '/create',
		  templateUrl: 'views/create.html',
		  needProfile: true,
		  modal: true,
		  views: {
			'main': {
			  templateUrl: 'views/create.html'
			},
		  }
		})
		.state('copayers', {
		  url: '/copayers',
		  needProfile: true,
		  views: {
			'main': {
			  templateUrl: 'views/copayers.html'
			},
		  }
		})
		.state('correspondentDevices', {
		  url: '/correspondentDevices',
		  walletShouldBeComplete: false,
		  needProfile: true,
		  deepStateRedirect: true,
		  sticky: true,
		  views: {
			'chat': {
			  templateUrl: 'views/correspondentDevices.html'
			},
		  }
		})
		.state('correspondentDevices.correspondentDevice', {
		  url: '/device',
		  walletShouldBeComplete: false,
		  needProfile: true,
		  views: {
			'dialog': {
			  templateUrl: 'views/correspondentDevice.html'
			},
		  }
		})
		.state('correspondentDevices.correspondentDevice.editCorrespondentDevice', {
		  url: '/edit',
		  walletShouldBeComplete: false,
		  needProfile: true,
		  views: {
			'dialog@correspondentDevices': {
			  templateUrl: 'views/editCorrespondentDevice.html'
			},
		  }
		})
	  .state('correspondentDevices.addCorrespondentDevice', {
		url: '/add',
		needProfile: true,
		views: {
		  'dialog': {
			templateUrl: 'views/addCorrespondentDevice.html'
		  },
		}
	  })
		.state('correspondentDevices.addCorrespondentDevice.inviteCorrespondentDevice', {
		  url: '/invite',
		  walletShouldBeComplete: false,
		  needProfile: true,
		  views: {
			'dialog@correspondentDevices': {
			  templateUrl: 'views/inviteCorrespondentDevice.html'
			},
		  }
		})
		.state('correspondentDevices.addCorrespondentDevice.acceptCorrespondentInvitation', {
		  url: '/acceptCorrespondentInvitation',
		  walletShouldBeComplete: false,
		  needProfile: true,
		  views: {
			'dialog@correspondentDevices': {
			  templateUrl: 'views/acceptCorrespondentInvitation.html'
			},
		  }
		})
		.state('correspondentDevices.bot', {
		  url: '/bot/:id',
		  walletShouldBeComplete: false,
		  needProfile: true,
		  views: {
			'dialog': {
			  templateUrl: 'views/bot.html'
			},
		  }
		})
		.state('authConfirmation', {
		  url: '/authConfirmation',
		  walletShouldBeComplete: true,
		  needProfile: true,
		  views: {
			'main': {
			  templateUrl: 'views/authConfirmation.html'
			},
		  }
		})
		.state('preferences', {
		  url: '/preferences',
		  templateUrl: 'views/preferences.html',
		  walletShouldBeComplete: true,
		  needProfile: true,
		  modal: true,
		  views: {
			'main': {
			  templateUrl: 'views/preferences.html',
			},
		  }
		})
		.state('preferences.preferencesColor', {
		  url: '/color',
		  templateUrl: 'views/preferencesColor.html',
		  walletShouldBeComplete: true,
		  needProfile: true,
		  views: {
			'main@': {
			  templateUrl: 'views/preferencesColor.html'
			},
		  }
		})
  
		.state('preferences.preferencesAlias', {
		  url: '/alias',
		  templateUrl: 'views/preferencesAlias.html',
		  walletShouldBeComplete: true,
		  needProfile: true,
		  views: {
			'main@': {
			  templateUrl: 'views/preferencesAlias.html'
			},
  
		  }
		})
		.state('preferences.preferencesHiddenAssets', {
			url: '/hiddenAssets',
			templateUrl: 'views/preferencesHiddenAssets.html',
			walletShouldBeComplete: true,
			needProfile: true,
			views: {
			  'main@': {
				templateUrl: 'views/preferencesHiddenAssets.html'
			  },
			}
		  })
		.state('preferences.preferencesAdvanced', {
			url: '/advanced',
			templateUrl: 'views/preferencesAdvanced.html',
			walletShouldBeComplete: true,
			needProfile: true,
			views: {
			  'main@': {
				templateUrl: 'views/preferencesAdvanced.html'
			  },
			}
		  })
		.state('preferences.preferencesAdvanced.preferencesInformation', {
		  url: '/information',
		  walletShouldBeComplete: true,
		  needProfile: true,
		  views: {
			'main@': {
			  templateUrl: 'views/preferencesInformation.html'
			},
		  }
		})
		.state('preferences.preferencesAdvanced.paperWallet', {
		  url: '/paperWallet',
		  templateUrl: 'views/paperWallet.html',
		  walletShouldBeComplete: true,
		  needProfile: true,
		  views: {
			'main@': {
			  templateUrl: 'views/paperWallet.html'
			},
		  }
		})
		.state('preferences.preferencesAdvanced.preferencesDeleteWallet', {
		  url: '/delete',
		  templateUrl: 'views/preferencesDeleteWallet.html',
		  walletShouldBeComplete: true,
		  needProfile: true,
		  views: {
			'main@': {
			  templateUrl: 'views/preferencesDeleteWallet.html'
			},
		  }
		})
		.state('preferencesGlobal', {
		  url: '/preferencesGlobal',
		  needProfile: true,
		  modal: true,
		  views: {
			'main': {
			  templateUrl: 'views/preferencesGlobal.html',
			},
		  }
		})
		.state('preferencesGlobal.preferencesDeviceName', {
		  url: '/deviceName',
		  walletShouldBeComplete: false,
		  needProfile: false,
		  views: {
			'main@': {
			  templateUrl: 'views/preferencesDeviceName.html'
			},
		  }
		})
		.state('preferencesGlobal.preferencesHub', {
		  url: '/hub',
		  walletShouldBeComplete: false,
		  needProfile: false,
		  views: {
			'main@': {
			  templateUrl: 'views/preferencesHub.html'
			},
		  }
		})
		 .state('preferencesGlobal.preferencesTor', {
			url: '/tor',
			templateUrl: 'views/preferencesTor.html',
			walletShouldBeComplete: true,
			needProfile: true,
			views: {
				'main@': {
					templateUrl: 'views/preferencesTor.html'
				}
			}
		})
		.state('preferencesGlobal.preferencesLanguage', {
		  url: '/language',
		  walletShouldBeComplete: true,
		  needProfile: true,
		  views: {
			'main@': {
			  templateUrl: 'views/preferencesLanguage.html'
			},
		  }
		})
		.state('preferencesGlobal.preferencesAttestorAddresses', {
		  url: '/attestorAddresses',
		  walletShouldBeComplete: true,
		  needProfile: true,
		  views: {
			'main@': {
			  templateUrl: 'views/preferencesAttestorAddresses.html'
			},
		  }
		})
		.state('preferencesGlobal.preferencesAttestorAddresses.preferencesEditAttestorAddress', {
		  url: '/edit',
		  walletShouldBeComplete: true,
		  needProfile: true,
		  views: {
			'main@': {
			  templateUrl: 'views/preferencesEditAttestorAddress.html'
			},
		  }
		})
		.state('preferencesGlobal.preferencesAttestorAddresses.preferencesEditRealNameAttestors', {
		  url: '/editrna',
		  walletShouldBeComplete: true,
		  needProfile: true,
		  views: {
			'main@': {
			  templateUrl: 'views/preferencesEditRealNameAttestors.html'
			},
		  }
		})
		.state('preferencesGlobal.preferencesUnit', {
		  url: '/preferencesGlobal/unit',
		  templateUrl: 'views/preferencesUnit.html',
		  walletShouldBeComplete: true,
		  needProfile: true,
		  views: {
			'main@': {
			  templateUrl: 'views/preferencesUnit.html'
			},
		  }
		})
		.state('walletHome.preferencesUnit', {
		  url: '/unit',
		  templateUrl: 'views/preferencesUnit.html',
		  walletShouldBeComplete: true,
		  needProfile: true,
		  views: {
			'main@': {
			  templateUrl: 'views/preferencesUnit.html'
			},
		  }
		})
		.state('preferencesGlobal.preferencesBbUnit', {
		  url: '/preferencesGlobal/bbUnit',
		  templateUrl: 'views/preferencesBbUnit.html',
		  walletShouldBeComplete: true,
		  needProfile: true,
		  views: {
			'main@': {
			  templateUrl: 'views/preferencesBbUnit.html'
			},
		  }
		})
		.state('walletHome.preferencesBbUnit', {
		  url: '/bbUnit',
		  templateUrl: 'views/preferencesBbUnit.html',
		  walletShouldBeComplete: true,
		  needProfile: true,
		  views: {
			'main@': {
			  templateUrl: 'views/preferencesBbUnit.html'
			},
		  }
		})
		.state('preferencesGlobal.preferencesEmail', {
		  url: '/email',
		  templateUrl: 'views/preferencesEmail.html',
		  walletShouldBeComplete: true,
		  needProfile: true,
		  views: {
			'main@': {
			  templateUrl: 'views/preferencesEmail.html'
			},
  
		  }
		})
		.state('preferencesGlobal.preferencesWitnesses', {
			url: '/witnesses',
			templateUrl: 'views/preferencesWitnesses.html',
			walletShouldBeComplete: true,
			needProfile: true,
			views: {
			  'main@': {
				templateUrl: 'views/preferencesWitnesses.html'
			  },
			}
		  })
		.state('preferencesGlobal.preferencesWitnesses.preferencesEditWitness', {
		  url: '/edit',
		  walletShouldBeComplete: true,
		  needProfile: true,
		  views: {
			'main@': {
			  templateUrl: 'views/preferencesEditWitness.html'
			},
		  }
		})
		.state('preferencesGlobal.backup', {
		  url: '/backup',
		  templateUrl: 'views/backup.html',
		  walletShouldBeComplete: true,
		  needProfile: true,
		  views: {
			'main@': {
			  templateUrl: 'views/backup.html'
			},
		  }
		})
		.state('preferencesGlobal.recoveryFromSeed', {
			url: '/recoveryFromSeed',
			templateUrl: 'views/recoveryFromSeed.html',
			walletShouldBeComplete: true,
			needProfile: true,
			views: {
				'main@': {
					templateUrl: 'views/recoveryFromSeed.html'
				}
			}
		})
		.state('preferencesGlobal.export', {
		  url: '/export',
		  templateUrl: 'views/export.html',
		  walletShouldBeComplete: true,
		  needProfile: true,
		  views: {
			'main@': {
			  templateUrl: 'views/export.html'
			},
		  }
		})
		.state('preferencesGlobal.import', {
		  url: '/import',
		  needProfile: true,
		  views: {
			'main@': {
			  templateUrl: 'views/import.html'
			},
		  }
		})
  
	  .state('preferencesGlobal.preferencesAbout', {
		url: '/about',
		templateUrl: 'views/preferencesAbout.html',
		walletShouldBeComplete: true,
		needProfile: true,
		views: {
		  'main@': {
			templateUrl: 'views/preferencesAbout.html'
		  },
		}
	  })
	  .state('preferencesGlobal.preferencesAbout.disclaimer', {
		  url: '/disclaimer',
		  needProfile: false,
		  views: {
			'main@': {
			  templateUrl: 'views/disclaimer.html',
			}
		  }
		})
	  .state('preferencesGlobal.preferencesAbout.translators', {
		  url: '/translators',
		  walletShouldBeComplete: true,
		  needProfile: true,
		  views: {
			'main@': {
			  templateUrl: 'views/translators.html'
			}
		  }
		})
	  .state('preferencesGlobal.preferencesAbout.preferencesLogs', {
		  url: '/logs',
		  templateUrl: 'views/preferencesLogs.html',
		  walletShouldBeComplete: true,
		  needProfile: true,
		  views: {
			'main@': {
			  templateUrl: 'views/preferencesLogs.html'
			},
		  }
		})
  
	  .state('add', {
		url: '/add',
		needProfile: true,
		views: {
		  'main': {
			templateUrl: 'views/add.html'
		  },
		}
	  })
		.state('cordova', { // never used
		  url: '/cordova/:status/:isHome',
		  views: {
			'main': {
			  controller: function($rootScope, $state, $stateParams, $timeout, go, isCordova) {
				  console.log('cordova status: '+$stateParams.status);
				  switch ($stateParams.status) {
					  case 'resume':
						  $rootScope.$emit('Local/Resume');
						  break;
					  case 'backbutton':
						  if (isCordova && $stateParams.isHome == 'true' && !$rootScope.modalOpened)
							  navigator.app.exitApp();
						  else
							  $rootScope.$emit('closeModal');
						  break;
				  };
				  // why should we go home on resume or backbutton?
				  /*
				$timeout(function() {
				  $rootScope.$emit('Local/SetTab', 'walletHome', true);
				}, 100);
				go.walletHome();
				*/
			  }
			}
		  },
		  needProfile: false
		});
	})
	.run(function($rootScope, $state, $log, uriHandler, isCordova, profileService, $timeout, nodeWebkit, uxLanguage, animationService) {
	  FastClick.attach(document.body);
  
	  uxLanguage.init();
  
	  // Register URI handler, not for mobileApp
	  if (!isCordova) {
		uriHandler.register();
	  }
  
	  if (nodeWebkit.isDefined()) {
		var gui = require('nw.gui');
		var win = gui.Window.get();
		var nativeMenuBar = new gui.Menu({
		  type: "menubar"
		});
		try {
		  nativeMenuBar.createMacBuiltin("Obyte");
		} catch (e) {
		  $log.debug('This is not OSX');
		}
		win.menu = nativeMenuBar;
	  }
  
	  $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
  
		if (!profileService.profile && toState.needProfile) {
			
		  // Give us time to open / create the profile
		  event.preventDefault();
  
		  if (!profileService.assocVisitedFromStates)
			  profileService.assocVisitedFromStates = {};
		  breadcrumbs.add('$stateChangeStart no profile from '+fromState.name+' to '+toState.name);
		  if (profileService.assocVisitedFromStates[fromState.name] && !fromState.name)
			  return breadcrumbs.add("already loading profile, ignoring duplicate $stateChangeStart from "+fromState.name);
		  profileService.assocVisitedFromStates[fromState.name] = true;
  
		  // Try to open local profile
		  profileService.loadAndBindProfile(function(err) {
			delete profileService.assocVisitedFromStates[fromState.name];
			if (err) {
			  if (err.message && err.message.match('NOPROFILE')) {
				$log.debug('No profile... redirecting');
				return $state.transitionTo('splash');
			  } else if (err.message && err.message.match('NONAGREEDDISCLAIMER')) {
				$log.debug('Display disclaimer... redirecting');
				return $state.transitionTo('preferencesGlobal.preferencesAbout.disclaimer');
			  } else {
				throw new Error(err.message || err); // TODO
			  }
			} else {
			  $log.debug('Profile loaded ... Starting UX.');
			  return $state.transitionTo(toState.name || toState, toParams);
			}
		  });
		}
  
		if (profileService.focusedClient && !profileService.focusedClient.isComplete() && toState.walletShouldBeComplete) {
  
		  $state.transitionTo('copayers');
		  event.preventDefault();
		} 
  
		if (!animationService.transitionAnimated(fromState, toState)) {
		  event.preventDefault();
		  // Time for the backpane to render
		  setTimeout(function() {
			$state.transitionTo(toState);
		  }, 50);
		}
	  });
	});
  
  'use strict';
  
  function selectText(element) {
	var doc = document;
	if (doc.body.createTextRange) { // ms
	  var range = doc.body.createTextRange();
	  range.moveToElementText(element);
	  range.select();
	} else if (window.getSelection) {
	  var selection = window.getSelection();
	  var range = doc.createRange();
	  range.selectNodeContents(element);
	  selection.removeAllRanges();
	  selection.addRange(range);
  
	}
  }
  
  function isValidAddress(value) {
	var ValidationUtils = require('ocore/validation_utils.js');
	if (!value) {
	  return false;
	}
  
	// byteball uri
	var conf = require('ocore/conf.js');
	var re = new RegExp('^'+conf.program+':([A-Z2-7]{32})\b', 'i');
	var arrMatches = value.match(re);
	if (arrMatches) {
	  return ValidationUtils.isValidAddress(arrMatches[1]);
	}
  
	re = new RegExp('^'+conf.program.replace(/byteball/i, 'obyte')+':([A-Z2-7]{32})\b', 'i');
	arrMatches = value.match(re);
	if (arrMatches) {
	  return ValidationUtils.isValidAddress(arrMatches[1]);
	}
  
	return ValidationUtils.isValidAddress(value);
  }
  
  angular.module('copayApp.directives')
  .directive('validAddress', ['$rootScope', 'profileService',
	  function($rootScope, profileService) {
		return {
		  require: 'ngModel',
		  link: function(scope, elem, attrs, ctrl) {          
		  var validator = function(value) {
			if (!profileService.focusedClient)
			  return;
			ctrl.$setValidity('validAddress', isValidAddress(value));
			return value;
		  };
			ctrl.$parsers.unshift(validator);
			ctrl.$formatters.unshift(validator);
		  }
		};
	  }
	])
  .directive('validAddressOrAccount', ['$rootScope', 'profileService', 'aliasValidationService',
	  function($rootScope, profileService, aliasValidationService) {
		return {
		  require: 'ngModel',
		  link: function(scope, elem, attrs, ctrl) {
			var validator = function(value) {
			  if (!profileService.focusedClient)
			return;
			ctrl.$setValidity(
			  'validAddressOrAccount', 
			  isValidAddress(value) || aliasValidationService.isValid(value)
			);
			return value;
		  };
			ctrl.$parsers.unshift(validator);
			ctrl.$formatters.unshift(validator);
		  }
		};
	  }
	])
  .directive('validAddresses', ['$rootScope', 'profileService', 'configService', 
	  function($rootScope, profileService, configService) {
		return {
		  require: 'ngModel',
		  link: function(scope, elem, attrs, ctrl) {
		  var asset = attrs.validAddresses;       
		var validator = function(value) {
		  for (var key in ctrl.$error) {
			if (key.indexOf('line-') > -1) ctrl.$setValidity(key, true);
		  }
		  if (!profileService.focusedClient || !value)
			return value;
		  var lines = value.split(/\r?\n/);
		  if (lines.length > 120) {
			ctrl.$setValidity('validAddresses', false);
			return value;
		  }
		  for (i = 0; i < lines.length; i++) {
			var tokens = lines[i].trim().match(/^([A-Z0-9]{32})[\s,;]+([0-9]*\.[0-9]+|[0-9]+)$/);
			if (!tokens) {
			  ctrl.$setValidity('validAddresses', false);
			  ctrl.$setValidity("line-" + lines[i], false); //hack to get wrong line text
			  return value;
			}
			var address = tokens[1];
			var amount = +tokens[2];
  
				  var settings = configService.getSync().wallet.settings;
			var unitValue = 1;
			var decimals = 0;
			if (asset === 'base'){
			  unitValue = settings.unitValue;
			  decimals = Number(settings.unitDecimals);
			}
			else if (profileService.assetMetadata[asset]){
			  decimals = profileService.assetMetadata[asset].decimals || 0;
			  unitValue = Math.pow(10, decimals);
			}
			  
				  var vNum = Number((amount * unitValue).toFixed(0));
  
				  if (!isValidAddress(address) || typeof vNum !== "number" || vNum <= 0) {
					ctrl.$setValidity('validAddresses', false);
			  ctrl.$setValidity("line-" + lines[i], false); //hack to get wrong line text
			  return value;
				  }
				  var sep_index = ('' + amount).indexOf('.');
				  var str_value = ('' + amount).substring(sep_index + 1);
				  if (sep_index > 0 && str_value.length > decimals) {
					  ctrl.$setValidity('validAddresses', false);
			  ctrl.$setValidity("line-" + lines[i], false); //hack to get wrong line text
			  return value;
				  }
		  }
		  ctrl.$setValidity('validAddresses', true);
		  return value;
		};
			ctrl.$parsers.unshift(validator);
			ctrl.$formatters.unshift(validator);
		  }
		};
	  }
	])
	.directive('validUrl', [
  
	  function() {
		return {
		  require: 'ngModel',
		  link: function(scope, elem, attrs, ctrl) {
			var validator = function(value) {
			  // Regular url
			  if (/^https?:\/\//.test(value)) {
				ctrl.$setValidity('validUrl', true);
				return value;
			  } else {
				ctrl.$setValidity('validUrl', false);
				return value;
			  }
			};
  
			ctrl.$parsers.unshift(validator);
			ctrl.$formatters.unshift(validator);
		  }
		};
	  }
	])
	.directive('validMnemonic', [function() {
		return {
		  require: 'ngModel',
		  link: function(scope, elem, attrs, ctrl) {
			var Mnemonic = require('bitcore-mnemonic');
		   var validator = function(value) {
			 try {
			   value = value.split('-').join(' ');
				if (Mnemonic.isValid(value)) {
				  ctrl.$setValidity('validMnemonic', true);
				  return value;
				} else {
				  ctrl.$setValidity('validMnemonic', false);
				  return value;
				}
			} catch(ex) {
				ctrl.$setValidity('validMnemonic', false);
			   return value;
			}
			};
		   ctrl.$parsers.unshift(validator);
			ctrl.$formatters.unshift(validator);
		  }
		};
	  }
	])
	.directive('validAmount', ['configService', 'profileService',
	  function(configService, profileService) {
  
		return {
		  require: 'ngModel',
		  link: function(scope, element, attrs, ctrl) {
			var val = function(value) {
		//console.log('-- scope', ctrl);
		/*if (scope.home && scope.home.bSendAll){
		  console.log('-- send all');
		  ctrl.$setValidity('validAmount', true);
		  return value;
		}*/
		//console.log('-- amount');
		var constants = require('ocore/constants.js');
		var asset = attrs.validAmount;
		var settings = configService.getSync().wallet.settings;
		var unitValue = 1;
		var decimals = 0;
		if (asset === 'base'){
		  unitValue = settings.unitValue;
		  decimals = Number(settings.unitDecimals);
		}
		else if (asset === constants.BLACKBYTES_ASSET){
		  unitValue = settings.bbUnitValue;
		  decimals = Number(settings.bbUnitDecimals);
		}
		else if (profileService.assetMetadata[asset]){
		  decimals = profileService.assetMetadata[asset].decimals || 0;
		  unitValue = Math.pow(10, decimals);
		}
		  
			  var vNum = Number((value * unitValue).toFixed(0));
  
			  if (typeof value == 'undefined' || value == 0) {
				ctrl.$pristine = true;
				return value;
			  }
  
			  if (typeof vNum == "number" && vNum > 0) {
				var sep_index = ('' + value).indexOf('.');
				var str_value = ('' + value).substring(sep_index + 1);
				if (sep_index > 0 && str_value.length > decimals) {
					ctrl.$setValidity('validAmount', false);
				} else {
					ctrl.$setValidity('validAmount', true);
				 }
			  } else {
				ctrl.$setValidity('validAmount', false);
			  }
			  return value;
			}
			ctrl.$parsers.unshift(val);
			ctrl.$formatters.unshift(val);
		  }
		}
	  }
	])
	.directive('validFeedName', ['configService',
	  function(configService) {
  
		return {
		  require: 'ngModel',
		  link: function(scope, elem, attrs, ctrl) {
			var validator = function(value) {
			  var oracle = configService.oracles[attrs.validFeedName];
			  if (!oracle || !oracle.feednames_filter) {
				ctrl.$setValidity('validFeedName', true);
				  return value;
			  }
			  for (var i in oracle.feednames_filter) {
				var matcher = new RegExp(oracle.feednames_filter[i], "g");
			  if (matcher.test(value)) {
				  ctrl.$setValidity('validFeedName', true);
				  return value;
				}
			  }
			  ctrl.$setValidity('validFeedName', false);
			  return value;
			};
  
			ctrl.$parsers.unshift(validator);
			ctrl.$formatters.unshift(validator);
		  }
		};
	  }
	])
	.directive('validFeedValue', ['configService',
	  function(configService) {
  
		return {
		  require: 'ngModel',
		  link: function(scope, elem, attrs, ctrl) {
			var validator = function(value) {
			  var oracle = configService.oracles[attrs.validFeedValue];
			  if (!oracle || !oracle.feedvalues_filter) {
				ctrl.$setValidity('validFeedValue', true);
				  return value;
			  }
			  for (var i in oracle.feedvalues_filter) {
				var matcher = new RegExp(oracle.feedvalues_filter[i], "g");
			  if (matcher.test(value)) {
				  ctrl.$setValidity('validFeedValue', true);
				  return value;
				}
			  }
			  ctrl.$setValidity('validFeedValue', false);
			  return value;
			};
  
			ctrl.$parsers.unshift(validator);
			ctrl.$formatters.unshift(validator);
		  }
		};
	  }
	])
	.directive('loading', function() {
	  return {
		restrict: 'A',
		link: function($scope, element, attr) {
		  var a = element.html();
		  var text = attr.loading;
		  element.on('click', function() {
			element.html('<i class="size-21 fi-bitcoin-circle icon-rotate spinner"></i> ' + text + '...');
		  });
		  $scope.$watch('loading', function(val) {
			if (!val) {
			  element.html(a);
			}
		  });
		}
	  }
	})
	.directive('ngFileSelect', function() {
	  return {
		link: function($scope, el) {
		  el.bind('change', function(e) {
			$scope.file = (e.srcElement || e.target).files[0];
			$scope.getFile();
		  });
		}
	  }
	})
	.directive('contact', ['addressbookService', function(addressbookService) {
	  return {
		restrict: 'E',
		link: function(scope, element, attrs) {
		  var addr = attrs.address;
		  addressbookService.getLabel(addr, function(label) {
			if (label) {
			  element.append(label);
			} else {
			  element.append(addr);
			}
		  });
		}
	  };
	}])
	.directive('highlightOnChange', function() {
	  return {
		restrict: 'A',
		link: function(scope, element, attrs) {
		  scope.$watch(attrs.highlightOnChange, function(newValue, oldValue) {
			element.addClass('highlight');
			setTimeout(function() {
			  element.removeClass('highlight');
			}, 500);
		  });
		}
	  }
	})
	.directive('checkStrength', function() {
	  return {
		replace: false,
		restrict: 'EACM',
		require: 'ngModel',
		link: function(scope, element, attrs) {
  
		  var MIN_LENGTH = 8;
		  var MESSAGES = ['Very Weak', 'Very Weak', 'Weak', 'Medium', 'Strong', 'Very Strong'];
		  var COLOR = ['#dd514c', '#dd514c', '#faa732', '#faa732', '#16A085', '#16A085'];
  
		  function evaluateMeter(password) {
			var passwordStrength = 0;
			var text;
			if (password.length > 0) passwordStrength = 1;
			if (password.length >= MIN_LENGTH) {
			  if ((password.match(/[a-z]/)) && (password.match(/[A-Z]/))) {
				passwordStrength++;
			  } else {
				text = ', add mixed case';
			  }
			  if (password.match(/\d+/)) {
				passwordStrength++;
			  } else {
				if (!text) text = ', add numerals';
			  }
			  if (password.match(/.[!,@,#,$,%,^,&,*,?,_,~,-,(,)]/)) {
				passwordStrength++;
			  } else {
				if (!text) text = ', add punctuation';
			  }
			  if (password.length > 12) {
				passwordStrength++;
			  } else {
				if (!text) text = ', add characters';
			  }
			} else {
			  text = ', that\'s short';
			}
			if (!text) text = '';
  
			return {
			  strength: passwordStrength,
			  message: MESSAGES[passwordStrength] + text,
			  color: COLOR[passwordStrength]
			}
		  }
  
		  scope.$watch(attrs.ngModel, function(newValue, oldValue) {
			if (newValue && newValue !== '') {
			  var info = evaluateMeter(newValue);
			  scope[attrs.checkStrength] = info;
			}
		  });
		}
	  };
	})
	.directive('showFocus', function($timeout) {
	  return function(scope, element, attrs) {
		scope.$watch(attrs.showFocus,
		  function(newValue) {
			$timeout(function() {
			  newValue && element[0].focus();
			});
		  }, true);
	  };
	})
	.directive('match', function() {
	  return {
		require: 'ngModel',
		restrict: 'A',
		scope: {
		  match: '='
		},
		link: function(scope, elem, attrs, ctrl) {
		  scope.$watch(function() {
			return (ctrl.$pristine && angular.isUndefined(ctrl.$modelValue)) || scope.match === ctrl.$modelValue;
		  }, function(currentValue) {
			ctrl.$setValidity('match', currentValue);
		  });
		}
	  };
	})
	.directive('clipCopy', function() {
	  return {
		restrict: 'A',
		scope: {
		  clipCopy: '=clipCopy'
		},
		link: function(scope, elm) {
		  // TODO this does not work (FIXME)
		  elm.attr('tooltip', 'Press Ctrl+C to Copy');
		  elm.attr('tooltip-placement', 'top');
  
		  elm.bind('click', function() {
			selectText(elm[0]);
		  });
		}
	  };
	})
	.directive('menuToggle', function() {
	  return {
		restrict: 'E',
		replace: true,
		templateUrl: 'views/includes/menu-toggle.html'
	  }
	})
	.directive('logo', function() {
	  return {
		restrict: 'E',
		scope: {
		  width: "@",
		  height: "@",
		  negative: "="
		},
		controller: function($scope) {
		  $scope.styles = { width: $scope.width ? $scope.width +'px' : 'auto', height: $scope.height ? $scope.height +'px' : 'auto' };
		  $scope.logo_url = $scope.negative ? 'img/icons/obyte-logo-negative.svg' : 'img/icons/obyte-logo.svg';
		},
		replace: true,
		template: '<img ng-style="styles" ng-src="{{ logo_url }}" alt="Obyte">'
	  }
	})
	.directive('availableBalance', function() {
	  return {
		restrict: 'E',
		replace: true,
		templateUrl: 'views/includes/available-balance.html'
	  }
	}).directive('selectable', function ($rootScope, $timeout) {
	return {
	  restrict: 'A',
	  scope: {
		bindObj: "=model",
		bindProp: "@prop",
		targetProp: "@exclusionBind"
	  },
	  link: function (scope, elem, attrs) {
		$timeout(function(){
		  var dropdown = angular.element(document.querySelector(attrs.selectable));
		  
		  dropdown.find('li').on('click', function(e){
			var li = angular.element(this);
			elem.html(li.find('a').find('span').eq(0).html());
			scope.bindObj[scope.bindProp] = li.attr('data-value');
			if(!$rootScope.$$phase) $rootScope.$digest();
		  });
		  scope.$watch(function(scope){return scope.bindObj[scope.bindProp]}, function(newValue, oldValue) {
			angular.forEach(dropdown.find('li'), function(element){
			  var li = angular.element(element);
			  if (li.attr('data-value') == newValue) {
				elem.html(li.find('a').find('span').eq(0).html());
				li.addClass('selected');
			  } else {
				li.removeClass('selected');
			  }
			});
		  });
		  var selected = false;
		  angular.forEach(dropdown.find('li'), function(el){
			var li = angular.element(el);
			var a = angular.element(li.find('a'));
			a.append('<i class="fi-check check"></i>');
			if (scope.bindObj[scope.bindProp] == li.attr('data-value')) {
			  a[0].click();
			  selected = true;
			}
		  });
		  if (!selected && typeof attrs.notSelected == "undefined") dropdown.find('a').eq(0)[0].click();
  
		  if (scope.targetProp) {
			scope.$watch(function(scope){return scope.bindObj[scope.targetProp]}, function(newValue, oldValue) {
			  angular.forEach(dropdown.find('li'), function(element){
				var li = angular.element(element);
				if (li.attr('data-value') != newValue) {
				  li[0].click();
				  scope.bindObj[scope.bindProp] = li.attr('data-value');
				}
			  });
			});
		  }
		});
	  }
	}}).directive('cosigners', function() {
	  return {
		restrict: 'E',
		template: '<ul class="no-bullet m20b whopays">\
					<li class="" ng-repeat="copayer in index.copayers">\
						<span class="size-12 text-gray" ng-show="copayer.me">\
							<i class="icon-contact size-24 m10r"></i>{{\'Me\'|translate}} <i class="fi-check m5 right"></i>\
						</span>\
						<div class="size-12" style="width: 100%" ng-show="!copayer.me" ng-click="copayer.signs = !copayer.signs">\
							<i class="icon-contact size-24 m10r"></i> {{copayer.name}} ({{copayer.device_address.substr(0,4)}}...) <i class="m5 right" ng-class="copayer.signs ? \'fi-check\' : \'\'"></i>\
						</div>\
					</li>\
				  </ul>\
				  '
	  }
	}).directive('markdown', function ($rootScope, $timeout, isCordova) {
		var md = window.markdownit({linkify: true}).disable(['image', 'link']);
	return {
	  restrict: 'A',
	  link: function (scope, elem, attrs) {
		  $timeout(function () {
			  var text = elem.html();
			  var html = md.render(text);
			  elem.html(html);
			  elem.find('a').on('click', function(e) {
				  e.preventDefault();
				  var url = angular.element(this).attr('href');
				  if (typeof nw !== 'undefined')
					  nw.Shell.openExternal(url);
				  else if (isCordova)
					  cordova.InAppBrowser.open(url, '_system');
			  })
		  });
		}
   }})
	.filter('encodeURIComponent', function() {
	  return window.encodeURIComponent;
  })
   .filter('objectKeys', [function() {
	  return function(item) {
		  if (!item) return null;
		  var keys = Object.keys(item);
		  keys.sort();
		  return keys;
	  };
  }])
  .filter('sumNumbers', [function(){
	return function(str) {
		  return str ? str.split(/[\n\s,;]/).reduce(function(acc, val){return isNaN(+val) ? acc : acc + (+val)}, 0) : 0;
	  };
  }]);
  
  'use strict';
  
  /*  
   * This is a modification from https://github.com/angular/angular.js/blob/master/src/ngTouch/swipe.js
   */
  
  
  function makeSwipeDirective(directiveName, direction, eventName) {
	angular.module('copayApp.directives')
	  .directive(directiveName, ['$parse', '$swipe', '$timeout',
		function($parse, $swipe, $timeout) {
		  // The maximum vertical delta for a swipe should be less than 75px.
		  var MAX_VERTICAL_DISTANCE = 75;
		  // Vertical distance should not be more than a fraction of the horizontal distance.
		  var MAX_VERTICAL_RATIO = 0.4;
		  // At least a 30px lateral motion is necessary for a swipe.
		  var MIN_HORIZONTAL_DISTANCE = 30;
  
		  return function(scope, element, attr) {
			var swipeHandler = $parse(attr[directiveName]);
  
			var startCoords, valid;
  
			function validSwipe(coords) {
			  // Check that it's within the coordinates.
			  // Absolute vertical distance must be within tolerances.
			  // Horizontal distance, we take the current X - the starting X.
			  // This is negative for leftward swipes and positive for rightward swipes.
			  // After multiplying by the direction (-1 for left, +1 for right), legal swipes
			  // (ie. same direction as the directive wants) will have a positive delta and
			  // illegal ones a negative delta.
			  // Therefore this delta must be positive, and larger than the minimum.
			  if (!startCoords) return false;
			  var deltaY = Math.abs(coords.y - startCoords.y);
			  var deltaX = (coords.x - startCoords.x) * direction;
			  return valid && // Short circuit for already-invalidated swipes.
				deltaY < MAX_VERTICAL_DISTANCE &&
				deltaX > 0 &&
				deltaX > MIN_HORIZONTAL_DISTANCE &&
				deltaY / deltaX < MAX_VERTICAL_RATIO;
			}
  
			var pointerTypes = ['touch'];
			$swipe.bind(element, {
			  'start': function(coords, event) {
				startCoords = coords;
				valid = true;
			  },
			  'move': function(coords, event) {
				if (validSwipe(coords)) {
				  $timeout(function() {
					  scope.$apply(function() {
						  element.triggerHandler(eventName);
						  swipeHandler(scope, {
							  $event: event
						  });
					  });
				  });
				}
			  }
			}, pointerTypes);
		  };
		}
	  ]);
  }
  /*
  // Left is negative X-coordinate, right is positive.
  makeSwipeDirective('ngSwipeLeft', -1, 'swipeleft');
  makeSwipeDirective('ngSwipeRight', 1, 'swiperight');
  */
  'use strict';
  
  var breadcrumbs = require('ocore/breadcrumbs.js');
  
  angular.module('copayApp.directives')
	  .directive('qrScanner', ['$rootScope', '$timeout', '$modal', 'isCordova', 'gettextCatalog',
		function($rootScope, $timeout, $modal, isCordova, gettextCatalog) {
  
		  var controller = function($scope) {
  
			$scope.cordovaOpenScanner = function() {
			  window.ignoreMobilePause = true;
			  window.plugins.spinnerDialog.show(null, gettextCatalog.getString('Preparing camera...'), true);
			  $timeout(function() {
				cordova.plugins.barcodeScanner.scan(
					function onSuccess(result) {
					  $timeout(function() {
						window.plugins.spinnerDialog.hide();
						window.ignoreMobilePause = false;
					  }, 100);
					  if (result.cancelled) return;
  
					  $timeout(function() {
						var data = result.text;
						$scope.onScan({ data: data });
					  }, 1000);
					},
					function onError(error) {
					  $timeout(function() {
						window.ignoreMobilePause = false;
						window.plugins.spinnerDialog.hide();
					  }, 100);
					  alert('Scanning error');
					}
				);
				if ($scope.beforeScan) {
				  $scope.beforeScan();
				}
			  }, 100);
			};
  
			$scope.modalOpenScanner = function() {
			  var parentScope = $scope;
			  var ModalInstanceCtrl = function($scope, $rootScope, $modalInstance) {
				// QR code Scanner
				var video;
				var canvas;
				var $video;
				var context;
				var localMediaStream;
				var prevResult;
  
				var _scan = function(evt) {
				  if (localMediaStream) {
					context.drawImage(video, 0, 0, 300, 225);
					try {
					  qrcode.decode();
					} catch (e) {
					  //qrcodeError(e);
					}
				  }
				  $timeout(_scan, 800);
				};
  
				var _scanStop = function() {
				  if (localMediaStream && localMediaStream.active) {
					var localMediaStreamTrack = localMediaStream.getTracks();
					for (var i = 0; i < localMediaStreamTrack.length; i++) {
					  localMediaStreamTrack[i].stop();
					}
				  } else {
					try {
					  localMediaStream.stop();
					} catch(e) {
					  // Older Chromium not support the STOP function
					};
				  }
				  localMediaStream = null;
				  if (video)
					  video.src = '';
				};
  
				qrcode.callback = function(data) {
				  if (prevResult != data) {
					prevResult = data;
					return;
				  }
				  _scanStop();
				  $modalInstance.close(data);
				};
  
				var _successCallback = function(stream) {
				  if (process.versions['node-webkit'] === '0.14.7')
					  video.src = (window.URL && window.URL.createObjectURL(stream)) || stream;
				  else // newer versions of chrome
					  video.srcObject = stream;
				  localMediaStream = stream;
				  video.play();
				  $timeout(_scan, 1000);
				};
  
				var _videoError = function(err) {
				  breadcrumbs.add('qr scanner video error');
				  $scope.cancel();
				};
  
				var setScanner = function() {
				  navigator.getUserMedia = navigator.getUserMedia ||
					  navigator.webkitGetUserMedia || navigator.mozGetUserMedia ||
					  navigator.msGetUserMedia;
				  window.URL = window.URL || window.webkitURL ||
					  window.mozURL || window.msURL;
				};
  
				$scope.init = function() {
				  setScanner();
				  $timeout(function() {
					if (parentScope.beforeScan) {
					  parentScope.beforeScan();
					}
					canvas = document.getElementById('qr-canvas');
					if (!canvas)
						return;
					context = canvas.getContext('2d');
  
  
					video = document.getElementById('qrcode-scanner-video');
					$video = angular.element(video);
					canvas.width = 300;
					canvas.height = 225;
					context.clearRect(0, 0, 300, 225);
  
					navigator.getUserMedia({
					  video: true
					}, _successCallback, _videoError);
				  }, 500);
				};
  
				$scope.cancel = function() {
				  breadcrumbs.add('qr scanner cancel');
				  _scanStop();
				  try{
					  $modalInstance.dismiss('cancel');
				  }
				  catch(e){
					  e.bIgnore = true;
				  //	throw e;
				  }
				};
			  };
  
			  var modalInstance = $modal.open({
				templateUrl: 'views/modals/scanner.html',
				windowClass: 'full',
				controller: ModalInstanceCtrl,
				backdrop : 'static',
				keyboard: false
			  });
			  modalInstance.result.then(function(data) {
				parentScope.onScan({ data: data });
			  });
  
			};
  
			$scope.openScanner = function() {
			  if (isCordova) {
				$scope.cordovaOpenScanner();
			  }
			  else {
				$scope.modalOpenScanner();
			  }
			};
		  };
  
		  return {
			restrict: 'E',
			scope: {
			  onScan: "&",
			  beforeScan: "&"
			},
			controller: controller,
			replace: true,
			template: '<a id="camera-icon" class="p10" ng-click="openScanner()"><i class="icon-scan size-21"></i></a>'
		  }
		}
	  ]);
  
  'use strict';
  
  angular.module('copayApp.filters', [])
	.filter('amTimeAgo', ['amMoment',
	  function(amMoment) {
		return function(input) {
		  return amMoment.preprocessDate(input).fromNow();
		};
	  }
	])
	.filter('paged', function() {
	  return function(elements) {
		if (elements) {
		  return elements.filter(Boolean);
		}
  
		return false;
	  };
	})
	.filter('removeEmpty', function() {
	  return function(elements) {
		elements = elements || [];
		// Hide empty change addresses from other copayers
		return elements.filter(function(e) {
		  return !e.isChange || e.balance > 0;
		});
	  }
	})
  
  .filter('noFractionNumber', ['$filter', '$locale', 'configService',
	function(filter, locale, configService) {
	  var numberFilter = filter('number');
	  var formats = locale.NUMBER_FORMATS;
	  var config = configService.getSync().wallet.settings;
	  return function(amount, n) {
		if (typeof(n) === 'undefined' && !config) return amount;
  
		var fractionSize = (typeof(n) !== 'undefined') ?
		  n : config.unitValue.toString().length - 1;
		var value = numberFilter(amount, fractionSize);
		var sep = value.indexOf(formats.DECIMAL_SEP);
		var group = value.indexOf(formats.GROUP_SEP);
		if (amount >= 0) {
		  if (group > 0) {
			if (sep < 0) {
			  return value;
			}
			var intValue = value.substring(0, sep);
			var floatValue = parseFloat(value.substring(sep));
			if (floatValue === 0) {
			  floatValue = '';
			} else {
			  if (floatValue % 1 === 0) {
				floatValue = floatValue.toFixed(0);
			  }
			  floatValue = floatValue.toString().substring(1);
			}
			var finalValue = intValue + floatValue;
			return finalValue;
		  } else {
			value = parseFloat(value);
			if (value % 1 === 0) {
			  value = value.toFixed(0);
			}
			return value;
		  }
		}
		return 0;
	  };
	}
  ]);
  
  'use strict';
  
  /**
   * Profile
   *
   * credential: array of OBJECTS
   */
  function Profile() {
	  this.version = '1.0.0';
  };
  
  Profile.create = function(opts) {
	  opts = opts || {};
  
	  var x = new Profile();
	  x.createdOn = Date.now();
	  x.credentials = opts.credentials || [];
	  if (!opts.xPrivKey && !opts.xPrivKeyEncrypted)
		  throw Error("no xPrivKey, even encrypted");
	  if (!opts.mnemonic && !opts.mnemonicEncrypted)
		  throw Error("no mnemonic, even encrypted");
	  if (!opts.tempDeviceKey)
		  throw Error("no tempDeviceKey");
	  x.xPrivKey = opts.xPrivKey;
	  x.mnemonic = opts.mnemonic;
	  x.xPrivKeyEncrypted = opts.xPrivKeyEncrypted;
	  x.mnemonicEncrypted = opts.mnemonicEncrypted;
	  x.tempDeviceKey = opts.tempDeviceKey;
	  x.prevTempDeviceKey = opts.prevTempDeviceKey; // optional
	  x.my_device_address = opts.my_device_address;
	  return x;
  };
  
  
  Profile.fromObj = function(obj) {
	  var x = new Profile();
  
	  x.createdOn = obj.createdOn;
	  x.credentials = obj.credentials;
  
	  if (x.credentials[0] && typeof x.credentials[0] != 'object')
		  throw ("credentials should be an object");
  
	  if (!obj.xPrivKey && !obj.xPrivKeyEncrypted)
		  throw Error("no xPrivKey, even encrypted");
  //	if (!obj.mnemonic && !obj.mnemonicEncrypted)
  //		throw Error("no mnemonic, even encrypted");
	  if (!obj.tempDeviceKey)
		  throw Error("no tempDeviceKey");
	  x.xPrivKey = obj.xPrivKey;
	  x.mnemonic = obj.mnemonic;
	  x.xPrivKeyEncrypted = obj.xPrivKeyEncrypted;
	  x.mnemonicEncrypted = obj.mnemonicEncrypted;
	  x.tempDeviceKey = obj.tempDeviceKey;
	  x.prevTempDeviceKey = obj.prevTempDeviceKey; // optional
	  x.my_device_address = obj.my_device_address;
	  
	  return x;
  };
  
  
  Profile.fromString = function(str) {
	  return Profile.fromObj(JSON.parse(str));
  };
  
  Profile.prototype.toObj = function() {
	  return JSON.stringify(this);
  };
  
  
  
  'use strict';
  
  angular.module('copayApp.services').service('addonManager', function (lodash) {
	var addons = [];
  
	this.registerAddon = function (addonSpec) {
	  addons.push(addonSpec);
	};
  
	this.addonMenuItems = function () {
	  return lodash.map(addons, function (addonSpec) {
		return addonSpec.menuItem;
	  });
	};
  
	this.addonViews = function () {
	  return lodash.map(addons, function (addonSpec) {
		return addonSpec.view;
	  });
	};
  
	this.formatPendingTxp = function (txp) {
	  lodash.each(addons, function (addon) {
		if (addon.formatPendingTxp) {
		  addon.formatPendingTxp(txp);
		}
	  });
	};
  
	this.txTemplateUrl = function() {
	  var addon = lodash.find(addons, 'txTemplateUrl');
	  return addon ? addon.txTemplateUrl() : null;
	}
  });
  
  'use strict';
  
  angular.module('copayApp.services').factory('addressbookService', function(storageService, profileService) {
	var root = {};
  
	root.getLabel = function(addr, cb) {
	  var fc = profileService.focusedClient;
	  storageService.getAddressbook(fc.credentials.network, function(err, ab) {
		if (!ab) return cb();
		ab = JSON.parse(ab);
		if (ab[addr]) return cb(ab[addr]);
		else return cb();
	  });
	};
  
	root.list = function(cb) {
	  var fc = profileService.focusedClient;
	  storageService.getAddressbook(fc.credentials.network, function(err, ab) {
		if (err) return cb('Could not get the Addressbook');
		if (ab) ab = JSON.parse(ab);
		return cb(err, ab);
	  });
	};
  
	root.add = function(entry, cb) {
	  var fc = profileService.focusedClient;
	  root.list(function(err, ab) {
		if (err) return cb(err);
		if (!ab) ab = {};
		if (ab[entry.address]) return cb('Entry already exist');
		ab[entry.address] = entry.label;
		storageService.setAddressbook(fc.credentials.network, JSON.stringify(ab), function(err, ab) {
		  if (err) return cb('Error adding new entry');
		  root.list(function(err, ab) {
			return cb(err, ab);
		  });
		});
	  });
	};
	
	root.remove = function(addr, cb) {
	  var fc = profileService.focusedClient;
	  root.list(function(err, ab) {
		if (err) return cb(err);
		if (!ab) return;
		if (!ab[addr]) return cb('Entry does not exist');
		delete ab[addr];
		storageService.setAddressbook(fc.credentials.network, JSON.stringify(ab), function(err) {
		  if (err) return cb('Error deleting entry');
		  root.list(function(err, ab) {
			return cb(err, ab);
		  });
		});
	  }); 
	};
  
	root.removeAll = function() {
	  var fc = profileService.focusedClient;
	  storageService.removeAddressbook(fc.credentials.network, function(err) {
		if (err) return cb('Error deleting addressbook');
		return cb();
	  });
	};
  
	return root;
  });
  
  'use strict';
  'use strict';
  angular.module('copayApp.services')
	.factory('addressService', function(profileService, $log, $timeout) {
	  var root = {};
  
  
	  root.expireAddress = function(walletId,cb) {
		  $log.debug('Cleaning Address ' + walletId );
		  cb();
	  };
  
  
	  root._createAddress = function(walletId, cb) {
		var client = profileService.getClient(walletId);
  
		$log.debug('Creating address for wallet:', walletId);
		  
  
		client.createAddress(0, function(err, addr) {
		  if (err)
			  throw "impossible err creating address";
		  return cb(null, addr.address);
		});
	  };
  
	  
	  root.getAddress = function(walletId, forceNew, cb) {
		  if (forceNew) {
			  root._createAddress(walletId, function(err, addr) {
				  $timeout(function(){
					  if (err)
						  return cb(err);
					  cb(null, addr);
				  });
			  });
		  }
		  else {
			  var client = profileService.getClient(walletId);
			  client.getAddresses({reverse: true, limit: 1, is_change: 0}, function(err, addr) {
				  $timeout(function(){
					  if (err)
						  return cb(err);
					  if (addr.length > 0)
						  return cb(null, addr[0].address);
					  else // issue new address
						  root.getAddress(walletId, true, cb);
				  });
			  });
		  }
	  };
  
	  return root;
	});
  
  'use strict';
  
  var ValidationUtils = require('ocore/validation_utils.js');
  
  angular.module('copayApp.services').factory('aliasValidationService', function($timeout, configService, gettextCatalog) {
  
	  var listOfAliases = {
		  email: {
			  dbKey: 'email',
			  title: 'email',
			  isValid: function (value) {
				  return ValidationUtils.isValidEmail(value);
			  },
			  transformToAccount: function (value) {
				  return value.replace(/^textcoin:/, '').toLowerCase();
			  }
		  },
		  reddit: {
			  dbKey: 'reddit_username',
			  title: 'reddit account',
			  isValid: function (value) {
				  return /^reddit\/[a-z0-9\-_]{3,20}$/i.test(value);
			  },
			  transformToAccount: function (value) {
				  return value.replace(/^reddit\//i, '').toLowerCase();
			  }
		  },
		  steem: {
			  dbKey: 'steem_username',
			  title: 'steem account',
			  isValid: function (value) {
				  return /^steem\/[a-z0-9\-_.]{3,20}$/i.test(value);
			  },
			  transformToAccount: function (value) {
				  return value.replace(/^steem\//i, '').toLowerCase();
			  }
		  },
		  username: {
			  dbKey: 'username',
			  title: 'username',
			  isValid: function (value) {
				  return /^@([a-z\d\-_]){1,32}$/i.test(value);
			  },
			  transformToAccount: function (value) {
				  return value.substr(1).toLowerCase();
			  }
		  },
		  phone: {
			  dbKey: 'phone',
			  title: 'phone number',
			  isValid: function (value) {
				  return /^\+?\d{9,14}$/.test(value);
			  },
			  transformToAccount: function (value) {
				  return value.replace('+', '');
			  }
		  }
	  };
	  var assocBbAddresses = {};
	  var root = {};
	  
	  for (var attestorKey in listOfAliases) {
		  if (!listOfAliases.hasOwnProperty(attestorKey)) continue;
		  assocBbAddresses[attestorKey] = {};
	  }
  
	  root.getAliasObj = function (attestorKey) {
		  if (!(attestorKey in listOfAliases)) {
			  throw new Error('unknown alias');
		  }
		  return listOfAliases[attestorKey];
	  };
  
	  root.getListOfAliases = function () {
		  return listOfAliases;
	  };
  
	  root.validate = function (value) {
		  for (var attestorKey in listOfAliases) {
			  if (!listOfAliases.hasOwnProperty(attestorKey)) continue;
			  if (listOfAliases[attestorKey].isValid(value)) {
				  var account = listOfAliases[attestorKey].transformToAccount(value);
				  return { isValid: true, attestorKey: attestorKey, account: account };
			  }
		  }
		  return { isValid: false };
	  };
  
	  root.checkAliasExists = function (attestorKey) {
		  if (!listOfAliases.hasOwnProperty(attestorKey)) {
			  throw new Error('Alias not found');
		  }
	  };
  
	  root.getBbAddress = function (attestorKey, value) {
		  root.checkAliasExists(attestorKey);
		  return assocBbAddresses[attestorKey][value];
	  };
  
	  root.deleteAssocBbAddress = function (attestorKey, value) {
		  root.checkAliasExists(attestorKey);
		  delete assocBbAddresses[attestorKey][value];
	  };
  
	  root.resolveValueToBbAddress = function (attestorKey, value, callback) {
		  function setResult(result) {
			  assocBbAddresses[attestorKey][value] = result;
			  $timeout(callback);
		  }
  
		  root.checkAliasExists(attestorKey);
		  
		  if (!listOfAliases[attestorKey]) {
			  throw new Error('Alias not found');
		  }
  
		  var obj = listOfAliases[attestorKey];
		  var attestorAddress = configService.getSync().attestorAddresses[attestorKey];
		  if (!attestorAddress) {
			  return setResult('none');
		  }
  
		  var conf = require('ocore/conf.js');
		  var db = require('ocore/db.js');
		  db.query(
			  "SELECT \n\
				  address, is_stable \n\
			  FROM attested_fields \n\
			  CROSS JOIN units USING(unit) \n\
			  WHERE attestor_address=? \n\
				  AND field=? \n\
				  AND value=? \n\
			  ORDER BY attested_fields.rowid DESC \n\
			  LIMIT 1",
			  [attestorAddress, obj.dbKey, value],
			  function (rows) {
				  if (rows.length > 0) {
					  return setResult( (!conf.bLight || rows[0].is_stable) ? rows[0].address : 'unknown' );
				  }
				  // not found
				  if (!conf.bLight) {
					  return setResult('none');
				  }
				  // light
				  var network = require('ocore/network.js');
				  var params = {attestor_address: attestorAddress, field: obj.dbKey, value: value};
				  network.requestFromLightVendor('light/get_attestation', params, function (ws, request, response) {
					  if (response.error) {
						  return setResult('unknown');
					  }
  
					  var attestation_unit = response;
					  if (attestation_unit === "") {// no attestation
						  return setResult('none');
					  }
  
					  network.requestHistoryFor([attestation_unit], [], function (err) {
						  if (err) {
							  return setResult('unknown');
						  }
						  // now attestation_unit is in the db (stable or unstable)
						  root.resolveValueToBbAddress(attestorKey, value, callback);
					  });
				  });
			  }
		  );
	  };
  
	  root.isValid = function (value) {
		  for (var attestorKey in listOfAliases) {
			  if (!listOfAliases.hasOwnProperty(attestorKey)) continue;
			  if (listOfAliases[attestorKey].isValid(value)) {
				  return true;
			  }
		  }
		  return false;
	  };
  
	  return root;
  });
  
  'use strict';
  
  angular.module('copayApp.services').factory('animationService', function(isCordova) {
	var root = {};
  
	var cachedTransitionState, cachedBackPanel;
  
	// DISABLE ANIMATION ON DESKTOP
	root.modalAnimated = {
	  slideUp: isCordova ? 'full animated slideInUp' : 'full',
	  slideRight: isCordova ? 'full animated slideInRight' : 'full',
	  slideOutDown: isCordova ? 'slideOutDown' : 'hideModal',
	  slideOutRight: isCordova ? 'slideOutRight' : 'hideModal',
	};
  
	var pageWeight = {
	  walletHome: 0,
	  copayers: -1,
	  cordova: -1,
	  payment: -1,
  
	  preferences: 11,
	  "preferences.preferencesColor": 12,
	  "preferencesGlobal.backup": 12,
	  "preferences.preferencesAdvanced": 12,
	  "preferencesGlobal.preferencesAbout": 12,
	  "preferences.preferencesAdvanced.preferencesDeleteWallet": 13,
	  "preferencesGlobal.preferencesDeviceName": 12,
	  "preferencesGlobal.preferencesLanguage": 12,
	  "preferencesGlobal.preferencesUnit": 12,
	  "preferencesGlobal.preferencesBbUnit": 12,
	  "walletHome.preferencesUnit": 12,
	  "walletHome.preferencesBbUnit": 12,
	  preferencesFee: 12,
	  preferencesAltCurrency: 12,
	  "preferences.preferencesAlias": 12,
	  "preferencesGlobal.preferencesEmail": 12,
	  "preferencesGlobal.export": 13,
	  "preferences.preferencesAdvanced.paperWallet": 13,
	  "preferencesGlobal.preferencesAbout.preferencesLogs": 13,
	  "preferences.preferencesAdvanced.preferencesInformation": 13,
	  "preferencesGlobal.preferencesAbout.translators": 13,
	  "preferencesGlobal.preferencesAbout.disclaimer": 13,
	  add: 11,
	  create: 12,
	  "preferencesGlobal.import": 12,
	  importLegacy: 13
	};
  
	function cleanUpLater(e, e2) {
	  var cleanedUp = false,
		timeoutID;
	  var cleanUp = function() {
		if (cleanedUp) return;
		cleanedUp = true;
		if (e2.parentNode) // sometimes it is null
			e2.parentNode.removeChild(e2);
		e2.innerHTML = "";
		e.className = '';
		cachedBackPanel = null;
		cachedTransitionState = '';
		if (timeoutID) {
		  timeoutID = null;
		  window.clearTimeout(timeoutID);
		}
	  };
	  e.addEventListener("animationend", cleanUp, true);
	  e2.addEventListener("animationend", cleanUp, true);
	  e.addEventListener("webkitAnimationEnd", cleanUp, true);
	  e2.addEventListener("webkitAnimationEnd", cleanUp, true);
	  timeoutID = setTimeout(cleanUp, 500);
	};
  
	root.transitionAnimated = function(fromState, toState, event) {
  
	  if (isaosp)
		return true;
  
	  // Animation in progress?
	  var x = document.getElementById('mainSectionDup');
	  if (x && !cachedTransitionState) {
		console.log('Anim in progress');
		return true;
	  }
  
	  var fromName = fromState.name;
	  var toName = toState.name;
	  if (!fromName || !toName)
		return true;
  
	  var fromWeight = pageWeight[fromName];
	  var toWeight = pageWeight[toName];
  
  
	  var entering = null,
		leaving = null;
  
	  // Horizontal Slide Animation?
	  if (isCordova && fromWeight && toWeight) {
		if (fromWeight > toWeight) {
		  leaving = 'CslideOutRight';
		} else {
		  entering = 'CslideInRight';
		}
  
		// Vertical Slide Animation?
	  } else if (isCordova && fromName && fromWeight >= 0 && toWeight >= 0) {
		if (toWeight) {
		  entering = 'CslideInUp';
  
		} else {
		  leaving = 'CslideOutDown';
		}
  
		// no Animation  ?
	  } else {
		return true;
	  }
  
	  var e = document.getElementById('mainSection');
  
  
	  var desiredTransitionState = (fromName || '-') + ':' + (toName || '-');
  
	  if (desiredTransitionState == cachedTransitionState) {
		e.className = entering || '';
		cachedBackPanel.className = leaving || '';
		cleanUpLater(e, cachedBackPanel);
		//console.log('USing animation', cachedTransitionState);
		return true;
	  } else {
		var sc;
		// Keep prefDiv scroll
		var contentDiv = e.getElementsByClassName('content');
		if (contentDiv && contentDiv[0])
		  sc = contentDiv[0].scrollTop;
  
		cachedBackPanel = e.cloneNode(true);
		cachedBackPanel.id = 'mainSectionDup';
		var c = document.getElementById('sectionContainer');
		//c.appendChild(cachedBackPanel);
  
		if (sc)
		  cachedBackPanel.getElementsByClassName('content')[0].scrollTop = sc;
  
		cachedTransitionState = desiredTransitionState;
		return false;
	  }
	}
  
	return root;
  });
  'use strict';
  angular.module('copayApp.services')
	.factory('applicationService', function($rootScope, $timeout, isCordova, nodeWebkit, go) {
	  var root = {};
  
	  root.restart = function() {
		var hashIndex = window.location.href.indexOf('#/');
		if (isCordova) {
		  window.location = window.location.href.substr(0, hashIndex);
		  $timeout(function() {
			$rootScope.$digest();
		  }, 1);
  
		} else {
		  // Go home reloading the application
		  if (nodeWebkit.isDefined()) {
			go.walletHome();
			$timeout(function() {
			  var win = require('nw.gui').Window.get();
			  win.reload(3);
			  //or
			  win.reloadDev();
			}, 100);
		  } else {
			window.location = window.location.href.substr(0, hashIndex);
		  }
		}
	  };
  
	  return root;
	});
  
  'use strict';
  
  angular
	  .module('copayApp.services')
	  .factory('attestorAddressListService', function () {
		  var root = {};
		  root.currentAttestorKey = null;
		  return root;
	  });
  
  'use strict';
  
  
  angular.module('copayApp.services').factory('authService', function() {
	  var root = {};
  
	  root.objRequest = null;
  
  
	  return root;
  });
  
  'use strict';
  
  
  angular.module('copayApp.services')
  .factory('autoUpdatingWitnessesList', function($timeout, $modal, $rootScope, configService){
	var root = {};
  
	root.autoUpdate = true;
	root.timerNextCheck = null;
  
	root.checkChangeWitnesses = function(){
	  if (!root.autoUpdate) return;
  
	  var device = require('ocore/device.js');
	  var myWitnesses = require('ocore/my_witnesses.js');
	  device.getWitnessesFromHub(function(err, arrWitnessesFromHub){
		if (arrWitnessesFromHub) {
		  myWitnesses.readMyWitnesses(function(arrWitnesses){
			root.addWitnesses = arrWitnessesFromHub.filter(function(witness){
			  return arrWitnesses.indexOf(witness) == -1;
			});
			root.delWitnesses = arrWitnesses.filter(function(witness){
			  return arrWitnessesFromHub.indexOf(witness) == -1;
			});
  
			if (root.addWitnesses.length != 0) {
				var modalInstance = $modal.open({
					templateUrl: 'views/modals/approveNewWitnesses.html',
					controller: 'approveNewWitnesses'
				});
				$rootScope.$on('closeModal', function() {
					modalInstance.dismiss('cancel');
				});
			}
			if (root.timerNextCheck) $timeout.cancel(root.timerNextCheck);
			root.timerNextCheck = $timeout(root.checkChangeWitnesses, 1000 * 60 * 60 * 24);
		  }, 'wait');
		}
		else {
		  if (root.timerNextCheck) $timeout.cancel(root.timerNextCheck);
		  root.timerNextCheck = $timeout(root.checkChangeWitnesses, 1000 * 60);
		}
	  });
	};
  
	root.setAutoUpdate = function(bAutoUpdate){
	  configService.set({autoUpdateWitnessesList: bAutoUpdate},function(){
	  });
	  root.autoUpdate = bAutoUpdate;
	};
  
	configService.get(function(err, conf){
	  if (conf.autoUpdateWitnessesList === undefined) {
		root.setAutoUpdate(true);
	  } else {
		root.autoUpdate = conf.autoUpdateWitnessesList;
	  }
	  root.checkChangeWitnesses();
	});
  
	return root;
  });
  
  'use strict';
  
  
  angular.module('copayApp.services').factory('backButton', function($log, $rootScope, gettextCatalog, $deepStateRedirect, $document, $timeout, go, $state, lodash) {
	  var root = {};
	  
	  root.menuOpened = false;
	  root.dontDeletePath = false;
	  
	  var arrHistory = [];
	  var body = $document.find('body').eq(0);
	  var shownExitMessage = false;
	  
	  $rootScope.$on('$stateChangeSuccess', function(event, to, toParams, from, fromParams){
		  // if we navigated to point already been somewhere in history -> cut all the history past this point
		  /*for (var i = 0; i < arrHistory.length; i++) {
			  var state = arrHistory[i];
			  if (to.name == state.to && lodash.isEqual(toParams, state.toParams)) {
				  arrHistory.splice(i+1);
				  break;
			  }
		  }*/
  
		  var lastState = arrHistory.length ? arrHistory[arrHistory.length - 1] : null;
		  if (from.name == "" // first state
			  || (lastState && !(to.name == lastState.to && lodash.isEqual(toParams, lastState.toParams)))) // jumped back in history 
			  arrHistory.push({to: to.name, toParams: toParams, from: from.name, fromParams: fromParams});
		  if (to.name == "walletHome") {
			  $rootScope.$emit('Local/SetTab', 'walletHome', true);
		  }
		  root.menuOpened = false;
	  });
	  
	  function back() {
		  if (body.hasClass('modal-open')) {
			  $rootScope.$emit('closeModal');
		  }
		  else if (root.menuOpened) {
			  go.swipe();
			  root.menuOpened = false;
		  }
		  else {
			  var currentState = arrHistory.pop();
			  if (!currentState || currentState.from == "") {
				  arrHistory.push(currentState);
				  askAndExit();
			  } else {
				  var parent_state = $state.get('^');
				  if (parent_state.name) { // go up on state tree
					  $deepStateRedirect.reset(parent_state.name);
					  $state.go(parent_state);	
				  } else { // go back across history
					  var targetState = $state.get(currentState.from);
					  if (targetState.modal || (currentState.to == "walletHome" && $rootScope.tab == "walletHome")) { // don't go to modal and don't go to anywhere wfom home screen 
						  arrHistory.push(currentState);
						  askAndExit();
					  } else if (currentState.from.indexOf(currentState.to) != -1) { // prev state is a child of current one
						  go.walletHome();
					  } else {
						  $state.go(currentState.from, currentState.fromParams);
					  }
				  }
			  }
		  }
	  }
	  
	  function askAndExit(){
		  if (shownExitMessage) {
			  navigator.app.exitApp();
		  }
		  else {
			  shownExitMessage = true;
			  window.plugins.toast.showShortBottom(gettextCatalog.getString('Press again to exit'));
			  $timeout(function() {
				  shownExitMessage = false;
			  }, 2000);
		  }
	  }
  
	  function clearHistory() {
		  arrHistory.splice(1);
	  }
	  
	  document.addEventListener('backbutton', function() {
		  back();
	  }, false);
  
	  /*document.addEventListener('keydown', function(e) {
		  if (e.which == 37) back();
	  }, false);*/
	  
	  root.back = back;
	  root.arrHistory = arrHistory;
	  root.clearHistory = clearHistory;
	  return root;
  });
  'use strict';
  angular.module('copayApp.services')
	.factory('backupService', function backupServiceFactory($log, $timeout, profileService, sjcl) {
  
	  var root = {};
  
	  var _download = function(ew, filename, cb) {
		var NewBlob = function(data, datatype) {
		  var out;
  
		  try {
			out = new Blob([data], {
			  type: datatype
			});
			$log.debug("case 1");
		  } catch (e) {
			window.BlobBuilder = window.BlobBuilder ||
			  window.WebKitBlobBuilder ||
			  window.MozBlobBuilder ||
			  window.MSBlobBuilder;
  
			if (e.name == 'TypeError' && window.BlobBuilder) {
			  var bb = new BlobBuilder();
			  bb.append(data);
			  out = bb.getBlob(datatype);
			  $log.debug("case 2");
			} else if (e.name == "InvalidStateError") {
			  // InvalidStateError (tested on FF13 WinXP)
			  out = new Blob([data], {
				type: datatype
			  });
			  $log.debug("case 3");
			} else {
			  // We're screwed, blob constructor unsupported entirely   
			  $log.debug("Errore");
			}
		  }
		  return out;
		};
  
		var a = document.createElement("a");
		document.body.appendChild(a);
		a.style.display = "none";
  
		var blob = new NewBlob(ew, 'text/plain;charset=utf-8');
		var url = window.URL.createObjectURL(blob);
		a.href = url;
		a.download = filename;
		a.click();
		$timeout(function() {
		  window.URL.revokeObjectURL(url);
		}, 250);
		return cb();
	  };
  
	  root.addMetadata = function(b, opts) {
  
		b = JSON.parse(b);
		if (opts.historyCache) b.historyCache = opts.historyCache;
		if (opts.addressBook) b.addressBook = opts.addressBook;
		return JSON.stringify(b);
	  }
  
	  root.walletExport = function(password, opts) {
		if (!password) {
		  return null;
		}
		var fc = profileService.focusedClient;
		try {
		  opts = opts || {};
		  var b = fc.export(opts);
		  if (opts.historyCache || opts.addressBook) b = root.addMetadata(b, opts);
  
		  var e = sjcl.encrypt(password, b, {
			iter: 10000
		  });
		  return e;
		} catch (err) {
		  $log.debug('Error exporting wallet: ', err);
		  return null;
		};
	  };
  
	  root.walletDownload = function(password, opts, cb) {
		var fc = profileService.focusedClient;
		var ew = root.walletExport(password, opts);
		if (!ew) return cb('Could not create backup');
  
		var walletName = (fc.alias || '') + (fc.alias ? '-' : '') + fc.credentials.walletName;
		if (opts.noSign) walletName = walletName + '-noSign'
		var filename = walletName + '-Copaybackup.aes.json';
		_download(ew, filename, cb)
	  };
	  return root;
	});
  'use strict';
  angular.module('copayApp.services')
	.factory('bitcore', function bitcoreFactory(bwcService) {
	  var bitcore = bwcService.getBitcore();
	  return bitcore;
	});
  
  'use strict';
  angular.module('copayApp.services')
  .factory('bottomBarService', function($rootScope, $timeout, lodash, isCordova) {
	  if (!isCordova)
		  return {};
  
	  window.addEventListener('keyboardDidShow', function() {
		  $timeout(function(){
			  angular.element(document).find('body').addClass('keyboard-open');
		  }, 1);
	  });
  
	  window.addEventListener('keyboardDidHide', function() {
		  $timeout(function(){
			  angular.element(document).find('body').removeClass('keyboard-open');
		  }, 1);
	  });
  
	  return {};
  });
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
	var isDevnet = constants.version.match(/dev$/);
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
	  
	  if (isDevnet) {
		  root.TIMESTAMPER_ADDRESS = 'ZQFHJXFWT2OCEBXF26GFXJU4MPASWPJT';
		  defaultConfig.hub = 'localhost:6611';
	  }
  
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
  
  
  'use strict';
  
  angular.module('copayApp.services').factory('confirmDialog', function($log, $timeout, gettextCatalog, isCordova) {
	var root = {};
  
  
	var acceptMsg = gettextCatalog.getString('Accept');
	var cancelMsg = gettextCatalog.getString('Cancel');
	var confirmMsg = gettextCatalog.getString('Confirm');
  
	root.show = function(msg, cb) {
	  if (isCordova) {
		navigator.notification.confirm(
		  msg,
		  function(buttonIndex) {
			if (buttonIndex == 1) {
			  $timeout(function() {
				return cb(true);
			  }, 1);
			} else {
			  return cb(false);
			}
		  },
		  confirmMsg, [acceptMsg, cancelMsg]
		);
	  } else {
		return cb(confirm(msg));
	  }
	};
  
	return root;
  });
  
  
  'use strict';
  
  var constants = require('ocore/constants.js');
  var eventBus = require('ocore/event_bus.js');
  var ValidationUtils = require('ocore/validation_utils.js');
  var objectHash = require('ocore/object_hash.js');
  
  angular.module('copayApp.services').factory('correspondentListService', function($state, $rootScope, $sce, $compile, configService, storageService, profileService, go, lodash, $stickyState, $deepStateRedirect, $timeout, gettext, isCordova, pushNotificationsService) {
	  var root = {};
	  var crypto = require('crypto');
	  var device = require('ocore/device.js');
	  var wallet = require('ocore/wallet.js');
  
	  var chatStorage = require('ocore/chat_storage.js');
	  $rootScope.newMessagesCount = {};
	  $rootScope.newMsgCounterEnabled = false;
  
	  if (typeof nw !== 'undefined') {
		  var win = nw.Window.get();
		  win.on('focus', function(){
			  $rootScope.newMsgCounterEnabled = false;
		  });
		  win.on('blur', function(){
			  $rootScope.newMsgCounterEnabled = true;
		  });
		  $rootScope.$watch('newMessagesCount', function(counters) {
			  var sum = lodash.sum(lodash.values(counters));
			  if (sum) {
				  win.setBadgeLabel(""+sum);
			  } else {
				  win.setBadgeLabel("");
			  }
		  }, true);
	  }
	  $rootScope.$watch('newMessagesCount', function(counters) {
		  $rootScope.totalNewMsgCnt = lodash.sum(lodash.values(counters));
	  }, true);
	  
	  function addIncomingMessageEvent(from_address, body, message_counter){
		  var walletGeneral = require('ocore/wallet_general.js');
		  walletGeneral.readMyAddresses(function(arrMyAddresses){
			  body = highlightActions(escapeHtml(body), arrMyAddresses);
			  body = text2html(body);
			  console.log("body with markup: "+body);
			  addMessageEvent(true, from_address, body, message_counter);
		  });
	  }
	  
	  function addMessageEvent(bIncoming, peer_address, body, message_counter, skip_history_load){
		  if (!root.messageEventsByCorrespondent[peer_address] && !skip_history_load) {
			  return loadMoreHistory({device_address: peer_address}, function() {
				  addMessageEvent(bIncoming, peer_address, body, message_counter, true);
			  });
		  }
		  //root.messageEventsByCorrespondent[peer_address].push({bIncoming: true, message: $sce.trustAsHtml(body)});
		  if (bIncoming) {
			  if (peer_address in $rootScope.newMessagesCount)
				  $rootScope.newMessagesCount[peer_address]++;
			  else {
				  $rootScope.newMessagesCount[peer_address] = 1;
			  }
			  if ($rootScope.newMessagesCount[peer_address] == 1 && (!$state.is('correspondentDevices.correspondentDevice') || root.currentCorrespondent.device_address != peer_address)) {
				  root.messageEventsByCorrespondent[peer_address].push({
					  bIncoming: false,
					  message: '<span>new messages</span>',
					  type: 'system',
					  new_message_delim: true
				  });
			  }
		  }
		  var msg_obj = {
			  bIncoming: bIncoming,
			  message: body,
			  timestamp: Math.floor(Date.now() / 1000),
			  message_counter: message_counter
		  };
		  checkAndInsertDate(root.messageEventsByCorrespondent[peer_address], msg_obj);
		  insertMsg(root.messageEventsByCorrespondent[peer_address], msg_obj);
		  root.assocLastMessageDateByCorrespondent[peer_address] = new Date().toISOString().substr(0, 19).replace('T', ' ');
		  if ($state.is('walletHome') && $rootScope.tab == 'walletHome') {
			  setCurrentCorrespondent(peer_address, function(bAnotherCorrespondent){
				  $timeout(function(){
					  $stickyState.reset('correspondentDevices.correspondentDevice');
					  go.path('correspondentDevices.correspondentDevice');
				  });
			  });
		  }
		  else
			  $timeout(function(){
				  $rootScope.$digest();
			  });
	  }
  
	  function insertMsg(messages, msg_obj) {
		  for (var i = messages.length-1; i >= 0 && msg_obj.message_counter; i--) {
			  var message = messages[i];
			  if (message.message_counter === undefined || message.message_counter && msg_obj.message_counter > message.message_counter) {
				  messages.splice(i+1, 0, msg_obj);
				  return;
			  }
		  }
		  messages.push(msg_obj);
	  }
	  
	  var payment_request_regexp = /\[.*?\]\((?:byteball|obyte):([0-9A-Z]{32})\?([\w=&;+%]+)\)/g; // payment description within [] is ignored
	  
	  function highlightActions(text, arrMyAddresses){
	  //	return text.replace(/\b[2-7A-Z]{32}\b(?!(\?(amount|asset|device_address|single_address)|"))/g, function(address){
		  var assocReplacements = {};
		  var index = crypto.randomBytes(4).readUInt32BE(0);
		  function toDelayedReplacement(new_text) {
			  index++;
			  var key = '{' + index + '}';
			  assocReplacements[key] = new_text;
			  return key;
		  }
		  var text = text.replace(/(.*?\s|^)([2-7A-Z]{32})([\s.,;!:].*?|$)/g, function(str, pre, address, post){
			  if (!ValidationUtils.isValidAddress(address))
				  return str;
			  if (pre.lastIndexOf(')') < pre.lastIndexOf(']('))
				  return str;
			  if (post.indexOf('](') < post.indexOf('[') || (post.indexOf('](') > -1) && (post.indexOf('[') == -1))
				  return str;
		  //	if (arrMyAddresses.indexOf(address) >= 0)
		  //		return address;
			  //return '<a send-payment address="'+address+'">'+address+'</a>';
			  index++;
			  var key = '{' + index + '}';
			  assocReplacements[key] = '<a dropdown-toggle="#pop'+address+'">'+address+'</a><ul id="pop'+address+'" class="f-dropdown" style="left:0px" data-dropdown-content><li><a ng-click="sendPayment(\''+address+'\')">'+gettext('Pay to this address')+'</a></li><li><a ng-click="offerContract(\''+address+'\')">'+gettext('Offer a contract')+'</a></li><li><a ng-click="offerProsaicContract(\''+address+'\')">'+gettext('Offer prosaic contract')+'</a></li></ul>';
			  return pre+key+post;
		  //	return '<a ng-click="sendPayment(\''+address+'\')">'+address+'</a>';
			  //return '<a send-payment ng-click="sendPayment(\''+address+'\')">'+address+'</a>';
			  //return '<a send-payment ng-click="console.log(\''+address+'\')">'+address+'</a>';
			  //return '<a onclick="console.log(\''+address+'\')">'+address+'</a>';
		  }).replace(/(.*?\s|^)\b(https?:\/\/\S+)([\s.,;!:].*?|$)/g, function(str, pre, link, post){
			  if (pre.lastIndexOf(')') < pre.lastIndexOf(']('))
				  return str;
			  if (post.indexOf('](') < post.indexOf('[') || (post.indexOf('](') > -1) && (post.indexOf('[') == -1))
				  return str;
			  index++;
			  var key = '{' + index + '}';
			  assocReplacements[key] = '<a ng-click="openExternalLink(\''+escapeQuotes(link)+'\')" class="external-link">'+link+'</a>';
			  return pre+key+post;
		  }).replace(payment_request_regexp, function(str, address, query_string){
			  if (!ValidationUtils.isValidAddress(address))
				  return str;
		  //	if (arrMyAddresses.indexOf(address) >= 0)
		  //		return str;
			  var objPaymentRequest = parsePaymentRequestQueryString(query_string);
			  if (!objPaymentRequest)
				  return str;
			  return toDelayedReplacement('<a ng-click="sendPayment(\''+address+'\', '+objPaymentRequest.amount+', \''+objPaymentRequest.asset+'\', \''+objPaymentRequest.device_address+'\', \''+objPaymentRequest.single_address+'\')">'+objPaymentRequest.amountStr+'</a>');
		  }).replace(/\[(.+?)\]\(suggest-command:(.+?)\)/g, function(str, description, command){
			  return toDelayedReplacement('<a ng-click="suggestCommand(\''+escapeQuotes(command)+'\')" class="suggest-command">'+description+'</a>');
		  }).replace(/\[(.+?)\]\(command:(.+?)\)/g, function(str, description, command){
			  return toDelayedReplacement('<a ng-click="sendCommand(\''+escapeQuotes(command)+'\', \''+escapeQuotes(description)+'\')" class="command">'+description+'</a>');
		  }).replace(/\[(.+?)\]\(payment:(.+?)\)/g, function(str, description, paymentJsonBase64){
			  var arrMovements = getMovementsFromJsonBase64PaymentRequest(paymentJsonBase64, true);
			  if (!arrMovements)
				  return '[invalid payment request]';
			  description = 'Payment request: '+arrMovements.join(', ');
			  return toDelayedReplacement('<a ng-click="sendMultiPayment(\''+paymentJsonBase64+'\')">'+description+'</a>');
		  }).replace(/\[(.+?)\]\(vote:(.+?)\)/g, function(str, description, voteJsonBase64){
			  var objVote = getVoteFromJsonBase64(voteJsonBase64);
			  if (!objVote)
				  return '[invalid vote request]';
			  return toDelayedReplacement('<a ng-click="sendVote(\''+voteJsonBase64+'\')">'+objVote.choice+'</a>');
		  }).replace(/\[(.+?)\]\(profile:(.+?)\)/g, function(str, description, privateProfileJsonBase64){
			  var objPrivateProfile = getPrivateProfileFromJsonBase64(privateProfileJsonBase64);
			  if (!objPrivateProfile)
				  return '[invalid profile]';
			  return toDelayedReplacement('<a ng-click="acceptPrivateProfile(\''+privateProfileJsonBase64+'\')">[Profile of '+objPrivateProfile._label+']</a>');
		  }).replace(/\[(.+?)\]\(profile-request:([\w,]+?)\)/g, function(str, description, fields_list){
			  return toDelayedReplacement('<a ng-click="choosePrivateProfile(\''+escapeQuotes(fields_list)+'\')">[Request for profile]</a>');
		  }).replace(/\[(.+?)\]\(sign-message-request:(.+?)\)/g, function(str, description, message_to_sign){
			  return toDelayedReplacement('<a ng-click="showSignMessageModal(\''+escapeQuotes(message_to_sign)+'\')">[Request to sign message: '+message_to_sign+']</a>');
		  }).replace(/\[(.+?)\]\(signed-message:(.+?)\)/g, function(str, description, signedMessageBase64){
			  var info = getSignedMessageInfoFromJsonBase64(signedMessageBase64);
			  if (!info)
				  return '<i>[invalid signed message]</i>';
			  var objSignedMessage = info.objSignedMessage;
			  var text = 'Message signed by '+objSignedMessage.authors[0].address+': '+objSignedMessage.signed_message;
			  if (info.bValid)
				  text += " (valid)";
			  else if (info.bValid === false)
				  text += " (invalid)";
			  else
				  text += ' (<a ng-click="verifySignedMessage(\''+signedMessageBase64+'\')">verify</a>)';
			  return toDelayedReplacement('<i>['+text+']</i>');
		  }).replace(/\(prosaic-contract:(.+?)\)/g, function(str, contractJsonBase64){
			  var objContract = getProsaicContractFromJsonBase64(contractJsonBase64);
			  if (!objContract)
				  return '[invalid contract]';
			  return toDelayedReplacement('<a ng-click="showProsaicContractOffer(\''+contractJsonBase64+'\', true)" class="prosaic_contract_offer">[Prosaic contract offer: '+objContract.title+']</a>');
		  });
		  for (var key in assocReplacements)
			  text = text.replace(key, assocReplacements[key]);
		  return text;
	  }
	  
	  function getMovementsFromJsonBase64PaymentRequest(paymentJsonBase64, bAggregatedByAsset){
		  var paymentJson = Buffer(paymentJsonBase64, 'base64').toString('utf8');
		  console.log(paymentJson);
		  try{
			  var objMultiPaymentRequest = JSON.parse(paymentJson);
		  }
		  catch(e){
			  return null;
		  }
		  if (!ValidationUtils.isNonemptyArray(objMultiPaymentRequest.payments))
			  return null;
		  if (!objMultiPaymentRequest.payments.every(function(objPayment){
			  return ( ValidationUtils.isValidAddress(objPayment.address) && ValidationUtils.isPositiveInteger(objPayment.amount) && (!objPayment.asset || objPayment.asset === "base" || ValidationUtils.isValidBase64(objPayment.asset, constants.HASH_LENGTH)) );
		  }))
			  return null;
		  if (objMultiPaymentRequest.definitions){
			  for (var destinationAddress in objMultiPaymentRequest.definitions){
				  var arrDefinition = objMultiPaymentRequest.definitions[destinationAddress].definition;
				  if (destinationAddress !== objectHash.getChash160(arrDefinition))
					  return null;
			  }
		  }
		  try{
			  var assocPaymentsByAsset = getPaymentsByAsset(objMultiPaymentRequest);
		  }
		  catch(e){
			  return null;
		  }
		  var arrMovements = [];
		  if (bAggregatedByAsset)
			  for (var asset in assocPaymentsByAsset)
				  arrMovements.push(getAmountText(assocPaymentsByAsset[asset], asset));
		  else
			  arrMovements = objMultiPaymentRequest.payments.map(function(objPayment){
				  return getAmountText(objPayment.amount, objPayment.asset || 'base') + ' to ' + objPayment.address;
			  });
		  return arrMovements;
	  }
	  
	  function getVoteFromJsonBase64(voteJsonBase64){
		  var voteJson = Buffer(voteJsonBase64, 'base64').toString('utf8');
		  console.log(voteJson);
		  try{
			  var objVote = JSON.parse(voteJson);
		  }
		  catch(e){
			  return null;
		  }
		  if (!ValidationUtils.isStringOfLength(objVote.poll_unit, 44) || typeof objVote.choice !== 'string')
			  return null;
		  return objVote;
	  }
	  
	  function getPrivateProfileFromJsonBase64(privateProfileJsonBase64){
		  var privateProfile = require('ocore/private_profile.js');
		  var objPrivateProfile = privateProfile.getPrivateProfileFromJsonBase64(privateProfileJsonBase64);
		  if (!objPrivateProfile)
			  return null;
		  var arrFirstFields = [];
		  for (var field in objPrivateProfile.src_profile){
			  var value = objPrivateProfile.src_profile[field];
			  if (!Array.isArray(value))
				  continue;
			  arrFirstFields.push(value[0]);
			  if (arrFirstFields.length === 2)
				  break;
		  }
		  objPrivateProfile._label = arrFirstFields.join(' ');
		  return objPrivateProfile;
	  }
  
	  function getProsaicContractFromJsonBase64(strJsonBase64){
		  var strJSON = Buffer.from(strJsonBase64, 'base64').toString('utf8');
		  try{
			  var objProsaicContract = JSON.parse(strJSON);
		  }
		  catch(e){
			  return null;
		  }
		  if (!ValidationUtils.isValidAddress(objProsaicContract.my_address) || !objProsaicContract.text.length)
			  return null;
		  return objProsaicContract;
	  }
	  
	  function getSignedMessageInfoFromJsonBase64(signedMessageBase64){
		  var signedMessageJson = Buffer.from(signedMessageBase64, 'base64').toString('utf8');
		  console.log(signedMessageJson);
		  try{
			  var objSignedMessage = JSON.parse(signedMessageJson);
		  }
		  catch(e){
			  return null;
		  }
		  var info = {
			  objSignedMessage: objSignedMessage,
			  bValid: undefined
		  };
		  var validation = require('ocore/validation.js');
		  validation.validateSignedMessage(objSignedMessage, function(err){
			  info.bValid = !err;
			  if (err)
				  console.log("validateSignedMessage: "+err);
		  });
		  return info;
	  }
	  
	  function getPaymentsByAsset(objMultiPaymentRequest){
		  var assocPaymentsByAsset = {};
		  objMultiPaymentRequest.payments.forEach(function(objPayment){
			  var asset = objPayment.asset || 'base';
			  if (asset !== 'base' && !ValidationUtils.isValidBase64(asset, constants.HASH_LENGTH))
				  throw Error("asset "+asset+" is not valid");
			  if (!ValidationUtils.isPositiveInteger(objPayment.amount))
				  throw Error("amount "+objPayment.amount+" is not valid");
			  if (!assocPaymentsByAsset[asset])
				  assocPaymentsByAsset[asset] = 0;
			  assocPaymentsByAsset[asset] += objPayment.amount;
		  });
		  return assocPaymentsByAsset;
	  }
	  
	  function formatOutgoingMessage(text){
		  var assocReplacements = {};
		  var index = crypto.randomBytes(4).readUInt32BE(0);
		  function toDelayedReplacement(new_text) {
			  index++;
			  var key = '{' + index + '}';
			  assocReplacements[key] = new_text;
			  return key;
		  }
		  var text = escapeHtmlAndInsertBr(text).replace(payment_request_regexp, function(str, address, query_string){
			  if (!ValidationUtils.isValidAddress(address))
				  return str;
			  var objPaymentRequest = parsePaymentRequestQueryString(query_string);
			  if (!objPaymentRequest)
				  return str;
			  return toDelayedReplacement('<i>'+objPaymentRequest.amountStr+' to '+address+'</i>');
		  }).replace(/\[(.+?)\]\(payment:(.+?)\)/g, function(str, description, paymentJsonBase64){
			  var arrMovements = getMovementsFromJsonBase64PaymentRequest(paymentJsonBase64);
			  if (!arrMovements)
				  return '[invalid payment request]';
			  return toDelayedReplacement('<i>Payment request: '+arrMovements.join(', ')+'</i>');
		  }).replace(/\[(.+?)\]\(vote:(.+?)\)/g, function(str, description, voteJsonBase64){
			  var objVote = getVoteFromJsonBase64(voteJsonBase64);
			  if (!objVote)
				  return '[invalid vote request]';
			  return toDelayedReplacement('<i>Vote request: '+objVote.choice+'</i>');
		  }).replace(/\[(.+?)\]\(profile:(.+?)\)/g, function(str, description, privateProfileJsonBase64){
			  var objPrivateProfile = getPrivateProfileFromJsonBase64(privateProfileJsonBase64);
			  if (!objPrivateProfile)
				  return '[invalid profile]';
			  return toDelayedReplacement('<a ng-click="acceptPrivateProfile(\''+privateProfileJsonBase64+'\')">[Profile of '+objPrivateProfile._label+']</a>');
		  }).replace(/\[(.+?)\]\(profile-request:([\w,]+?)\)/g, function(str, description, fields_list){
			  return toDelayedReplacement('[Request for profile fields '+fields_list+']');
		  }).replace(/\[(.+?)\]\(sign-message-request:(.+?)\)/g, function(str, description, message_to_sign){
			  return toDelayedReplacement('<i>[Request to sign message: '+message_to_sign+']</i>');
		  }).replace(/\[(.+?)\]\(signed-message:(.+?)\)/g, function(str, description, signedMessageBase64){
			  var info = getSignedMessageInfoFromJsonBase64(signedMessageBase64);
			  if (!info)
				  return '<i>[invalid signed message]</i>';
			  var objSignedMessage = info.objSignedMessage;
			  var text = 'Message signed by '+objSignedMessage.authors[0].address+': '+objSignedMessage.signed_message;
			  if (info.bValid)
				  text += " (valid)";
			  else if (info.bValid === false)
				  text += " (invalid)";
			  else
				  text += ' (<a ng-click="verifySignedMessage(\''+signedMessageBase64+'\')">verify</a>)';
			  return toDelayedReplacement('<i>['+text+']</i>');
		  }).replace(/\bhttps?:\/\/\S+/g, function(str){
			  return toDelayedReplacement('<a ng-click="openExternalLink(\''+escapeQuotes(str)+'\')" class="external-link">'+str+'</a>');
		  }).replace(/\(prosaic-contract:(.+?)\)/g, function(str, contractJsonBase64){
			  var objContract = getProsaicContractFromJsonBase64(contractJsonBase64);
			  if (!objContract)
				  return '[invalid contract]';
			  return toDelayedReplacement('<a ng-click="showProsaicContractOffer(\''+contractJsonBase64+'\', false)" class="prosaic_contract_offer">[Prosaic contract offer: '+objContract.title+']</a>');
		  });
		  for (var key in assocReplacements)
			  text = text.replace(key, assocReplacements[key]);
		  return text;
	  }
	  
	  function parsePaymentRequestQueryString(query_string){
		  var URI = require('ocore/uri.js');
		  var assocParams = URI.parseQueryString(query_string, '&amp;');
		  var strAmount = assocParams['amount'];
		  if (!strAmount)
			  return null;
		  var amount = parseInt(strAmount);
		  if (amount + '' !== strAmount)
			  return null;
		  if (!ValidationUtils.isPositiveInteger(amount))
			  return null;
		  var asset = assocParams['asset'] || 'base';
		  console.log("asset="+asset);
		  if (asset !== 'base' && !ValidationUtils.isValidBase64(asset, constants.HASH_LENGTH)) // invalid asset
			  return null;
		  var device_address = assocParams['device_address'] || '';
		  if (device_address && !ValidationUtils.isValidDeviceAddress(device_address))
			  return null;
		  var single_address = assocParams['single_address'] || 0;
		  if (single_address)
			  single_address = single_address.replace(/^single/, '');
		  if (single_address && !ValidationUtils.isValidAddress(single_address))
			  single_address = 1;
		  var amountStr = 'Payment request: ' + getAmountText(amount, asset);
		  return {
			  amount: amount,
			  asset: asset,
			  device_address: device_address,
			  amountStr: amountStr,
			  single_address: single_address
		  };
	  }
	  
	  function text2html(text){
		  return text.replace(/\r/g, '').replace(/\n/g, '<br>').replace(/\t/g, ' &nbsp; &nbsp; ');
	  }
	  
	  function escapeHtml(text){
		  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	  }
	  
	  function escapeHtmlAndInsertBr(text){
		  return text2html(escapeHtml(text));
	  }
	  
	  function escapeQuotes(text){
		  return text.replace(/(['\\])/g, "\\$1").replace(/"/g, "&quot;");
	  }
	  
	  function setCurrentCorrespondent(correspondent_device_address, onDone){
		  if (!root.currentCorrespondent || correspondent_device_address !== root.currentCorrespondent.device_address)
			  device.readCorrespondent(correspondent_device_address, function(correspondent){
				  root.currentCorrespondent = correspondent;
				  onDone(true);
			  });
		  else
			  onDone(false);
	  }
	  
	  // amount is in smallest units
	  function getAmountText(amount, asset){
		  if (asset === 'base'){
			  var walletSettings = configService.getSync().wallet.settings;
			  var unitValue = walletSettings.unitValue;
			  var unitName = walletSettings.unitName;
			  if (amount !== 'all')
				  amount /= unitValue;
			  return amount + ' ' + unitName;
		  }
		  else if (asset === constants.BLACKBYTES_ASSET){
			  var walletSettings = configService.getSync().wallet.settings;
			  var bbUnitValue = walletSettings.bbUnitValue;
			  var bbUnitName = walletSettings.bbUnitName;
			  amount /= bbUnitValue;
			  return amount + ' ' + bbUnitName;
		  }
		  else if (profileService.assetMetadata[asset]){
			  amount /= Math.pow(10, profileService.assetMetadata[asset].decimals || 0);
			  return amount + ' ' + profileService.assetMetadata[asset].name;
		  }
		  else{
			  wallet.readAssetMetadata([asset], function(){});
			  return amount + ' of ' + asset;
		  }
	  }
		  
	  function getHumanReadableDefinition(arrDefinition, arrMyAddresses, arrMyPubKeys, assocPeerNamesByAddress, bWithLinks){
		  function getDisplayAddress(address){
			  if (arrMyAddresses.indexOf(address) >= 0)
				  return '<span title="your address: '+address+'">you</span>';
			  if (assocPeerNamesByAddress[address])
				  return '<span title="peer address: '+address+'">'+escapeHtml(assocPeerNamesByAddress[address])+'</span>';
			  return address;
		  }
		  function parse(arrSubdefinition){
			  var op = arrSubdefinition[0];
			  var args = arrSubdefinition[1];
			  switch(op){
				  case 'sig':
					  var pubkey = args.pubkey;
					  return 'signed by '+(arrMyPubKeys.indexOf(pubkey) >=0 ? 'you' : 'public key '+pubkey);
				  case 'address':
					  var address = args;
					  return 'signed by '+getDisplayAddress(address);
				  case 'cosigned by':
					  var address = args;
					  return 'co-signed by '+getDisplayAddress(address);
				  case 'not':
					  return '<span class="size-18">not</span>'+parseAndIndent(args);
				  case 'or':
				  case 'and':
					  return args.map(parseAndIndent).join('<span class="size-18">'+op+'</span>');
				  case 'r of set':
					  return 'at least '+args.required+' of the following is true:<br>'+args.set.map(parseAndIndent).join(',');
				  case 'weighted and':
					  return 'the total weight of the true conditions below is at least '+args.required+':<br>'+args.set.map(function(arg){
						  return arg.weight+': '+parseAndIndent(arg.value);
					  }).join(',');
				  case 'in data feed':
					  var arrAddresses = args[0];
					  var feed_name = args[1];
					  var relation = args[2];
					  var value = args[3];
					  var min_mci = args[4];
					  if (feed_name === 'timestamp' && relation === '>' && (typeof value === 'number' || parseInt(value).toString() === value))
						  return 'after ' + ((typeof value === 'number') ? new Date(value).toString() : new Date(parseInt(value)).toString());
					  var str = 'Oracle '+arrAddresses.join(', ')+' posted '+feed_name+' '+relation+' '+value;
					  if (min_mci)
						  str += ' after MCI '+min_mci;
					  return str;
				  case 'in merkle':
					  var arrAddresses = args[0];
					  var feed_name = args[1];
					  var value = args[2];
					  var min_mci = args[3];
					  var str = 'A proof is provided that oracle '+arrAddresses.join(', ')+' posted '+value+' in '+feed_name;
					  if (min_mci)
						  str += ' after MCI '+min_mci;
					  return str;
				  case 'has':
					  if (args.what === 'output' && args.asset && args.amount_at_least && args.address)
						  return 'sends at least ' + getAmountText(args.amount_at_least, args.asset) + ' to ' + getDisplayAddress(args.address);
					  if (args.what === 'output' && args.asset && args.amount && args.address)
						  return 'sends ' + getAmountText(args.amount, args.asset) + ' to ' + getDisplayAddress(args.address);
					  return JSON.stringify(arrSubdefinition);
				  case 'seen':
					  if (args.what === 'output' && args.asset && args.amount && args.address){
						  var dest_address = ((args.address === 'this address') ? objectHash.getChash160(arrDefinition) : args.address);
						  var bOwnAddress = (arrMyAddresses.indexOf(args.address) >= 0);
						  var expected_payment = getAmountText(args.amount, args.asset) + ' to ' + getDisplayAddress(args.address);
						  return 'there was a transaction that sends ' + ((bWithLinks && !bOwnAddress) ? ('<a ng-click="sendPayment(\''+dest_address+'\', '+args.amount+', \''+args.asset+'\')">'+expected_payment+'</a>') : expected_payment);
					  }
					  else if (args.what === 'input' && (args.asset && args.amount || !args.asset && !args.amount) && args.address){
						  var how_much = (args.asset && args.amount) ? getAmountText(args.amount, args.asset) : '';
						  return 'there was a transaction that spends '+how_much+' from '+args.address;
					  }
					  return JSON.stringify(arrSubdefinition);
  
				  default:
					  return JSON.stringify(arrSubdefinition);
			  }
		  }
		  function parseAndIndent(arrSubdefinition){
			  return '<div class="indent">'+parse(arrSubdefinition)+'</div>\n';
		  }
		  return parse(arrDefinition, 0);
	  }
  
	  var historyEndForCorrespondent = {};
	  function loadMoreHistory(correspondent, cb) {
		  if (historyEndForCorrespondent[correspondent.device_address]) {
			  if (cb) cb();
			  return;
		  }
		  if (!root.messageEventsByCorrespondent[correspondent.device_address])
			  root.messageEventsByCorrespondent[correspondent.device_address] = [];
		  var messageEvents = root.messageEventsByCorrespondent[correspondent.device_address];
		  var limit = 40;
		  var last_msg_ts = null;
		  var last_msg_id = 90071992547411;
		  if (messageEvents.length && messageEvents[0].id) {
			  last_msg_ts = new Date(messageEvents[0].timestamp * 1000);
			  last_msg_id = messageEvents[0].id;
		  }
		  chatStorage.load(correspondent.device_address, last_msg_id, limit, function(messages){
			  for (var i in messages) {
				  messages[i] = parseMessage(messages[i]);
			  }
			  var walletGeneral = require('ocore/wallet_general.js');
			  walletGeneral.readMyAddresses(function(arrMyAddresses){
				  if (messages.length < limit)
					  historyEndForCorrespondent[correspondent.device_address] = true;
				  for (var i in messages) {
					  var message = messages[i];
					  var msg_ts = new Date(message.creation_date.replace(' ', 'T')+'.000Z');
					  if (last_msg_ts && last_msg_ts.getDay() != msg_ts.getDay()) {
						  messageEvents.unshift({type: 'system', bIncoming: false, message: "<span>" + last_msg_ts.toDateString() + "</span>", timestamp: Math.floor(msg_ts.getTime() / 1000)});	
					  }
					  last_msg_ts = msg_ts;
					  if (message.type == "text") {
						  if (message.is_incoming) {
							  message.message = highlightActions(escapeHtml(message.message), arrMyAddresses);
							  message.message = text2html(message.message);
						  } else {
							  message.message = formatOutgoingMessage(message.message);
						  }
					  }
					  messageEvents.unshift({id: message.id, type: message.type, bIncoming: message.is_incoming, message: message.message, timestamp: Math.floor(msg_ts.getTime() / 1000), chat_recording_status: message.chat_recording_status});
				  }
				  if (historyEndForCorrespondent[correspondent.device_address] && messageEvents.length > 1) {
					  messageEvents.unshift({type: 'system', bIncoming: false, message: "<span>" + (last_msg_ts ? last_msg_ts : new Date()).toDateString() + "</span>", timestamp: Math.floor((last_msg_ts ? last_msg_ts : new Date()).getTime() / 1000)});
				  }
				  if (cb) cb();
			  });
		  });
	  }
  
	  function checkAndInsertDate(messageEvents, message) {
		  if (messageEvents.length == 0 || typeof messageEvents[messageEvents.length-1].timestamp == "undefined") return;
  
		  var msg_ts = new Date(message.timestamp * 1000);
		  var last_msg_ts = new Date(messageEvents[messageEvents.length-1].timestamp * 1000);
		  if (last_msg_ts.getDay() != msg_ts.getDay()) {
			  messageEvents.push({type: 'system', bIncoming: false, message: "<span>" + msg_ts.toDateString() + "</span>", timestamp: Math.floor(msg_ts.getTime() / 1000)});	
		  }
	  }
  
	  function parseMessage(message) {
		  switch (message.type) {
			  case "system":
				  message.message = JSON.parse(message.message);
				  message.message = "<span>chat recording " + (message.message.state ? "&nbsp;" : "") + "</span><b dropdown-toggle=\"#recording-drop\">" + (message.message.state ? "ON" : "OFF") + "</b><span class=\"padding\"></span>";
				  message.chat_recording_status = true;
				  break;
		  }
		  return message;
	  }
  
	  var message_signing_key_in_progress;
	  function signMessageFromAddress(message, address, signingDeviceAddresses, cb) {
		  var fc = profileService.focusedClient;
		  if (fc.isPrivKeyEncrypted()) {
			  profileService.unlockFC(null, function(err) {
				  if (err){
					  return cb(err.message);
				  }
				  signMessageFromAddress(message, address, signingDeviceAddresses, cb);
			  });
			  return;
		  }
		  
		  profileService.requestTouchid(function(err) {
			  if (err) {
				  profileService.lockFC();
				  return cb(err);
			  }
			  
			  var current_message_signing_key = crypto.createHash("sha256").update(address + message).digest('base64');
			  if (current_message_signing_key === message_signing_key_in_progress){
				  return cb("This message signing is already under way");
			  }
			  message_signing_key_in_progress = current_message_signing_key;
			  fc.signMessage(address, message, signingDeviceAddresses, function(err, objSignedMessage){
				  message_signing_key_in_progress = null;
				  if (err){
					  return cb(err);
				  }
				  var signedMessageBase64 = Buffer.from(JSON.stringify(objSignedMessage)).toString('base64');
				  cb(null, signedMessageBase64);
			  });
		  });
	  }
  
	  function populateScopeWithAttestedFields(scope, my_address, peer_address, cb) {
		  var privateProfile = require('ocore/private_profile.js');
		  scope.my_first_name = "FIRST NAME UNKNOWN";
		  scope.my_last_name = "LAST NAME UNKNOWN";
		  scope.my_attestor = {};
		  scope.peer_first_name = "FIRST NAME UNKNOWN";
		  scope.peer_last_name = "LAST NAME UNKNOWN";
		  scope.peer_attestor = {};
		  async.series([function(cb2) {
			  privateProfile.getFieldsForAddress(peer_address, ["first_name", "last_name"], lodash.map(configService.getSync().realNameAttestorAddresses, function(a){return a.address}), function(profile) {
				  scope.peer_first_name = profile.first_name || scope.peer_first_name;
				  scope.peer_last_name = profile.last_name || scope.peer_last_name;
				  scope.peer_attestor = {address: profile.attestor_address, attestation_unit: profile.attestation_unit, trusted: !!lodash.find(configService.getSync().realNameAttestorAddresses, function(attestor){return attestor.address == profile.attestor_address})}
				  cb2();
			  });
		  }, function(cb2) {
			  privateProfile.getFieldsForAddress(my_address, ["first_name", "last_name"], lodash.map(configService.getSync().realNameAttestorAddresses, function(a){return a.address}), function(profile) {
				  scope.my_first_name = profile.first_name || scope.my_first_name;
				  scope.my_last_name = profile.last_name || scope.my_last_name;
				  scope.my_attestor = {address: profile.attestor_address, attestation_unit: profile.attestation_unit, trusted: !!lodash.find(configService.getSync().realNameAttestorAddresses, function(attestor){return attestor.address == profile.attestor_address})}
				  cb2();
			  });
		  }], function(){
			  cb();
		  });
	  }
  
	  function openInExplorer(unit) {
		  var testnet = constants.version.match(/t$/) ? 'testnet' : '';
		  var url = 'https://' + testnet + 'explorer.obyte.org/#' + unit;
		  if (typeof nw !== 'undefined')
			  nw.Shell.openExternal(url);
		  else if (isCordova)
			  cordova.InAppBrowser.open(url, '_system');
	  };
  
	  /*eventBus.on("sign_message_from_address", function(message, address, signingDeviceAddresses) {
		  signMessageFromAddress(message, address, signingDeviceAddresses, function(err, signedMessageBase64){
			  if (signedMessageBase64)
				  eventBus.emit("message_signed_from_address", message, address, signedMessageBase64);
		  });
	  });*/
	  
	  eventBus.on("text", function(from_address, body, message_counter){
		  device.readCorrespondent(from_address, function(correspondent){
			  if (!root.messageEventsByCorrespondent[correspondent.device_address]) loadMoreHistory(correspondent);
			  addIncomingMessageEvent(correspondent.device_address, body, message_counter);
			  if (correspondent.my_record_pref && correspondent.peer_record_pref) chatStorage.store(from_address, body, 1);
		  });
	  });
  
	  eventBus.on("chat_recording_pref", function(correspondent_address, enabled, message_counter){
		  device.readCorrespondent(correspondent_address, function(correspondent){
			  var oldState = (correspondent.peer_record_pref && correspondent.my_record_pref);
			  correspondent.peer_record_pref = enabled;
			  var newState = (correspondent.peer_record_pref && correspondent.my_record_pref);
			  device.updateCorrespondentProps(correspondent);
			  if (newState != oldState) {
				  if (!root.messageEventsByCorrespondent[correspondent_address]) root.messageEventsByCorrespondent[correspondent_address] = [];
				  var message = {
					  type: 'system',
					  message: JSON.stringify({state: newState}),
					  timestamp: Math.floor(Date.now() / 1000),
					  chat_recording_status: true,
					  message_counter: message_counter
				  };
				  insertMsg(root.messageEventsByCorrespondent[correspondent_address], parseMessage(message));
				  $timeout(function(){
					  $rootScope.$digest();
				  });
				  chatStorage.store(correspondent_address, JSON.stringify({state: newState}), 0, 'system');
			  }
			  if (root.currentCorrespondent && root.currentCorrespondent.device_address == correspondent_address) {
				  root.currentCorrespondent.peer_record_pref = enabled ? 1 : 0;
			  }
		  });
	  });
	  
	  eventBus.on("sent_payment", function(peer_address, amount, asset, bToSharedAddress){
		  var title = bToSharedAddress ? 'Payment to smart address' : 'Payment';
		  setCurrentCorrespondent(peer_address, function(bAnotherCorrespondent){
			  var body = '<a ng-click="showPayment(\''+asset+'\')" class="payment">'+title+': '+getAmountText(amount, asset)+'</a>';
			  addMessageEvent(false, peer_address, body);
			  device.readCorrespondent(peer_address, function(correspondent){
				  if (correspondent.my_record_pref && correspondent.peer_record_pref) chatStorage.store(peer_address, body, 0, 'html');
			  });
			  $timeout(function(){
				  go.path('correspondentDevices.correspondentDevice');
			  });
		  });
	  });
	  
	  eventBus.on("received_payment", function(peer_address, amount, asset, message_counter, bToSharedAddress){
		  var title = bToSharedAddress ? 'Payment to smart address' : 'Payment';
		  var body = '<a ng-click="showPayment(\''+asset+'\')" class="payment">'+title+': '+getAmountText(amount, asset)+'</a>';
		  addMessageEvent(true, peer_address, body, message_counter);
		  device.readCorrespondent(peer_address, function(correspondent){
			  if (correspondent.my_record_pref && correspondent.peer_record_pref) chatStorage.store(peer_address, body, 1, 'html');
		  });
	  });
	  
	  eventBus.on('paired', function(device_address){
		  pushNotificationsService.pushNotificationsInit();
		  if ($state.is('correspondentDevices'))
			  return $state.reload(); // refresh the list
		  if (!$state.is('correspondentDevices.correspondentDevice'))
			  return;
		  if (!root.currentCorrespondent)
			  return;
		  if (device_address !== root.currentCorrespondent.device_address)
			  return;
		  // re-read the correspondent to possibly update its name
		  device.readCorrespondent(device_address, function(correspondent){
			  // do not assign a new object, just update its property (this object was already bound to a model)
			  root.currentCorrespondent.name = correspondent.name;
			  $timeout(function(){
				  $rootScope.$digest();
			  });
		  });
	  });
  
	   eventBus.on('removed_paired_device', function(device_address){
		  if ($state.is('correspondentDevices'))
			  return $state.reload(); // todo show popup after refreshing the list
		  if (!$state.is('correspondentDevices.correspondentDevice'))
			   return;
		  if (!root.currentCorrespondent)
			   return;
		  if (device_address !== root.currentCorrespondent.device_address)
			   return;
		  
		  // go back to list of correspondentDevices
		  // todo show popup message
		  // todo return to correspondentDevices when in edit-mode, too
		  $deepStateRedirect.reset('correspondentDevices');
		  go.path('correspondentDevices');
		  $timeout(function(){
			  $rootScope.$digest();
		  });
	  });
	  
  
	  $rootScope.$on('Local/CorrespondentInvitation', function(event, device_pubkey, device_hub, pairing_secret){
		  console.log('CorrespondentInvitation', device_pubkey, device_hub, pairing_secret);
		  root.acceptInvitation(device_hub, device_pubkey, pairing_secret, function(){});
	  });
  
	  
	  root.getPaymentsByAsset = getPaymentsByAsset;
	  root.getAmountText = getAmountText;
	  root.setCurrentCorrespondent = setCurrentCorrespondent;
	  root.formatOutgoingMessage = formatOutgoingMessage;
	  root.getHumanReadableDefinition = getHumanReadableDefinition;
	  root.loadMoreHistory = loadMoreHistory;
	  root.checkAndInsertDate = checkAndInsertDate;
	  root.parseMessage = parseMessage;
	  root.escapeHtmlAndInsertBr = escapeHtmlAndInsertBr;
	  root.addMessageEvent = addMessageEvent;
	  root.getProsaicContractFromJsonBase64 = getProsaicContractFromJsonBase64;
	  root.signMessageFromAddress = signMessageFromAddress;
	  root.populateScopeWithAttestedFields = populateScopeWithAttestedFields;
	  root.openInExplorer = openInExplorer;
	  
	  root.list = function(cb) {
		device.readCorrespondents(function(arrCorrespondents){
			cb(null, arrCorrespondents);
		});
	  };
  
  
	  root.startWaitingForPairing = function(cb){
		  device.startWaitingForPairing(function(pairingInfo){
			  cb(pairingInfo);
		  });
	  };
	  
	  root.acceptInvitation = function(hub_host, device_pubkey, pairing_secret, cb){
		  //return setTimeout(cb, 5000);
		  if (device_pubkey === device.getMyDevicePubKey())
			  return cb("cannot pair with myself");
		  if (!device.isValidPubKey(device_pubkey))
			  return cb("invalid peer public key");
		  // the correspondent will be initially called 'New', we'll rename it as soon as we receive the reverse pairing secret back
		  device.addUnconfirmedCorrespondent(device_pubkey, hub_host, 'New', function(device_address){
			  device.startWaitingForPairing(function(reversePairingInfo){
				  device.sendPairingMessage(hub_host, device_pubkey, pairing_secret, reversePairingInfo.pairing_secret, {
					  ifOk: cb,
					  ifError: cb
				  });
			  });
			  // this continues in parallel
			  // open chat window with the newly added correspondent
			  device.readCorrespondent(device_address, function(correspondent){
				  root.currentCorrespondent = correspondent;
				  if (!$state.is('correspondentDevices.correspondentDevice'))
					  go.path('correspondentDevices.correspondentDevice');
				  else {
					  $stickyState.reset('correspondentDevices.correspondentDevice');
					  $state.reload();
				  }
			  });
		  });
	  };
	  
	  root.currentCorrespondent = null;
	  root.messageEventsByCorrespondent = {};
	  root.assocLastMessageDateByCorrespondent = {};
  
	  root.listenForProsaicContractResponse = function(contracts) {
		  var prosaic_contract = require('ocore/prosaic_contract.js');
		  var storage = require('ocore/storage.js');
		  var fc = profileService.focusedClient;
  
		  var showError = function(msg) {
			  $rootScope.$emit('Local/ShowErrorAlert', msg);
		  }
  
		  var start_listening = function(contracts) {
			  contracts.forEach(function(contract){
				  console.log('listening for prosaic contract response ' + contract.hash);
  
				  var sendUnit = function(accepted, authors){
					  if (!accepted) {
						  return;
					  }
  
					  if (fc.isPrivKeyEncrypted()) {
						  profileService.unlockFC(null, function(err) {
							  if (err){
								  showError(err);
								  return;
							  }
							  sendUnit(accepted, authors);
						  });
						  return;
					  }
					  
					  root.readLastMainChainIndex(function(err, last_mci){
						  if (err){
							  showError(err);
							  return;
						  }
						  var arrDefinition = 
							  ['and', [
								  ['address', contract.my_address],
								  ['address', contract.peer_address]
							  ]];
						  var assocSignersByPath = {
							  'r.0': {
								  address: contract.my_address,
								  member_signing_path: 'r',
								  device_address: device.getMyDeviceAddress()
							  },
							  'r.1': {
								  address: contract.peer_address,
								  member_signing_path: 'r',
								  device_address: contract.peer_device_address
							  }
						  };
						  require('ocore/wallet_defined_by_addresses.js').createNewSharedAddress(arrDefinition, assocSignersByPath, {
							  ifError: function(err){
								  showError(err);
							  },
							  ifOk: function(shared_address){
								  composeAndSend(shared_address);
							  }
						  });
					  });
					  
					  // create shared address and deposit some bytes to cover fees
					  function composeAndSend(shared_address){
						  prosaic_contract.setField(contract.hash, "shared_address", shared_address);
						  device.sendMessageToDevice(contract.peer_device_address, "prosaic_contract_update", {hash: contract.hash, field: "shared_address", value: shared_address});
						  contract.cosigners.forEach(function(cosigner){
							  if (cosigner != device.getMyDeviceAddress())
								  prosaic_contract.share(contract.hash, cosigner);
						  });
  
						  profileService.bKeepUnlocked = true;
						  var opts = {
							  asset: "base",
							  to_address: shared_address,
							  amount: prosaic_contract.CHARGE_AMOUNT,
							  arrSigningDeviceAddresses: contract.cosigners
						  };
						  fc.sendMultiPayment(opts, function(err){
							  // if multisig, it might take very long before the callback is called
							  //self.setOngoingProcess();
							  profileService.bKeepUnlocked = false;
							  if (err){
								  if (err.match(/device address/))
									  err = "This is a private asset, please send it only by clicking links from chat";
								  if (err.match(/no funded/))
									  err = "Not enough spendable funds, make sure all your funds are confirmed";
								  showError(err);
								  return;
							  }
							  $rootScope.$emit("NewOutgoingTx");
  
							  // post a unit with contract text hash and send it for signing to correspondent
							  var value = {"contract_text_hash": contract.hash};
							  var objMessage = {
								  app: "data",
								  payload_location: "inline",
								  payload_hash: objectHash.getBase64Hash(value, storage.getMinRetrievableMci() >= constants.timestampUpgradeMci),
								  payload: value
							  };
  
							  fc.sendMultiPayment({
								  arrSigningDeviceAddresses: contract.cosigners.length ? contract.cosigners.concat([contract.peer_device_address]) : [],
								  shared_address: shared_address,
								  messages: [objMessage]
							  }, function(err, unit) { // can take long if multisig
								  //indexScope.setOngoingProcess(gettext('proposing a contract'), false);
								  if (err) {
									  showError(err);
									  return;
								  }
								  prosaic_contract.setField(contract.hash, "unit", unit);
								  device.sendMessageToDevice(contract.peer_device_address, "prosaic_contract_update", {hash: contract.hash, field: "unit", value: unit});
								  var testnet = constants.version.match(/t$/) ? 'testnet' : '';
								  var url = 'https://' + testnet + 'explorer.obyte.org/#' + unit;
								  var text = "unit with contract hash for \""+ contract.title +"\" was posted into DAG " + url;
								  addMessageEvent(false, contract.peer_device_address, formatOutgoingMessage(text));
								  device.sendMessageToDevice(contract.peer_device_address, "text", text);
							  });
						  });
					  }
				  };
				  eventBus.once("prosaic_contract_response_received" + contract.hash, sendUnit);
			  });
		  }
  
		  if (contracts)
			  return start_listening(contracts);
		  prosaic_contract.getAllByStatus("pending", function(contracts){
			  start_listening(contracts);
		  });
	  }
	  root.listenForProsaicContractResponse();
  
	  root.readLastMainChainIndex = function(cb){
		  if (require('ocore/conf.js').bLight){
			  require('ocore/network.js').requestFromLightVendor('get_last_mci', null, function(ws, request, response){
				  response.error ? cb(response.error) : cb(null, response);
			  });
		  }
		  else
			  require('ocore/storage.js').readLastMainChainIndex(function(last_mci){
				  cb(null, last_mci);
			  })
	  }
	/*
	root.remove = function(addr, cb) {
	  var fc = profileService.focusedClient;
	  root.list(function(err, ab) {
		if (err) return cb(err);
		if (!ab) return;
		if (!ab[addr]) return cb('Entry does not exist');
		delete ab[addr];
		storageService.setCorrespondentList(fc.credentials.network, JSON.stringify(ab), function(err) {
		  if (err) return cb('Error deleting entry');
		  root.list(function(err, ab) {
			return cb(err, ab);
		  });
		});
	  }); 
	};
  
	root.removeAll = function() {
	  var fc = profileService.focusedClient;
	  storageService.removeCorrespondentList(fc.credentials.network, function(err) {
		if (err) return cb('Error deleting correspondentList');
		return cb();
	  });
	};*/
  
	  return root;
  });
  
  'use strict';
  
  angular.module('copayApp.services').factory('derivationPathHelper', function(lodash) {
	var root = {};
  
	root.default = "m/44'/0'/0'"
	root.parse = function(str) {
	  var arr = str.split('/');
  
	  var ret = {};
  
	  if (arr[0] != 'm')
		return false;
  
	  switch (arr[1]) {
		case "44'":
		  ret.derivationStrategy = 'BIP44';
		  break;
		case "48'":
		  ret.derivationStrategy = 'BIP48';
		  break;
		default:
		  return false;
	  };
  
	  switch (arr[2]) {
		case "0'":
		  ret.networkName = 'livenet';
		  break;
		case "1'":
		  ret.networkName = 'testnet';
		  break;
		default:
		  return false;
	  };
  
	  var match = arr[3].match(/(\d+)'/);
	  if (!match)
		return false;
	  ret.account = + match[1]
  
	  return ret;
	};
  
	return root;
  });
  
  'use strict';
  
  angular.module('copayApp.services')
	.factory('fileStorageService', function() {
	  var fileStorage = require('./fileStorage.js');
	  var root = {};
	  
	  root.get = function(k, cb) {
		  fileStorage.get(k, cb);
	  };
	  
	  root.set = function(k, v, cb) {
		  fileStorage.set(k, v, cb);  
	  };
		
  
	  root.remove = function(k, cb) {
		fileStorage.init(function(err, fs, dir) {
		  if (err) return cb(err);
		  dir.getFile(k, {
			create: false
		  }, function(fileEntry) {
			// Create a FileWriter object for our FileEntry (log.txt).
			fileEntry.remove(function() {
			  console.log('File removed.');
			  return cb();
			}, cb);
		  }, cb);
		});
	  };
  
	  /**
	   * Same as setItem, but fails if an item already exists
	   */
	  root.create = function(name, value, callback) {
		fileStorage.get(name,
		  function(err, data) {
			if (data) {
			  return callback('EEXISTS');
			} else {
			  return fileStorage.set(name, value, callback);
			}
		  });
	  };
  
	  return root;
	});
  
  'use strict';
  
  angular.module('copayApp.services')
  .factory('fileSystemService', function($log, isCordova) {
	  var root = {},
		  bFsInitialized = false;
	  
	  try {
		  var fs = require('fs');
		  var desktopApp = require('ocore/desktop_app.js' + '');
	  } catch (e) {
		  
	  }
	  
	  root.init = function(cb) {
		  if (bFsInitialized) return cb(null);
		  
		  function onFileSystemSuccess(fileSystem) {
			  console.log('File system started: ', fileSystem.name, fileSystem.root.name);
			  bFsInitialized = true;
			  return cb(null);
		  }
		  
		  function fail(evt) {
			  var msg = 'Could not init file system: ' + evt.target.error.code;
			  console.log(msg);
			  return cb(msg);
		  }
		  
		  window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onFileSystemSuccess, fail);
	  };
	  
	  root.readFileFromForm = function(file, cb) {
		  if (isCordova) {
			  var reader = new FileReader();
			  reader.onloadend = function() {
				  var fileBuffer = Buffer.from(new Uint8Array(this.result));
				  cb(null, fileBuffer);
			  };
			  reader.readAsArrayBuffer(file);
		  }
		  else {
			  return cb(null, fs.createReadStream(file.path));
		  }
	  };
	  
	  root.readFile = function(path, cb) {
		  if (isCordova) {
			  root.init(function() {
				  window.resolveLocalFileSystemURL(path, function(fileEntry) {
					  fileEntry.file(function(file) {
						  root.readFileFromForm(file, cb);
					  });
				  }, function(e) {
					  throw new Error('error: ' + JSON.stringify(e));
				  });
			  });
		  }
		  else {
			  fs.readFile(path, function(err, data) {
				  return err ? cb(err) : cb(null, data);
			  });
		  }
	  };
	  
	  root.getPath = function(path, cb) {
		  return cb(null, path.replace(/\\/g, '/'));
	  };
	  
	  root.nwWriteFile = function(path, data, cb) {
		  if (!isCordova) {
			  fs.writeFile(path, data, function(err) {
				  return err ? cb(err) : cb(null);
			  });
		  }
		  else {
			  cb('use cordovaWriteFile')
		  }
	  };
	  
	  // example: fileSystemService.cordovaWriteFile(cordova.file.externalRootDirectory, 'testFolder', 'testFile.txt', 'testText :)', function(err) {
	  root.cordovaWriteFile = function(cordovaFile, path, fileName, data, cb) {
		  if (isCordova) {
			  root.init(function() {
				  window.resolveLocalFileSystemURL(cordovaFile, function(dirEntry) {
					  if (!path || path == '.' || path == '/') {
						  _cordovaWriteFile(dirEntry, fileName, data, cb);
					  }
					  else {
						  dirEntry.getDirectory(path, {create: true, exclusive: false}, function(dirEntry1) {
							  _cordovaWriteFile(dirEntry1, fileName, data, cb);
						  }, cb);
					  }
				  }, cb);
			  });
		  }
		  else {
			  cb('use nwWriteFile');
		  }
	  };
	  
	  //on mobile, big files can crash the application, we write data by chunk to prevent this issue
	  function writeByChunks(writer, data, handle) {
		  var written = 0;
		  const BLOCK_SIZE = 1*1024*1024; // write 1M every time of write
		  function writeNext(cbFinish) {
			  var chunkSize = Math.min(BLOCK_SIZE, data.byteLength - written);
			  var dataChunk = data.slice(written, written + chunkSize);
			  written += chunkSize;
			  writer.onwrite = function(evt) {
				  if (written < data.byteLength)
					  writeNext(cbFinish);
				  else
					  cbFinish(null);
			  };
			  writer.write(dataChunk);
		  }
		  writeNext(handle);
	  }
  
	  function _cordovaWriteFile(dirEntry, name, data, cb) {
		  if(typeof data != 'string') data = data.buffer;
		  dirEntry.getFile(name, {create: true, exclusive: false}, function(file) {
			  file.createWriter(function(writer) {
				  writeByChunks(writer, data, cb);
			  }, cb);
		  }, cb);
	  }
	  
	  root.readdir = function(path, cb) {
		  if (isCordova) {
			  root.init(function() {
				  window.resolveLocalFileSystemURL(path,
					  function(fileSystem) {
						  var reader = fileSystem.createReader();
						  reader.readEntries(
							  function(entries) {
								  cb(null, entries.map(function(entry) {
									  return entry.name
								  }));
							  },
							  function(err) {
								  cb(err);
							  }
						  );
					  }, function(err) {
						  cb(err);
					  }
				  );
			  });
		  }
		  else {
			  fs.readdir(path, function(err, entries) {
				  return err ? cb(err) : cb(null, entries);
			  });
		  }
	  };
	  
	  root.nwMoveFile = function(oldPath, newPath, cb){
		  var read = fs.createReadStream(oldPath);
		  var write = fs.createWriteStream(newPath);
  
		  read.pipe(write);
		  read.on('end',function() {
			  fs.unlink(oldPath, cb);
		  });
	  };
	  
	  root.nwUnlink = function(path, cb) {
		  fs.unlink(path, cb);
	  };
	  
	  root.nwRmDir = function(path, cb) {
		  fs.rmdir(path, cb);
	  };
	  
	  root.nwExistsSync = function(path) {
		  return fs.existsSync(path);
	  };
	  
	  
	  root.getParentDirPath = function() {
		  if (!isCordova) return false;
		  switch (window.cordova.platformId) {
			  case 'ios':
				  return window.cordova.file.applicationStorageDirectory + '/Library';
			  case 'android':
			  default:
				  return window.cordova.file.applicationStorageDirectory;
		  }
	  };
	  
	  root.getDatabaseDirName = function() {
		  if (!isCordova) return false;
		  switch (window.cordova.platformId) {
			  case 'ios':
				  return 'LocalDatabase';
			  case 'android':
			  default:
				  return 'databases';
		  }
	  };
	  
	  root.getDatabaseDirPath = function() {
		  if (isCordova) {
			  return root.getParentDirPath() + '/' + root.getDatabaseDirName();
		  }
		  else {
			  return desktopApp.getAppDataDir();
		  }
	  };
  
	  root.recursiveMkdir = function(path, mode, callback) {
		  var parentDir = require('path' + '').dirname(path);
		  
		  fs.stat(parentDir, function(err, stats) {
			  if (err && err.code !== 'ENOENT')
				  throw Error("failed to stat dir: "+err);
  
			  if (err && err.code === 'ENOENT') {
				  root.recursiveMkdir(parentDir, mode, function(err) {
					  if (err)
						  callback(err);
					  else
						  fs.mkdir(path, mode, callback);
				  });
			  } else {
				  fs.mkdir(path, mode, callback);
			  }
		  });
	  };
	  
	  return root;
  });
  
  'use strict';
  
  var eventBus = require('ocore/event_bus.js');
  
  angular.module('copayApp.services').factory('go', function($window, $rootScope, $location, $state, profileService, fileSystemService, nodeWebkit, notification, gettextCatalog, authService, $deepStateRedirect, $stickyState, configService) {
	  var root = {};
  
	  var hideSidebars = function() {
		  if (typeof document === 'undefined')
			  return;
  
		  var elem = document.getElementById('off-canvas-wrap');
		  elem.className = 'off-canvas-wrap';
	  };
  
	  var toggleSidebar = function(invert) {
		  if (typeof document === 'undefined')
			  return;
  
		  var elem = document.getElementById('off-canvas-wrap');
		  var leftbarActive = elem.className.indexOf('move-right') >= 0;
  
		  if (invert) {
			  if (profileService.profile && !$rootScope.hideNavigation) {
				  elem.className = 'off-canvas-wrap move-right';
			  }
		  } else {
			  if (leftbarActive) {
				  hideSidebars();
			  }
		  }
	  };
  
	  root.openExternalLink = function(url, target) {
		  if (nodeWebkit.isDefined()) {
			  nodeWebkit.openExternalLink(url);
		  }
		  else {
			  target = target || '_blank';
			  var ref = window.open(url, target, 'location=no');
		  }
	  };
  
	  root.path = function(path, cb) {
		  $state.go(path)
		  .then(function() {
			  console.log("transition done "+path);
			  if (cb) return cb();
		  }, function() {
			  console.log("transition failed "+path);
			  if (cb) return cb('animation in progress');
		  });
		  hideSidebars();
	  };
  
	  root.swipe = function(invert) {
		  toggleSidebar(invert);
	  };
  
	  root.walletHome = function() {
		  var fc = profileService.focusedClient;
		  if (fc && !fc.isComplete())
			  root.path('copayers');
		  else {
			  root.path('walletHome', function() {
				  $rootScope.$emit('Local/SetTab', 'walletHome', true);
			  });
		  }
	  };
  
  
	  root.send = function(cb) {
		  $stickyState.reset('walletHome');
		  root.path('walletHome', function() {
			  $rootScope.$emit('Local/SetTab', 'send');
			  if (cb)
				  cb();
		  });
	  };
  
	  root.history = function(cb) {
		  root.path('walletHome', function() {
			  $rootScope.$emit('Local/SetTab', 'history');
			  if (cb)
				  cb();
		  });
	  };
  
	  root.addWallet = function() {
		  $state.go('add');
	  };
  
	  root.preferences = function() {
		  $state.go('preferences');
	  };
  
	  root.preferencesGlobal = function() {
		  $state.go('preferencesGlobal');
	  };
  
	  root.reload = function() {
		  $state.reload();
	  };
  
  
	  // Global go. This should be in a better place TODO
	  // We dont do a 'go' directive, to use the benefits of ng-touch with ng-click
	  $rootScope.go = function(path, resetState) {
		  var targetState = $state.get(path);
		  if (resetState) $deepStateRedirect.reset(targetState.name);
		  root.path(path);
	  };
  
	  $rootScope.openExternalLink = function(url, target) {
		  root.openExternalLink(url, target);
	  };
  
  
	  function handleUri(uri){
		  if (uri.indexOf("byteball:") == -1 && uri.indexOf("obyte:") == -1) return handleFile(uri);
  
		  console.log("handleUri "+uri);
  
		  require('ocore/uri.js').parseUri(uri, {
			  ifError: function (err) {
				  console.log(err);
				  notification.error(err);
				  //notification.success(gettextCatalog.getString('Success'), err);
			  },
			  ifOk: function (objRequest) {
				  console.log("request: " + JSON.stringify(objRequest));
				  setTimeout(function () {
					  if (objRequest.type === 'address') {
						  root.send(function () {
							  $rootScope.$emit('paymentRequest', objRequest.address, objRequest.amount, objRequest.asset);
						  });
					  }
					  else if (objRequest.type === 'data') {
						  delete objRequest.type;
						  root.send(function () {
							  $rootScope.$emit('dataPrompt', objRequest);
						  });
					  }
					  else if (objRequest.type === 'pairing') {
						  $rootScope.$emit('Local/CorrespondentInvitation', objRequest.pubkey, objRequest.hub, objRequest.pairing_secret);
					  }
					  else if (objRequest.type === 'auth') {
						  authService.objRequest = objRequest;
						  root.path('authConfirmation');
					  }
					  else if (objRequest.type === 'textcoin') {
						  $rootScope.$emit('claimTextcoin', objRequest.mnemonic);
					  }
					  else
						  throw Error('unknown url type: ' + objRequest.type);
				  });
			  }
		  });
	  }
  
	  var last_handle_file_ts = 0;
  
	  function handleFile(uri) {
		  var checkDoubleClaim = function() {
			  if (double_claim)
				  eventBus.emit('nonfatal_error', "double claim of private textcoin", new Error());
		  }
		  var double_claim = false;
		  if (Date.now() - last_handle_file_ts < 500) {
			  //double_claim = true;
			  return;
		  }
		  last_handle_file_ts = Date.now();
		  var breadcrumbs = require('ocore/breadcrumbs.js');
		  console.log("handleFile "+uri);
		  root.walletHome();
		  $rootScope.$emit('process_status_change', 'claiming', true);
		  var cb = function(err, data) {
			  breadcrumbs.add("callback from handlePrivatePaymentFile");
			  if (err) {
				  $rootScope.$emit('process_status_change', 'claiming', false);
				  return notification.error(err);
			  }
			  $rootScope.$emit('claimTextcoin', data.mnemonic);
		  }
		  if (uri.indexOf("content:") !== -1) {
			  window.plugins.intent.readFileFromContentUrl(uri.replace(/#/g,'%23'), function (content) {
				  breadcrumbs.add("handleFile - content url");
				  require('ocore/wallet.js').handlePrivatePaymentFile(null, content, cb);
			  }, function (err) {throw err});
			  return checkDoubleClaim();
		  }
		  if (uri.indexOf("." + configService.privateTextcoinExt) != -1) {
			  breadcrumbs.add("handleFile - file path url");
			  require('ocore/wallet.js').handlePrivatePaymentFile(uri, null, cb);
			  return checkDoubleClaim();
		  }
		  $rootScope.$emit('process_status_change', 'claiming', false);
	  }
	  
	  function extractObyteArgFromCommandLine(commandLine){
		  var conf = require('ocore/conf.js');
		  var bb_url = new RegExp('^'+conf.program+':', 'i');
		  var ob_url = new RegExp('^'+conf.program.replace(/byteball/i, 'obyte')+':', 'i');
		  var file = new RegExp("\\."+configService.privateTextcoinExt+'$', 'i');
		  var tokenize = function(str) {
			  var tokens = [];
			  var start = -1; // opening quote index
			  var lastSpace = -1;
			  for (var i = 0; i < str.length; i++) {
				  if (str[i] == '"' || str[i] == '\'')
					  if (start != -1) {
						  tokens.push(str.substring(start+1, i));
						  start = -1;
					  } else
						  start = i;
				  if (str[i] == ' ' && start == -1) {
					  if (str.substring(lastSpace+1, i).length)
						  tokens.push(str.substring(lastSpace+1, i));
					  lastSpace = i;
				  }
			  }
			  if (lastSpace != -1 && str.substring(lastSpace+1, i).length) {
				  tokens.push(str.substring(lastSpace+1, i));
			  }
			  return (tokens.length > 0) ? tokens : [str];
		  }
		  var arrParts = tokenize(commandLine); // on windows commandLine includes exe and all args, on mac just our arg
		  for (var i=0; i<arrParts.length; i++){
			  var part = arrParts[i].trim().replace(/"/g, '');
			  if (part.match(bb_url) || part.match(ob_url) || part.match(file))
				  return part;
		  }
		  return null;
	  }
	  
	  function registerWindowsProtocolHandler(){
		  // now we do it in inno setup
	  }
	  
	  function createLinuxDesktopFile(){
		  console.log("will write .desktop file");
		  var fs = require('fs'+'');
		  var path = require('path'+'');
		  var child_process = require('child_process'+'');
		  var package_json = require('../package.json'+''); // relative to html root
		  var oname = package_json.name.replace(/byteball/i, 'obyte');
		  var applicationsDir = process.env.HOME + '/.local/share/applications';
		  var mimeDir = process.env.HOME + '/.local/share/mime';
		  fileSystemService.recursiveMkdir(applicationsDir, parseInt('700', 8), function(err){
			  console.log('mkdir applications: '+err);
			  fs.writeFile(applicationsDir + '/' +oname+'.desktop', "[Desktop Entry]\n\
  Type=Application\n\
  Version=1.0\n\
  Name="+oname+"\n\
  Comment="+package_json.description+"\n\
  Exec="+process.execPath.replace(/ /g, '\\ ')+" %u\n\
  Icon="+path.dirname(process.execPath)+"/public/img/icons/logo-circle-256.png\n\
  Terminal=false\n\
  Categories=Office;Finance;\n\
  MimeType=x-scheme-handler/"+package_json.name+";application/x-"+package_json.name+";x-scheme-handler/"+oname+";application/x-"+oname+";\n\
  X-Ubuntu-Touch=true\n\
  X-Ubuntu-StageHint=SideStage\n", {mode: parseInt('755', 8)}, function(err){
				  if (err)
					  throw Error("failed to write desktop file: "+err);
				  child_process.exec('update-desktop-database '+applicationsDir, function(err){
					  if (err)
						  throw Error("failed to exec update-desktop-database: "+err);
					  var writeXml = function() {
						  fs.writeFile(mimeDir + '/packages/' + oname+'.xml', "<?xml version=\"1.0\"?>\n\
	   <mime-info xmlns='http://www.freedesktop.org/standards/shared-mime-info'>\n\
		 <mime-type type=\"application/x-"+oname+"\">\n\
		 <comment>Obyte Private Coin</comment>\n\
		 <glob pattern=\"*."+configService.privateTextcoinExt+"\"/>\n\
		</mime-type>\n\
	   </mime-info>\n", {mode: parseInt('755', 8)}, function(err) {
							   if (err)
								  throw Error("failed to write MIME config file: "+err);
							  child_process.exec('update-mime-database '+mimeDir, function(err){
								  if (err)
									  throw Error("failed to exec update-mime-database: "+err);
								  child_process.exec('xdg-icon-resource install --context mimetypes --size 64 '+path.dirname(process.execPath)+'/public/img/icons/logo-circle-64.png application-x-'+oname, function(err){});
							  });
							   console.log(".desktop done");
						   });
					  };
					  if (!fs.existsSync(mimeDir + '/packages')) {
						  fileSystemService.recursiveMkdir(mimeDir + '/packages', parseInt('755', 8), function(err){
							  writeXml();
						  });
					  }
					  else
						  writeXml();
				  });
			  });
		  });
	  }
	  
	  var gui;
	  try{
		  gui = require('nw.gui');
	  }
	  catch(e){
	  }
	  
	  if (gui){ // nwjs
		  var removeListenerForOnopen = $rootScope.$on('Local/BalanceUpdatedAndWalletUnlocked', function(){
			  removeListenerForOnopen();
			  gui.App.on('open', function(commandLine) {
				  console.log("Open url: " + commandLine);
				  if (commandLine){
					  var file = extractObyteArgFromCommandLine(commandLine);
					  if (!file)
						  return console.log("no byteball:, obyte:, or file arg found");
					  handleUri(file);
					  gui.Window.get().focus();
				  }
			  });
		  });
		  console.log("argv: "+gui.App.argv);
		  if (gui.App.argv[0]){
			  // wait till the wallet fully loads
			  var removeListener = $rootScope.$on('Local/BalanceUpdatedAndWalletUnlocked', function(){
				  setTimeout(function(){
					  handleUri(gui.App.argv[0]);
				  }, 100);
				  removeListener();
			  });
		  }
		  if (process.platform === 'win32' || process.platform === 'linux'){
			  // wait till the wallet fully loads
			  var removeRegListener = $rootScope.$on('Local/BalanceUpdated', function(){
				  setTimeout(function(){
					  (process.platform === 'win32') ? registerWindowsProtocolHandler() : createLinuxDesktopFile();
					  gui.desktop = process.env.HOME + '/.local/share/applications';
				  }, 200);
				  removeRegListener();
			  });
		  }
		  /*var win = gui.Window.get();
		  win.on('close', function(){
			  console.log('close event');
			  var db = require('ocore/db.js');
			  db.close(function(err){
				  console.log('close err: '+err);
			  });
			  this.close(true);
		  });*/
	  }
	  else if (window.cordova){
		  //console.log("go service: setting temp handleOpenURL");
		  //window.handleOpenURL = tempHandleUri;
		  // wait till the wallet fully loads
		  var removeListener = $rootScope.$on('Local/BalanceUpdatedAndWalletUnlocked', function(){
			  console.log("setting permanent handleOpenURL");
			  window.handleOpenURL = handleUri;
			  if (window.open_url){ // use cached url at startup
				  console.log("using cached open url "+window.open_url);
				  setTimeout(function(){
					  handleUri(window.open_url);
				  }, 100);
			  }
			  removeListener();
		  });
		  /*
		  document.addEventListener('backbutton', function() {
			  console.log('doc backbutton');
			  if (root.onBackButton)
				  root.onBackButton();
		  });*/
		  document.addEventListener('resume', function() {
			  console.log('resume');
			  $rootScope.$emit('Local/Resume');
		  }, false);
  
		  if (window.plugins.intent) {
			  window.plugins.intent.setNewIntentHandler(function(intent){
				  if (typeof intent.data === "string")
					  handleFile(intent.data);
			  });
		  }
	  }
	 
	  
	  root.handleUri = handleUri;
	  
	  return root;
  }).factory('$exceptionHandler', function($log){
	  return function myExceptionHandler(exception, cause) {
		  console.log("angular $exceptionHandler");
		  $log.error(exception, cause);
		  eventBus.emit('uncaught_error', "An exception occurred: "+exception+"; cause: "+cause, exception);
	  };
  });
  
  function tempHandleUri(url){
	  setTimeout(function(){
		  console.log("saving open url "+url);
		  window.open_url = url;
	  },0);
  }
  
  
  console.log("parsing go.js");
  if (window.cordova){
	  // this is temporary, before angular starts
	  console.log("go file: setting temp handleOpenURL");
	  window.handleOpenURL = tempHandleUri;
  }
  
  window.onerror = function(msg, url, line, col, error){
	  console.log("onerror");
	  eventBus.emit('uncaught_error', "Javascript error: "+msg, error);
  };
  
  process.on('uncaughtException', function(e){
	  console.log("uncaughtException");
	  eventBus.emit('uncaught_error', "Uncaught exception: "+e, e);
  });
  'use strict';
  var logs = [];
  angular.module('copayApp.services')
	.factory('historicLog', function historicLog() {
	  var root = {};
  
	  root.add = function(level, msg) {
		logs.push({
		  level: level,
		  msg: msg,
		});
	  };
  
	  root.get = function() {
		return logs;
	  };
  
	  return root;
	});
  
  'use strict';
  
  angular.module('copayApp.services').value('isCordova',  window.cordova ? true : false);
  
  'use strict';
  
  // Detect mobile devices
  var isMobile = {
	Android: function() {
	  return !!navigator.userAgent.match(/Android/i);
	},
	BlackBerry: function() {
	  return !!navigator.userAgent.match(/BlackBerry/i);
	},
	iOS: function() {
	  return !!navigator.userAgent.match(/iPhone|iPad|iPod/i);
	},
	Opera: function() {
	  return !!navigator.userAgent.match(/Opera Mini/i);
	},
	Windows: function() {
	  return !!navigator.userAgent.match(/IEMobile/i);
	},
	Safari: function() {
	  return Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
	},
	any: function() {
	  return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
	}
  };
  
  
  angular.module('copayApp.services').value('isMobile', isMobile);
  
  'use strict';
  
  angular.module('copayApp.services')
	.factory('localStorageService', function($timeout) {
	  var root = {};
	  var ls = ((typeof window.localStorage !== "undefined") ? window.localStorage : null);
  
	  if (!ls)
		throw new Error('localstorage not available');
  
	  root.get = function(k, cb) {
		  return cb(null, ls.getItem(k));
	  };
  
	  /**
	   * Same as setItem, but fails if an item already exists
	   */
	  root.create = function(name, value, callback) {
		root.get(name,
		  function(err, data) {
			if (data) {
			  return callback('EEXISTS');
			} else {
			  return root.set(name, value, callback);
			}
		  });
	  };
  
	  root.set = function(k, v, cb) {
		  ls.setItem(k, v);
		  return cb();
	  };
  
	  root.remove = function(k, cb) {
		  ls.removeItem(k);
		  return cb();
	  };
  
	  return root;
	});
  
  'use strict';
  angular.module('copayApp.services')
	.factory('logHeader', function($log, isCordova, nodeWebkit) {
	  $log.info('Starting Obyte v' + window.version + ' #' + window.commitHash);
	  $log.info('Client: isCordova:', isCordova, 'isNodeWebkit:', nodeWebkit.isDefined());
	  $log.info('Navigator:', navigator.userAgent);
	  return {};
	});
  
  'use strict';
  
  var eventBus = require('ocore/event_bus.js');
  
  angular.module('copayApp.services')
  .factory('newVersion', function($modal, $timeout, $rootScope){
	var root = {};
	root.shown = false;
	root.timerNextShow = false;
  
	eventBus.on('new_version', function(ws, data){
	  root.version = data.version;
	  if(!root.shown) {
		var modalInstance = $modal.open({
			templateUrl: 'views/modals/newVersionIsAvailable.html',
			controller: 'newVersionIsAvailable'
		});
		$rootScope.$on('closeModal', function() {
			  modalInstance.dismiss('cancel');
		});
		root.shown = true;
		startTimerNextShow();
	  }
	});
  
	function startTimerNextShow(){
	  if (root.timerNextShow) $timeout.cancel(root.timerNextShow);
	  root.timerNextShow = $timeout(function(){
		root.shown = false;
	  }, 1000 * 60 * 60 * 24);
	}
  
	return root;
  });
  
  'use strict';
  
  angular.module('copayApp.services').factory('nodeWebkit', function nodeWebkitFactory() {
	var root = {};
  
	var isNodeWebkit = function() {
	  var isNode = (typeof process !== "undefined" && typeof require !== "undefined");
	  if(isNode) {
		try {
		  return (typeof require('nw.gui') !== "undefined");
		} catch(e) {
		  return false;
		}
	  }
	};
	  
  
	root.isDefined = function() {
	  return isNodeWebkit();
	};
  
	root.readFromClipboard = function() {
	  if (!isNodeWebkit()) return;
	  var gui = require('nw.gui');
	  var clipboard = gui.Clipboard.get();
	  return clipboard.get();
	};
  
	root.writeToClipboard = function(text) {
	  if (!isNodeWebkit()) return;
	  var gui = require('nw.gui');
	  var clipboard = gui.Clipboard.get();
	  return clipboard.set(text);
	};
  
	root.openExternalLink = function(url) {
	  if (!isNodeWebkit()) return;
	  var gui = require('nw.gui');
	  return gui.Shell.openExternal(url);
	};
  
	return root;
  });
  
  'use strict';
  
  angular.module('copayApp.services').
  factory('notification', ['$timeout',
	function($timeout) {
  
	  var notifications = [];
  
	  /*
	  ls.getItem('notifications', function(err, data) {
		if (data) {
		  notifications = JSON.parse(data);
		}
	  });
	  */
  
	  var queue = [];
	  var settings = {
		info: {
		  duration: 6000,
		  enabled: true
		},
		funds: {
		  duration: 7000,
		  enabled: true
		},
		version: {
		  duration: 60000,
		  enabled: true
		},
		warning: {
		  duration: 7000,
		  enabled: true
		},
		error: {
		  duration: 7000,
		  enabled: true
		},
		success: {
		  duration: 5000,
		  enabled: true
		},
		progress: {
		  duration: 0,
		  enabled: true
		},
		custom: {
		  duration: 35000,
		  enabled: true
		},
		details: true,
		localStorage: false,
		html5Mode: false,
		html5DefaultIcon: 'img/icons/favicon-circle.ico'
	  };
  
	  function html5Notify(icon, title, content, ondisplay, onclose) {
		if (window.webkitNotifications && window.webkitNotifications.checkPermission() === 0) {
		  if (!icon) {
			icon = 'img/icons/favicon-circle.ico';
		  }
		  var noti = window.webkitNotifications.createNotification(icon, title, content);
		  if (typeof ondisplay === 'function') {
			noti.ondisplay = ondisplay;
		  }
		  if (typeof onclose === 'function') {
			noti.onclose = onclose;
		  }
		  noti.show();
		} else {
		  settings.html5Mode = false;
		}
	  }
  
  
	  return {
  
		/* ========== SETTINGS RELATED METHODS =============*/
  
		disableHtml5Mode: function() {
		  settings.html5Mode = false;
		},
  
		disableType: function(notificationType) {
		  settings[notificationType].enabled = false;
		},
  
		enableHtml5Mode: function() {
		  // settings.html5Mode = true;
		  settings.html5Mode = this.requestHtml5ModePermissions();
		},
  
		enableType: function(notificationType) {
		  settings[notificationType].enabled = true;
		},
  
		getSettings: function() {
		  return settings;
		},
  
		toggleType: function(notificationType) {
		  settings[notificationType].enabled = !settings[notificationType].enabled;
		},
  
		toggleHtml5Mode: function() {
		  settings.html5Mode = !settings.html5Mode;
		},
  
		requestHtml5ModePermissions: function() {
		  if (window.webkitNotifications) {
			if (window.webkitNotifications.checkPermission() === 0) {
			  return true;
			} else {
			  window.webkitNotifications.requestPermission(function() {
				if (window.webkitNotifications.checkPermission() === 0) {
				  settings.html5Mode = true;
				} else {
				  settings.html5Mode = false;
				}
			  });
			  return false;
			}
		  } else {
			return false;
		  }
		},
  
  
		/* ============ QUERYING RELATED METHODS ============*/
  
		getAll: function() {
		  // Returns all notifications that are currently stored
		  return notifications;
		},
  
		getQueue: function() {
		  return queue;
		},
  
		/* ============== NOTIFICATION METHODS ==============*/
  
		info: function(title, content, userData) {
		  return this.awesomeNotify('info', 'fi-info', title, content, userData);
		},
  
		funds: function(title, content, userData) {
		  return this.awesomeNotify('funds', 'icon-receive', title, content, userData);
		},
  
		version: function(title, content, severe) {
		  return this.awesomeNotify('version', severe ? 'fi-alert' : 'fi-flag', title, content);
		},
  
		error: function(title, content, userData) {
		  return this.awesomeNotify('error', 'fi-x', title, content, userData);
		},
  
		success: function(title, content, userData) {
		  return this.awesomeNotify('success', 'fi-check', title, content, userData);
		},
  
		warning: function(title, content, userData) {
		  return this.awesomeNotify('warning', 'fi-alert', title, content, userData);
		},
  
		new: function(title, content, userData) {
		  return this.awesomeNotify('warning', 'fi-plus', title, content, userData);
		},
  
		sent: function(title, content, userData) {
		  return this.awesomeNotify('warning', 'icon-paperplane', title, content, userData);
		},
  
		awesomeNotify: function(type, icon, title, content, userData) {
		  /**
		   * Supposed to wrap the makeNotification method for drawing icons using font-awesome
		   * rather than an image.
		   *
		   * Need to find out how I'm going to make the API take either an image
		   * resource, or a font-awesome icon and then display either of them.
		   * Also should probably provide some bits of color, could do the coloring
		   * through classes.
		   */
		  // image = '<i class="icon-' + image + '"></i>';
		  return this.makeNotification(type, false, icon, title, content, userData);
		},
  
		notify: function(image, title, content, userData) {
		  // Wraps the makeNotification method for displaying notifications with images
		  // rather than icons
		  return this.makeNotification('custom', image, true, title, content, userData);
		},
  
		makeNotification: function(type, image, icon, title, content, userData) {
		  var notification = {
			'type': type,
			'image': image,
			'icon': icon,
			'title': title,
			'content': content,
			'timestamp': +new Date(),
			'userData': userData
		  };
  
		  notifications.push(notification);
  
		  if (settings.html5Mode) {
			html5Notify(image, title, content, function() {
			  // inner on display function
			}, function() {
			  // inner on close function
			});
		  }
  
		  //this is done because html5Notify() changes the variable settings.html5Mode
		  if (!settings.html5Mode) {
			queue.push(notification);
			$timeout(function removeFromQueueTimeout() {
			  queue.splice(queue.indexOf(notification), 1);
			}, settings[type].duration);
		  }
  
		  // Mobile notification
		  if (window && window.navigator && window.navigator.vibrate) {
			window.navigator.vibrate([200, 100, 200]);
		  };
  
		  if (document.hidden && (type == 'info' || type == 'funds')) {
			new window.Notification(title, {
			  body: content,
			  icon: 'img/notification.png'
			});
		  }
  
		  this.save();
		  return notification;
		},
  
  
		/* ============ PERSISTENCE METHODS ============ */
  
		save: function() {
		  // Save all the notifications into localStorage
		  if (settings.localStorage) {
			localStorage.setItem('notifications', JSON.stringify(notifications));
		  }
		},
  
		restore: function() {
		  // Load all notifications from localStorage
		},
  
		clear: function() {
		  notifications = [];
		  this.save();
		}
  
	  };
	}
  ]).directive('notifications', function(notification, $compile) {
	/**
	 *
	 * It should also parse the arguments passed to it that specify
	 * its position on the screen like "bottom right" and apply those
	 * positions as a class to the container element
	 *
	 * Finally, the directive should have its own controller for
	 * handling all of the notifications from the notification service
	 */
	function link(scope, element, attrs) {
	  var position = attrs.notifications;
	  position = position.split(' ');
	  element.addClass('dr-notification-container');
	  for (var i = 0; i < position.length; i++) {
		element.addClass(position[i]);
	  }
	}
  
	return {
	  restrict: 'A',
	  scope: {},
	  templateUrl: 'views/includes/notifications.html',
	  link: link,
	  controller: ['$scope',
		function NotificationsCtrl($scope) {
		  $scope.queue = notification.getQueue();
  
		  $scope.removeNotification = function(noti) {
			$scope.queue.splice($scope.queue.indexOf(noti), 1);
		  };
		}
	  ]
  
	};
  });
  
  'use strict';
  
  var breadcrumbs = require('ocore/breadcrumbs.js');
  var constants = require('ocore/constants.js');
  
  angular.module('copayApp.services')
	.factory('profileService', function profileServiceFactory($rootScope, $location, $timeout, $filter, $log, lodash, storageService, bwcService, configService, pushNotificationsService, isCordova, gettext, gettextCatalog, nodeWebkit, uxLanguage) {
  
	  var root = {};
  
	  root.profile = null;
	  root.focusedClient = null;
	  root.walletClients = {};
	  
	  root.assetMetadata = {};
  
	  root.Utils = bwcService.getUtils();
	  root.formatAmount = function(amount, asset, opts) {
		  var config = configService.getSync().wallet.settings;
		//if (config.unitCode == 'byte') return amount;
  
		//TODO : now only works for english, specify opts to change thousand separator and decimal separator
		  if (asset === 'blackbytes' || asset === constants.BLACKBYTES_ASSET)
			  return this.Utils.formatAmount(amount, config.bbUnitCode, opts);
		  else if (asset === 'base' || asset === 'bytes')
			  return this.Utils.formatAmount(amount, config.unitCode, opts);
		  else if (root.assetMetadata[asset]){
			  var decimals = root.assetMetadata[asset].decimals || 0;
			  return (amount / Math.pow(10, decimals)).toLocaleString([], {maximumFractionDigits: decimals});
		  }
		  else
			  return amount;
	  };
  
	  root.formatAmountWithUnit = function(amount, asset, opts) {
		  return root.formatAmount(amount, asset, opts) + ' ' + root.getUnitName(asset);
	  };
  
	  root.formatAmountWithUnitIfShort = function(amount, asset, opts) {
		  var str = root.formatAmount(amount, asset, opts);
		  var unit = root.getUnitName(asset);
		  if (unit.length <= 8)
			  str += ' ' + unit;
		  return str;
	  };
  
	  root.getUnitName = function(asset) {
		  var config = configService.getSync().wallet.settings;
		  if (asset === 'blackbytes' || asset === constants.BLACKBYTES_ASSET)
			  return config.bbUnitName;
		  else if (asset === 'base' || asset === 'bytes')
			  return config.unitName;
		  else if (root.assetMetadata[asset])
			  return root.assetMetadata[asset].name;
		  else
			  return "of "+asset;
	  };
  
	   root.getAmountInSmallestUnits = function(amount, asset){
		  var config = configService.getSync().wallet.settings;
		  if (asset === 'base')
			  amount *= config.unitValue;
		  else if (asset === constants.BLACKBYTES_ASSET)
			  amount *= config.bbUnitValue;
		  else if (root.assetMetadata[asset])
			  amount *= Math.pow(10, root.assetMetadata[asset].decimals || 0);
		  return Math.round(amount);
	  };
	  
	  root.getAmountInDisplayUnits = function(amount, asset){
		  var config = configService.getSync().wallet.settings;
		  if (asset === 'base')
			  amount /= config.unitValue;
		  else if (asset === constants.BLACKBYTES_ASSET)
			  amount /= config.bbUnitValue;
		  else if (root.assetMetadata[asset])
			  amount /= Math.pow(10, root.assetMetadata[asset].decimals || 0);
		  return amount;
	  };
  
	  root._setFocus = function(walletId, cb) {
		$log.debug('Set focus:', walletId);
  
		// Set local object
		if (walletId)
		  root.focusedClient = root.walletClients[walletId];
		else
		  root.focusedClient = [];
  
		if (lodash.isEmpty(root.focusedClient)) {
		  root.focusedClient = root.walletClients[lodash.keys(root.walletClients)[0]];
		}
  
		// Still nothing?
		if (lodash.isEmpty(root.focusedClient)) {
		  $rootScope.$emit('Local/NoWallets');
		} else {
		  $rootScope.$emit('Local/NewFocusedWallet');
		}
  
		return cb();
	  };
  
	  root.setAndStoreFocus = function(walletId, cb) {
		root._setFocus(walletId, function() {
		  storageService.storeFocusedWalletId(walletId, cb);
		});
	  };
  
	  root.setWalletClient = function(credentials) {
		  if (root.walletClients[credentials.walletId] && root.walletClients[credentials.walletId].started)
			  return;
  
		  var client = bwcService.getClient(JSON.stringify(credentials));
		  
		  client.credentials.xPrivKey = root.profile.xPrivKey;
		  client.credentials.mnemonic = root.profile.mnemonic;
		  client.credentials.xPrivKeyEncrypted = root.profile.xPrivKeyEncrypted;
		  client.credentials.mnemonicEncrypted = root.profile.mnemonicEncrypted;
		  
		  root.walletClients[credentials.walletId] = client;
  
		  root.walletClients[credentials.walletId].started = true;
  
		  client.initialize({}, function(err) {
			  if (err) {
				  // impossible
				  return;
			  }
		  });
	  };
  
	  root.setWalletClients = function() {
		var credentials = root.profile.credentials;
		lodash.each(credentials, function(credentials) {
		  root.setWalletClient(credentials);
		});
		$rootScope.$emit('Local/WalletListUpdated');
	  };
	  
	  
	  function saveTempKeys(tempDeviceKey, prevTempDeviceKey, onDone){
		  $timeout(function(){
			  console.log("will save temp device keys");//, tempDeviceKey, prevTempDeviceKey);
			  root.profile.tempDeviceKey = tempDeviceKey.toString('base64');
			  if (prevTempDeviceKey)
				  root.profile.prevTempDeviceKey = prevTempDeviceKey.toString('base64');
			  storageService.storeProfile(root.profile, function(err) {
				  onDone(err);
			  });
		  });
	  }
  
	  function unlockWalletAndInitDevice(){
		  // wait till the wallet fully loads
		  breadcrumbs.add('unlockWalletAndInitDevice');
		  //Hide the mainSection
		  var mainSectionElement = angular.element( document.querySelector( '#mainSection' ) );
		  mainSectionElement.css('visibility','hidden');
  
		  var removeListener = $rootScope.$on('Local/BalanceUpdated', function(){
			  removeListener();
			  breadcrumbs.add('unlockWalletAndInitDevice BalanceUpdated');
			  root.insistUnlockFC(null, function(){
				  breadcrumbs.add('unlockWalletAndInitDevice unlocked');
  
				  //After unlock, make mainSection visible again
				  var mainSectionElement = angular.element( document.querySelector( '#mainSection' ) );
				  mainSectionElement.css('visibility','visible');
  
				  if (!root.focusedClient.credentials.xPrivKey)
					  throw Error("xPrivKey still not set after unlock");
				  console.log('unlocked: '+root.focusedClient.credentials.xPrivKey);
				  var config = configService.getSync();
				  root.focusedClient.initDeviceProperties(
					  root.focusedClient.credentials.xPrivKey, root.profile.my_device_address, config.hub, config.deviceName);
				  $rootScope.$emit('Local/BalanceUpdatedAndWalletUnlocked');
			  });
		  });
	  }
	  
	  root.bindProfile = function(profile, cb) {
		  breadcrumbs.add('bindProfile');
		  root.profile = profile;
		  configService.get(function(err) {
			  $log.debug('Preferences read');
			  if (err)
				  return cb(err);
			  root.setWalletClients();
			  storageService.getFocusedWalletId(function(err, focusedWalletId) {
				  if (err) 
					  return cb(err);
				  root._setFocus(focusedWalletId, function() {
					  console.log("focusedWalletId", focusedWalletId);
					  var Wallet = require('ocore/wallet.js');
					  var device = require('ocore/device.js');
					  var config = configService.getSync();
					  var firstWc = root.walletClients[lodash.keys(root.walletClients)[0]];
					  // set light_vendor_url here as we may request new assets history at startup during balances update
					  require('ocore/light_wallet.js').setLightVendorHost(config.hub);
					  if (root.profile.xPrivKeyEncrypted){
						  console.log('priv key is encrypted, will wait for UI and request password');
						  // assuming bindProfile is called on encrypted keys only at program startup
						  unlockWalletAndInitDevice();
						  device.setDeviceAddress(root.profile.my_device_address);
					  }
					  else if (root.profile.xPrivKey)
						  root.focusedClient.initDeviceProperties(profile.xPrivKey, root.profile.my_device_address, config.hub, config.deviceName);
					  else
						  throw Error("neither xPrivKey nor xPrivKeyEncrypted");
					  //var tempDeviceKey = device.genPrivKey();
					  //saveTempKeys(tempDeviceKey, null, function(){});
					  var tempDeviceKey = Buffer.from(profile.tempDeviceKey, 'base64');
					  var prevTempDeviceKey = profile.prevTempDeviceKey ? Buffer.from(profile.prevTempDeviceKey, 'base64') : null;
					  device.setTempKeys(tempDeviceKey, prevTempDeviceKey, saveTempKeys);
					  $rootScope.$emit('Local/ProfileBound');
					  Wallet.readAssetMetadata(null, function(assocAssetMetadata){
						  for (var asset in assocAssetMetadata){
							  if (!root.assetMetadata[asset])
								  root.assetMetadata[asset] = assocAssetMetadata[asset];
						  }
					  });
					  return cb();
				  });
			  });
		  });
	  };
  
	  root.loadAndBindProfile = function(cb) {
		breadcrumbs.add('loadAndBindProfile');
		storageService.getDisclaimerFlag(function(err, val) {
		  if (!val) {
			breadcrumbs.add('Non agreed disclaimer');
			return cb(new Error('NONAGREEDDISCLAIMER: Non agreed disclaimer'));
		  } else {
			storageService.getProfile(function(err, profile) {
			  if (err) {
				$rootScope.$emit('Local/DeviceError', err);
				return cb(err);
			  }
			  if (!profile) {
				  breadcrumbs.add('no profile');
				  return cb(new Error('NOPROFILE: No profile'));
			  } else {
				$log.debug('Profile read');
				return root.bindProfile(profile, cb);
			  }
  
			});
		  }
		});
	  };
  
	  
	  root._seedWallet = function(opts, cb) {
		opts = opts || {};
  
		var walletClient = bwcService.getClient();
		var network = opts.networkName || 'livenet';
  
  
		if (opts.mnemonic) {
		  try {
			opts.mnemonic = root._normalizeMnemonic(opts.mnemonic);
			walletClient.seedFromMnemonic(opts.mnemonic, {
			  network: network,
			  passphrase: opts.passphrase,
			  account: opts.account || 0,
			  derivationStrategy: opts.derivationStrategy || 'BIP44',
			});
  
		  } catch (ex) {
			$log.info(ex);
			return cb(gettext('Could not create: Invalid wallet seed'));
		  }
		} else if (opts.extendedPrivateKey) {
		  try {
			walletClient.seedFromExtendedPrivateKey(opts.extendedPrivateKey, opts.account || 0);
		  } catch (ex) {
			$log.warn(ex);
			return cb(gettext('Could not create using the specified extended private key'));
		  }
		} else if (opts.extendedPublicKey) {
		  try {
			walletClient.seedFromExtendedPublicKey(opts.extendedPublicKey, opts.externalSource, opts.entropySource, {
			  account: opts.account || 0,
			  derivationStrategy: opts.derivationStrategy || 'BIP44',
			});
		  } catch (ex) {
			$log.warn("Creating wallet from Extended Public Key Arg:", ex, opts);
			return cb(gettext('Could not create using the specified extended public key'));
		  }
		} else {
		  var lang = uxLanguage.getCurrentLanguage();
			console.log("will seedFromRandomWithMnemonic for language "+lang);
		  try {
			walletClient.seedFromRandomWithMnemonic({
			  network: network,
			  passphrase: opts.passphrase,
			  language: lang,
			  account: opts.account || 0,
			});
		  } catch (e) {
			$log.info('Error creating seed: ' + e.message);
			if (e.message.indexOf('language') > 0) {
			  $log.info('Using default language for mnemonic');
			  walletClient.seedFromRandomWithMnemonic({
				network: network,
				passphrase: opts.passphrase,
				account: opts.account || 0,
			  });
			} else {
			  return cb(e);
			}
		  }
		}
		return cb(null, walletClient);
	  };
  
	  
	  root._createNewProfile = function(opts, cb) {
		  console.log("_createNewProfile");
		  if (opts.noWallet)
			  return cb(null, Profile.create());
		  root._seedWallet({}, function(err, walletClient) {
			  if (err)
				  return cb(err);
			  var config = configService.getSync();
			  require('ocore/wallet.js'); // load hub/ message handlers
			  var device = require('ocore/device.js');
			  var tempDeviceKey = device.genPrivKey();
			  require('ocore/light_wallet.js').setLightVendorHost(config.hub);
			  // initDeviceProperties sets my_device_address needed by walletClient.createWallet
			  walletClient.initDeviceProperties(walletClient.credentials.xPrivKey, null, config.hub, config.deviceName);
			  var walletName = gettextCatalog.getString('Small Expenses Wallet');
			  walletClient.createWallet(walletName, 1, 1, {
			  //	isSingleAddress: true,
				  network: 'livenet'
			  }, function(err) {
				  if (err)
					  return cb(gettext('Error creating wallet')+": "+err);
				  console.log("created wallet, client: ", JSON.stringify(walletClient));
				  var xPrivKey = walletClient.credentials.xPrivKey;
				  var mnemonic = walletClient.credentials.mnemonic;
				  console.log("mnemonic: "+mnemonic+', xPrivKey: '+xPrivKey);
				  var p = Profile.create({
					  credentials: [JSON.parse(walletClient.export())],
					  xPrivKey: xPrivKey,
					  mnemonic: mnemonic,
					  tempDeviceKey: tempDeviceKey.toString('base64'),
					  my_device_address: device.getMyDeviceAddress()
				  });
				  device.setTempKeys(tempDeviceKey, null, saveTempKeys);
				  return cb(null, p);
			  });
		  });
	  };
	  
	  // create additional wallet (the first wallet is created in _createNewProfile())
	  root.createWallet = function(opts, cb) {
		  $log.debug('Creating Wallet:', opts);
		  if (!root.focusedClient.credentials.xPrivKey){ // locked
			  root.unlockFC(null, function(err){
				  if (err)
					  return cb(err.message);
				  root.createWallet(opts, cb);
			  });
			  return console.log('need password to create new wallet');
		  }
		  var walletDefinedByKeys = require('ocore/wallet_defined_by_keys.js');
		  walletDefinedByKeys.readNextAccount(function(account){
			  console.log("next account = "+account);
			  if (!opts.extendedPrivateKey && !opts.mnemonic){
				  if (!root.focusedClient.credentials.xPrivKey)
					  throw Error("no root.focusedClient.credentials.xPrivKey");
				  $log.debug("reusing xPrivKey from focused client");
				  opts.extendedPrivateKey = root.focusedClient.credentials.xPrivKey;
				  opts.mnemonic = root.profile.mnemonic;
				  opts.account = account;
			  }
			  root._seedWallet(opts, function(err, walletClient) {
				  if (err)
					  return cb(err);
  
				  walletClient.createWallet(opts.name, opts.m, opts.n, {
					  network: opts.networkName,
					  account: opts.account,
					  cosigners: opts.cosigners,
					  isSingleAddress: opts.isSingleAddress
				  }, function(err) {
					  $timeout(function(){
						  if (err) 
							  return cb(gettext('Error creating wallet')+": "+err);
						  root._addWalletClient(walletClient, opts, cb);
					  });
				  });
			  });
		  });
	  };
  
  
	  root.getClient = function(walletId) {
		return root.walletClients[walletId];
	  };
  
	  root.deleteWallet = function(opts, cb) {
		  var client = opts.client || root.focusedClient;
		  var walletId = client.credentials.walletId;
		  $log.debug('Deleting Wallet:', client.credentials.walletName);
		  breadcrumbs.add('Deleting Wallet: ' + client.credentials.walletName);
  
		  root.profile.credentials = lodash.reject(root.profile.credentials, {
			  walletId: walletId
		  });
  
		  delete root.walletClients[walletId];
		  root.focusedClient = null;
  
		  storageService.clearBackupFlag(walletId, function(err) {
			  if (err) $log.warn(err);
		  });
  
		  $timeout(function() {
			  root.setWalletClients();
			  root.setAndStoreFocus(null, function() {
				  storageService.storeProfile(root.profile, function(err) {
					  if (err) return cb(err);
					  return cb();
				  });
			  });
		  });
	  };
  
	  root.setMetaData = function(walletClient, addressBook, cb) {
		storageService.getAddressbook(walletClient.credentials.network, function(err, localAddressBook) {
		  var localAddressBook1 = {};
		  try {
			localAddressBook1 = JSON.parse(localAddressBook);
		  } catch (ex) {
			$log.warn(ex);
		  }
		  var mergeAddressBook = lodash.merge(addressBook, localAddressBook1);
		  storageService.setAddressbook(walletClient.credentials.network, JSON.stringify(addressBook), function(err) {
			if (err) return cb(err);
			  return cb(null);
		  });
		});
	  }
  
	  root._addWalletClient = function(walletClient, opts, cb) {
		  var walletId = walletClient.credentials.walletId;
  
		  // check if exists
		  var w = lodash.find(root.profile.credentials, { 'walletId': walletId });
		  if (w)
			  return cb(gettext('Wallet already in Obyte' + ": ") + w.walletName);
  
		  root.profile.credentials.push(JSON.parse(walletClient.export()));
		  root.setWalletClients();
  
		  // assign wallet color based on first character of walletId
		  var color = configService.colorOpts[walletId.charCodeAt(0) % configService.colorOpts.length];
		  var configOpts = {colorFor: {}};
		  configOpts.colorFor[walletId] = color;
		  configService.set(configOpts, function(err){
			  root.setAndStoreFocus(walletId, function() {
				  storageService.storeProfile(root.profile, function(err) {
					  var config = configService.getSync();
					  return cb(err, walletId);
				  });
			  });
		  });
	  };
  
	  
	  root.importWallet = function(str, opts, cb) {
  
		var walletClient = bwcService.getClient();
  
		$log.debug('Importing Wallet:', opts);
		try {
		  walletClient.import(str, {
			compressed: opts.compressed,
			password: opts.password
		  });
		} catch (err) {
		  return cb(gettext('Could not import. Check input file and password'));
		}
  
		str = JSON.parse(str);
  
		var addressBook = str.addressBook || {};
  
		root._addWalletClient(walletClient, opts, function(err, walletId) {
		  if (err) return cb(err);
		  root.setMetaData(walletClient, addressBook, function(error) {
			if (error) console.log(error);
			return cb(err, walletId);
		  });
		});
	  };
  
	  
	  root.importExtendedPrivateKey = function(xPrivKey, opts, cb) {
		var walletClient = bwcService.getClient();
		$log.debug('Importing Wallet xPrivKey');
  
		walletClient.importFromExtendedPrivateKey(xPrivKey, function(err) {
		  if (err)
			return cb(gettext('Could not import')+": "+err);
  
		  root._addWalletClient(walletClient, opts, cb);
		});
	  };
  
	  root._normalizeMnemonic = function(words) {
		var isJA = words.indexOf('\u3000') > -1;
		var wordList = words.split(/[\u3000\s]+/);
  
		return wordList.join(isJA ? '\u3000' : ' ');
	  };
  
	  
	  root.importMnemonic = function(words, opts, cb) {
  
		var walletClient = bwcService.getClient();
  
		$log.debug('Importing Wallet Mnemonic');
  
		words = root._normalizeMnemonic(words);
		walletClient.importFromMnemonic(words, {
		  network: opts.networkName,
		  passphrase: opts.passphrase,
		  account: opts.account || 0,
		}, function(err) {
		  if (err)
			return cb(gettext('Could not import')+": "+err);
  
		  root._addWalletClient(walletClient, opts, cb);
		});
	  };
  
	  
	  root.importExtendedPublicKey = function(opts, cb) {
  
		var walletClient = bwcService.getClient();
		$log.debug('Importing Wallet XPubKey');
  
		walletClient.importFromExtendedPublicKey(opts.extendedPublicKey, opts.externalSource, opts.entropySource, {
		  account: opts.account || 0,
		  derivationStrategy: opts.derivationStrategy || 'BIP44',
		}, function(err) {
		  if (err) {
  
			// in HW wallets, req key is always the same. They can't addAccess.
			if (err.code == 'NOT_AUTHORIZED')
			  err.code = 'WALLET_DOES_NOT_EXIST';
  
			return cb(gettext('Could not import')+": "+err);
		  }
  
		  root._addWalletClient(walletClient, opts, cb);
		});
	  };
  
	  
	  root.create = function(opts, cb) {
		$log.info('Creating profile', opts);
		var defaults = configService.getDefaults();
  
		configService.get(function(err) {
		  root._createNewProfile(opts, function(err, p) {
			if (err) return cb(err);
  
			root.bindProfile(p, function(err) {
			  storageService.storeNewProfile(p, function(err) {
				  root.setSingleAddressFlag(true);
				  return cb(err);
			  });
			});
		  });
		});
	  };
  
  
	  root.updateCredentialsFC = function(cb) {
		var fc = root.focusedClient;
  
		var newCredentials = lodash.reject(root.profile.credentials, {
		  walletId: fc.credentials.walletId
		});
		newCredentials.push(JSON.parse(fc.export()));
		root.profile.credentials = newCredentials;
		  //root.profile.my_device_address = device.getMyDeviceAddress();
  
		storageService.storeProfile(root.profile, cb);
	  };
  
	  root.clearMnemonic = function(cb){
		  delete root.profile.mnemonic;
		  delete root.profile.mnemonicEncrypted;
		  for (var wid in root.walletClients)
			  root.walletClients[wid].clearMnemonic();
		  storageService.storeProfile(root.profile, cb);
	  };
  
	  root.setPrivateKeyEncryptionFC = function(password, cb) {
		  var fc = root.focusedClient;
		  $log.debug('Encrypting private key for', fc.credentials.walletName);
  
		  fc.setPrivateKeyEncryption(password);
		  if (!fc.credentials.xPrivKeyEncrypted)
			  throw Error("no xPrivKeyEncrypted after setting encryption");
		  root.profile.xPrivKeyEncrypted = fc.credentials.xPrivKeyEncrypted;
		  root.profile.mnemonicEncrypted = fc.credentials.mnemonicEncrypted;
		  delete root.profile.xPrivKey;
		  delete root.profile.mnemonic;
		  root.lockFC();
		  for (var wid in root.walletClients){
			  root.walletClients[wid].credentials.xPrivKeyEncrypted = root.profile.xPrivKeyEncrypted;
			  delete root.walletClients[wid].credentials.xPrivKey;
		  }
		  storageService.storeProfile(root.profile, function() {
			  $log.debug('Wallet encrypted');
				  return cb();
		  });
		  /*root.updateCredentialsFC(function() {
			  $log.debug('Wallet encrypted');
				  return cb();
		  });*/
	  };
  
  
	  root.disablePrivateKeyEncryptionFC = function(cb) {
		  var fc = root.focusedClient;
		  $log.debug('Disabling private key encryption for', fc.credentials.walletName);
  
		  try {
			  fc.disablePrivateKeyEncryption();
		  } catch (e) {
			  return cb(e);
		  }
		  if (!fc.credentials.xPrivKey)
			  throw Error("no xPrivKey after disabling encryption");
		  root.profile.xPrivKey = fc.credentials.xPrivKey;
		  root.profile.mnemonic = fc.credentials.mnemonic;
		  delete root.profile.xPrivKeyEncrypted;
		  delete root.profile.mnemonicEncrypted;
		  for (var wid in root.walletClients){
			  root.walletClients[wid].credentials.xPrivKey = root.profile.xPrivKey;
			  delete root.walletClients[wid].credentials.xPrivKeyEncrypted;
		  }
		  storageService.storeProfile(root.profile, function() {
			  $log.debug('Wallet encryption disabled');
				  return cb();
		  });
		  /*root.updateCredentialsFC(function() {
			  $log.debug('Wallet encryption disabled');
				  return cb();
		  });*/
	  };
  
	  root.lockFC = function() {
		var fc = root.focusedClient;
		try {
		  fc.lock();
		} catch (e) {};
	  };
  
	  root.unlockFC = function(error_message, cb) {
		$log.debug('Wallet is encrypted');
		$rootScope.$emit('Local/NeedsPassword', false, error_message, function(err2, password) {
		  if (err2 || !password) {
			return cb({
			  message: (err2 || gettext('Password needed'))
			});
		  }
		  var fc = root.focusedClient;
		  try {
			fc.unlock(password);
			breadcrumbs.add('unlocked '+fc.credentials.walletId);
		  } catch (e) {
			$log.debug(e);
			return cb({
			  message: gettext('Wrong password')
			});
		  }
		  var autolock = function() {
			if (root.bKeepUnlocked){
				console.log("keeping unlocked");
				breadcrumbs.add("keeping unlocked");
				$timeout(autolock, 30*1000);
				return;
			}
			console.log('time to auto-lock wallet', fc.credentials);
			if (fc.hasPrivKeyEncrypted()) {
			  $log.debug('Locking wallet automatically');
			  try {
				  fc.lock();
				  breadcrumbs.add('locked '+fc.credentials.walletId);
			  } catch (e) {};
			};
		  };
		  $timeout(autolock, 30*1000);
		  return cb();
		});
	  };
	  
	  // continue to request password until the correct password is entered
	  root.insistUnlockFC = function(error_message, cb){
		  root.unlockFC(error_message, function(err){
			  if (!err)
				  return cb();
			  $timeout(function(){
				  root.insistUnlockFC(err.message, cb);
			  }, 1000);
		  });
	  };
  
	  root.getWallets = function(network) {
		if (!root.profile) return [];
  
		var config = configService.getSync();
		config.colorFor = config.colorFor || {};
		config.aliasFor = config.aliasFor || {};
		var ret = lodash.map(root.profile.credentials, function(c) {
		  return {
			m: c.m,
			n: c.n,
			is_complete: (c.publicKeyRing && c.publicKeyRing.length === c.n),
			name: config.aliasFor[c.walletId] || c.walletName,
			id: c.walletId,
			network: c.network,
			color: config.colorFor[c.walletId] || '#2C3E50'
		  };
		});
		ret = lodash.filter(ret, function(w) {
		  return (w.network == network && w.is_complete);
		});
		return lodash.sortBy(ret, 'name');
	  };
  
	  
	  
	  root.requestTouchid = function(cb) {
		  var fc = root.focusedClient;
		  var config = configService.getSync();
		  config.touchIdFor = config.touchIdFor || {};
		  if (window.touchidAvailable && config.touchIdFor[fc.credentials.walletId])
			  $rootScope.$emit('Local/RequestTouchid', cb);
		  else
			  return cb();
	  };
		  
	  root.replaceProfile = function (xPrivKey, mnemonic, myDeviceAddress, cb) {
		  var device = require('ocore/device.js');
		  
		  root.profile.credentials = [];
		  root.profile.xPrivKey = xPrivKey;
		  root.profile.mnemonic = mnemonic;
		  root.profile.my_device_address = myDeviceAddress;
		  device.setNewDeviceAddress(myDeviceAddress);
		  
		  storageService.storeProfile(root.profile, function () {
			  return cb();
		  });
	  };
  
	  root.setSingleAddressFlag = function(newValue) {
		  var fc = root.focusedClient;
		  fc.isSingleAddress = newValue;
		  var walletId = fc.credentials.walletId;
		  var config = configService.getSync();
		  var oldValue = config.isSingleAddress || false;
  
		  var opts = {
			  isSingleAddress: {}
		  };
		  opts.isSingleAddress[walletId] = newValue;
		  configService.set(opts, function(err) {
			  if (err) {
				  fc.isSingleAddress = oldValue;
				  $rootScope.$emit('Local/DeviceError', err);
				  return;
			  }
			  $rootScope.$emit('Local/SingleAddressFlagUpdated');
		  });
	  }
  
  
	  return root;
	});
  
  'use strict';
  angular.module('copayApp.services')
  .factory('pushNotificationsService', function($http, $rootScope, $log, isMobile, $timeout, storageService, configService, lodash, isCordova) {
	  var root = {};
	  var defaults = configService.getDefaults();
	  var usePushNotifications = isCordova && !isMobile.Windows() && (isMobile.Android() || isMobile.iOS());
	  var projectNumber;
	  var _ws;
	  var push;
	  
	  var eventBus = require('ocore/event_bus.js');
	  
	  function sendRequestEnableNotification(ws, registrationId) {
		  var network = require('ocore/network.js');
		  network.sendRequest(ws, 'hub/enable_notification', {registrationId: registrationId, platform: isMobile.iOS() ? 'ios' : 'android'}, false, function(ws, request, response) {
			  if (!response || (response && response !== 'ok')) return $log.error('Error sending push info');
		  });
	  }
	  
	  window.onNotification = function(data) {
	  };
  
	  window.onNotificationAPN = function(event) {
		  if (event.badge)
		  {
			  //window.plugins.pushNotification.setApplicationIconBadgeNumber(function(){}, function(){}, event.badge);
		  }
	  }
	  
	  eventBus.on('receivedPushProjectNumber', function(ws, data) {
		  if (!usePushNotifications) return;
		  _ws = ws;
		  if (data && data.projectNumber !== undefined) {
			  $timeout(function(){
				  storageService.getPushInfo(function(err, pushInfo) {
					  var config = configService.getSync();
					  projectNumber = data.projectNumber + "";
					  var is_hub_configured = !!((isMobile.Android() && projectNumber !== "0") || (isMobile.iOS() && data.hasKeyId));
					  if (pushInfo && !is_hub_configured) {
						  root.pushNotificationsUnregister(function() {
  
						  });
					  }
					  else if (is_hub_configured && config.pushNotifications.enabled) {
						  root.pushNotificationsInit();
					  }
				  });
			  });
		  }
	  });
	  
	  root.pushNotificationsInit = function() {
		  if (!usePushNotifications) return;
		  
		  var device = require('ocore/device.js');
		  device.readCorrespondents(function(devices){
			  if (devices.length == 0)
				  return;
			  
			  if (isMobile.Android()) {
				  push = PushNotification.init({android:{
					  clearBadge: true,
					  icon: 'notification',
					  iconColor: '#2c3e50'
				  }});
			  } else if (isMobile.iOS()) {
				  push = PushNotification.init({ios: {
					  alert: true,
					  badge: true,
					  sound: true,
					  clearBadge: true
				  }});
			  }
			  push.on('registration', function(data) {
				  storageService.setPushInfo(projectNumber, data.registrationId, true, function() {
					  sendRequestEnableNotification(_ws, data.registrationId);
				  });
			  });
			  push.on('error', function(e) {
				  console.warn("push notification register failed", e);
				  usePushNotifications = false;
			  });
			  configService.set({pushNotifications: {enabled: true}}, function(err) {
				  if (err) $log.debug(err);
			  });
		  });
	  };
	  
	  function disable_notification() {
		  storageService.getPushInfo(function(err, pushInfo) {
			  if (err)
				  return $log.error('Error getting push info');
			  storageService.removePushInfo(function() {
				  var network = require('ocore/network.js');
				  network.sendRequest(_ws, 'hub/disable_notification', pushInfo.registrationId, false, function(ws, request, response) {
					  if (!response || (response && response !== 'ok')) return $log.error('Error sending push info');
				  });
			  });
		  });
		  configService.set({pushNotifications: {enabled: false}}, function(err) {
			  if (err) $log.debug(err);
		  });
	  }
	  
	  root.pushNotificationsUnregister = function() {
		  if (!usePushNotifications || !push) return;
		  push.unregister(function() {
			  disable_notification();
		  }, function() {
			  disable_notification();
		  });
	  };
	  
	  return root;
	  
  });
  
  'use strict';
  angular.module('copayApp.services')
	.factory('sjcl', function bitcoreFactory(bwcService) {
	  var sjcl = bwcService.getSJCL();
	  return sjcl;
	});
  
  'use strict';
  angular.module('copayApp.services')
	.factory('storageService', function(logHeader, fileStorageService, localStorageService, sjcl, $log, lodash, isCordova) {
  
	  var root = {};
  
	  // File storage is not supported for writting according to 
	  // https://github.com/apache/cordova-plugin-file/#supported-platforms
	  var shouldUseFileStorage = isCordova && !isMobile.Windows();
	  $log.debug('Using file storage:', shouldUseFileStorage);
  
  
	  var storage = shouldUseFileStorage ? fileStorageService : localStorageService;
  
	  var getUUID = function(cb) {
		// TO SIMULATE MOBILE
		//return cb('hola');
		if (!window || !window.plugins || !window.plugins.uniqueDeviceID)
		  return cb(null);
  
		window.plugins.uniqueDeviceID.get(
		  function(uuid) {
			return cb(uuid);
		  }, cb);
	  };
  
	  var encryptOnMobile = function(text, cb) {
  
		// UUID encryption is disabled.
		return cb(null, text);
		//
		// getUUID(function(uuid) {
		//   if (uuid) {
		//     $log.debug('Encrypting profile');
		//     text = sjcl.encrypt(uuid, text);
		//   }
		//   return cb(null, text);
		// });
	  };
  
  
	  var decryptOnMobile = function(text, cb) {
		var json;
		try {
		  json = JSON.parse(text);
		} catch (e) {};
  
		if (!json) return cb('Could not access storage')
  
		if (!json.iter || !json.ct) {
		  $log.debug('Profile is not encrypted');
		  return cb(null, text);
		}
  
		$log.debug('Profile is encrypted');
		getUUID(function(uuid) {
		  $log.debug('Device UUID:' + uuid);
		  if (!uuid)
			return cb('Could not decrypt storage: could not get device ID');
  
		  try {
			text = sjcl.decrypt(uuid, text);
  
			$log.info('Migrating to unencrypted profile');
			return storage.set('profile', text, function(err) {
			  return cb(err, text);
			});
		  } catch(e) {
			$log.warn('Decrypt error: ', e);
			return cb('Could not decrypt storage: device ID mismatch');
		  };
		  return cb(null, text);
		});
	  };
  
	  // on mobile, the storage keys are files, we have to avoid slashes in filenames
	  function getSafeWalletId(walletId){
		  return walletId.replace(/[\/+=]/g, '');
	  }
  
	  root.storeNewProfile = function(profile, cb) {
		encryptOnMobile(profile.toObj(), function(err, x) {
		  storage.create('profile', x, cb);
		});
	  };
  
	  root.storeProfile = function(profile, cb) {
		encryptOnMobile(profile.toObj(), function(err, x) {
		  storage.set('profile', x, cb);
		});
	  };
  
	  root.getProfile = function(cb) {
		storage.get('profile', function(err, str) {
		  //console.log("prof="+str+", err="+err);
		  if (err || !str)
			return cb(err);
  
		  decryptOnMobile(str, function(err, str) {
			if (err) return cb(err);
			var p, err;
			try {
			  p = Profile.fromString(str);
			} catch (e) {
			  $log.debug('Could not read profile:', e);
			  err = new Error('Could not read profile:' + e);
			}
			return cb(err, p);
		  });
		});
	  };
  
	  root.deleteProfile = function(cb) {
		storage.remove('profile', cb);
	  };
  
	  root.storeFocusedWalletId = function(id, cb) {
		storage.set('focusedWalletId', id || '', cb);
	  };
  
	  root.getFocusedWalletId = function(cb) {
		storage.get('focusedWalletId', cb);
	  };
  
	  root.setBackupFlag = function(walletId, cb) {
		storage.set('backup-' + getSafeWalletId(walletId), Date.now(), cb);
	  };
  
	  root.getBackupFlag = function(walletId, cb) {
		storage.get('backup-' + getSafeWalletId(walletId), cb);
	  };
  
	  root.clearBackupFlag = function(walletId, cb) {
		storage.remove('backup-' + getSafeWalletId(walletId), cb);
	  };
  
	  root.getConfig = function(cb) {
		storage.get('config', cb);
	  };
  
	  root.storeConfig = function(val, cb) {
		$log.debug('Storing Preferences', val);
		storage.set('config', val, cb);
	  };
  
	  root.clearConfig = function(cb) {
		storage.remove('config', cb);
	  };
  
	  root.setDisclaimerFlag = function(cb) {
		storage.set('agreeDisclaimer', true, cb);
	  };
  
	  root.getDisclaimerFlag = function(cb) {
		storage.get('agreeDisclaimer', cb);
	  };
  
	  root.setRemotePrefsStoredFlag = function(cb) {
		storage.set('remotePrefStored', true, cb);
	  };
  
	  root.getRemotePrefsStoredFlag = function(cb) {
		storage.get('remotePrefStored', cb);
	  };
  
	  root.setAddressbook = function(network, addressbook, cb) {
		storage.set('addressbook-' + network, addressbook, cb);
	  };
  
	  root.getAddressbook = function(network, cb) {
		storage.get('addressbook-' + network, cb);
	  };
  
	  root.removeAddressbook = function(network, cb) {
		storage.remove('addressbook-' + network, cb);
	  };
  
	  root.setPushInfo = function(projectNumber, registrationId, enabled, cb) {
		storage.set('pushToken', JSON.stringify({projectNumber: projectNumber, registrationId: registrationId, enabled: enabled}), cb);
	  };
  
	  root.getPushInfo = function(cb) {
		storage.get('pushToken', function(err, data) {
			err ? cb(err) : cb(null, (data ? JSON.parse(data) : data));
		});
	  };
		
	  root.removePushInfo = function(cb){
		storage.remove('pushToken', cb);
	  };
  
	  return root;
	});
  
  'use strict';
  
  /*  
   * This is a modification from https://github.com/angular/angular.js/blob/master/src/ngTouch/swipe.js
   */
  
  
  angular.module('copayApp.services')
	.factory('$swipemodified', [
	function() {
	  // The total distance in any direction before we make the call on swipe vs. scroll.
	  var MOVE_BUFFER_RADIUS = 10;
  
	  var POINTER_EVENTS = {
		'touch': {
		  start: 'touchstart',
		  move: 'touchmove',
		  end: 'touchend',
		  cancel: 'touchcancel'
		}
	  };
  
	  function getCoordinates(event) {
		var originalEvent = event.originalEvent || event;
		var touches = originalEvent.touches && originalEvent.touches.length ? originalEvent.touches : [originalEvent];
		var e = (originalEvent.changedTouches && originalEvent.changedTouches[0]) || touches[0];
  
		return {
		  x: e.clientX,
		  y: e.clientY
		};
	  }
  
	  function getEvents(pointerTypes, eventType) {
		var res = [];
		angular.forEach(pointerTypes, function(pointerType) {
		  var eventName = POINTER_EVENTS[pointerType][eventType];
		  if (eventName) {
			res.push(eventName);
		  }
		});
		return res.join(' ');
	  }
  
	  return {
		/**
		 * @ngdoc method
		 * @name $swipe#bind
		 *
		 * @description
		 * The main method of `$swipe`. It takes an element to be watched for swipe motions, and an
		 * object containing event handlers.
		 * The pointer types that should be used can be specified via the optional
		 * third argument, which is an array of strings `'mouse'` and `'touch'`. By default,
		 * `$swipe` will listen for `mouse` and `touch` events.
		 *
		 * The four events are `start`, `move`, `end`, and `cancel`. `start`, `move`, and `end`
		 * receive as a parameter a coordinates object of the form `{ x: 150, y: 310 }`.
		 *
		 * `start` is called on either `mousedown` or `touchstart`. After this event, `$swipe` is
		 * watching for `touchmove` or `mousemove` events. These events are ignored until the total
		 * distance moved in either dimension exceeds a small threshold.
		 *
		 * Once this threshold is exceeded, either the horizontal or vertical delta is greater.
		 * - If the horizontal distance is greater, this is a swipe and `move` and `end` events follow.
		 * - If the vertical distance is greater, this is a scroll, and we let the browser take over.
		 *   A `cancel` event is sent.
		 *
		 * `move` is called on `mousemove` and `touchmove` after the above logic has determined that
		 * a swipe is in progress.
		 *
		 * `end` is called when a swipe is successfully completed with a `touchend` or `mouseup`.
		 *
		 * `cancel` is called either on a `touchcancel` from the browser, or when we begin scrolling
		 * as described above.
		 *
		 */
		bind: function(element, eventHandlers, pointerTypes) {
		  // Absolute total movement, used to control swipe vs. scroll.
		  var totalX, totalY;
		  // Coordinates of the start position.
		  var startCoords;
		  // Last event's position.
		  var lastPos;
		  // Whether a swipe is active.
		  var active = false;
  
		  pointerTypes = pointerTypes || ['touch'];
		  element.on(getEvents(pointerTypes, 'start'), function(event) {
			startCoords = getCoordinates(event);
			active = true;
			totalX = 0;
			totalY = 0;
			lastPos = startCoords;
			eventHandlers['start'] && eventHandlers['start'](startCoords, event);
		  });
		  var events = getEvents(pointerTypes, 'cancel');
		  if (events) {
			element.on(events, function(event) {
			  active = false;
			  eventHandlers['cancel'] && eventHandlers['cancel'](event);
			});
		  }
  
		  element.on(getEvents(pointerTypes, 'move'), function(event) {
			if (!active) return;
  
			// Android will send a touchcancel if it thinks we're starting to scroll.
			// So when the total distance (+ or - or both) exceeds 10px in either direction,
			// we either:
			// - On totalX > totalY, we send preventDefault() and treat this as a swipe.
			// - On totalY > totalX, we let the browser handle it as a scroll.
  
			if (!startCoords) return;
			var coords = getCoordinates(event);
  
			totalX += Math.abs(coords.x - lastPos.x);
			totalY += Math.abs(coords.y - lastPos.y);
  
			lastPos = coords;
  
			if (totalX < MOVE_BUFFER_RADIUS && totalY < MOVE_BUFFER_RADIUS) {
			  return;
			}
  
			// One of totalX or totalY has exceeded the buffer, so decide on swipe vs. scroll.
			if (totalY > totalX) {
			  // Allow native scrolling to take over.
			  active = false;
			  eventHandlers['cancel'] && eventHandlers['cancel'](event);
			  return;
			} else {
  
			  // Prevent the browser from scrolling.
			  event.preventDefault();
			  eventHandlers['move'] && eventHandlers['move'](coords, event);
			}
		  });
  
		  element.on(getEvents(pointerTypes, 'end'), function(event) {
			if (!active) return;
			active = false;
			eventHandlers['end'] && eventHandlers['end'](getCoordinates(event), event);
		  });
		}
	  };
	}
  ]);
  
  
  
  'use strict';
  
  var constants = require('ocore/constants.js');
  
  angular.module('copayApp.services').factory('txFormatService', function(profileService, configService, lodash) {
	var root = {};
  
	var formatAmountStr = function(amount, asset) {
	  if (!amount) return;
	  if (asset !== "base" && asset !==  constants.BLACKBYTES_ASSET && !profileService.assetMetadata[asset])
		  return amount;
	  return profileService.formatAmountWithUnit(amount, asset);
	};
	  
	  var formatFeeStr = function(fee) {
		  if (!fee) return;
		  return fee + ' bytes';
	  };
  
	root.processTx = function(tx) {
	  if (!tx) return; 
  
	  var outputs = tx.outputs ? tx.outputs.length : 0;
	  if (outputs > 1 && tx.action != 'received') {
		tx.hasMultiplesOutputs = true;
		tx.recipientCount = outputs;
		tx.amount = lodash.reduce(tx.outputs, function(total, o) {
		  o.amountStr = formatAmountStr(o.amount, tx.asset);
		  return total + o.amount;
		}, 0);
	  }
  
	  tx.amountStr = formatAmountStr(tx.amount, tx.asset);
	  tx.feeStr = formatFeeStr(tx.fee || tx.fees);
  
	  return tx;
	};
  
	return root;
  });
  
  'use strict';
  
  angular.module('copayApp.services').factory('txStatus', function($modal, lodash, profileService, $timeout) {
	var root = {};
  
	root.notify = function(txp, cb) {
	  var fc = profileService.focusedClient;
	  var status = txp.status;
	  var type;
	  var INMEDIATE_SECS = 10;
  
	  if (status == 'broadcasted') {
		type = 'broadcasted';
	  } else {
		  throw Error("unsupported status");
		  /*
		var n = txp.actions.length;
		var action = lodash.find(txp.actions, {
		  copayerId: fc.credentials.copayerId
		});
  
		if (!action)  {
		  type = 'created';
		} else if (action.type == 'accept') {
		  // created and accepted at the same time?
		  if ( n == 1 && action.createdOn - txp.createdOn < INMEDIATE_SECS ) {
			type = 'created';
		  } else {
			type = 'accepted';
		  }
		} else if (action.type == 'reject') {
		  type = 'rejected';
		} else {
		  throw new Error('Unknown type:' + type);
		}
		  */
	  }
  
	  openModal(type, txp, cb);
	};
  
	root._templateUrl = function(type, txp) {
	  return 'views/modals/tx-status.html';
	};
  
	var openModal = function(type, txp, cb) {
	  var ModalInstanceCtrl = function($scope, $modalInstance) {
		$scope.type = type;
		$scope.cancel = function() {
		  $modalInstance.dismiss('cancel');
		};
		if (cb) $timeout(cb, 100);
	  };
	  var modalInstance = $modal.open({
		templateUrl: root._templateUrl(type, txp),
		windowClass: 'popup-tx-status full',
		controller: ModalInstanceCtrl,
	  });
  
	  modalInstance.result.finally(function() {
		var m = angular.element(document.getElementsByClassName('reveal-modal'));
		m.addClass('hideModal');
	  });
	};
  
	return root;
  });
  
  'use strict';
  
  var UriHandler = function() {};
  
  UriHandler.prototype.register = function() {
	var base = window.location.origin + '/';
	var url = base + '#/uri-payment/%s';
  
	if(navigator.registerProtocolHandler) {
	  navigator.registerProtocolHandler('bitcoin', url, 'Copay');
	}
  };
  
  angular.module('copayApp.services').value('uriHandler', new UriHandler());
  
  'use strict';
  angular.module('copayApp.services')
	.factory('uxLanguage', function languageService($log, lodash, gettextCatalog, amMoment, configService) {
	  var root = {};
  
	  root.availableLanguages = [{
		name: 'English',
		isoCode: 'en',
	  }, {
		name: 'Français',
		isoCode: 'fr_FR',
	  }, {
		name: 'Italiano',
		isoCode: 'it_IT',
	  }, {
		name: 'Deutsch',
		isoCode: 'de_DE',
	  }, {
		name: 'Español',
		isoCode: 'es_ES',
	  }, {
		name: 'Português',
		isoCode: 'pt_PT',
	  }, {
		name: 'Nederlands',
		isoCode: 'nl_NL',
	  }, {
		name: 'Dansk',
		isoCode: 'da_DK',
	  }, {
		name: 'Svenska',
		isoCode: 'sv_SE',
	  }, {
		name: 'Polski',
		isoCode: 'pl_PL',
	  }, {
		name: 'Eesti',
		isoCode: 'et_EE',
	  }, {
		name: 'Bosanski',
		isoCode: 'bs_BA',
	  }, {
		name: 'Hrvatski',
		isoCode: 'hr_HR',
	  }, {
		name: 'Srpski',
		isoCode: 'sr_CS',
	  }, {
		name: 'Magyar',
		isoCode: 'hu_HU',
	  }, {
		name: 'Română',
		isoCode: 'ro_RO',
	  }, {
		name: 'Shqip',
		isoCode: 'sq_AL',
	  }, {
		name: 'Nigerian (Pidgin)',
		isoCode: 'pcm_NG',
	  }, {
		name: 'Ελληνικά',
		isoCode: 'el_GR',
	  }, {
		name: 'हिन्दी',
		isoCode: 'hi_IN',
	  }, {
		name: '日本語',
		isoCode: 'ja_jp',
		useIdeograms: true,
	  }, {
		name: '中文',
		isoCode: 'zh_CN',
		useIdeograms: true,
	  }, {
		name: '한국어',
		isoCode: 'ko_KR',
	  }, {
		name: 'Pусский',
		isoCode: 'ru_RU',
	  }, {
		name: 'Bahasa Indonesia',
		isoCode: 'id_ID',
	  }, {
		name: 'Filipino',
		isoCode: 'fil_PH',
	  }, {
		name: 'Tiếng Việt',
		isoCode: 'vi_VN',
	  }, {
		name: 'Èdè Yorùbá',
		isoCode: 'yo_NG',
	  }, {
		name: 'Türk',
		isoCode: 'tr_TR',
	  }];
  
	  root.currentLanguage = null;
  
	  root._detect = function() {
		// Auto-detect browser language
		var userLang, androidLang;
  
		if (navigator && navigator.userAgent && (androidLang = navigator.userAgent.match(/android.*\W(\w\w)-(\w\w)\W/i))) {
		  userLang = androidLang[1];
		} else {
		  // works for iOS and Android 4.x
		  userLang = navigator.userLanguage || navigator.language;
		}
		userLang = userLang ? (userLang.split('-', 1)[0] || 'en') : 'en';
		  
		for (var i=0; i<root.availableLanguages.length; i++){
			var isoCode = root.availableLanguages[i].isoCode;
			if (userLang === isoCode.substr(0, 2))
				return isoCode;
		}
  
		return 'en';
	  };
  
	  root._set = function(lang) {
		$log.debug('Setting default language: ' + lang);
		gettextCatalog.setCurrentLanguage(lang);
		if (lang !== 'en')
			gettextCatalog.loadRemote("languages/" + lang + ".json");
		amMoment.changeLocale(lang);
		root.currentLanguage = lang;
	  };
  
	  root.getCurrentLanguage = function() {
		return root.currentLanguage;
	  };
  
	  root.getCurrentLanguageName = function() {
		return root.getName(root.currentLanguage);
	  };
  
	  root.getCurrentLanguageInfo = function() {
		return lodash.find(root.availableLanguages, {
		  'isoCode': root.currentLanguage
		});
	  };
  
	  root.getLanguages = function() {
		return root.availableLanguages;
	  };
  
	  root.init = function() {
		root._set(root._detect());
	  };
  
	  root.update = function() {
		var userLang = configService.getSync().wallet.settings.defaultLanguage;
  
		if (!userLang) {
		  userLang = root._detect();
		}
  
		if (userLang != gettextCatalog.getCurrentLanguage()) {
		  root._set(userLang);
		}
		return userLang;
	  };
  
	  root.getName = function(lang) {
		return lodash.result(lodash.find(root.availableLanguages, {
		  'isoCode': lang
		}), 'name');
	  };
  
	  return root;
	});
  
  'use strict';
  
  
  angular.module('copayApp.services').factory('witnessListService', function($state, $rootScope, go) {
	  var root = {};
	  
	  console.log("witnessListService");
  
	  
	  root.currentWitness = null;
  
  
	  return root;
  });
  
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
		  var conf = require('ocore/conf.js');
		  var re = new RegExp('^'+conf.program+':', 'i');
		  code = code.replace(re, '');
		  re = new RegExp('^'+conf.program.replace(/byteball/i, 'obyte')+':', 'i');
		  code = code.replace(re, '');
		  var matches = code.match(/^([\w\/+]+)@([\w.:\/-]+)#(.+)$/);
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
  
  'use strict';
  
  angular.module('copayApp.controllers').controller('approveNewWitnesses', function($scope, $modalInstance, $document, autoUpdatingWitnessesList){
	$scope.addWitnesses = autoUpdatingWitnessesList.addWitnesses;
	$scope.delWitnesses = autoUpdatingWitnessesList.delWitnesses;
  
  
	$scope.replace = function(){
	  var oldWitnesses = $scope.delWitnesses;
	  var newWitnesses = $scope.addWitnesses;
  
	  var n = 0, l = newWitnesses.length;
  
	  function replaceWitness(n, oldWitnesses, newWitnesses){
		var myWitnesses = require('ocore/my_witnesses.js');
		myWitnesses.replaceWitness(oldWitnesses[n], newWitnesses[n], function(err){
  
		  if (l < n) {
			replaceWitness(n++, oldWitnesses, newWitnesses)
		  } else {
			$modalInstance.close('closed result');
		  }
		});
	  }
  
	  replaceWitness(n, oldWitnesses, newWitnesses);
	};
  
	$scope.later = function(){
	  $modalInstance.close('closed result');
	};
  });
  
  'use strict';
  
  /*
  
  This is incomplete!
  To do:
  - modify bitcore to accept string indexes
  - add app column to my_addresses table
  - add choice of cosigners when m<n
  - implement signAuthRequest()
  - update handling of "sign" command in cosigners so that they accept auth requests, not just payments
  - post the result to site url
  - allow to change keys of the wallet, update definitions for all apps/domains saved so far
  - send the chain of key changes with the response
  
  */
  
  var ecdsaSig = require('ocore/signature.js');
  
  angular.module('copayApp.controllers').controller('authConfirmationController',
	function($scope, $timeout, configService, profileService, go, authService) {
	  
	  function extractDomainFromUrl(url){
		  var domain_with_path = url.replace(/^https?:\/\//i, '');
		  var domain = domain_with_path.replace(/\/.*$/, '');
		  domain = domain.replace(/^www\./i, '');
		  return domain;
	  }
	  
	  var self = this;
	  var bbWallet = require('ocore/wallet.js');
	  
	  // the wallet to sign with
	  $scope.walletId = profileService.focusedClient.credentials.walletId;
	  
	  var objRequest = authService.objRequest;
	  if (!objRequest)
		  throw Error("no request");
	  
	  var app_name;
	  if (objRequest.app)
		  app_name = objRequest.app;
	  else if (objRequest.url)
		  app_name = extractDomainFromUrl(objRequest.url);
	  else
		  throw Error("neither app nor url");
	  
	  if (objRequest.question)
		  $scope.question = objRequest.question;
	  else
		  $scope.question = "Log in to "+app_name+"?";
	  
	  var arrSigningDeviceAddresses = []; // todo allow to choose the devices that are to sign
	  
	  $scope.yes = function() {
		  console.log("yes");
		  var credentials = lodash.find(profileService.profile.credentials, {walletId: $scope.walletId});
		  if (!credentials)
			  throw Error("unknown wallet: "+$scope.walletId);
		  var coin = (credentials.network == 'livenet' ? "0" : "1");
  
		  var signWithLocalPrivateKey = function(wallet_id, account, is_change, address_index, text_to_sign, handleSig){
			  var path = "m/44'/" + coin + "'/" + account + "'/"+is_change+"/"+address_index;
			  var xPrivKey = new Bitcore.HDPrivateKey.fromString(profileService.focusedClient.credentials.xPrivKey); // todo unlock the key if encrypted
			  var privateKey = xPrivKey.derive(path).privateKey;
			  //var privKeyBuf = privateKey.toBuffer();
			  var privKeyBuf = privateKey.bn.toBuffer({size:32}); // https://github.com/bitpay/bitcore-lib/issues/47
			  handleSig(ecdsaSig.sign(text_to_sign, privKeyBuf));
		  };
  
		  // create a new app/domain-bound address if not created already
		  bbWallet.issueOrSelectAddressForApp(credentials.walletId, app_name, function(address){
			  bbWallet.signAuthRequest(credentials.walletId, objRequest, arrSigningDeviceAddresses, signWithLocalPrivateKey, function(err){
				  go.walletHome();
			  });
		  });
	  };
  
	  $scope.no = function() {
		  // do nothing
		  console.log("no");
		  go.walletHome();
	  };
  
  
	});
  
  'use strict';
  
  angular.module('copayApp.controllers').controller('wordsController',
	function($rootScope, $scope, $timeout, profileService, go, gettext, confirmDialog, notification, $log, isCordova) {
  
	  var msg = gettext('Are you sure you want to delete the backup words?');
	  var successMsg = gettext('Backup words deleted');
	  var self = this;
	  self.show = false;
	  var fc = profileService.focusedClient;
	  
	  if (!isCordova){
		  var desktopApp = require('ocore/desktop_app.js'+'');
		  self.appDataDir = desktopApp.getAppDataDir();
	  }
	  self.isCordova = isCordova;
  
  
	  if (fc.isPrivKeyEncrypted()) self.credentialsEncrypted = true;
	  else {
		setWords(fc.getMnemonic());
	  }
	  if (fc.credentials && !fc.credentials.mnemonicEncrypted && !fc.credentials.mnemonic) {
		self.deleted = true;
	  }
  
	  self.toggle = function() {
		self.error = "";
		if (!self.credentialsEncrypted) {
		  if (!self.show)
			$rootScope.$emit('Local/BackupDone');
		  self.show = !self.show;
		}
  
		if (self.credentialsEncrypted)
		  self.passwordRequest();
  
		$timeout(function() {
		  $scope.$apply();
		}, 1);
	  };
  
	  self.delete = function() {
		confirmDialog.show(msg, function(ok) {
		  if (ok) {
			fc.clearMnemonic();
			profileService.clearMnemonic(function() {
			  self.deleted = true;
			  notification.success(successMsg);
			  go.walletHome();
			});
		  }
		});
	  };
  
	  $scope.$on('$destroy', function() {
		profileService.lockFC();
	  });
  
	  function setWords(words) {
		if (words) {
		  self.mnemonicWords = words.split(/[\u3000\s]+/);
		  self.mnemonicHasPassphrase = fc.mnemonicHasPassphrase();
		  self.useIdeograms = words.indexOf("\u3000") >= 0;
		}
	  };
  
	  self.passwordRequest = function() {
		try {
		  setWords(fc.getMnemonic());
		} catch (e) {
		  if (e.message && e.message.match(/encrypted/) && fc.isPrivKeyEncrypted()) {
			self.credentialsEncrypted = true;
  
			$timeout(function() {
			  $scope.$apply();
			}, 1);
  
			profileService.unlockFC(null, function(err) {
			  if (err) {
				self.error = gettext('Could not decrypt') +': '+ err.message;
				$log.warn('Error decrypting credentials:', self.error); //TODO
				return;
			  }
			  if (!self.show && self.credentialsEncrypted)
				self.show = !self.show;
			  self.credentialsEncrypted = false;
			  setWords(fc.getMnemonic());
			  $rootScope.$emit('Local/BackupDone');
			});
		  }
		}
	  }
	});
  
  'use strict';
  
  angular.module('copayApp.controllers').controller('botController',
	function($stateParams, $scope, $rootScope, $timeout, configService, profileService, isCordova, go, correspondentListService) {
	  
	  var self = this;
	  var bots = require('ocore/bots.js');
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
  'use strict';
  
  angular.module('copayApp.controllers').controller('copayersController',
	function($scope, $rootScope, $timeout, $log, $modal, profileService, go, notification, isCordova, gettext, gettextCatalog, animationService) {
	  var self = this;
  
	  var delete_msg = gettextCatalog.getString('Are you sure you want to delete this wallet?');
	  var accept_msg = gettextCatalog.getString('Accept');
	  var cancel_msg = gettextCatalog.getString('Cancel');
	  var confirm_msg = gettextCatalog.getString('Confirm');
	  
	  self.init = function() {
		var fc = profileService.focusedClient;
		if (fc.isComplete()) {
		  $log.debug('Wallet Complete...redirecting')
		  go.walletHome();
		  return;
		}
		self.loading = false;
		self.isCordova = isCordova;
		$rootScope.$emit('Local/BalanceUpdated', {});
		if(self.isCordova && !wallet.clientCompleteLoaded()) wallet.showCompleteClient();
	  };
  
	  var _modalDeleteWallet = function() {
		var ModalInstanceCtrl = function($scope, $modalInstance, $sce, gettext) {
		  $scope.title = $sce.trustAsHtml(delete_msg);;
			$scope.yes_icon = 'fi-trash';
			$scope.yes_button_class = 'warning';
			$scope.cancel_button_class = 'light-gray outline';
		  $scope.loading = false;
  
		  $scope.ok = function() {
			$scope.loading = true;
			$modalInstance.close(accept_msg);
		  };
		  $scope.cancel = function() {
			$modalInstance.dismiss(cancel_msg);
		  };
		};
  
		var modalInstance = $modal.open({
		  templateUrl: 'views/modals/confirmation.html',
		  windowClass: animationService.modalAnimated.slideUp,
		  controller: ModalInstanceCtrl
		});
  
		modalInstance.result.finally(function() {
		  var m = angular.element(document.getElementsByClassName('reveal-modal'));
		  m.addClass(animationService.modalAnimated.slideOutDown);
		});
  
		modalInstance.result.then(function(ok) {
		  if (ok) {
			_deleteWallet();
		  }
		});
	  };
  
	  var _deleteWallet = function() {
		var fc = profileService.focusedClient;
		$timeout(function() {
		  var fc = profileService.focusedClient;
		  var walletName = fc.credentials.walletName;
  
		  profileService.deleteWallet({}, function(err) {
			if (err) {
			  this.error = err.message || err;
			  console.log(err);
			  $timeout(function() {
				$scope.$digest();
			  });
			} else {
			  go.walletHome();
			  $timeout(function() {
				notification.success(gettextCatalog.getString('Success'), gettextCatalog.getString('The wallet "{{walletName}}" was deleted', {walletName: walletName}));
			  });
			}
		  });
		}, 100);
	  };
  
	  self.deleteWallet = function() {
		var fc = profileService.focusedClient;
		if (isCordova) {
		  navigator.notification.confirm(
			delete_msg,
			function(buttonIndex) {
			  if (buttonIndex == 1) {
				_deleteWallet();
			  }
			},
			confirm_msg, [accept_msg, cancel_msg]
		  );
		} else {
		  _modalDeleteWallet();
		}
	  };
   
  
	});
  
  /*jslint node: true */
  'use strict';
  
  
  var constants = require('ocore/constants.js');
  
  angular.module('copayApp.controllers').controller('correspondentDeviceController',
	function($scope, $rootScope, $timeout, $sce, $modal, configService, profileService, animationService, isCordova, go, correspondentListService, addressService, lodash, $deepStateRedirect, $state, backButton, gettext, nodeWebkit, notification) {
	  
	  var async = require('async');
	  var chatStorage = require('ocore/chat_storage.js');
	  var self = this;
	  console.log("correspondentDeviceController");
	  var privateProfile = require('ocore/private_profile.js');
	  var objectHash = require('ocore/object_hash.js');
	  var db = require('ocore/db.js');
	  var network = require('ocore/network.js');
	  var device = require('ocore/device.js');
	  var eventBus = require('ocore/event_bus.js');
	  var conf = require('ocore/conf.js');
	  var storage = require('ocore/storage.js');
	  var breadcrumbs = require('ocore/breadcrumbs.js');
	  var ValidationUtils = require('ocore/validation_utils.js');
	  
	  var fc = profileService.focusedClient;
	  var chatScope = $scope;
	  var indexScope = $scope.index;
	  $rootScope.tab = $scope.index.tab = 'chat';
	  var correspondent = correspondentListService.currentCorrespondent;
	  $scope.correspondent = correspondent;
	  if (document.chatForm && document.chatForm.message && !isCordova)
		  document.chatForm.message.focus();
	  
	  if (!correspondentListService.messageEventsByCorrespondent[correspondent.device_address])
		  correspondentListService.messageEventsByCorrespondent[correspondent.device_address] = [];
	  $scope.messageEvents = correspondentListService.messageEventsByCorrespondent[correspondent.device_address];
  
	  $scope.$watch("correspondent.my_record_pref", function(pref, old_pref) {
		  if (pref == old_pref) return;
		  var device = require('ocore/device.js');
		  device.sendMessageToDevice(correspondent.device_address, "chat_recording_pref", pref, {
			  ifOk: function(){
				  device.updateCorrespondentProps(correspondent);
				  var oldState = (correspondent.peer_record_pref && !correspondent.my_record_pref);
				  var newState = (correspondent.peer_record_pref && correspondent.my_record_pref);
				  if (newState != oldState) {
					  var message = {
						  type: 'system',
						  message: JSON.stringify({state: newState}),
						  timestamp: Math.floor(Date.now() / 1000),
						  chat_recording_status: true
					  };
					  $scope.autoScrollEnabled = true;
					  $scope.messageEvents.push(correspondentListService.parseMessage(message));
					  $timeout(function(){
						  $scope.$digest();
					  });
					  chatStorage.store(correspondent.device_address, JSON.stringify({state: newState}), 0, 'system');
				  }
				  /*if (!pref) {
					  chatStorage.purge(correspondent.device_address);
				  }*/
			  },
			  ifError: function(){
				  // ignore
			  }
		  });
	  });
  
	  var removeNewMessagesDelim = function() {
		  for (var i in $scope.messageEvents) {
			  if ($scope.messageEvents[i].new_message_delim) {
				  $scope.messageEvents.splice(i, 1);
			  }
		  }
	  };
  
	  $scope.$watch("newMessagesCount['" + correspondent.device_address +"']", function(counter) {
		  if (!$scope.newMsgCounterEnabled && $state.is('correspondentDevices.correspondentDevice')) {
			  $scope.newMessagesCount[$scope.correspondent.device_address] = 0;			
		  }
	  });
  
	  $scope.$on('$stateChangeStart', function(evt, toState, toParams, fromState) {
		  if (toState.name === 'correspondentDevices.correspondentDevice') {
			  $rootScope.tab = $scope.index.tab = 'chat';
			  $scope.newMessagesCount[correspondentListService.currentCorrespondent.device_address] = 0;
		  } else
			  removeNewMessagesDelim();
	  });
  
	  $scope.send = function() {
		  $scope.error = null;
		  if (!$scope.message)
			  return;
		  setOngoingProcess("sending");
		  var message = lodash.clone($scope.message); // save in var as $scope.message may disappear while we are sending the message over the network
		  device.sendMessageToDevice(correspondent.device_address, "text", message, {
			  ifOk: function(){
				  setOngoingProcess();
				  //$scope.messageEvents.push({bIncoming: false, message: $sce.trustAsHtml($scope.message)});
				  $scope.autoScrollEnabled = true;
				  var msg_obj = {
					  bIncoming: false, 
					  message: correspondentListService.formatOutgoingMessage(message), 
					  timestamp: Math.floor(Date.now() / 1000)
				  };
				  correspondentListService.checkAndInsertDate($scope.messageEvents, msg_obj);
				  $scope.messageEvents.push(msg_obj);
				  $scope.message = "";
				  $timeout(function(){
					  $scope.$apply();
				  });
				  correspondentListService.assocLastMessageDateByCorrespondent[correspondent.device_address] = new Date().toISOString().substr(0, 19).replace('T', ' ');
				  if (correspondent.my_record_pref && correspondent.peer_record_pref) chatStorage.store(correspondent.device_address, message, 0);
			  },
			  ifError: function(error){
				  setOngoingProcess();
				  setError(error);
			  }
		  });
	  };
	  
	  $scope.insertMyAddress = function(){
		  if (!profileService.focusedClient.credentials.isComplete())
			  return $rootScope.$emit('Local/ShowErrorAlert', "The wallet is not approved yet");
		  readMyPaymentAddress(profileService.focusedClient, appendMyPaymentAddress);
	  //	issueNextAddressIfNecessary(appendMyPaymentAddress);
	  };
	  
	  $scope.requestPayment = function(){
		  if (!profileService.focusedClient.credentials.isComplete())
			  return $rootScope.$emit('Local/ShowErrorAlert', "The wallet is not approved yet");
		  readMyPaymentAddress(profileService.focusedClient, showRequestPaymentModal);
	  //	issueNextAddressIfNecessary(showRequestPaymentModal);
	  };
	  
	  $scope.sendPayment = function(address, amount, asset, device_address, single_address){
		  console.log("will send payment to "+address);
		  if (asset && $scope.index.arrBalances.filter(function(balance){ return (balance.asset === asset); }).length === 0){
			  console.log("i do not own anything of asset "+asset);
			  return;
		  }
		  readMyPaymentAddress(profileService.focusedClient, function(my_address){
			  if (single_address && single_address !== '0'){
				  var bSpecificSingleAddress = (single_address.length === 32);
				  var displayed_single_address = bSpecificSingleAddress ? ' '+single_address : '';
				  var fc = profileService.focusedClient;
				  if (!fc.isSingleAddress || bSpecificSingleAddress && single_address !== my_address)
					  return $rootScope.$emit('Local/ShowErrorAlert', gettext("This payment must be paid only from single-address wallet")+displayed_single_address+".  "+gettext("Please switch to a single-address wallet and you probably need to insert your address again."));
			  }
			  backButton.dontDeletePath = true;
			  go.send(function(){
				  //$rootScope.$emit('Local/SetTab', 'send', true);
				  $rootScope.$emit('paymentRequest', address, amount, asset, correspondent.device_address);
			  });
		  });
	  };
  
	  $scope.showPayment = function(asset){
		  console.log("will show payment in asset "+asset);
		  if (!asset)
			  throw Error("no asset in showPayment");
		  if (asset && $scope.index.arrBalances.filter(function(balance){ return (balance.asset === asset); }).length === 0){
			  console.log("i do not own anything of asset "+asset);
			  return;
		  }
		  var assetIndex = lodash.findIndex($scope.index.arrBalances, {asset: asset});
		  if (assetIndex < 0)
			  throw Error("failed to find asset index of asset "+asset);
		  $scope.index.assetIndex = assetIndex;
		  go.history();
	  };
	  
  
	  function getSigningDeviceAddresses(fc, exclude_self){
		  var arrSigningDeviceAddresses = []; // empty list means that all signatures are required (such as 2-of-2)
		  if (fc.credentials.m < fc.credentials.n)
			  indexScope.copayers.forEach(function(copayer){
				  if ((copayer.me && !exclude_self) || copayer.signs)
					  arrSigningDeviceAddresses.push(copayer.device_address);
			  });
		  else if (indexScope.shared_address)
			  arrSigningDeviceAddresses = indexScope.copayers.map(function(copayer){ return copayer.device_address; });
		  return arrSigningDeviceAddresses;
	  }
	  
	  
	  $scope.offerContract = function(address){
		  var walletDefinedByAddresses = require('ocore/wallet_defined_by_addresses.js');
		  $rootScope.modalOpened = true;
		  var fc = profileService.focusedClient;
		  $scope.oracles = configService.oracles;
		  
		  var ModalInstanceCtrl = function($scope, $modalInstance) {
			  var config = configService.getSync();
			  var configWallet = config.wallet;
			  var walletSettings = configWallet.settings;
			  $scope.unitValue = walletSettings.unitValue;
			  $scope.unitName = walletSettings.unitName;
			  $scope.color = fc.backgroundColor;
			  $scope.bWorking = false;
			  $scope.arrRelations = ["=", ">", "<", ">=", "<=", "!="];
			  $scope.arrParties = [{value: 'me', display_value: "I"}, {value: 'peer', display_value: "the peer"}];
			  $scope.arrPeerPaysTos = [];
			  if (!fc.isSingleAddress)
				  $scope.arrPeerPaysTos.push({value: 'me', display_value: "to me"});
			  $scope.arrPeerPaysTos.push({value: 'contract', display_value: "to this contract"});
			  $scope.arrAssetInfos = indexScope.arrBalances.map(function(b){
				  var info = {asset: b.asset, is_private: b.is_private};
				  if (b.asset === 'base')
					  info.displayName = walletSettings.unitName;
				  else if (b.asset === constants.BLACKBYTES_ASSET)
					  info.displayName = walletSettings.bbUnitName;
				  else if (profileService.assetMetadata[b.asset])
					  info.displayName = profileService.assetMetadata[b.asset].name;
				  else
					  info.displayName = 'of '+b.asset.substr(0, 4);
				  return info;
			  });
			  $scope.arrPublicAssetInfos = $scope.arrAssetInfos.filter(function(b){ return !b.is_private; });
			  var contract = {
				  timeout: 4,
				  myAsset: 'base',
				  peerAsset: 'base',
				  peer_pays_to: 'contract',
				  relation: '>',
				  expiry: 7,
				  data_party: 'me',
				  expiry_party: 'peer'
			  };
			  $scope.contract = contract;
  
			  
			  $scope.onDataPartyUpdated = function(){
				  console.log('onDataPartyUpdated');
				  contract.expiry_party = (contract.data_party === 'me') ? 'peer' : 'me';
			  };
			  
			  $scope.onExpiryPartyUpdated = function(){
				  console.log('onExpiryPartyUpdated');
				  contract.data_party = (contract.expiry_party === 'me') ? 'peer' : 'me';
			  };
			  
			  
			  $scope.payAndOffer = function() {
				  console.log('payAndOffer');
				  $scope.error = '';
				  
				  if (fc.isPrivKeyEncrypted()) {
					  profileService.unlockFC(null, function(err) {
						  if (err){
							  $scope.error = err.message;
							  $timeout(function(){
								  $scope.$apply();
							  });
							  return;
						  }
						  $scope.payAndOffer();
					  });
					  return;
				  }
				  
				  profileService.requestTouchid(function(err) {
					  if (err) {
						  profileService.lockFC();
						  $scope.error = err;
						  $timeout(function() {
							  $scope.$digest();
						  }, 1);
						  return;
					  }
					  
					  if ($scope.bWorking)
						  return console.log('already working');
					  
					  var my_amount = contract.myAmount;
					  if (contract.myAsset === "base")
						  my_amount *= walletSettings.unitValue;
					  if (contract.myAsset === constants.BLACKBYTES_ASSET)
						  my_amount *= walletSettings.bbUnitValue;
					  if (profileService.assetMetadata[contract.myAsset])
						  my_amount *= Math.pow(10, profileService.assetMetadata[contract.myAsset].decimals || 0);
					  my_amount = Math.round(my_amount);
					  
					  var peer_amount = contract.peerAmount;
					  if (contract.peerAsset === "base")
						  peer_amount *= walletSettings.unitValue;
					  if (contract.peerAsset === constants.BLACKBYTES_ASSET)
						  throw Error("peer asset cannot be blackbytes");
					  if (profileService.assetMetadata[contract.peerAsset])
						  peer_amount *= Math.pow(10, profileService.assetMetadata[contract.peerAsset].decimals || 0);
					  peer_amount = Math.round(peer_amount);
					  
					  if (my_amount === peer_amount && contract.myAsset === contract.peerAsset && contract.peer_pays_to === 'contract'){
						  $scope.error = "The amounts are equal, you cannot require the peer to pay to the contract.  Please either change the amounts slightly or fund the entire contract yourself and require the peer to pay his half to you.";
						  $timeout(function() {
							  $scope.$digest();
						  }, 1);
						  return;
					  }
					  
					  var fnReadMyAddress = (contract.peer_pays_to === 'contract') ? readMyPaymentAddress : issueNextAddress;
					  fnReadMyAddress(fc, function(my_address){
						  var arrSeenCondition = ['seen', {
							  what: 'output', 
							  address: (contract.peer_pays_to === 'contract') ? 'this address' : my_address, 
							  asset: contract.peerAsset, 
							  amount: peer_amount
						  }];
						  correspondentListService.readLastMainChainIndex(function(err, last_mci){
							  if (err){
								  $scope.error = err;
								  $timeout(function() {
									  $scope.$digest();
								  }, 1);
								  return;
							  }
							  if (contract.oracle_address === configService.TIMESTAMPER_ADDRESS)
								  contract.feed_value = parseInt(contract.feed_value);
							  else
								  contract.feed_value = contract.feed_value + '';
							  var arrExplicitEventCondition = 
								  ['in data feed', [[contract.oracle_address], contract.feed_name, contract.relation, contract.feed_value, last_mci]];
							  var arrEventCondition = arrExplicitEventCondition;
							  var data_address = (contract.data_party === 'me') ? my_address : address;
							  var expiry_address = (contract.expiry_party === 'me') ? my_address : address;
							  var data_device_address = (contract.data_party === 'me') ? device.getMyDeviceAddress() : correspondent.device_address;
							  var expiry_device_address = (contract.expiry_party === 'me') ? device.getMyDeviceAddress() : correspondent.device_address;
							  var arrDefinition = ['or', [
								  ['and', [
									  arrSeenCondition,
									  ['or', [
										  ['and', [
											  ['address', data_address],
											  arrEventCondition
										  ]],
										  ['and', [
											  ['address', expiry_address],
											  ['in data feed', [[configService.TIMESTAMPER_ADDRESS], 'timestamp', '>', Date.now() + Math.round(contract.expiry*24*3600*1000)]]
										  ]]
									  ]]
								  ]],
								  ['and', [
									  ['address', my_address],
									  ['not', arrSeenCondition],
									  ['in data feed', [[configService.TIMESTAMPER_ADDRESS], 'timestamp', '>', Date.now() + Math.round(contract.timeout*3600*1000)]]
								  ]]
							  ]];
							  var assocSignersByPath = {
								  'r.0.1.0.0': {
									  address: data_address,
									  member_signing_path: 'r',
									  device_address: data_device_address
								  },
								  'r.0.1.1.0': {
									  address: expiry_address,
									  member_signing_path: 'r',
									  device_address: expiry_device_address
								  },
								  'r.1.0': {
									  address: my_address,
									  member_signing_path: 'r',
									  device_address: device.getMyDeviceAddress()
								  }
							  };
							  walletDefinedByAddresses.createNewSharedAddress(arrDefinition, assocSignersByPath, {
								  ifError: function(err){
									  $scope.bWorking = false;
									  $scope.error = err;
									  $timeout(function(){
										  $scope.$digest();
									  });
								  },
								  ifOk: function(shared_address){
									  composeAndSend(shared_address, arrDefinition, assocSignersByPath, my_address);
								  }
							  });
						  });
					  });
					  
					  // compose and send
					  function composeAndSend(shared_address, arrDefinition, assocSignersByPath, my_address){
						  profileService.bKeepUnlocked = true;
						  var opts = {
							  spend_unconfirmed: configWallet.spendUnconfirmed ? 'all' : 'own',
							  shared_address: indexScope.shared_address,
							  asset: contract.myAsset,
							  to_address: shared_address,
							  amount: my_amount,
							  arrSigningDeviceAddresses: getSigningDeviceAddresses(fc),
							  recipient_device_address: correspondent.device_address
						  };
						  fc.sendMultiPayment(opts, function(err){
							  // if multisig, it might take very long before the callback is called
							  //self.setOngoingProcess();
							  $scope.bWorking = false;
							  profileService.bKeepUnlocked = false;
							  if (err){
								  if (err.match(/device address/))
									  err = "This is a private asset, please send it only by clicking links from chat";
								  if (err.match(/no funded/))
									  err = "Not enough spendable funds, make sure all your funds are confirmed";
								  if ($scope)
									  $scope.error = err;
								  return;
							  }
							  $rootScope.$emit("NewOutgoingTx");
							  eventBus.emit('sent_payment', correspondent.device_address, my_amount, contract.myAsset, true);
							  var paymentRequestCode;
							  if (contract.peer_pays_to === 'contract'){
								  var arrPayments = [{address: shared_address, amount: peer_amount, asset: contract.peerAsset}];
								  var assocDefinitions = {};
								  assocDefinitions[shared_address] = {
									  definition: arrDefinition,
									  signers: assocSignersByPath
								  };
								  var objPaymentRequest = {payments: arrPayments, definitions: assocDefinitions};
								  var paymentJson = JSON.stringify(objPaymentRequest);
								  var paymentJsonBase64 = Buffer(paymentJson).toString('base64');
								  paymentRequestCode = 'payment:'+paymentJsonBase64;
							  }
							  else
								  paymentRequestCode = 'byteball:'+my_address+'?amount='+peer_amount+'&asset='+encodeURIComponent(contract.peerAsset);
							  var paymentRequestText = '[your share of payment to the contract]('+paymentRequestCode+')';
							  device.sendMessageToDevice(correspondent.device_address, 'text', paymentRequestText);
							  var body = correspondentListService.formatOutgoingMessage(paymentRequestText);
							  correspondentListService.addMessageEvent(false, correspondent.device_address, body);
							  if (correspondent.my_record_pref && correspondent.peer_record_pref) chatStorage.store(correspondent.device_address, body, 0, 'html');
							  if (contract.peer_pays_to === 'me')
								  issueNextAddress(fc); // make sure the address is not reused
						  });
						  $modalInstance.dismiss('cancel');
					  }
					  
				  });
			  }; // payAndOffer
			  
  
			  $scope.cancel = function() {
				  $modalInstance.dismiss('cancel');
			  };
		  };
		  
		  
		  var modalInstance = $modal.open({
			  templateUrl: 'views/modals/offer-contract.html',
			  windowClass: animationService.modalAnimated.slideUp,
			  controller: ModalInstanceCtrl,
			  scope: $scope
		  });
  
		  var disableCloseModal = $rootScope.$on('closeModal', function() {
			  modalInstance.dismiss('cancel');
		  });
  
		  modalInstance.result.finally(function() {
			  $rootScope.modalOpened = false;
			  disableCloseModal();
			  var m = angular.element(document.getElementsByClassName('reveal-modal'));
			  m.addClass(animationService.modalAnimated.slideOutDown);
		  });
	  };
  
	  $scope.offerProsaicContract = function(address){
		  var walletDefinedByAddresses = require('ocore/wallet_defined_by_addresses.js');
		  var prosaic_contract = require('ocore/prosaic_contract.js');
		  $rootScope.modalOpened = true;
		  var fc = profileService.focusedClient;
		  
		  var ModalInstanceCtrl = function($scope, $modalInstance) {
  
			  $scope.form = {
				  ttl: 24*7
			  };
			  $scope.index = indexScope;
			  $scope.isMobile = isMobile.any();
  
			  readMyPaymentAddress(fc, function(my_address) {
				  $scope.my_address = my_address;
				  $scope.peer_address = address;
				  correspondentListService.populateScopeWithAttestedFields($scope, my_address, address, function() {
					  $timeout(function() {
						  $rootScope.$apply();
					  });
				  });
			  });
  
			  $scope.CHARGE_AMOUNT = prosaic_contract.CHARGE_AMOUNT;
			  
			  $scope.payAndOffer = function() {
				  profileService.requestTouchid(function(err) {
					  if (err) {
						  profileService.lockFC();
						  $scope.error = err;
						  return;
					  }
					  console.log('offerProsaicContract');
					  $scope.error = '';
  
					  var contract_text = $scope.form.contractText;
					  var contract_title = $scope.form.contractTitle;
					  var ttl = $scope.form.ttl;
					  var creation_date = new Date().toISOString().slice(0, 19).replace('T', ' ');
					  var hash = prosaic_contract.getHash({title:contract_title, text:contract_text, creation_date:creation_date});
  
					  readMyPaymentAddress(fc, function(my_address) {
						  var cosigners = getSigningDeviceAddresses(fc);
						  if (!cosigners.length && fc.credentials.m > 1) {
							  indexScope.copayers.forEach(function(copayer) {
								  cosigners.push(copayer.device_address);
							  });
						  }
						  prosaic_contract.createAndSend(hash, address, correspondent.device_address, my_address, creation_date, ttl, contract_title, contract_text, cosigners, function(objContract) {
							  correspondentListService.listenForProsaicContractResponse([{hash: hash, title: contract_title, my_address: my_address, peer_address: address, peer_device_address: correspondent.device_address, cosigners: cosigners}]);
							  var chat_message = "(prosaic-contract:" + Buffer.from(JSON.stringify(objContract), 'utf8').toString('base64') + ")";
							  var body = correspondentListService.formatOutgoingMessage(chat_message);
							  correspondentListService.addMessageEvent(false, correspondent.device_address, body);
							  device.readCorrespondent(correspondent.device_address, function(correspondent) {
								  if (correspondent.my_record_pref && correspondent.peer_record_pref) chatStorage.store(correspondent.device_address, body, 0, 'html');
							  });
							  $modalInstance.dismiss('sent');
						  });
					  });
				  });
			  };
			  
			  $scope.cancel = function() {
				  $modalInstance.dismiss('cancel');
			  };
  
			  $scope.openInExplorer = correspondentListService.openInExplorer;
		  };
		  
		  
		  var modalInstance = $modal.open({
			  templateUrl: 'views/modals/offer-prosaic-contract.html',
			  windowClass: animationService.modalAnimated.slideUp,
			  controller: ModalInstanceCtrl,
			  scope: $scope
		  });
  
		  var disableCloseModal = $rootScope.$on('closeModal', function() {
			  modalInstance.dismiss('cancel');
		  });
  
		  modalInstance.result.finally(function() {
			  $rootScope.modalOpened = false;
			  disableCloseModal();
			  var m = angular.element(document.getElementsByClassName('reveal-modal'));
			  m.addClass(animationService.modalAnimated.slideOutDown);
		  });
	  };
  
	  $scope.sendMultiPayment = function(paymentJsonBase64){
		  var walletDefinedByAddresses = require('ocore/wallet_defined_by_addresses.js');
		  var paymentJson = Buffer(paymentJsonBase64, 'base64').toString('utf8');
		  console.log("multi "+paymentJson);
		  var objMultiPaymentRequest = JSON.parse(paymentJson);
		  $rootScope.modalOpened = true;
		  var self = this;
		  var fc = profileService.focusedClient;
		  var ModalInstanceCtrl = function($scope, $modalInstance) {
			  var config = configService.getSync();
			  var configWallet = config.wallet;
			  var walletSettings = configWallet.settings;
			  $scope.unitValue = walletSettings.unitValue;
			  $scope.unitName = walletSettings.unitName;
			  $scope.color = fc.backgroundColor;
			  $scope.bDisabled = true;
			  var assocSharedDestinationAddresses = {};
			  var createMovementLines = function(){
				  $scope.arrMovements = objMultiPaymentRequest.payments.map(function(objPayment){
					  var text = correspondentListService.getAmountText(objPayment.amount, objPayment.asset || 'base') + ' to ' + objPayment.address;
					  if (assocSharedDestinationAddresses[objPayment.address])
						  text += ' (smart address, see below)';
					  return text;
				  });
			  };
			  if (objMultiPaymentRequest.definitions){
				  var arrAllMemberAddresses = [];
				  var arrFuncs = [];
				  var assocMemberAddressesByDestAddress = {};
				  for (var destinationAddress in objMultiPaymentRequest.definitions){
					  var arrDefinition = objMultiPaymentRequest.definitions[destinationAddress].definition;
					  var arrMemberAddresses = extractAddressesFromDefinition(arrDefinition);
					  assocMemberAddressesByDestAddress[destinationAddress] = arrMemberAddresses;
					  arrAllMemberAddresses = arrAllMemberAddresses.concat(arrMemberAddresses);
					  arrFuncs.push(function(cb){
						  walletDefinedByAddresses.validateAddressDefinition(arrDefinition, cb);
					  });
				  }
				  arrAllMemberAddresses = lodash.uniq(arrAllMemberAddresses);
				  if (arrAllMemberAddresses.length === 0)
					  throw Error("no member addresses in "+paymentJson);
				  var assocPeerNamesByDeviceAddress = {};
				  var loadCorrespondentNames = function(cb){
					  device.readCorrespondents(function(arrCorrespondents){
						  arrCorrespondents.forEach(function(corr){
							  assocPeerNamesByDeviceAddress[corr.device_address] = corr.name;
						  });
						  cb();
					  });
				  };
				  var findMyAddresses = function(cb){
					  db.query(
						  "SELECT address FROM my_addresses WHERE address IN(?) \n\
						  UNION \n\
						  SELECT shared_address AS address FROM shared_addresses WHERE shared_address IN(?)",
						  [arrAllMemberAddresses, arrAllMemberAddresses],
						  function(rows){
							  var arrMyAddresses = rows.map(function(row){ return row.address; });
							  for (var destinationAddress in assocMemberAddressesByDestAddress){
								  var arrMemberAddresses = assocMemberAddressesByDestAddress[destinationAddress];
								  if (lodash.intersection(arrMemberAddresses, arrMyAddresses).length > 0)
									  assocSharedDestinationAddresses[destinationAddress] = true;
							  }
							  createMovementLines();
							  $scope.arrHumanReadableDefinitions = [];
							  for (var destinationAddress in objMultiPaymentRequest.definitions){
								  var arrDefinition = objMultiPaymentRequest.definitions[destinationAddress].definition;
								  var assocSignersByPath = objMultiPaymentRequest.definitions[destinationAddress].signers;
								  var arrPeerAddresses = walletDefinedByAddresses.getPeerAddressesFromSigners(assocSignersByPath);
								  if (lodash.difference(arrPeerAddresses, arrAllMemberAddresses).length !== 0)
									  throw Error("inconsistent peer addresses");
								  var assocPeerNamesByAddress = {};
								  for (var path in assocSignersByPath){
									  var signerInfo = assocSignersByPath[path];
									  if (signerInfo.device_address !== device.getMyDeviceAddress())
										  assocPeerNamesByAddress[signerInfo.address] = assocPeerNamesByDeviceAddress[signerInfo.device_address] || 'unknown peer';
								  }
								  $scope.arrHumanReadableDefinitions.push({
									  destinationAddress: destinationAddress,
									  humanReadableDefinition: correspondentListService.getHumanReadableDefinition(arrDefinition, arrMyAddresses, [], assocPeerNamesByAddress)
								  });
							  }
							  cb();
						  }
					  );
				  };
				  var checkDuplicatePayment = function(cb){
					  var objFirstPayment = objMultiPaymentRequest.payments[0];
					  db.query(
						  "SELECT 1 FROM outputs JOIN unit_authors USING(unit) JOIN my_addresses ON unit_authors.address=my_addresses.address \n\
						  WHERE outputs.address=? AND amount=? LIMIT 1",
						  [objFirstPayment.address, objFirstPayment.amount],
						  function(rows){
							  $scope.bAlreadyPaid = (rows.length > 0);
							  cb();
						  }
					  );
				  };
				  arrFuncs.push(loadCorrespondentNames);
				  arrFuncs.push(findMyAddresses);
				  arrFuncs.push(checkDuplicatePayment);
				  async.series(arrFuncs, function(err){
					  if (err)
						  $scope.error = err;
					  else
						  $scope.bDisabled = false;
					  $timeout(function(){
						  $scope.$apply();
					  });
				  });
			  }
			  else
				  $scope.bDisabled = false;
			  
			  function insertSharedAddress(shared_address, arrDefinition, signers, cb){
				  db.query("SELECT 1 FROM shared_addresses WHERE shared_address=?", [shared_address], function(rows){
					  if (rows.length > 0){
						  console.log('shared address '+shared_address+' already known');
						  return cb();
					  }
					  walletDefinedByAddresses.handleNewSharedAddress({address: shared_address, definition: arrDefinition, signers: signers}, {
						  ifOk: cb,
						  ifError: function(err){
							  throw Error('failed to create shared address '+shared_address+': '+err);
						  }
					  });
				  });
			  }
  
			  
			  $scope.pay = function() {
				  console.log('pay');
				  $scope.bDisabled = true;
				  
				  if (fc.isPrivKeyEncrypted()) {
					  profileService.unlockFC(null, function(err) {
						  if (err){
							  $scope.error = err.message;
							  $timeout(function(){
								  $scope.$apply();
							  });
							  return;
						  }
						  $scope.pay();
					  });
					  return;
				  }
				  
				  profileService.requestTouchid(function(err) {
					  if (err) {
						  profileService.lockFC();
						  $scope.error = err;
						  $timeout(function() {
							  $scope.$digest();
						  }, 1);
						  return;
					  }
					  
					  // create shared addresses
					  var arrFuncs = [];
					  for (var destinationAddress in assocSharedDestinationAddresses){
						  (function(){ // use self-invoking function to isolate scope of da and make it different in different iterations
							  var da = destinationAddress;
							  arrFuncs.push(function(cb){
								  var objDefinitionAndSigners = objMultiPaymentRequest.definitions[da];
								  insertSharedAddress(da, objDefinitionAndSigners.definition, objDefinitionAndSigners.signers, cb);
							  });
						  })();
					  }
					  async.series(arrFuncs, function(){
						  // shared addresses inserted, now pay
						  var assocOutputsByAsset = {};
						  objMultiPaymentRequest.payments.forEach(function(objPayment){
							  var asset = objPayment.asset || 'base';
							  if (!assocOutputsByAsset[asset])
								  assocOutputsByAsset[asset] = [];
							  assocOutputsByAsset[asset].push({address: objPayment.address, amount: objPayment.amount});
						  });
						  var arrNonBaseAssets = Object.keys(assocOutputsByAsset).filter(function(asset){ return (asset !== 'base'); });
						  if (arrNonBaseAssets.length > 1){
							  $scope.error = 'more than 1 non-base asset not supported';
							  $timeout(function(){
								  $scope.$apply();
							  });
							  return;
						  }
						  var asset = (arrNonBaseAssets.length > 0) ? arrNonBaseAssets[0] : null;
						  var arrBaseOutputs = assocOutputsByAsset['base'] || [];
						  var arrAssetOutputs = asset ? assocOutputsByAsset[asset] : null;
						  var current_multi_payment_key = require('crypto').createHash("sha256").update(paymentJson).digest('base64');
						  if (current_multi_payment_key === indexScope.current_multi_payment_key){
							  $rootScope.$emit('Local/ShowErrorAlert', "This payment is already under way");
							  $modalInstance.dismiss('cancel');
							  return;
						  }
						  indexScope.current_multi_payment_key = current_multi_payment_key;
						  var recipient_device_address = lodash.clone(correspondent.device_address);
						  fc.sendMultiPayment({
							  spend_unconfirmed: configWallet.spendUnconfirmed ? 'all' : 'own',
							  asset: asset,
							  arrSigningDeviceAddresses: getSigningDeviceAddresses(fc),
							  recipient_device_address: recipient_device_address,
							  base_outputs: arrBaseOutputs,
							  asset_outputs: arrAssetOutputs
						  }, function(err){ // can take long if multisig
							  delete indexScope.current_multi_payment_key;
							  if (err){
								  if (chatScope){
									  setError(err);
									  $timeout(function() {
										  chatScope.$apply();
									  });
								  }
								  return;
							  }
							  $rootScope.$emit("NewOutgoingTx");
							  var assocPaymentsByAsset = correspondentListService.getPaymentsByAsset(objMultiPaymentRequest);
							  var bToSharedAddress = objMultiPaymentRequest.payments.some(function(objPayment){
								  return assocSharedDestinationAddresses[objPayment.address];
							  });
							  for (var asset in assocPaymentsByAsset)
								  eventBus.emit('sent_payment', recipient_device_address, assocPaymentsByAsset[asset], asset, bToSharedAddress);
						  });
						  $modalInstance.dismiss('cancel');
					  });
				  });
			  }; // pay
			  
  
			  $scope.cancel = function() {
				  $modalInstance.dismiss('cancel');
			  };
		  };
		  
		  function extractAddressesFromDefinition(arrDefinition){
			  var assocAddresses = {};
			  function parse(arrSubdefinition){
				  var op = arrSubdefinition[0];
				  switch(op){
					  case 'address':
					  case 'cosigned by':
						  assocAddresses[arrSubdefinition[1]] = true;
						  break;
					  case 'or':
					  case 'and':
						  arrSubdefinition[1].forEach(parse);
						  break;
					  case 'r of set':
						  arrSubdefinition[1].set.forEach(parse);
						  break;
					  case 'weighted and':
						  arrSubdefinition[1].set.forEach(function(arg){
							  parse(arg.value);
						  });
						  break;
				  }
			  }
			  parse(arrDefinition);
			  return Object.keys(assocAddresses);
		  }
		  
		  var modalInstance = $modal.open({
			  templateUrl: 'views/modals/multi-payment.html',
			  windowClass: animationService.modalAnimated.slideUp,
			  controller: ModalInstanceCtrl,
			  scope: $scope
		  });
  
		  var disableCloseModal = $rootScope.$on('closeModal', function() {
			  modalInstance.dismiss('cancel');
		  });
  
		  modalInstance.result.finally(function() {
			  $rootScope.modalOpened = false;
			  disableCloseModal();
			  var m = angular.element(document.getElementsByClassName('reveal-modal'));
			  m.addClass(animationService.modalAnimated.slideOutDown);
		  });
	  };
	  
  
	  
	  $scope.sendVote = function(voteJsonBase64){
		  var voteJson = Buffer(voteJsonBase64, 'base64').toString('utf8');
		  console.log("vote "+voteJson);
		  var objVote = JSON.parse(voteJson);
		  $rootScope.modalOpened = true;
		  var self = this;
		  var fc = profileService.focusedClient;
		  
		  var ModalInstanceCtrl = function($scope, $modalInstance) {
			  $scope.choice = objVote.choice;
			  $scope.color = fc.backgroundColor;
			  $scope.bDisabled = true;
			  setPollQuestion(true);
			  
			  function setPollQuestion(bFirstAttempt){
				  db.query("SELECT question FROM polls WHERE unit=?", [objVote.poll_unit], function(rows){
					  if (rows.length > 1)
						  throw Error("more than 1 poll?");
					  if (rows.length === 0){
						  if (conf.bLight && bFirstAttempt){
							  $scope.question = '[Fetching the question...]';
							  network.requestProofsOfJointsIfNewOrUnstable([objVote.poll_unit], function(err){
								  if (err){
									  $scope.error = err;
									  return scopeApply();
								  }
								  setPollQuestion();
							  });
						  }
						  else
							  $scope.question = '[No such poll: '+objVote.poll_unit+']';
					  }
					  else{
						  $scope.question = rows[0].question;
						  $scope.bDisabled = false;
					  }
					  scopeApply();
				  });
			  }
			  
			  function scopeApply(){
				  $timeout(function(){
					  $scope.$apply();
				  });
			  }
  
			  function readVotingAddresses(handleAddresses){
				  if (indexScope.shared_address)
					  return handleAddresses([indexScope.shared_address]);
				  db.query(
					  "SELECT address, SUM(amount) AS total FROM my_addresses JOIN outputs USING(address) \n\
					  WHERE wallet=? AND is_spent=0 AND asset IS NULL GROUP BY address ORDER BY total DESC LIMIT 16", 
					  [fc.credentials.walletId], 
					  function(rows){
						  var arrAddresses = rows.map(function(row){ return row.address; });
						  handleAddresses(arrAddresses);
					  }
				  );
			  }
			  
			  $scope.vote = function() {
				  console.log('vote');
				  
				  if (fc.isPrivKeyEncrypted()) {
					  profileService.unlockFC(null, function(err) {
						  if (err){
							  $scope.error = err.message;
							  return scopeApply();
						  }
						  $scope.vote();
					  });
					  return;
				  }
				  
				  profileService.requestTouchid(function(err) {
					  if (err) {
						  profileService.lockFC();
						  $scope.error = err;
						  return scopeApply();
					  }
					  
					  readVotingAddresses(function(arrAddresses){
						  if (arrAddresses.length === 0){
							  $scope.error = "Cannot vote, no funded addresses.";
							  return scopeApply();
						  }
						  var payload = {unit: objVote.poll_unit, choice: objVote.choice};
						  var objMessage = {
							  app: 'vote',
							  payload_location: "inline",
							  payload_hash: objectHash.getBase64Hash(payload, storage.getMinRetrievableMci() >= constants.timestampUpgradeMci),
							  payload: payload
						  };
  
						  var current_vote_key = require('crypto').createHash("sha256").update(voteJson).digest('base64');
						  if (current_vote_key === indexScope.current_vote_key){
							  $rootScope.$emit('Local/ShowErrorAlert', "This vote is already under way");
							  $modalInstance.dismiss('cancel');
							  return;
						  }
						  var recipient_device_address = lodash.clone(correspondent.device_address);
						  indexScope.current_vote_key = current_vote_key;
						  fc.sendMultiPayment({
							  spend_unconfirmed: configService.getSync().wallet.spendUnconfirmed ? 'all' : 'own',
							  arrSigningDeviceAddresses: getSigningDeviceAddresses(fc),
							  paying_addresses: arrAddresses,
							  signing_addresses: arrAddresses,
							  shared_address: indexScope.shared_address,
							  change_address: arrAddresses[0],
							  messages: [objMessage]
						  }, function(err){ // can take long if multisig
							  delete indexScope.current_vote_key;
							  if (err){
								  if (chatScope){
									  setError(err);
									  $timeout(function() {
										  chatScope.$apply();
									  });
								  }
								  return;
							  }
							  var body = 'voted:'+objVote.choice;
							  device.sendMessageToDevice(recipient_device_address, 'text', body);
							  correspondentListService.addMessageEvent(false, recipient_device_address, body);
							  $rootScope.$emit("NewOutgoingTx");
						  });
						  $modalInstance.dismiss('cancel');
					  });
					  
				  });
			  }; // vote
			  
  
			  $scope.cancel = function() {
				  $modalInstance.dismiss('cancel');
			  };
		  };
		  
		  
		  var modalInstance = $modal.open({
			  templateUrl: 'views/modals/vote.html',
			  windowClass: animationService.modalAnimated.slideUp,
			  controller: ModalInstanceCtrl,
			  scope: $scope
		  });
  
		  var disableCloseModal = $rootScope.$on('closeModal', function() {
			  modalInstance.dismiss('cancel');
		  });
  
		  modalInstance.result.finally(function() {
			  $rootScope.modalOpened = false;
			  disableCloseModal();
			  var m = angular.element(document.getElementsByClassName('reveal-modal'));
			  m.addClass(animationService.modalAnimated.slideOutDown);
		  });
		  
	  }; // sendVote
	  
	  
	  $scope.showSignMessageModal = function(message_to_sign){
		  $rootScope.modalOpened = true;
		  var self = this;
		  var fc = profileService.focusedClient;
		  $scope.error = '';
		  
		  var ModalInstanceCtrl = function($scope, $modalInstance) {
			  $scope.color = fc.backgroundColor;
			  $scope.bDisabled = true;
			  $scope.message_to_sign = message_to_sign;
			  readMyPaymentAddress(fc, function(address){
				  $scope.address = address;
				  var arrAddreses = message_to_sign.match(/\b[2-7A-Z]{32}\b/g) || [];
				  arrAddreses = arrAddreses.filter(ValidationUtils.isValidAddress);
				  if (arrAddreses.length === 0 || arrAddreses.indexOf(address) >= 0) {
					  $scope.bDisabled = false;
					  return scopeApply();
				  }
				  db.query(
					  "SELECT address FROM my_addresses \n\
					  WHERE wallet = ? AND address IN(" + arrAddreses.map(db.escape).join(', ') + ")",
					  fc.credentials.walletId,
					  function (rows) {
						  if (rows.length > 0)
							  $scope.address = rows[0].address;
						  $scope.bDisabled = false;
						  scopeApply();
					  }
				  );
			  });
			  
			  function scopeApply(){
				  $timeout(function(){
					  $scope.$apply();
				  });
			  }
  
			  $scope.signMessage = function() {
				  console.log('signMessage');
				  
				  correspondentListService.signMessageFromAddress(message_to_sign, $scope.address, getSigningDeviceAddresses(fc), function(err, signedMessageBase64){
					  if (err) {
						  $scope.error = err;
						  return scopeApply();
					  }
					  appendText('[Signed message](signed-message:' + signedMessageBase64 + ')');
					  chatScope.send();
					  $modalInstance.dismiss('cancel');
				  });
			  }; // signMessage
			  
  
			  $scope.cancel = function() {
				  $modalInstance.dismiss('cancel');
			  };
		  };
		  
		  
		  var modalInstance = $modal.open({
			  templateUrl: 'views/modals/sign-message.html',
			  windowClass: animationService.modalAnimated.slideUp,
			  controller: ModalInstanceCtrl,
			  scope: $scope
		  });
  
		  var disableCloseModal = $rootScope.$on('closeModal', function() {
			  modalInstance.dismiss('cancel');
		  });
  
		  modalInstance.result.finally(function() {
			  $rootScope.modalOpened = false;
			  disableCloseModal();
			  var m = angular.element(document.getElementsByClassName('reveal-modal'));
			  m.addClass(animationService.modalAnimated.slideOutDown);
		  });
		  
	  }; // showSignMessageModal
	  
	  
	  $scope.verifySignedMessage = function(signedMessageBase64){
		  $rootScope.modalOpened = true;
		  var self = this;
		  var fc = profileService.focusedClient;
		  var signedMessageJson = Buffer(signedMessageBase64, 'base64').toString('utf8');
		  var objSignedMessage = JSON.parse(signedMessageJson);
		  
		  var ModalInstanceCtrl = function($scope, $modalInstance) {
			  $scope.color = fc.backgroundColor;
			  $scope.signed_message = objSignedMessage.signed_message;
			  $scope.address = objSignedMessage.authors[0].address;
			  var validation = require('ocore/validation.js');
			  validation.validateSignedMessage(objSignedMessage, function(err){
				  $scope.bValid = !err;
				  if (err)
					  console.log("validateSignedMessage: "+err);
				  scopeApply();
			  });
			  
			  function scopeApply(){
				  $timeout(function(){
					  $scope.$apply();
				  });
			  }
  
			  $scope.cancel = function() {
				  $modalInstance.dismiss('cancel');
			  };
		  };
		  
		  
		  var modalInstance = $modal.open({
			  templateUrl: 'views/modals/signed-message.html',
			  windowClass: animationService.modalAnimated.slideUp,
			  controller: ModalInstanceCtrl,
			  scope: $scope
		  });
  
		  var disableCloseModal = $rootScope.$on('closeModal', function() {
			  modalInstance.dismiss('cancel');
		  });
  
		  modalInstance.result.finally(function() {
			  $rootScope.modalOpened = false;
			  disableCloseModal();
			  var m = angular.element(document.getElementsByClassName('reveal-modal'));
			  m.addClass(animationService.modalAnimated.slideOutDown);
		  });
		  
	  }; // verifySignedMessage
	  
	  
	  
	  
	  // send a command to the bot
	  $scope.sendCommand = function(command, description){
		  console.log("will send command "+command);
		  $scope.message = command;
		  $scope.send();
	  };
  
	  $scope.suggestCommand = function(command){
		  $scope.message = command;
	  };
	  
	  $scope.openExternalLink = function(url){
		  if (typeof nw !== 'undefined')
			  nw.Shell.openExternal(url);
		  else if (isCordova)
			  cordova.InAppBrowser.open(url, '_system');
	  };
  
	  $scope.editCorrespondent = function() {
		  go.path('correspondentDevices.correspondentDevice.editCorrespondentDevice');
	  };
  
	  $scope.loadMoreHistory = function(cb) {
		  correspondentListService.loadMoreHistory(correspondent, function() {
			  cb();
		  });
	  }
	  $scope.isCordova = isCordova;
  
	  $scope.autoScrollEnabled = true;
	  $scope.loadMoreHistory(function(){
		  $timeout(function(){
			  $scope.$digest();
		  });
		  for (var i in $scope.messageEvents) {
			  var message = $scope.messageEvents[i];
			  if (message.chat_recording_status) {
				  return;
			  }
		  }
		  breadcrumbs.add("correspondent with empty chat opened: " + correspondent.device_address);
		  var message = {
			  type: 'system',
			  bIncoming: false,
			  message: JSON.stringify({state: (correspondent.peer_record_pref && correspondent.my_record_pref ? true : false)}),
			  timestamp: Math.floor(+ new Date() / 1000),
			  chat_recording_status: true
		  };
		  chatStorage.store(correspondent.device_address, message.message, 0, 'system');
		  $scope.messageEvents.push(correspondentListService.parseMessage(message));
	  });
  
	  function setError(error){
		  console.log("send error:", error);
		  $scope.error = error;
	  }
	  
	  function readMyPaymentAddress(fc, cb){
	  //	if (indexScope.shared_address)
	  //		return cb(indexScope.shared_address);
		  addressService.getAddress(fc.credentials.walletId, false, function(err, address) {
			  cb(address);
		  });
	  }
	  
	  function issueNextAddress(fc, cb){
		  if (fc.isSingleAddress)
			  throw Error("trying to issue a new address on a single-address wallet");
		  var walletDefinedByKeys = require('ocore/wallet_defined_by_keys.js');
		  walletDefinedByKeys.issueNextAddress(fc.credentials.walletId, 0, function(addressInfo){
			  if (cb)
				  cb(addressInfo.address);
		  });
	  }
	  
	  /*
	  function issueNextAddressIfNecessary(onDone){
		  if (myPaymentAddress) // do not issue new address
			  return onDone();
		  var walletDefinedByKeys = require('ocore/wallet_defined_by_keys.js');
		  walletDefinedByKeys.issueOrSelectNextAddress(fc.credentials.walletId, 0, function(addressInfo){
			  myPaymentAddress = addressInfo.address; // cache it in case we need to insert again
			  onDone();
			  $scope.$apply();
		  });
	  }*/
	  
	  function appendText(text){
		  if (!$scope.message)
			  $scope.message = '';
		  if ($scope.message && $scope.message.charAt($scope.message.length - 1) !== ' ')
			  $scope.message += ' ';
		  $scope.message += text;
		  $scope.message += ' ';
		  if (!document.chatForm || !document.chatForm.message) // already gone
			  return;
		  var msgField = document.chatForm.message;
		  $timeout(function(){
			  $rootScope.$digest();
			  msgField.selectionStart = msgField.selectionEnd = msgField.value.length;
			  msgField.focus();
		  });
	  }
	  
	  function appendMyPaymentAddress(myPaymentAddress){
		  appendText(myPaymentAddress);
	  }
	  
	  function showRequestPaymentModal(myPaymentAddress){
		  $rootScope.modalOpened = true;
		  var self = this;
		  var fc = profileService.focusedClient;
		  var ModalInstanceCtrl = function($scope, $modalInstance) {
			  var config = configService.getSync();
			  var configWallet = config.wallet;
			  var walletSettings = configWallet.settings;
			  $scope.unitValue = walletSettings.unitValue;
			  $scope.unitName = walletSettings.unitName;
			  $scope.bbUnitValue = walletSettings.bbUnitValue;
			  $scope.bbUnitName = walletSettings.bbUnitName;
			  $scope.color = fc.backgroundColor;
			  $scope.isCordova = isCordova;
			  $scope.buttonLabel = 'Request payment';
			  //$scope.selectedAsset = $scope.index.arrBalances[$scope.index.assetIndex];
			  //console.log($scope.index.arrBalances.length+" assets, current: "+$scope.asset);
  
			  Object.defineProperty($scope,
				  "_customAmount", {
				  get: function() {
					  return $scope.customAmount;
				  },
				  set: function(newValue) {
					  $scope.customAmount = newValue;
				  },
				  enumerable: true,
				  configurable: true
			  });
  
			  $scope.submitForm = function(form) {
				  if ($scope.index.arrBalances.length === 0)
					  return console.log('showRequestPaymentModal: no balances yet');
				  var amount = form.amount.$modelValue;
				  //var asset = form.asset.$modelValue;
				  var asset = $scope.index.arrBalances[$scope.index.assetIndex].asset;
				  if (!asset)
					  throw Error("no asset");
				  var amountInSmallestUnits = profileService.getAmountInSmallestUnits(amount, asset);
				  var params = 'amount='+amountInSmallestUnits;
				  if (asset !== 'base')
					  params += '&asset='+encodeURIComponent(asset);
				  var units = profileService.getUnitName(asset);
				  appendText('['+amount+' '+units+'](byteball:'+myPaymentAddress+'?'+params+')');
				  $modalInstance.dismiss('cancel');
			  };
  
			  $scope.cancel = function() {
				  $modalInstance.dismiss('cancel');
			  };
		  };
  
		  var modalInstance = $modal.open({
			  templateUrl: 'views/modals/customized-amount.html',
			  windowClass: animationService.modalAnimated.slideUp,
			  controller: ModalInstanceCtrl,
			  scope: $scope
		  });
  
		  var disableCloseModal = $rootScope.$on('closeModal', function() {
			  modalInstance.dismiss('cancel');
		  });
  
		  modalInstance.result.finally(function() {
			  $rootScope.modalOpened = false;
			  disableCloseModal();
			  var m = angular.element(document.getElementsByClassName('reveal-modal'));
			  m.addClass(animationService.modalAnimated.slideOutDown);
		  });
	  }
	  
  
	  function checkIfPrivateProfileExists(objPrivateProfile, handleResult){
		  var disclosed_fields = [];
		  for (var field in objPrivateProfile.src_profile){
			  var arrValueAndBlinding = objPrivateProfile.src_profile[field];
			  if (ValidationUtils.isArrayOfLength(arrValueAndBlinding, 2)) {
				  disclosed_fields.push(field);
			  }
		  }
		  db.query("SELECT COUNT(1) AS count FROM private_profiles \n\
			  JOIN private_profile_fields USING(private_profile_id) \n\
			  WHERE unit=? AND payload_hash=? AND field IN (?)", [objPrivateProfile.unit, objPrivateProfile.payload_hash, disclosed_fields], function(rows){
			  handleResult(rows[0].count === disclosed_fields.length);
		  });
	  }
	  
	  function getDisplayField(field){
		  switch (field){
			  case 'first_name': return gettext('First name');
			  case 'last_name': return gettext('Last name');
			  case 'dob': return gettext('Date of birth');
			  case 'country': return gettext('Country');
			  case 'personal_code': return gettext('Personal code');
			  case 'us_state': return gettext('US state');
			  case 'id_number': return gettext('ID number');
			  case 'id_type': return gettext('ID type');
			  case 'id_subtype': return gettext('ID subtype');
			  case 'id_expiry': return gettext('ID expires at');
			  case 'id_issued_at': return gettext('ID issued at');
			  default: return field;
		  }
	  }
	  
	  $scope.acceptPrivateProfile = function(privateProfileJsonBase64){
		  $rootScope.modalOpened = true;
		  var objPrivateProfile = privateProfile.getPrivateProfileFromJsonBase64(privateProfileJsonBase64);
		  if (!objPrivateProfile)
			  throw Error('failed to parse the already validated base64 private profile '+privateProfileJsonBase64);
		  var fc = profileService.focusedClient;
		  var ModalInstanceCtrl = function($scope, $modalInstance) {
			  $scope.color = fc.backgroundColor;
			  var openProfile = {};
			  for (var field in objPrivateProfile.src_profile)
				  if (Array.isArray(objPrivateProfile.src_profile[field]))
					  openProfile[field] = objPrivateProfile.src_profile[field][0];
			  $scope.openProfile = openProfile;
			  $scope.bDisabled = true;
			  $scope.buttonLabel = gettext('Verifying the profile...');
			  $scope.isMobile = isMobile.any();
			  $scope.openInExplorer = correspondentListService.openInExplorer;
			  privateProfile.parseAndValidatePrivateProfile(objPrivateProfile, function(error, address, attestor_address, bMyAddress){
				  if (!$scope)
					  return;
				  if (error){
					  $scope.error = error;
					  $scope.buttonLabel = gettext('Bad profile');
					  $timeout(function() {
						  $rootScope.$apply();
					  });
					  return;
				  }
				  $scope.address = address;
				  $scope.attestor_address = attestor_address;
				  $scope.bMyAddress = bMyAddress;
				  $scope.unit = objPrivateProfile.unit;
				  $scope.trusted = !!lodash.find(configService.getSync().realNameAttestorAddresses, function(attestor){return attestor.address == attestor_address});
				  /*if (!bMyAddress)
					  return $timeout(function() {
						  $rootScope.$apply();
					  });*/
				  checkIfPrivateProfileExists(objPrivateProfile, function(bExists){
					  if (bExists)
						  $scope.buttonLabel = gettext('Already saved');
					  else{
						  $scope.buttonLabel = gettext('Store');
						  $scope.bDisabled = false;
					  }
					  $timeout(function() {
						  $rootScope.$apply();
					  });
				  });
			  });
			  
			  $scope.getDisplayField = getDisplayField;
  
			  $scope.store = function() {
				  /*if (!$scope.bMyAddress)
					  throw Error("not my address");*/
				  privateProfile.savePrivateProfile(objPrivateProfile, $scope.address, $scope.attestor_address, function(){
					  $timeout(function(){
						  $modalInstance.dismiss('cancel');
					  });
				  });
			  };
  
			  $scope.cancel = function() {
				  $modalInstance.dismiss('cancel');
			  };
		  };
  
		  var modalInstance = $modal.open({
			  templateUrl: 'views/modals/accept-profile.html',
			  windowClass: animationService.modalAnimated.slideUp,
			  controller: ModalInstanceCtrl,
			  scope: $scope
		  });
  
		  var disableCloseModal = $rootScope.$on('closeModal', function() {
			  modalInstance.dismiss('cancel');
		  });
  
		  modalInstance.result.finally(function() {
			  $rootScope.modalOpened = false;
			  disableCloseModal();
			  var m = angular.element(document.getElementsByClassName('reveal-modal'));
			  m.addClass(animationService.modalAnimated.slideOutDown);
		  });
	  };
	  
	  
	  
	  $scope.choosePrivateProfile = function(fields_list){
		  $rootScope.modalOpened = true;
		  var arrFields = fields_list ? fields_list.split(',') : [];
		  var fc = profileService.focusedClient;
		  var ModalInstanceCtrl = function($scope, $modalInstance) {
			  $scope.color = fc.backgroundColor;
			  $scope.requested = !!fields_list;
			  $scope.bDisabled = true;
			  var sql = fields_list
				  ? "SELECT private_profiles.*, version, COUNT(*) AS c FROM private_profile_fields JOIN private_profiles USING(private_profile_id) \n\
					  CROSS JOIN units USING (unit) \n\
					  LEFT JOIN my_addresses USING (address) \n\
					  LEFT JOIN shared_addresses ON shared_addresses.shared_address = private_profiles.address \n\
					  WHERE field IN(?) AND (my_addresses.address IS NOT NULL OR shared_addresses.shared_address IS NOT NULL) GROUP BY private_profile_id"
				  : "SELECT private_profiles.*, version FROM private_profiles \n\
					  CROSS JOIN units USING (unit) \n\
					  LEFT JOIN my_addresses USING (address) \n\
					  LEFT JOIN shared_addresses ON shared_addresses.shared_address = private_profiles.address \n\
					  WHERE my_addresses.address IS NOT NULL OR shared_addresses.shared_address IS NOT NULL";
			  var params = fields_list ? [arrFields] : [];
			  readMyPaymentAddress(fc, function(current_address){
				  db.query(sql, params, function(rows){
					  if (fields_list)
						  rows = rows.filter(function(row){ return (row.c === arrFields.length); });
					  var arrProfiles = [];
					  async.eachSeries(
						  rows,
						  function(row, cb){
							  var profile = row;
							  db.query(
								  "SELECT field, value, blinding FROM private_profile_fields WHERE private_profile_id=? ORDER BY rowid", 
								  [profile.private_profile_id], 
								  function(vrows){
									  profile.entries = vrows;
									  var assocValuesByField = {};
									  profile.entries.forEach(function(entry){
										  entry.editable = !fields_list;
										  if (arrFields.indexOf(entry.field) >= 0)
											  entry.provided = true;
										  assocValuesByField[entry.field] = entry.value;
									  });
									  if (fields_list){
										  profile._label = assocValuesByField[arrFields[0]];
										  if (arrFields[1])
											  profile._label += ' ' + assocValuesByField[arrFields[1]];
									  }
									  else{
										  profile._label = profile.entries[0].value;
										  if (profile.entries[1])
											  profile._label += ' ' + profile.entries[1].value;
									  }
									  profile.bCurrentAddress = (profile.address === current_address);
									  arrProfiles.push(profile);
									  cb();
								  }
							  );
						  },
						  function(){
							  // add date if duplicate labels
							  var assocLabels = {};
							  var assocDuplicateLabels = {};
							  arrProfiles.forEach(function(profile){
								  if (assocLabels[profile._label])
									  assocDuplicateLabels[profile._label] = true;
								  assocLabels[profile._label] = true;
							  });
							  arrProfiles.forEach(function(profile){
								  if (assocDuplicateLabels[profile._label])
									  profile._label += ' ' + profile.creation_date;
							  });
							  // sort profiles: current address first
							  arrProfiles.sort(function(p1, p2){
								  if (p1.bCurrentAddress && !p2.bCurrentAddress)
									  return -1;
								  if (!p1.bCurrentAddress && p2.bCurrentAddress)
									  return 1;
								  return (p1.creation_date > p2.creation_date) ? -1 : 1; // newest first
							  });
							  $scope.arrProfiles = arrProfiles;
							  $scope.vars = {selected_profile: arrProfiles[0]};
							  $scope.bDisabled = false;
							  if (arrProfiles.length === 0){
								  if (!fields_list)
									  $scope.noProfiles = true;
								  else
									  db.query("SELECT 1 FROM private_profiles LIMIT 1", function(rows2){
										  if (rows2.length > 0)
											  return;
										  $scope.noProfiles = true;
										  $timeout(function() {
											  $rootScope.$apply();
										  });
									  });
							  }
							  $timeout(function() {
								  $scope.$apply();
							  });
						  }
					  );
				  });
			  });
			  
			  $scope.getDisplayField = getDisplayField;
			  
			  $scope.noFieldsProvided = function(){
				  var entries = $scope.vars.selected_profile.entries;
				  for (var i=0; i<entries.length; i++)
					  if (entries[i].provided)
						  return false;
				  return true;
			  };
			  
			  $scope.send = function() {
				  var profile = $scope.vars.selected_profile;
				  if (!profile)
					  throw Error("no selected profile");
				  console.log('selected profile', profile);
				  var objPrivateProfile = {
					  unit: profile.unit,
					  payload_hash: profile.payload_hash,
					  src_profile: {}
				  };
				  profile.entries.forEach(function(entry){
					  var value = [entry.value, entry.blinding];
					  objPrivateProfile.src_profile[entry.field] = entry.provided ? value : objectHash.getBase64Hash(value, profile.version !== constants.versionWithoutTimestamp);
				  });
				  console.log('will send '+JSON.stringify(objPrivateProfile));
				  var privateProfileJsonBase64 = Buffer.from(JSON.stringify(objPrivateProfile)).toString('base64');
				  chatScope.message = '[Private profile](profile:'+privateProfileJsonBase64+')';
				  chatScope.send();
				  $modalInstance.dismiss('cancel');
			  };
  
			  $scope.cancel = function() {
				  $modalInstance.dismiss('cancel');
			  };
		  };
  
		  var modalInstance = $modal.open({
			  templateUrl: 'views/modals/choose-profile.html',
			  windowClass: animationService.modalAnimated.slideUp,
			  controller: ModalInstanceCtrl,
			  scope: $scope
		  });
  
		  var disableCloseModal = $rootScope.$on('closeModal', function() {
			  modalInstance.dismiss('cancel');
		  });
  
		  modalInstance.result.finally(function() {
			  $rootScope.modalOpened = false;
			  disableCloseModal();
			  var m = angular.element(document.getElementsByClassName('reveal-modal'));
			  m.addClass(animationService.modalAnimated.slideOutDown);
		  });
	  };
  
	  $scope.showProsaicContractOffer = function(contractJsonBase64, isIncoming){
		  $rootScope.modalOpened = true;
		  var objContract = correspondentListService.getProsaicContractFromJsonBase64(contractJsonBase64);
		  if (!objContract)
			  throw Error('failed to parse the already validated base64 prosaic contract '+contractJsonBase64);
		  objContract.peer_device_address = correspondent.device_address;
  
		  var showModal = function() {
			  var ModalInstanceCtrl = function($scope, $modalInstance) {
				  var prosaic_contract = require('ocore/prosaic_contract.js');
  
				  $scope.isIncoming = !!isIncoming;
				  $scope.text = objContract.text;
				  $scope.title = objContract.title;
				  $scope.isMobile = isMobile.any();
				  prosaic_contract.getByHash(objContract.hash, function(objContract){
					  if (!objContract)
						  throw Error("no contract found in database for already received offer message");
					  $scope.unit = objContract.unit;
					  $scope.status = objContract.status;
					  $scope.creation_date = objContract.creation_date;
					  $scope.hash = objContract.hash;
					  $scope.calculated_hash = prosaic_contract.getHash(objContract);
					  $scope.calculated_hash_V1 = prosaic_contract.getHashV1(objContract);
					  $scope.my_address = objContract.my_address;
					  $scope.peer_address = objContract.peer_address;
					  if (objContract.unit) {
						  db.query("SELECT payload FROM messages WHERE app='data' AND unit=?", [objContract.unit], function(rows) {
							  if (!rows.length)
								  return;
							  var payload = rows[0].payload;
							  try {
								  $scope.hash_inside_unit = JSON.parse(payload).contract_text_hash;
								  $timeout(function() {
									  $rootScope.$apply();
								  });
							  } catch (e) {}
						  })
					  }
					  var objDateCopy = new Date(objContract.creation_date_obj);
					  $scope.valid_till = objDateCopy.setHours(objDateCopy.getHours() + objContract.ttl);
					  if ($scope.status === "pending" && $scope.valid_till < Date.now())
						  $scope.status = 'expired';
  
					  correspondentListService.populateScopeWithAttestedFields($scope, objContract.my_address, objContract.peer_address, function() {
						  $timeout(function() {
							  $rootScope.$apply();
						  });
					  });
  
					  $timeout(function() {
						  $rootScope.tab = $scope.index.tab = 'chat';
						  $rootScope.$apply();
					  });
				  });
  
				  var setError = function(err) {
					  $scope.error = err;
					  $timeout(function() {
						  $rootScope.$apply();
					  });
				  }
  
				  var respond = function(status, signedMessageBase64) {
					  // read again, as we might already updated contract status by network in background
					  prosaic_contract.getByHash(objContract.hash, function(objContract){
						  if (objContract.status !== "pending")
							  return setError("contract status was changed, reopen it");
						  prosaic_contract.setField(objContract.hash, "status", status);
						  prosaic_contract.respond(objContract, status, signedMessageBase64, require('ocore/wallet.js').getSigner());
						  var body = "contract \""+objContract.title+"\" " + status;
						  correspondentListService.addMessageEvent(false, correspondent.device_address, body);
						  if (correspondent.my_record_pref && correspondent.peer_record_pref) chatStorage.store(correspondent.device_address, body, 0);
						  // share accepted contract to previously saced cosigners
						  if (status == "accepted") {
							  cosigners.forEach(function(cosigner){
								  prosaic_contract.share(objContract.hash, cosigner);
							  });
						  }
						  if (status != "accepted") {
							  $timeout(function() {
								  $modalInstance.dismiss(status);
							  });
						  }
					  });
				  };
				  $scope.accept = function() {
					  // save cosigners here as respond() can be called
					  cosigners = getSigningDeviceAddresses(profileService.focusedClient, true);
					  if (!cosigners.length && profileService.focusedClient.credentials.m > 1) {
						  indexScope.copayers.forEach(function(copayer) {
							  if (!copayer.me)
								  cosigners.push(copayer.device_address);
						  });
					  }
  
					  $modalInstance.dismiss();
  
					  correspondentListService.signMessageFromAddress(objContract.title, objContract.my_address, getSigningDeviceAddresses(profileService.focusedClient), function (err, signedMessageBase64) {
						  if (err)
							  return setError(err);
						  respond('accepted', signedMessageBase64);
					  });
				  };
  
				  $scope.revoke = function() {
					  prosaic_contract.getByHash(objContract.hash, function(objContract){
						  if (objContract.status !== "pending")
							  return setError("contract status was changed, reopen it");
						  device.sendMessageToDevice(objContract.peer_device_address, "prosaic_contract_update", {hash: objContract.hash, field: "status", value: "revoked"});
						  prosaic_contract.setField(objContract.hash, "status", "revoked");
						  var body = "contract \""+objContract.title+"\" revoked";
						  device.sendMessageToDevice(objContract.peer_device_address, "text", body);
						  correspondentListService.addMessageEvent(false, correspondent.device_address, body);
						  if (correspondent.my_record_pref && correspondent.peer_record_pref) chatStorage.store(correspondent.device_address, body, 0);
						  $timeout(function() {
							  $modalInstance.dismiss('revoke');
						  });
					  });
				  };
  
				  $scope.decline = function() {
					  respond('declined');
				  };
  
				  $scope.close = function() {
					  $modalInstance.dismiss('cancel');
				  };
  
				  $scope.openInExplorer = correspondentListService.openInExplorer;
  
				  $scope.expandProofBlock = function() {
					  $scope.proofBlockExpanded = !$scope.proofBlockExpanded;
				  };
  
				  $scope.checkValidity = function() {
					  $timeout(function() {
						  $scope.validity_checked = true;
					  }, 500);
				  }
  
				  $scope.copyToClipboard = function() {
					  var sourcetext = document.getElementById('sourcetext');
					  var text = sourcetext.value;
					  sourcetext.selectionStart = 0;
					  sourcetext.selectionEnd = text.length;
					  notification.success(gettext('Copied to clipboard'));
					  if (isCordova) {
						  cordova.plugins.clipboard.copy(text);
					  } else if (nodeWebkit.isDefined()) {
						  nodeWebkit.writeToClipboard(text);
					  }
				  }
			  };
  
			  var modalInstance = $modal.open({
				  templateUrl: 'views/modals/view-prosaic-contract.html',
				  windowClass: animationService.modalAnimated.slideUp,
				  controller: ModalInstanceCtrl,
				  scope: $scope
			  });
  
			  var disableCloseModal = $rootScope.$on('closeModal', function() {
				  modalInstance.dismiss('cancel');
			  });
  
			  modalInstance.result.finally(function() {
				  $rootScope.modalOpened = false;
				  disableCloseModal();
				  var m = angular.element(document.getElementsByClassName('reveal-modal'));
				  m.addClass(animationService.modalAnimated.slideOutDown);
				  if (oldWalletId) {
					  profileService._setFocus(oldWalletId, function(){});
					  correspondentListService.currentCorrespondent = oldCorrespondent;
					  go.path('correspondentDevices.correspondentDevice');
					  $timeout(function(){
						  $rootScope.tab = $scope.index.tab = 'chat';
					  });
				  }
			  });
		  };
  
		  var oldWalletId;
		  var oldCorrespondent;
		  var cosigners;
		  if (isIncoming) { // switch to the wallet containing the address which the contract is offered to
			  db.query(
				  "SELECT wallet FROM my_addresses \n\
				  LEFT JOIN shared_address_signing_paths ON \n\
						  shared_address_signing_paths.address=my_addresses.address AND shared_address_signing_paths.device_address=? \n\
					  WHERE my_addresses.address=? OR shared_address_signing_paths.shared_address=?",
				  [device.getMyDeviceAddress(), objContract.my_address, objContract.my_address],
				  function(rows) {
					  if (profileService.focusedClient.credentials.walletId === rows[0].wallet)
						  return showModal();
					  oldWalletId = profileService.focusedClient.credentials.walletId;
					  oldCorrespondent = correspondentListService.currentCorrespondent;
					  profileService._setFocus(rows[0].wallet, function(){
						  showModal();
					  });
				  }	
			  );
		  } else {
			  showModal();
		  }
	  };
	  
  
	  function setOngoingProcess(name) {
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
		  }
	  };
  
	  $scope.goToCorrespondentDevices = function() {
		  $deepStateRedirect.reset('correspondentDevices');
		  go.path('correspondentDevices');
	  }
  }).directive('sendPayment', function($compile){
	  console.log("sendPayment directive");
	  return {
		  replace: true,
		  //scope: {address: '@'},
		  //template: '<a ng-click="sendPayment(address)">{{address}}</a>',
		  //template: '<a ng-click="console.log(789)">{{address}} 88</a>',
		  link: function($scope, element, attrs){
			  console.log("link called", attrs, element);
			  //element.attr('ng-click', "console.log(777)");
			  //element.removeAttr('send-payment');
			  //$compile(element)($scope);
			  //$compile(element.contents())($scope);
			  //element.replaceWith($compile('<a ng-click="sendPayment(\''+attrs.address+'\')">'+attrs.address+'</a>')(scope));
			  //element.append($compile('<a ng-click="console.log(123456)">'+attrs.address+' 99</a>')($scope));
			  element.bind('click', function(){
				  console.log('clicked', attrs);
				  $scope.sendPayment(attrs.address);
			  });
		  }
	  };
  }).directive('dynamic', function ($compile) {
	  return {
		  restrict: 'A',
		  replace: true,
		  link: function (scope, ele, attrs) {
			  scope.$watch(attrs.dynamic, function(html) {
				  ele.html(html);
				  $compile(ele.contents())(scope);
			  });
		  }
	  };
  }).directive('scrollBottom', function ($timeout) { // based on http://plnkr.co/edit/H6tFjw1590jHT28Uihcx?p=preview
	  return {
		  link: function (scope, element) {
			  scope.$watchCollection('messageEvents', function (newCollection) {
				  if (newCollection)
					  $timeout(function(){
						  if (scope.autoScrollEnabled)
							  element[0].scrollTop = element[0].scrollHeight;
					  }, 100);
			  });
			  ['keyboardDidShow', 'keyboardDidHide'].forEach(function(event) {
				  window.addEventListener(event, function() {
					  $timeout(function(){
						  if (scope.autoScrollEnabled)
							  element[0].scrollTop = element[0].scrollHeight;
					  }, 1);
				  });
			  });
		  }
	  }
  }).directive('bindToHeight', function ($window) {
	  return {
		  restrict: 'A',
		  link: function (scope, elem, attrs) {
			  var attributes = scope.$eval(attrs['bindToHeight']);
			  var targetElem = angular.element(document.querySelector(attributes[1]));
  
			  // Watch for changes
			  scope.$watch(function () {
				  return targetElem[0].clientHeight;
			  },
			  function (newValue, oldValue) {
				  if (newValue != oldValue && newValue != 0) {
					  elem.css(attributes[0], newValue + 'px');
					  //elem[0].scrollTop = elem[0].scrollHeight;
				  }
			  });
		  }
	  };
  }).directive('ngEnter', function($timeout, isCordova) {
	  return function(scope, element, attrs) {
		  element.bind("keydown", function onNgEnterKeydown(e) {
			  if(!isCordova && e.which === 13 && !e.shiftKey) {
				  $timeout(function(){
					  scope.$apply(function(){
						  scope.$eval(attrs.ngEnter, {'e': e});
					  });
				  });
				  e.preventDefault();
			  }
		  });
	  };
  }).directive('whenScrolled', ['$timeout', function($timeout) {
	  function ScrollPosition(node) {
		  this.node = node;
		  this.previousScrollHeightMinusTop = 0;
		  this.readyFor = 'up';
	  }
  
	  ScrollPosition.prototype.restore = function () {
		  if (this.readyFor === 'up') {
			  this.node.scrollTop = this.node.scrollHeight
				  - this.previousScrollHeightMinusTop;
		  }
	  }
  
	  ScrollPosition.prototype.prepareFor = function (direction) {
		  this.readyFor = direction || 'up';
		  this.previousScrollHeightMinusTop = this.node.scrollHeight
			  - this.node.scrollTop;
	  }
  
	  return function(scope, elm, attr) {
		  var raw = elm[0];
  
		  var chatScrollPosition = new ScrollPosition(raw);
		  
		  $timeout(function() {
			  raw.scrollTop = raw.scrollHeight;
		  });
		  
		  elm.bind('scroll', function() {
			  if (raw.scrollTop + raw.offsetHeight < raw.scrollHeight - 30) 
				  scope.autoScrollEnabled = false;
			  else 
				  scope.autoScrollEnabled = true;
			  if (raw.scrollTop <= 0 && !scope.loadingHistory) { // load more items before you hit the top
				  scope.loadingHistory = true;
				  scope[attr.whenScrolled](function(){
					  chatScrollPosition.prepareFor('up');
					  $timeout(function(){
						  scope.$digest();
						  chatScrollPosition.restore();
						  //$timeout(function(){scope.loadingHistory = false; console.log('SCROLLED')}, 250);
						  scope.loadingHistory = false;
					  });
				  });
			  }
		  });
	  };
  }]);
  
  'use strict';
  
  angular
	  .module('copayApp.controllers')
	  .controller('correspondentDevicesController', function(
		  $scope,
		  $timeout,
		  configService,
		  profileService,
		  go,
		  correspondentListService,
		  $state,
		  $rootScope
	  ) {
		  var wallet = require('ocore/wallet.js');
		  var bots = require('ocore/bots.js');
		  var mutex = require('ocore/mutex.js');
		  var db = require('ocore/db.js');
	  
		  var bFirstLoad = true;
		  
		  var fc = profileService.focusedClient;
  
		  $scope.editCorrespondentList = false;
		  $scope.selectedCorrespondentList = {};
		  $scope.backgroundColor = fc.backgroundColor;
  
		  $scope.state = $state;
	  
		  $scope.self = $scope;
  
		  $scope.hideRemove = true;
  
		  var listScrollTop = 0;
  
		  $scope.$on('$stateChangeStart', function(
			  evt,
			  toState,
			  toParams,
			  fromState
		  ) {
			  if (toState.name === 'correspondentDevices') {
				  $scope.readList();
				  setTimeout(function() {
					  document.querySelector(
						  '[ui-view=chat]'
					  ).scrollTop = listScrollTop;
					  $rootScope.$emit('Local/SetTab', 'chat', true);
				  }, 5);
			  }
		  });
  
		  $scope.showCorrespondent = function(correspondent) {
			  console.log('showCorrespondent', correspondent);
			  correspondentListService.currentCorrespondent = correspondent;
			  listScrollTop = document.querySelector('[ui-view=chat]').scrollTop;
			  go.path('correspondentDevices.correspondentDevice');
		  };
  
		  $scope.showBot = function(bot) {
			  $state.go('correspondentDevices.bot', { id: bot.id });
		  };
  
		  $scope.toggleEditCorrespondentList = function() {
			  $scope.editCorrespondentList = !$scope.editCorrespondentList;
			  $scope.selectedCorrespondentList = {};
		  };
  
		  $scope.toggleSelectCorrespondentList = function(addr) {
			  $scope.selectedCorrespondentList[addr] = $scope
				  .selectedCorrespondentList[addr]
				  ? false
				  : true;
		  };
  
		  $scope.sortByDate = function(correspondent) {
			  if ($scope.newMessagesCount[correspondent.device_address])
				  return 'z'+$scope.newMessagesCount[correspondent.device_address];
			  return correspondent.last_message_date;
		  }
  
		  $scope.newMsgByAddressComparator = function(correspondent) {
			  return (
				  -$scope.newMessagesCount[correspondent.device_address] ||
				  correspondent.name.toLowerCase()
			  );
		  };
  
		  $scope.beginAddCorrespondent = function() {
			  console.log('beginAddCorrespondent');
			  listScrollTop = document.querySelector('[ui-view=chat]').scrollTop;
			  go.path('correspondentDevices.addCorrespondentDevice');
		  };
  
		  $scope.changeOrder = function(section, order) {
			  $scope[section + 'SortOrderLabel'] = order.label;
			  $scope[section + 'SortOrder'] = order.type;
			  $scope[section + 'SortReverse'] = order.sortReverse;
		  };
  
		  $scope.readList = function() {
			  $scope.error = null;
			  correspondentListService.list(function(err, ab) {
				  if (err) {
					  $scope.error = err;
					  return;
				  }
				  $scope.list = ab;
  
				  wallet.readNonRemovableDevices(function(
					  arrNotRemovableDeviceAddresses
				  ) {
					  // add a new property indicating whether the device can be removed or not
  
					  var length = ab.length;
					  for (var i = 0; i < length; i++) {
						  var corrDev = ab[i];
  
						  var corrDevAddr = corrDev.device_address;
  
						  var ix = arrNotRemovableDeviceAddresses.indexOf(
							  corrDevAddr
						  );
  
						  // device is removable when not in list
						  corrDev.removable = ix == -1;
					  }
				  });
  
				  bots.load(function(err, rows) {
					  if (err) $scope.botsError = err.toString();
					  if (rows){ // skip if network error
						  rows.forEach(function(row){
							  row.name_and_desc = row.name + ' ' + row.description;
						  });
					  }
					  $scope.bots = rows;
					  $timeout(function() {
						  $scope.$digest();
					  });
				  });
				  
				  db.query("SELECT correspondent_address, MAX(creation_date) AS last_message_date FROM chat_messages WHERE type='text' GROUP BY correspondent_address", function(rows) {
					  var assocLastMessageDateByCorrespondent = correspondentListService.assocLastMessageDateByCorrespondent;
  
					  rows.forEach(function(row) {
						  if (!assocLastMessageDateByCorrespondent[row.correspondent_address] || row.last_message_date > assocLastMessageDateByCorrespondent[row.correspondent_address])
							  assocLastMessageDateByCorrespondent[row.correspondent_address] = row.last_message_date;
					  });
  
					  ab = ab.forEach(function(correspondent) {
						  correspondent.last_message_date = assocLastMessageDateByCorrespondent[correspondent.device_address] || '2016-12-25 00:00:00';
					  });
					  
					  if (bFirstLoad){
						  $scope.changeOrder('contacts', $scope.contactsSortOrderList[1]); // sort by recent
						  bFirstLoad = false;
					  }
  
					  $timeout(function() {
						  $scope.$digest();
					  });
				  });
			  });
		  };
  
		  $scope.hideRemoveButton = function(removable) {
			  return $scope.hideRemove || !removable;
		  };
  
		  $scope.remove = function(device_address) {
			  mutex.lock(['remove_device'], function(unlock) {
				  // check to be safe
				  wallet.determineIfDeviceCanBeRemoved(device_address, function(
					  bRemovable
				  ) {
					  if (!bRemovable) {
						  unlock();
						  return console.log(
							  'device ' + device_address + ' is not removable'
						  );
					  }
					  var device = require('ocore/device.js');
  
					  // send message to paired device
					  // this must be done before removing the device
					  device.sendMessageToDevice(
						  device_address,
						  'removed_paired_device',
						  'removed'
					  );
  
					  // remove device
					  device.removeCorrespondentDevice(
						  device_address,
						  function() {
							  unlock();
							  $scope.hideRemove = true;
							  correspondentListService.currentCorrespondent = null;
							  $scope.readList();
							  $rootScope.$emit('Local/SetTab', 'chat', true);
							  setTimeout(function() {
								  document.querySelector(
									  '[ui-view=chat]'
								  ).scrollTop = listScrollTop;
							  }, 5);
						  }
					  );
				  });
			  });
		  };
  
		  $scope.cancel = function() {
			  console.log('cancel clicked');
			  go.walletHome();
		  };
	  
	  
		  // Contacts order
		  $scope.contactsSearchText = '';
		  $scope.contactsSortOrder = $scope.newMsgByAddressComparator;
		  $scope.contactsSortOrderLabel = 'alphabetic';
		  $scope.contactsSortOrderList = [{
			  label: 'alphabetic',
			  type: $scope.newMsgByAddressComparator,
		  }, {
			  label: 'recent',
			  type: $scope.sortByDate,
			  sortReverse: true
		  }];
  
		  // Bots order
		  $scope.botsSearchText = '';
		  $scope.botsSortOrder = undefined;
		  $scope.botsSortOrderLabel = 'suggested';
		  $scope.botsSortOrderList = [{
			  label: 'suggested',
			  type: undefined,
		  }, {
			  label: 'alphabetic',
			  type: 'name',
		  }];
  
	  });
  
  'use strict';
  
  angular.module('copayApp.controllers').controller('createController',
	function($scope, $rootScope, $location, $timeout, $log, lodash, go, profileService, configService, isCordova, gettext, isMobile, derivationPathHelper, correspondentListService) {
  
	  var self = this;
	  var defaults = configService.getDefaults();
	  this.isWindowsPhoneApp = isMobile.Windows() && isCordova;
	  $scope.account = 1;
  
	  var defaults = configService.getDefaults();
	  $scope.derivationPath = derivationPathHelper.default;
  
	  // ng-repeat defined number of times instead of repeating over array?
	  this.getNumber = function(num) {
		  return new Array(num);
	  }
  
	  var updateRCSelect = function(n) {
		  $scope.totalCosigners = n;
		  self.RCValues = lodash.range(1, n + 1);
		  if ($scope.requiredCosigners > n || !$scope.requiredCosigners)
			  $scope.requiredCosigners = parseInt(n / 2 + 1);
	  };
  
	  var updateSeedSourceSelect = function(n) {
		  self.seedOptions = [{
			  id: 'new',
			  label: gettext('New Random Seed')
		  }, {
			  id: 'set',
			  label: gettext('Specify Seed...')
		  }];
		  $scope.seedSource = self.seedOptions[0];
	  };
  
	  this.TCValues = lodash.range(2, defaults.limits.totalCosigners + 1);
	  $scope.totalCosigners = defaults.wallet.totalCosigners;
	  this.cosigners = [];//Array($scope.totalCosigners);
	  for (var i=0; i<$scope.totalCosigners-1; i++)
		  this.cosigners.push({});
	  correspondentListService.list(function(err, ab){
		  self.candidate_cosigners = ab;
		  $timeout(function(){
			  $scope.$digest();
		  });
	  });
	  
	  /*
	  $scope.$watch(function(){return $scope.totalCosigners;}, function(newVal, oldVal){
		  console.log("watch "+oldVal+" "+newVal);
		  if (newVal > oldVal)
			  for (var i=oldVal; i<newVal-1; i++)
				  self.cosigners.push({});
		  else
			  self.cosigners.length = newVal-1;
	  }, true);*/
  
	  this.setTotalCosigners = function(tc) {
		  var oldLen = self.cosigners.length;
		  var newLen = tc-1;
		  if (newLen > oldLen)
			  for (var i=oldLen; i<newLen; i++)
				  self.cosigners.push({});
		  else if (newLen < oldLen)
			  self.cosigners.length = newLen;
		  
		  updateRCSelect(tc);
		  updateSeedSourceSelect(tc);
		  self.seedSourceId = $scope.seedSource.id;
	  };
	  
	  this.setMultisig = function(){
		  this.setTotalCosigners(3);
		  $scope.requiredCosigners = 2;
	  };
	  
	  this.onCorrespondentSelected = function(device_address){
		  console.log(device_address);
		  if (device_address === "new")
			  go.path('correspondentDevices.addCorrespondentDevice');
	  };
  
  
	  this.setSeedSource = function(src) {
		  self.seedSourceId = $scope.seedSource.id;
  
		  $timeout(function() {
			  $rootScope.$apply();
		  });
	  };
  
	  function setError(error){
		  self.error = gettext(error);
	  }
	  
	  this.create = function(form) {
		  if (form && form.$invalid) {
			  this.error = gettext('Please enter the required fields');
			  return;
		  }
		  if (self.cosigners.length !== $scope.totalCosigners - 1)
			  return setError("invalid number of cosigners");
  
		  var opts = {
			  m: $scope.requiredCosigners,
			  n: $scope.totalCosigners,
			  name: form.walletName.$modelValue,
			  networkName: 'livenet',
			  cosigners: [],
			  isSingleAddress: $scope.isSingleAddress
		  };
		  if ($scope.totalCosigners > 1){
			  opts.cosigners = lodash.uniq(self.cosigners.map(function(cosigner){ return cosigner.device_address; }));
			  if (opts.cosigners.length !== $scope.totalCosigners - 1)
				  return setError("Please select different co-signers");
			  for (var i=0; i<opts.cosigners.length; i++)
				  if (!opts.cosigners[i] || opts.cosigners[i].length !== 33)
					  return setError("Please fill all co-signers");
		  }
		  /*
		  var setSeed = self.seedSourceId == 'set';
		  if (setSeed) {
  
			  var words = form.privateKey.$modelValue || '';
			  if (words.indexOf(' ') == -1 && words.indexOf('prv') == 1 && words.length > 108)
				  opts.extendedPrivateKey = words;
			  else
				  opts.mnemonic = words;
  
			  opts.passphrase = form.passphrase.$modelValue;
  
			  var pathData = derivationPathHelper.parse($scope.derivationPath);
			  if (!pathData) {
				  this.error = gettext('Invalid derivation path');
				  return;
			  }
  
			  opts.account = pathData.account;
			  opts.networkName = pathData.networkName;
			  opts.derivationStrategy = pathData.derivationStrategy;
  
		  }
		  else
			  opts.passphrase = form.createPassphrase.$modelValue;
  
		  if (setSeed && !opts.mnemonic && !opts.extendedPrivateKey) {
			  this.error = gettext('Please enter the wallet seed');
			  return;
		  }
		  */
		
		  self._create(opts);
	  };
	  
  
	  this._create = function(opts) {
		  self.loading = true;
		  $timeout(function() {
			  profileService.createWallet(opts, function(err, walletId) {
				  self.loading = false;
				  if (err) {
					  $log.warn(err);
					  self.error = err;
					  $timeout(function() {
						  $rootScope.$apply();
					  });
					  return;
				  }
  
				  //if (opts.mnemonic || opts.externalSource || opts.extendedPrivateKey) {
				  if (opts.externalSource) {
					  if (opts.n == 1) {
						  $rootScope.$emit('Local/WalletImported', walletId);
					  }
				  }
				  /*if (opts.n > 1)
					  $rootScope.$emit('Local/ShowAlert', "Please approve wallet creation on other devices", 'fi-key', function(){
						  go.walletHome();
					  });*/
  
				  if (opts.isSingleAddress) {
					  profileService.setSingleAddressFlag(true);
				  }
			  });
		  }, 100);
	  }
  
	  this.formFocus = function(what) {
		  if (!this.isWindowsPhoneApp) 
			  return;
  
		  if (what && what == 'my-name') {
			  this.hideWalletName = true;
			  this.hideTabs = true;
		  } else if (what && what == 'wallet-name') {
			  this.hideTabs = true;
		  } else {
			  this.hideWalletName = false;
			  this.hideTabs = false;
		  }
		  $timeout(function() {
			  $rootScope.$digest();
		  }, 1);
	  };
  
	  $scope.$on("$destroy", function() {
		  $rootScope.hideWalletNavigation = false;
	  });
  
	  updateSeedSourceSelect(1);
	  self.setSeedSource('new');
	});
  
  'use strict';
  
  angular.module('copayApp.controllers').controller('disclaimerController',
	function($scope, $timeout, storageService, applicationService, gettextCatalog, isCordova, uxLanguage, go, $rootScope) {
  
	  if (!isCordova && process.platform === 'win32' && navigator.userAgent.indexOf('Windows NT 5.1') >= 0)
		  $rootScope.$emit('Local/ShowAlert', "Windows XP is not supported", 'fi-alert', function() {
			  process.exit();
		  });
	  
	  $scope.agree = function() {
		if (isCordova) {
		  window.plugins.spinnerDialog.show(null, gettextCatalog.getString('Loading...'), true);
		}
		$scope.loading = true;
		$timeout(function() {
		  storageService.setDisclaimerFlag(function(err) {
			  $timeout(function() {
				  if (isCordova)
					  window.plugins.spinnerDialog.hide();
				  // why reload the page?
				  //applicationService.restart();
				  go.walletHome();
			  }, 1000);
		  });
		}, 100);
	  };
	  
	  $scope.init = function() {
		storageService.getDisclaimerFlag(function(err, val) {
		  $scope.lang = uxLanguage.currentLanguage;
		  $scope.agreed = val;
		  $timeout(function() {
			$scope.$digest();
		  }, 1);
		});
	  };
	});
  
  'use strict';
  
  angular.module('copayApp.controllers').controller('editCorrespondentDeviceController',
	function($scope, $rootScope, $timeout, configService, profileService, isCordova, go, correspondentListService, $modal, animationService, nodeWebkit, gettext, notification) {
	  
	  var self = this;
	  
	  var fc = profileService.focusedClient;
	  $scope.backgroundColor = fc.backgroundColor;
	  var correspondent = correspondentListService.currentCorrespondent;
	  $scope.correspondent = correspondent;
	  $scope.name = correspondent.name;
	  $scope.hub = correspondent.hub;
  
	  var indexScope = $scope.index;
	  var db = require('ocore/db.js');
	  
	  function readAndSetPushNotificationsSetting(delay){
		  db.query("SELECT push_enabled FROM correspondent_devices WHERE device_address=?", [correspondent.device_address], function(rows){
			  if (rows.length === 0)
				  return console.log("correspondent "+correspondent.device_address+" not found, probably already removed");
			  $scope.pushNotifications = !!rows[0].push_enabled;
			  
			  $timeout(function(){
				  $scope.$digest();
			  }, delay || 0);
		  });
	  }
	  
	  $scope.updatePush = function(){
		  console.log("push "+$scope.pushNotifications);
		  var push_enabled = $scope.pushNotifications ? 1 : 0;
		  var device = require('ocore/device.js');
		  device.updateCorrespondentSettings(correspondent.device_address, {push_enabled: push_enabled}, function(err){
			  setError(err);
			  if (err)
				  return readAndSetPushNotificationsSetting(100);
			  db.query("UPDATE correspondent_devices SET push_enabled=? WHERE device_address=?", [push_enabled, correspondent.device_address]);
		  });
	  }
	  
	  if (indexScope.usePushNotifications)
		  readAndSetPushNotificationsSetting();
	  
	  var prosaic_contract = require('ocore/prosaic_contract.js');
	  var db = require('ocore/db.js');
	  prosaic_contract.getAllByStatus("accepted", function(contracts){
		  $scope.contracts = [];
		  contracts.forEach(function(contract){
			  if (contract.peer_device_address === correspondent.device_address)
				  $scope.contracts.push(contract);
		  });
		  $timeout(function(){
			  $rootScope.$digest();
		  });
	  });
  
	  $scope.showContract = function(hash){
		  $rootScope.modalOpened = true;
		  prosaic_contract.getByHash(hash, function(objContract){
			  if (!objContract)
				  throw Error("no contract found in database for hash " + hash);
			  var ModalInstanceCtrl = function($scope, $modalInstance) {
				  $scope.index = indexScope;
				  $scope.unit = objContract.unit;
				  $scope.status = objContract.status;
				  $scope.title = objContract.title;
				  $scope.text = objContract.text;
				  $scope.creation_date = objContract.creation_date
				  $scope.hash = objContract.hash;
				  $scope.calculated_hash = prosaic_contract.getHash(objContract);
				  $scope.calculated_hash_V1 = prosaic_contract.getHashV1(objContract);
				  $scope.my_address = objContract.my_address;
				  $scope.peer_address = objContract.peer_address;
				  if (objContract.unit) {
					  db.query("SELECT payload FROM messages WHERE app='data' AND unit=?", [objContract.unit], function(rows) {
						  if (!rows.length)
							  return;
						  var payload = rows[0].payload;
						  try {
							  $scope.hash_inside_unit = JSON.parse(payload).contract_text_hash;
							  $timeout(function() {
								  $rootScope.$apply();
							  });
						  } catch (e) {}
					  })
				  };
  
				  correspondentListService.populateScopeWithAttestedFields($scope, objContract.my_address, objContract.peer_address, function() {
					  $timeout(function() {
						  $rootScope.$apply();
					  });
				  });
  
				  $timeout(function() {
					  $rootScope.$apply();
				  });
  
				  $scope.close = function() {
					  $modalInstance.dismiss('cancel');
				  };
  
				  $scope.expandProofBlock = function() {
					  $scope.proofBlockExpanded = !$scope.proofBlockExpanded;
				  };
  
				  $scope.openInExplorer = correspondentListService.openInExplorer;
  
				  $scope.checkValidity = function() {
					  $timeout(function() {
						  $scope.validity_checked = true;
					  }, 500);
				  }
  
				  $scope.copyToClipboard = function() {
					  var sourcetext = document.getElementById('sourcetext');
					  var text = sourcetext.value;
					  sourcetext.selectionStart = 0;
					  sourcetext.selectionEnd = text.length;
					  notification.success(gettext('Copied to clipboard'));
					  if (isCordova) {
						  cordova.plugins.clipboard.copy(text);
					  } else if (nodeWebkit.isDefined()) {
						  nodeWebkit.writeToClipboard(text);
					  }
				  }
			  };
  
			  var modalInstance = $modal.open({
				  templateUrl: 'views/modals/view-prosaic-contract.html',
				  windowClass: animationService.modalAnimated.slideUp,
				  controller: ModalInstanceCtrl,
				  scope: $scope
			  });
  
			  var disableCloseModal = $rootScope.$on('closeModal', function() {
				  modalInstance.dismiss('cancel');
			  });
  
			  modalInstance.result.finally(function() {
				  $rootScope.modalOpened = false;
				  disableCloseModal();
				  var m = angular.element(document.getElementsByClassName('reveal-modal'));
				  m.addClass(animationService.modalAnimated.slideOutDown);
			  });
		  });
	  };
  
	  $scope.save = function() {
		  $scope.error = null;
		  correspondent.name = $scope.name;
		  correspondent.hub = $scope.hub;
		  var device = require('ocore/device.js');
		  device.updateCorrespondentProps(correspondent, function(){
			  go.path('correspondentDevices.correspondentDevice');
		  });
	  };
  
	  $scope.purge_chat = function() {
		var ModalInstanceCtrl = function($scope, $modalInstance, $sce, gettext) {
		  $scope.title = $sce.trustAsHtml('Delete the whole chat history with ' + correspondent.name + '?');
  
		  $scope.ok = function() {
			$modalInstance.close(true);
			go.path('correspondentDevices.correspondentDevice');
  
		  };
		  $scope.cancel = function() {
			$modalInstance.dismiss('cancel');
			go.path('correspondentDevices.correspondentDevice.editCorrespondentDevice');
		  };
		};
  
		var modalInstance = $modal.open({
		  templateUrl: 'views/modals/confirmation.html',
		  windowClass: animationService.modalAnimated.slideUp,
		  controller: ModalInstanceCtrl
		});
  
		modalInstance.result.finally(function() {
		  var m = angular.element(document.getElementsByClassName('reveal-modal'));
		  m.addClass(animationService.modalAnimated.slideOutDown);
		});
  
		modalInstance.result.then(function(ok) {
		  if (ok) {
				var chatStorage = require('ocore/chat_storage.js');
			  chatStorage.purge(correspondent.device_address);
			  correspondentListService.messageEventsByCorrespondent[correspondent.device_address] = [];
		  }
		  
		});
	  }
  
	  function setError(error){
		  $scope.error = error;
	  }
  
	  
  });
  
  'use strict';
  
  angular.module('copayApp.controllers').controller('exportController',
	  function($rootScope, $scope, $timeout, $log, $filter, backupService, storageService, fileSystemService, isCordova, isMobile, gettextCatalog, notification) {
  
		  var async = require('async');
		  var crypto = require('crypto');
		  var conf = require('ocore/conf');
		  var zip;
		  if (isCordova) {
			  var JSZip = require("jszip");
			  zip = new JSZip();
		  } else {
			  var _zip = require('zip' + '');
			  zip = null;
		  }
  
		  var self = this;
		  self.error = null;
		  self.success = null;
		  self.password = null;
		  self.repeatpassword = null;
		  self.exporting = false;
		  self.isCordova = isCordova;
		  self.bCompression = false;
		  self.connection = null;
		  $scope.downloadsDir = (process.env.HOME || process.env.USERPROFILE || '~') + require('path').sep +'Downloads';
  
		  function addDBAndConfToZip(cb) {
			  var dbDirPath = fileSystemService.getDatabaseDirPath() + '/';
			  fileSystemService.readdir(dbDirPath, function(err, listFilenames) {
				  if (err) return cb(err);
				  listFilenames = listFilenames.filter(function(name) {
					  return (name == 'conf.json' || /\.sqlite/.test(name));
				  });
				  if(isCordova) {
					  async.forEachSeries(listFilenames, function(name, callback) {
						  fileSystemService.readFile(dbDirPath + '/' + name, function(err, data) {
							  if (err) return callback(err);
							  zip.file(name, data);
							  callback();
						  });
					  }, cb);
				  }else{
					  async.forEachSeries(listFilenames, function(name, callback) {
						  fileSystemService.getPath(dbDirPath + '/' + name, function(err, path) {
							  if (err) return callback(err);
							  zip.file(name, path);
							  callback();
						  });
					  }, cb);
				  }
			  });
		  }
  
		  function checkValueFileAndChangeStatusExported() {
			  $timeout(function() {
				  var inputFile = document.getElementById('nwExportInputFile');
				  var value = inputFile ? inputFile.value : null;
				  if(!value && self.exporting){
					  self.exporting = false;
					  $timeout(function() {
						  $rootScope.$apply();
					  });
				  }
				  if(!value && self.connection){
					  self.connection.release();
					  self.connection = false;
				  }
				  window.removeEventListener('focus', checkValueFileAndChangeStatusExported, true);
			  }, 1000);
		  }
  
  
		  function saveFile(file, cb) {
			  var backupFilename = 'ObyteBackup-' + $filter('date')(Date.now(), 'yyyy-MM-dd-HH-mm-ss') + '.encrypted';
			  if (!isCordova) {
				  var inputFile = document.getElementById('nwExportInputFile');
				  inputFile.setAttribute("nwsaveas", backupFilename);
				  inputFile.click();
				  window.addEventListener('focus', checkValueFileAndChangeStatusExported, true);
				  inputFile.onchange = function() {
					  cb(this.value);
				  };
			  }
			  else {
				  fileSystemService.cordovaWriteFile((isMobile.iOS() ? window.cordova.file.cacheDirectory : window.cordova.file.externalRootDirectory), 'Obyte', backupFilename, file, function(err) {
					  var text = isMobile.iOS() ? gettextCatalog.getString('Now you have to send this file somewhere to restore from it later ("Save to Files", send to yourself using chat apps, etc.)') : gettextCatalog.getString('File saved to /Obyte/'+backupFilename+'. You can now also send it somewhere using chat apps or email to have more copies of the backup');
					  navigator.notification.alert(text, function(){
						  window.plugins.socialsharing.shareWithOptions({files: [(isMobile.iOS() ? window.cordova.file.cacheDirectory : window.cordova.file.externalRootDirectory) + 'Obyte/'+ backupFilename]}, function(){}, function(){});
					  }, 'Backup done');
					  cb(err);
				  });
			  }
		  }
  
		  function encrypt(buffer, password) {
			  password = Buffer.from(password);
			  var cipher = crypto.createCipheriv('aes-256-ctr', crypto.pbkdf2Sync(password, '', 100000, 32, 'sha512'), crypto.createHash('sha1').update(password).digest().slice(0, 16));
			  var arrChunks = [];
			  var CHUNK_LENGTH = 2003;
			  for (var offset = 0; offset < buffer.length; offset += CHUNK_LENGTH) {
				  arrChunks.push(cipher.update(buffer.slice(offset, Math.min(offset + CHUNK_LENGTH, buffer.length)), 'utf8'));
			  }
			  arrChunks.push(cipher.final());
			  return Buffer.concat(arrChunks);
		  }
  
		  function showError(text) {
			  self.exporting = false;
			  self.error = text;
			  $timeout(function() {
				  $rootScope.$apply();
			  });
			  return false;
		  }
  
		  self.walletExportPC = function(connection) {
			  self.connection = connection;
			  saveFile(null, function(path) {
				  if(!path) return;
				  var password = Buffer.from(self.password);
				  var cipher = crypto.createCipheriv('aes-256-ctr', crypto.pbkdf2Sync(password, '', 100000, 32, 'sha512'), crypto.createHash('sha1').update(password).digest().slice(0, 16));
				  zip = new _zip(path, {
					  compressed: self.bCompression ? 6 : 0,
					  cipher: cipher
				  });
				  storageService.getProfile(function(err, profile) {
					  storageService.getConfig(function(err, config) {
						  zip.text('profile', JSON.stringify(profile));
						  zip.text('config', config);
						  if (conf.bLight) zip.text('light', 'true');
						  addDBAndConfToZip(function(err) {
							  if (err) return showError(err);
							  zip.end(function() {
								  connection.release();
								  self.connection = null;
								  self.exporting = false;
								  $timeout(function() {
									  $rootScope.$apply();
									  notification.success(gettextCatalog.getString('Success'), gettextCatalog.getString('Export completed successfully', {}));
								  });
							  });
						  });
					  })
				  })
			  })
		  };
  
		  self.walletExportCordova = function(connection) {
			  storageService.getProfile(function(err, profile) {
				  storageService.getConfig(function(err, config) {
					  zip.file('profile', JSON.stringify(profile));
					  zip.file('config', config);
					  zip.file('light', 'true');
					  addDBAndConfToZip(function(err) {
						  if (err) return showError(err);
						  var zipParams = {type: "nodebuffer", compression: 'DEFLATE', compressionOptions: {level: 9}};
						  zip.generateAsync(zipParams).then(function(zipFile) {
							  saveFile(encrypt(zipFile, self.password), function(err) {
								  connection.release();
								  if (err) return showError(err);
								  self.exporting = false;
								  $timeout(function() {
									  $rootScope.$apply();
									  notification.success(gettextCatalog.getString('Success'), gettextCatalog.getString('Export completed successfully', {}));
								  });
							  })
						  }, function(err) {
							  showError(err);
						  })
					  });
				  });
			  });
		  };
  
		  self.walletExport = function() {
			  self.exporting = true;
			  self.error = '';
			  var db = require('ocore/db');
			  db.takeConnectionFromPool(function(connection) {
				  if (isCordova) {
					  self.walletExportCordova(connection);
				  } else {
					  self.walletExportPC(connection);
				  }
			  });
		  }
	  });
  'use strict';
  
  angular.module('copayApp.controllers').controller('importController',
	  function($scope, $rootScope, $location, $timeout, $log, storageService, fileSystemService, isCordova, isMobile) {
		  
		  var JSZip = require("jszip");
		  var async = require('async');
		  var crypto = require('crypto');
		  var conf = require('ocore/conf');
		  var userAgent = navigator.userAgent;
		  
		  if(isCordova) {
			  var zip = new JSZip();
		  }else{
			  var unzip = require('unzip' + '');
		  }
		  
		  var self = this;
		  self.importing = false;
		  self.password = '';
		  self.error = '';
		  self.iOs = isMobile.iOS();
		  self.android = isMobile.Android() && window.cordova;
		  self.arrBackupFiles = [];
		  self.androidVersion = isMobile.Android() ? parseFloat(userAgent.slice(userAgent.indexOf("Android")+8)) : null;
		  self.oldAndroidFilePath = null;
		  self.oldAndroidFileName = '';
		  
		  function generateListFilesForIos() {
			  var backupDirPath = window.cordova.file.documentsDirectory + '/Obyte/';
			  fileSystemService.readdir(backupDirPath, function(err, listFilenames) {
				  if (listFilenames){
					  listFilenames.forEach(function(name) {
						  var dateNow = parseInt(name.split(' ')[1]);
						  self.arrBackupFiles.push({
							  name: name.replace(dateNow, new Date(dateNow).toLocaleString()),
							  originalName: name,
							  time: dateNow
						  })
					  });
				  }
				  $timeout(function() {
					  $rootScope.$apply();
				  });
			  });
		  }
		  
		  if (self.iOs) generateListFilesForIos();
		  
		  function writeDBAndFileStorageMobile(zip, cb) {
			  var db = require('ocore/db');
			  var dbDirPath = fileSystemService.getDatabaseDirPath() + '/';
			  db.close(function() {
				  async.forEachOfSeries(zip.files, function(objFile, key, callback) {
					  if (key == 'profile') {
						  zip.file(key).async('string').then(function(data) {
							  storageService.storeProfile(Profile.fromString(data), callback);
							  storageService.storeProfile = function(){};
						  });
					  }
					  else if (key == 'config') {
						  zip.file(key).async('string').then(function(data) {
							  storageService.storeConfig(data, callback);
							  storageService.storeConfig = function(){};
						  });
					  }
					  else if (/\.sqlite/.test(key)) {
						  zip.file(key).async('nodebuffer').then(function(data) {
							  fileSystemService.cordovaWriteFile(dbDirPath, null, key, data, callback);
						  });
					  }
					  else {
						  callback();
					  }
				  }, function(err) {
					  if (err) return cb(err);
					  return cb();
				  });
			  });
		  }
		  
		  function writeDBAndFileStoragePC(cb) {
			  var db = require('ocore/db');
			  var dbDirPath = fileSystemService.getDatabaseDirPath() + '/';
			  db.close(function() {
				  async.series([
					  function(callback) {
						  fileSystemService.readFile(dbDirPath + 'temp/' + 'profile', function(err, data) {
							  if(err) return callback(err);
							  storageService.storeProfile(Profile.fromString(data.toString()), callback)
							  storageService.storeProfile = function(){};
						  });
					  },
					  function(callback) {
						  fileSystemService.readFile(dbDirPath + 'temp/' + 'config', function(err, data) {
							  if(err) return callback(err);
							  storageService.storeConfig(data.toString(), callback);
							  storageService.storeConfig = function(){};
						  });
					  },
					  function(callback) {
						  fileSystemService.readdir(dbDirPath + 'temp/', function(err, fileNames) {
							  fileNames = fileNames.filter(function(name){ return /\.sqlite/.test(name); });
							  async.forEach(fileNames, function(name, callback2) {
								  fileSystemService.nwMoveFile(dbDirPath + 'temp/' + name, dbDirPath + name, callback2);
							  }, function(err) {
								  if(err) return callback(err);
								  callback();
							  })
						  });
					  },
					  function(callback) {
						  var existsConfJson = fileSystemService.nwExistsSync(dbDirPath + 'temp/conf.json');
						  var existsLight = fileSystemService.nwExistsSync(dbDirPath + 'temp/light');
						  if(existsConfJson){
							  fileSystemService.nwMoveFile(dbDirPath + 'temp/conf.json', dbDirPath + 'conf.json', callback);
						  }else if(existsLight && !existsConfJson){
							  fileSystemService.nwWriteFile(dbDirPath + 'conf.json', JSON.stringify({bLight: true}, null, '\t'), callback);
						  }else if(!existsLight && conf.bLight){
							  var _conf = require(dbDirPath + 'conf.json');
							  _conf.bLight = false;
							  fileSystemService.nwWriteFile(dbDirPath + 'conf.json', JSON.stringify(_conf, null, '\t'), callback);
						  }else{
							  callback();
						  }
					  },
					  function(callback) {
						  fileSystemService.readdir(dbDirPath + 'temp/', function(err, fileNames) {
							  async.forEach(fileNames, function(name, callback2) {
								  fileSystemService.nwUnlink(dbDirPath + 'temp/' + name, callback2);
							  }, function(err) {
								  if(err) return callback(err);
								  fileSystemService.nwRmDir(dbDirPath + 'temp/', function() {
									  callback();
								  });
							  })
						  });
					  }
				  ], function(err) {
					  cb(err);
				  })
			  });
		  }
		  
		  function decrypt(buffer, password) {
			  password = Buffer.from(password);
			  var decipher = crypto.createDecipheriv('aes-256-ctr', crypto.pbkdf2Sync(password, '', 100000, 32, 'sha512'), crypto.createHash('sha1').update(password).digest().slice(0, 16));
			  var arrChunks = [];
			  var CHUNK_LENGTH = 2003;
			  for (var offset = 0; offset < buffer.length; offset += CHUNK_LENGTH) {
				  arrChunks.push(decipher.update(buffer.slice(offset, Math.min(offset + CHUNK_LENGTH, buffer.length)), 'utf8'));
			  }
			  arrChunks.push(decipher.final());
			  return Buffer.concat(arrChunks);
		  }
		  
		  function showError(text) {
			  self.importing = false;
			  self.error = text;
			  $timeout(function() {
				  $rootScope.$apply();
			  });
			  return false;
		  }
		  
		  function unzipAndWriteFiles(data, password) {
			  if(isCordova) {
				  zip.loadAsync(decrypt(data, password)).then(function(zip) {
					  if (!zip.file('light')) {
						  self.importing = false;
						  self.error = 'Mobile version supports only light wallets.';
						  $timeout(function() {
							  $rootScope.$apply();
						  });
					  }
					  else {
						  writeDBAndFileStorageMobile(zip, function(err) {
							  if (err) return showError(err);
							  self.importing = false;
							  $rootScope.$emit('Local/ShowAlert', "Import successfully completed, please restart the application.", 'fi-check', function() {
								  if (navigator && navigator.app)
									  navigator.app.exitApp();
								  else if (process.exit)
									  process.exit();
							  });
						  });
					  }
				  }, function(err) {
					  showError('Incorrect password or file');
				  })
			  }else {
				  password = Buffer.from(password);
				  var decipher = crypto.createDecipheriv('aes-256-ctr', crypto.pbkdf2Sync(password, '', 100000, 32, 'sha512'), crypto.createHash('sha1').update(password).digest().slice(0, 16));
				  data.pipe(decipher).pipe(unzip.Extract({ path: fileSystemService.getDatabaseDirPath() + '/temp/' })).on('error', function(err) {
					  if(err.message === "Invalid signature in zip file"){
						  showError('Incorrect password or file');
					  }else{
						  showError(err);
					  }
				  }).on('finish', function() {
					  setTimeout(function() {
						  writeDBAndFileStoragePC(function(err) {
							  if (err) return showError(err);
							  self.importing = false;
							  $rootScope.$emit('Local/ShowAlert', "Import successfully completed, please restart the application.", 'fi-check', function() {
								  if (navigator && navigator.app)
									  navigator.app.exitApp();
								  else if (process.exit)
									  process.exit();
							  });
						  });
					  }, 100);
				  });
			  }
		  }
		  
		  self.oldAndroidInputFileClick = function() {
			  if(isMobile.Android() && self.androidVersion < 5) {
				  window.plugins.mfilechooser.open([], function(uri) {
					  self.oldAndroidFilePath = 'file://' + uri;
					  self.oldAndroidFileName = uri.split('/').pop();
					  $timeout(function() {
						  $rootScope.$apply();
					  });
				  }, function(error) {
					  alert(error);
				  });
			  }
		  };
		  
		  self.walletImport = function() {
			  self.error = '';
			  if(isMobile.Android() && self.androidVersion < 5){
				  if (!self.oldAndroidFilePath)
					  return;
				  self.importing = true;
				  fileSystemService.readFile(self.oldAndroidFilePath, function(err, data) {
					  unzipAndWriteFiles(data, self.password);
				  })
			  }
			  else if ($scope.file){
				  self.importing = true;
				  fileSystemService.readFileFromForm($scope.file, function(err, data) {
					  if (err) return showError(err);
					  unzipAndWriteFiles(data, self.password);
				  });
			  }
		  };
		  
		  self.iosWalletImportFromFile = function(fileName) {
			  $rootScope.$emit('Local/NeedsPassword', false, null, function(err, password) {
				  if (password) {
					  var backupDirPath = window.cordova.file.documentsDirectory + '/Obyte/';
					  fileSystemService.readFile(backupDirPath + fileName, function(err, data) {
						  if (err) return showError(err);
						  unzipAndWriteFiles(data, password);
					  })
				  }
			  });
		  };
		  
		  $scope.getFile = function() {
			  $timeout(function() {
				  $rootScope.$apply();
			  });
		  };
	  });
  'use strict';
  
  var async = require('async');
  var constants = require('ocore/constants.js');
  var mutex = require('ocore/mutex.js');
  var eventBus = require('ocore/event_bus.js');
  var objectHash = require('ocore/object_hash.js');
  var ecdsaSig = require('ocore/signature.js');
  var breadcrumbs = require('ocore/breadcrumbs.js');
  var Bitcore = require('bitcore-lib');
  var EventEmitter = require('events').EventEmitter;
  
  angular.module('copayApp.controllers').controller('indexController', function($rootScope, $scope, $log, $filter, $timeout, lodash, go, profileService, configService, isCordova, storageService, addressService, gettext, gettextCatalog, amMoment, nodeWebkit, addonManager, txFormatService, uxLanguage, $state, isMobile, addressbookService, notification, animationService, $modal, bwcService, backButton, pushNotificationsService, aliasValidationService, bottomBarService) {
	breadcrumbs.add('index.js');
	var self = this;
	self.BLACKBYTES_ASSET = constants.BLACKBYTES_ASSET;
	self.isCordova = isCordova;
	self.isSafari = isMobile.Safari();
	self.isMobile = isMobile;
	self.onGoingProcess = {};
	self.historyShowLimit = 10;
	self.updatingTxHistory = {};
	self.bSwipeSuspended = false;
	self.assetsSet = {};
	self.arrBalances = [];
	self.assetIndex = 0;
	self.$state = $state;
	self.usePushNotifications = isCordova && !isMobile.Windows();
	
	self.totalUSDBalance = 0;
	self.isBackupReminderShown = false;
  
	self.calculateTotalUsdBalance = function () {
	  var exchangeRates = require('ocore/network.js').exchangeRates;
	  var totalUSDBalance = 0;
	  
	  for (var i = 0; i < self.arrBalances.length; i++){
		var balance = self.arrBalances[i];
		var completeBalance = (balance.total + (balance.shared || 0))
		if (!balance.pending && balance.asset === 'base' && exchangeRates.GBYTE_USD && balance.total) {
		  totalUSDBalance += completeBalance / 1e9 * exchangeRates.GBYTE_USD;
		} else if (!balance.pending && balance.asset === self.BLACKBYTES_ASSET && exchangeRates.GBB_USD && balance.total) {
		  totalUSDBalance += completeBalance / 1e9 * exchangeRates.GBB_USD;
		} else if (!balance.pending && exchangeRates[balance.asset + '_USD'] && balance.total) {
		  totalUSDBalance += completeBalance / Math.pow(10, balance.decimals || 0) * exchangeRates[balance.asset + '_USD'];
		}
	  }
  
	  self.totalUSDBalance = totalUSDBalance;
	}
  
	$timeout(function () {
	  self.backupExceedingAmountUSD = configService.backupExceedingAmountUSD;
	  self.isBackupReminderShown = !configService.getSync().isBackupReminderShutUp;
	}, 60 * 1000);
  
	self.dismissBackupReminder = function () {
	  self.isBackupReminderShown = false;
	  $timeout(function () {
		self.isBackupReminderShown = true;
	  }, 86400 * 1000)
	}
  
	self.shutupBackupReminder = function () {
	  self.isBackupReminderShown = false;
	  configService.set({ isBackupReminderShutUp: true }, function(err) {
		if (err) {
		  $log.debug(err);
		}
	  });
	}
  
	  /*
	  console.log("process", process.env);
	  var os = require('os');
	  console.log("os", os);
	  //console.log("os homedir="+os.homedir());
	  console.log("release="+os.release());
	  console.log("hostname="+os.hostname());
	  //console.log(os.userInfo());
	  */
  
	  
	  function updatePublicKeyRing(walletClient, onDone){
		  var walletDefinedByKeys = require('ocore/wallet_defined_by_keys.js');
		  walletDefinedByKeys.readCosigners(walletClient.credentials.walletId, function(arrCosigners){
			  var arrApprovedDevices = arrCosigners.
				  filter(function(cosigner){ return cosigner.approval_date; }).
				  map(function(cosigner){ return cosigner.device_address; });
			  console.log("approved devices: "+arrApprovedDevices.join(", "));
			  walletClient.credentials.addPublicKeyRing(arrApprovedDevices);
			  
			  // save it to profile
			  var credentialsIndex = lodash.findIndex(profileService.profile.credentials, {walletId: walletClient.credentials.walletId});
			  if (credentialsIndex < 0)
				  throw Error("failed to find our credentials in profile");
			  profileService.profile.credentials[credentialsIndex] = JSON.parse(walletClient.export());
			  console.log("saving profile: "+JSON.stringify(profileService.profile));
			  storageService.storeProfile(profileService.profile, function(){
				  if (onDone)
					  onDone();
			  });
		  });
	  }
	  
	  function sendBugReport(error_message, error_object){
		  var conf = require('ocore/conf.js');
		  var network = require('ocore/network.js');
		  var bug_sink_url = conf.WS_PROTOCOL + (conf.bug_sink_url || configService.getSync().hub);
		  network.findOutboundPeerOrConnect(bug_sink_url, function(err, ws){
			  if (err)
				  return;
			  breadcrumbs.add('bugreport');
			  var description = error_object.stack || JSON.stringify(error_object, null, '\t');
			  if (error_object.bIgnore)
				  description += "\n(ignored)";
			  description += "\n\nBreadcrumbs:\n"+breadcrumbs.get().join("\n")+"\n\n";
			  description += "UA: "+navigator.userAgent+"\n";
			  description += "Language: "+(navigator.userLanguage || navigator.language)+"\n";
			  description += "Program: "+conf.program+' '+conf.program_version+' '+(conf.bLight ? 'light' : 'full')+" #"+window.commitHash+"\n";
			  network.sendJustsaying(ws, 'bugreport', {message: error_message, exception: description});
		  });
	  }
	  
	  self.sendBugReport = sendBugReport;
	  
	  if (isCordova && constants.version === '1.0'){
		  var db = require('ocore/db.js');
		  db.query("SELECT 1 FROM units WHERE version!=? LIMIT 1", [constants.version], function(rows){
			  if (rows.length > 0){
				  self.showErrorPopup("Looks like you have testnet data.  Please remove the app and reinstall.", function() {
					  if (navigator && navigator.app) // android
						  navigator.app.exitApp();
					  // ios doesn't exit
				  });
			  }
		  });
	  }
  
	  if (isCordova && isMobile.iOS()) {
		  Keyboard.hideFormAccessoryBar(false);
	  }
	  
	  eventBus.on('nonfatal_error', function(error_message, error_object) {
		  console.log('nonfatal error stack', error_object.stack);
		  error_object.bIgnore = true;
		  sendBugReport(error_message, error_object);
	  });
	  
	  eventBus.on('uncaught_error', function(error_message, error_object) {
		  if (error_message.indexOf('ECONNREFUSED') >= 0 || error_message.indexOf('host is unreachable') >= 0){
			  $rootScope.$emit('Local/ShowAlert', "Error connecting to TOR", 'fi-alert', function() {
				  go.path('preferencesGlobal.preferencesTor');
			  });
			  return;
		  }
		  if (error_message.indexOf('ttl expired') >= 0 || error_message.indexOf('general SOCKS server failure') >= 0) // TOR error after wakeup from sleep
			  return;
		  console.log('stack', error_object.stack);
		  sendBugReport(error_message, error_object);
		  if (error_object && error_object.bIgnore)
			  return;
		  self.showErrorPopup(error_message, function() {
			  var db = require('ocore/db.js');
			  db.close();
			  if (self.isCordova && navigator && navigator.app) // android
				  navigator.app.exitApp();
			  else if (process.exit) // nwjs
				  process.exit();
			  // ios doesn't exit
		  });
		  if(isCordova) wallet.showCompleteClient();
	  });
	  
	  function readLastDateString(cb){
		  var conf = require('ocore/conf.js');
		  if (conf.storage !== 'sqlite')
			  return cb();
		  var db = require('ocore/db.js');
		  db.query(
			  "SELECT int_value FROM data_feeds CROSS JOIN unit_authors USING(unit) \n\
			  WHERE +address=? AND +feed_name='timestamp' \n\
			  ORDER BY data_feeds.rowid DESC LIMIT 1",
			  [configService.TIMESTAMPER_ADDRESS],
			  function(rows){
				  if (rows.length === 0)
					  return cb();
				  var ts = rows[0].int_value;
				  cb('at '+$filter('date')(ts, 'short'));
			  }
		  );
	  }
	  
	  function readSyncPercent(cb){
		  var db = require('ocore/db.js');
		  db.query("SELECT COUNT(1) AS count_left FROM catchup_chain_balls", function(rows){
			  var count_left = rows[0].count_left;
			  if (count_left === 0)
				  return cb("0%");
			  if (catchup_balls_at_start === -1)
				  catchup_balls_at_start = count_left;
			  var percent = ((catchup_balls_at_start - count_left) / catchup_balls_at_start * 100).toFixed(3);
			  cb(percent+'%');
		  });
	  }
	  
	  function readSyncProgress(cb){
		  readLastDateString(function(strProgress){
			  strProgress ? cb(strProgress) : readSyncPercent(cb);
		  });
	  }
	  
	  function setSyncProgress(){
		  readSyncProgress(function(strProgress){
			  self.syncProgress = strProgress;
			  $timeout(function() {
				  $rootScope.$apply();
			  });
		  });
	  }
  
	  eventBus.on('rates_updated', function(){
	  self.calculateTotalUsdBalance();
		  $timeout(function() {
			  $rootScope.$apply();
		  });
	  });
	  eventBus.on('started_db_upgrade', function(){
		  $timeout(function() {
			  if (self.bUpgradingDb === undefined)
				  self.bUpgradingDb = true;
			  $rootScope.$apply();
		  }, 100);
	  });
	  eventBus.on('finished_db_upgrade', function(){
		  $timeout(function() {
			  self.bUpgradingDb = false;
			  $rootScope.$apply();
		  });
	  });
	  
	  var catchup_balls_at_start = -1;
	  eventBus.on('catching_up_started', function(){
		  self.setOngoingProcess('Syncing', true);
		  setSyncProgress();
	  });
	  eventBus.on('catchup_next_hash_tree', function(){
		  setSyncProgress();
	  });
	  eventBus.on('catching_up_done', function(){
		  catchup_balls_at_start = -1;
		  self.setOngoingProcess('Syncing', false);
		  self.syncProgress = "";
	  });
	  eventBus.on('unhandled_private_payments_left', function(count_left){ // light only
		  var bChanged = (self.count_unhandled_private_payments !== count_left);
		  self.count_unhandled_private_payments = count_left;
		  if (bChanged)
			  self.setOngoingProcess('handling_private', count_left>0);
	  });
	  eventBus.on('refresh_light_started', function(){
		  console.log('refresh_light_started');
		  self.setOngoingProcess('Syncing', true);
	  });
	  eventBus.on('refresh_light_done', function(){
		  console.log('refresh_light_done');
		  self.setOngoingProcess('Syncing', false);
	  });
	  
	  eventBus.on("confirm_on_other_devices", function(){
		  $rootScope.$emit('Local/ShowAlert', gettextCatalog.getString("Transaction created.\nPlease approve it on the other devices."), 'fi-key', function(){
			  go.walletHome();
		  });
	  });
	  eventBus.on("confirm_prosaic_contract_deposit", function(){
		  $rootScope.$emit('Local/ShowAlert', gettextCatalog.getString("Please approve contract fees deposit on the other devices."), 'fi-key', function(){
			  go.walletHome();
		  });
	  });
	  eventBus.on("confirm_prosaic_contract_post", function(){
		  $rootScope.$emit('Local/ShowAlert', gettextCatalog.getString("Please approve posting prosaic contract hash on the other devices."), 'fi-key', function(){
			  go.walletHome();
		  });
	  });
  
	  eventBus.on("refused_to_sign", function(device_address){
		  var device = require('ocore/device.js');
		  device.readCorrespondent(device_address, function(correspondent){
			  notification.success(gettextCatalog.getString('Refused'), correspondent.name + " refused to sign the transaction");
		  });
	  });
  
	  /*
	  eventBus.on("transaction_sent", function(){
		  self.updateAll();
		  self.updateTxHistory();
	  });*/
  
	  eventBus.on("new_my_transactions", function(){
		  breadcrumbs.add('new_my_transactions');
		  self.updateAll();
		  self.updateTxHistory();
	  });
  
	  eventBus.on("my_transactions_became_stable", function(){
		  breadcrumbs.add('my_transactions_became_stable');
		  self.updateAll();
		  self.updateTxHistory();
	  });
  
	  eventBus.on("maybe_new_transactions", function(){
		  breadcrumbs.add('maybe_new_transactions');
		  self.updateAll();
		  self.updateTxHistory();
	  });
  
	  eventBus.on("wallet_approved", function(walletId, device_address){
		  console.log("wallet_approved "+walletId+" by "+device_address);
		  var client = profileService.walletClients[walletId];
		  if (!client) // already deleted (maybe declined by another device) or not present yet
			  return;
		  var walletName = client.credentials.walletName;
		  updatePublicKeyRing(client);
		  var device = require('ocore/device.js');
		  device.readCorrespondent(device_address, function(correspondent){
			  notification.success(gettextCatalog.getString('Success'), "Wallet "+walletName+" approved by "+correspondent.name);
		  });
	  });
  
	  eventBus.on("wallet_declined", function(walletId, device_address){
		  var client = profileService.walletClients[walletId];
		  if (!client) // already deleted (maybe declined by another device)
			  return;
		  var walletName = client.credentials.walletName;
		  var device = require('ocore/device.js');
		  device.readCorrespondent(device_address, function(correspondent){
			  notification.info(gettextCatalog.getString('Declined'), "Wallet "+walletName+" declined by "+(correspondent ? correspondent.name : 'peer'));
		  });
		  profileService.deleteWallet({client: client}, function(err) {
			  if (err)
				  console.log(err);
		  });
	  });
  
	  eventBus.on("wallet_completed", function(walletId){
		  console.log("wallet_completed "+walletId);
		  var client = profileService.walletClients[walletId];
		  if (!client) // impossible
			  return;
		  var walletName = client.credentials.walletName;
		  updatePublicKeyRing(client, function(){
			  if (!client.isComplete())
				  throw Error("not complete");
			  notification.success(gettextCatalog.getString('Success'), "Wallet "+walletName+" is ready");
			  $rootScope.$emit('Local/WalletCompleted');
		  });
	  });
  
	  $rootScope.$on('process_status_change', function(event, process_name, isEnabled){
		  self.setOngoingProcess(process_name, isEnabled);
	  });
	  
	  // in arrOtherCosigners, 'other' is relative to the initiator
	  eventBus.on("create_new_wallet", function(walletId, arrWalletDefinitionTemplate, arrDeviceAddresses, walletName, arrOtherCosigners, isSingleAddress){
		  var device = require('ocore/device.js');
		  var walletDefinedByKeys = require('ocore/wallet_defined_by_keys.js');
		  device.readCorrespondentsByDeviceAddresses(arrDeviceAddresses, function(arrCorrespondentInfos){
			  // my own address is not included in arrCorrespondentInfos because I'm not my correspondent
			  var arrNames = arrCorrespondentInfos.map(function(correspondent){ return correspondent.name; });
			  var name_list = arrNames.join(", ");
			  var question = gettextCatalog.getString('Create new wallet') + ' ' + walletName + ' ' + gettextCatalog.getString('together with') + ' ' + name_list + ' ?';
			  requestApproval(question, {
				  ifYes: function(){
					  console.log("===== YES CLICKED")
					  var createNewWallet = function(){
						  walletDefinedByKeys.readNextAccount(function(account){
							  var walletClient = bwcService.getClient();
							  if (!profileService.focusedClient.credentials.xPrivKey)
								  throw Error("no profileService.focusedClient.credentials.xPrivKeyin createNewWallet");
							  walletClient.seedFromExtendedPrivateKey(profileService.focusedClient.credentials.xPrivKey, account);
							  //walletClient.seedFromMnemonic(profileService.profile.mnemonic, {account: account});
							  walletDefinedByKeys.approveWallet(
								  walletId, walletClient.credentials.xPubKey, account, arrWalletDefinitionTemplate, arrOtherCosigners, 
								  function(){
									  walletClient.credentials.walletId = walletId;
									  walletClient.credentials.network = 'livenet';
									  var n = arrDeviceAddresses.length;
									  var m = arrWalletDefinitionTemplate[1].required || n;
									  walletClient.credentials.addWalletInfo(walletName, m, n);
									  updatePublicKeyRing(walletClient);
									  profileService._addWalletClient(walletClient, {}, function(){
										  if (isSingleAddress) {
											  profileService.setSingleAddressFlag(true);
										  }
										  console.log("switched to newly approved wallet "+walletId);
									  });
								  }
							  );
						  });
					  };
					  if (profileService.focusedClient.credentials.xPrivKey)
						  createNewWallet();
					  else
						  profileService.insistUnlockFC(null, createNewWallet);
				  },
				  ifNo: function(){
					  console.log("===== NO CLICKED")
					  walletDefinedByKeys.cancelWallet(walletId, arrDeviceAddresses, arrOtherCosigners);
				  }
			  });
		  });
	  });
	  
	  // units that were already approved or rejected by user.
	  // if there are more than one addresses to sign from, we won't pop up confirmation dialog for each address, instead we'll use the already obtained approval
	  var assocChoicesByUnit = {};
  
	  // objAddress is local wallet address, top_address is the address that requested the signature, 
	  // it may be different from objAddress if it is a shared address
	  eventBus.on("signing_request", function(objAddress, top_address, objUnit, assocPrivatePayloads, from_address, signing_path){
		  
		  function createAndSendSignature(){
			  var coin = "0";
			  var path = "m/44'/" + coin + "'/" + objAddress.account + "'/"+objAddress.is_change+"/"+objAddress.address_index;
			  console.log("path "+path);
			  // focused client might be different from the wallet this signature is for, but it doesn't matter as we have a single key for all wallets
			  if (profileService.focusedClient.isPrivKeyEncrypted()){
				  console.log("priv key is encrypted, will be back after password request");
				  return profileService.insistUnlockFC(null, function(){
					  createAndSendSignature();
				  });
			  }
			  var xPrivKey = new Bitcore.HDPrivateKey.fromString(profileService.focusedClient.credentials.xPrivKey);
			  var privateKey = xPrivKey.derive(path).privateKey;
			  console.log("priv key:", privateKey);
			  //var privKeyBuf = privateKey.toBuffer();
			  var privKeyBuf = privateKey.bn.toBuffer({size:32}); // https://github.com/bitpay/bitcore-lib/issues/47
			  console.log("priv key buf:", privKeyBuf);
			  var buf_to_sign = objectHash.getUnitHashToSign(objUnit);
			  var signature = ecdsaSig.sign(buf_to_sign, privKeyBuf);
			  bbWallet.sendSignature(from_address, buf_to_sign.toString("base64"), signature, signing_path, top_address);
			  console.log("sent signature "+signature);
		  }
		  
		  function refuseSignature(){
			  var buf_to_sign = objectHash.getUnitHashToSign(objUnit);
			  bbWallet.sendSignature(from_address, buf_to_sign.toString("base64"), "[refused]", signing_path, top_address);
			  console.log("refused signature");
		  }
		  
		  var bbWallet = require('ocore/wallet.js');
		  var walletDefinedByKeys = require('ocore/wallet_defined_by_keys.js');
		  var unit = objUnit.unit;
		  var credentials = lodash.find(profileService.profile.credentials, {walletId: objAddress.wallet});
		  mutex.lock(["signing_request-"+unit], function(unlock){
			  
			  // apply the previously obtained decision. 
			  // Unless the priv key is encrypted in which case the password request would have appeared from nowhere
			  if (assocChoicesByUnit[unit] && !profileService.focusedClient.isPrivKeyEncrypted()){
				  if (assocChoicesByUnit[unit] === "approve")
					  createAndSendSignature();
				  else if (assocChoicesByUnit[unit] === "refuse")
					  refuseSignature();
				  return unlock();
			  }
			  
			  if (objUnit.signed_message){
				  var question = gettextCatalog.getString('Sign message') + ' ' + objUnit.signed_message + ' ' + gettextCatalog.getString('by address') + ' ' + objAddress.address+'?';
				  requestApproval(question, {
					  ifYes: function(){
						  createAndSendSignature();
						  unlock();
					  },
					  ifNo: function(){
						  // do nothing
						  console.log("===== NO CLICKED");
						  refuseSignature();
						  unlock();
					  }
				  });
				  return;
			  }
			  
			  walletDefinedByKeys.readChangeAddresses(objAddress.wallet, function(arrChangeAddressInfos){
				  var arrAuthorAddresses = objUnit.authors.map(function(author){ return author.address; });
				  var arrChangeAddresses = arrChangeAddressInfos.map(function(info){ return info.address; });
				  arrChangeAddresses = arrChangeAddresses.concat(arrAuthorAddresses);
				  arrChangeAddresses.push(top_address);
				  var arrPaymentMessages = objUnit.messages.filter(function(objMessage){ return (objMessage.app === "payment"); });
				  if (arrPaymentMessages.length === 0)
					  throw Error("no payment message found");
				  var assocAmountByAssetAndAddress = {};
				  // exclude outputs paying to my change addresses
				  async.eachSeries(
					  arrPaymentMessages,
					  function(objMessage, cb){
						  var payload = objMessage.payload;
						  if (!payload)
							  payload = assocPrivatePayloads[objMessage.payload_hash];
						  if (!payload)
							  throw Error("no inline payload and no private payload either, message="+JSON.stringify(objMessage));
						  var asset = payload.asset || "base";
						  if (!payload.outputs)
							  throw Error("no outputs");
						  if (!assocAmountByAssetAndAddress[asset])
							  assocAmountByAssetAndAddress[asset] = {};
						  payload.outputs.forEach(function(output){
							  if (arrChangeAddresses.indexOf(output.address) === -1){
								  if (!assocAmountByAssetAndAddress[asset][output.address])
									  assocAmountByAssetAndAddress[asset][output.address] = 0;
								  assocAmountByAssetAndAddress[asset][output.address] += output.amount;
							  }
						  });
						  cb();
					  },
					  function(){
						  var config = configService.getSync().wallet.settings;
						  
						  var arrDestinations = [];
						  for (var asset in assocAmountByAssetAndAddress){
							  var formatted_asset = isCordova ? asset : ("<span class='small'>"+asset+'</span><br/>');
							  var currency = "of asset "+formatted_asset;
							  var assetInfo = profileService.assetMetadata[asset];
							  if (asset === 'base')
								  currency = config.unitName;
							  else if(asset === constants.BLACKBYTES_ASSET)
								  currency = config.bbUnitName;
							  else if (assetInfo && assetInfo.name)
								  currency = assetInfo.name;
							  for (var address in assocAmountByAssetAndAddress[asset]){
								  var formatted_amount = profileService.formatAmount(assocAmountByAssetAndAddress[asset][address], asset);
								  arrDestinations.push(formatted_amount + " " + currency + " to " + address);
							  }
						  }
						  function getQuestion(){
							  if (arrDestinations.length === 0){
								  var arrDataMessages = objUnit.messages.filter(function(objMessage){ return (objMessage.app === "profile" || objMessage.app === "attestation" || objMessage.app === "data" || objMessage.app === 'data_feed'); });
								  if (arrDataMessages.length > 0){
									  var message = arrDataMessages[0]; // can be only one
									  var payload = message.payload;
									  var obj = (message.app === 'attestation') ? payload.profile : payload;
									  var arrPairs = [];
									  for (var field in obj)
										  arrPairs.push(field+": "+obj[field]);
									  var nl = isCordova ? "\n" : "<br>";
									  var list = arrPairs.join(nl)+nl;
									  if (message.app === 'profile' || message.app === 'data' || message.app === 'data_feed')
										  return 'Sign '+message.app.replace('_', ' ')+' '+nl+list+'from wallet '+credentials.walletName+'?';
									  if (message.app === 'attestation')
										  return 'Sign transaction attesting '+payload.address+' as '+nl+list+'from wallet '+credentials.walletName+'?';
								  }
							  }
							  var dest = (arrDestinations.length > 0) ? arrDestinations.join(", ") : "to myself";
							  return 'Sign transaction spending '+dest+' from wallet '+credentials.walletName+'?';
						  }
						  var question = getQuestion();
						  var ask = function() {
							  requestApproval(question, {
								  ifYes: function(){
									  createAndSendSignature();
									  assocChoicesByUnit[unit] = "approve";
									  unlock();
								  },
								  ifNo: function(){
									  // do nothing
									  console.log("===== NO CLICKED");
									  refuseSignature();
									  assocChoicesByUnit[unit] = "refuse";
									  unlock();
								  }
							  });
						  }
						  // prosaic contract related requests
						  var db = require('ocore/db.js');
						  var prosaic_contract = require('ocore/prosaic_contract.js');
						  function isProsaicContractSignRequest(cb3) {
							  var matches = question.match(/contract_text_hash: (.{44})/m);
							  if (matches && matches.length) {
								  var contract_hash = matches[1];
								  var contract;
								  prosaic_contract.getByHash(contract_hash, function(objContract) {
									  contract = objContract;
									  var arrDataMessages = objUnit.messages.filter(function(objMessage){ return objMessage.app === "data"});
									  if (!objContract || objContract.status !== "accepted" || objContract.unit || arrDataMessages.length !== 1 || arrPaymentMessages.length !== 1 || arrPaymentMessages[0].payload.outputs.length !== 1 || Object.keys(arrDataMessages[0].payload).length > 1)
										  return cb3(false);
									  var shared_address;
									  async.series([function(cb2){
										  var shared_author = lodash.find(objUnit.authors, function(author){
											  try {
												  return author.definition[0] === "and" && author.definition[1][0][0] === "address" && author.definition[1][1][0] === "address";
											  } catch (e) {
												  return false;
											  }
										  });
										  if (shared_author)
											  shared_address = shared_author.address;
										  cb2();
									  }, function(cb2){
										  if (shared_address)
											  return cb2();
										  db.query("SELECT definition FROM shared_addresses WHERE shared_address=?", [arrPaymentMessages[0].payload.outputs[0].address], function(rows){
											  if (!rows || !rows.length)
												  return cb2();
											  var definition = JSON.parse(rows[0].definition);
											  try {
												  if (definition[0] === "and" && definition[1][0][0] === "address" && definition[1][1][0] === "address")
													  shared_address = arrPaymentMessages[0].payload.outputs[0].address;
												  cb2();
											  } catch (e) {
												  cb2();
											  }
										  });
									  }], function() {
										  if (!shared_address || shared_address !== arrPaymentMessages[0].payload.outputs[0].address || !lodash.includes(arrAuthorAddresses, shared_address))
											  return cb3(false);
										  return cb3(true, contract);
									  });
								  });
							  } else {
								  return cb3(false);
							  }
						  }
						  function isProsaicContractDepositRequest(cb) {
							  var payment_msg = lodash.find(objUnit.messages, function(m){return m.app=="payment"});
							  if (!payment_msg)
								  return cb(false);
							  var possible_contract_output = lodash.find(payment_msg.payload.outputs, function(o){return o.amount==prosaic_contract.CHARGE_AMOUNT});
							  if (!possible_contract_output) 
								  return cb(false);
							  db.query("SELECT hash FROM prosaic_contracts \n\
								  WHERE prosaic_contracts.shared_address=? AND prosaic_contracts.status='accepted'", [possible_contract_output.address], function(rows) {
								  if (!rows.length)
									  return cb(false);
								  if (rows.length === 1) {
									  prosaic_contract.getByHash(rows[0].hash, function(objContract) {
										  cb(true, objContract);
									  });
								  } else
									  cb(true);
							  });
						  }
						   isProsaicContractSignRequest(function(isContract, objContract){
							   if (isContract) {
								   question = 'Sign '+objContract.title+' from wallet '+credentials.walletName+'?';
								   return ask();
							   }
							   isProsaicContractDepositRequest(function(isContract, objContract){
								  if (isContract)
									   question = 'Approve prosaic contract '+(objContract ? objContract.title + ' ' : '')+'deposit from wallet '+credentials.walletName+'?';
								   ask();
							  });
						  });
					  }
				  ); // eachSeries
			  });
		  });
	  });
	  
	  var accept_msg = gettextCatalog.getString('Yes');
	  var cancel_msg = gettextCatalog.getString('No');
	  var confirm_msg = gettextCatalog.getString('Confirm');
  
	  var _modalRequestApproval = function(question, callbacks) {
		var ModalInstanceCtrl = function($scope, $modalInstance, $sce, gettext) {
		  $scope.title = $sce.trustAsHtml(question);
		  $scope.yes_icon = 'fi-check';
		  $scope.yes_button_class = 'primary';
		  $scope.cancel_button_class = 'warning';
		  $scope.cancel_label = 'No';
		  $scope.loading = false;
  
		  $scope.ok = function() {
			$scope.loading = true;
			$modalInstance.close(accept_msg);
		  };
		  $scope.cancel = function() {
			$modalInstance.dismiss(cancel_msg);
		  };
		};
  
		var modalInstance = $modal.open({
		  templateUrl: 'views/modals/confirmation.html',
		  windowClass: animationService.modalAnimated.slideUp,
		  controller: ModalInstanceCtrl
		});
  
		modalInstance.result.finally(function() {
		  var m = angular.element(document.getElementsByClassName('reveal-modal'));
		  m.addClass(animationService.modalAnimated.slideOutDown);
		});
  
		modalInstance.result.then(callbacks.ifYes, callbacks.ifNo);
	  };
  
	  var requestApproval = function(question, callbacks) {
		if (isCordova) {
		  navigator.notification.confirm(
			question,
			function(buttonIndex) {
			  if (buttonIndex == 1)
				  callbacks.ifYes();
			  else
				  callbacks.ifNo();
			},
			confirm_msg, [accept_msg, cancel_msg]
		  );
		} else {
		  _modalRequestApproval(question, callbacks);
		}
	  };
	  
  
	  
	self.openSubwalletModal = function() {
	  $rootScope.modalOpened = true;
	  var fc = profileService.focusedClient;
  
	  var ModalInstanceCtrl = function($scope, $modalInstance) {
		  $scope.color = fc.backgroundColor;
		  $scope.indexCtl = self;
		  var arrSharedWallets = [];
		  $scope.mainWalletBalanceInfo = self.arrMainWalletBalances[self.assetIndex];
		  $scope.asset = $scope.mainWalletBalanceInfo.asset;
		  var asset = $scope.asset;
		  var assetInfo = self.arrBalances[self.assetIndex];
		  var assocSharedByAddress = assetInfo.assocSharedByAddress;
		  for (var sa in assocSharedByAddress) {
			  var objSharedWallet = {};
			  objSharedWallet.shared_address = sa;
			  objSharedWallet.total = assocSharedByAddress[sa];
			  if (asset === 'base' || asset === constants.BLACKBYTES_ASSET || $scope.mainWalletBalanceInfo.name)
				  objSharedWallet.totalStr = profileService.formatAmountWithUnit(assocSharedByAddress[sa], asset);
			  arrSharedWallets.push(objSharedWallet);
		  }
		  $scope.arrSharedWallets = arrSharedWallets;
  
		  var walletDefinedByAddresses = require('ocore/wallet_defined_by_addresses.js');
		  async.eachSeries(
			  arrSharedWallets,
			  function(objSharedWallet, cb){
				  walletDefinedByAddresses.readSharedAddressCosigners(objSharedWallet.shared_address, function(cosigners){
					  objSharedWallet.shared_address_cosigners = cosigners.map(function(cosigner){ return cosigner.name; }).join(", ");
					  objSharedWallet.creation_ts = cosigners[0].creation_ts;
					  cb();
				  });
			  },
			  function(){
				  arrSharedWallets.sort(function(o1, o2){ return (o2.creation_ts - o1.creation_ts); });
				  $timeout(function(){
					  $scope.$apply();
				  });
			  }
		  );
  
		  $scope.cancel = function() {
			  breadcrumbs.add('openSubwalletModal cancel');
			  $modalInstance.dismiss('cancel');
		  };
  
		  $scope.selectSubwallet = function(shared_address) {
			  self.shared_address = shared_address;
			  if (shared_address){
				  walletDefinedByAddresses.determineIfHasMerkle(shared_address, function(bHasMerkle){
					  self.bHasMerkle = bHasMerkle;
					  walletDefinedByAddresses.readSharedAddressCosigners(shared_address, function(cosigners){
						  self.shared_address_cosigners = cosigners.map(function(cosigner){ return cosigner.name; }).join(", ");
						  $timeout(function(){
							  $rootScope.$apply();
						  });
					  });
				  });
			  }
			  else
				  self.bHasMerkle = false;
			  self.updateAll();
			  self.updateTxHistory();
			  $modalInstance.close();
		  };
	  };
  
	  var modalInstance = $modal.open({
		  templateUrl: 'views/modals/select-subwallet.html',
		  windowClass: animationService.modalAnimated.slideUp,
		  controller: ModalInstanceCtrl,
	  });
  
	  var disableCloseModal = $rootScope.$on('closeModal', function() {
		  breadcrumbs.add('openSubwalletModal on closeModal');
		  modalInstance.dismiss('cancel');
	  });
  
	  modalInstance.result.finally(function() {
		  $rootScope.modalOpened = false;
		  disableCloseModal();
		  var m = angular.element(document.getElementsByClassName('reveal-modal'));
		  m.addClass(animationService.modalAnimated.slideOutDown);
	  });
  
	};
	  
	self.goHome = function() {
	  go.walletHome();
	};
  
	self.menu = [{
	  'title': gettext('Home'),
	  'icon': 'icon-home',
	  'link': 'walletHome'
	}, {
	  'title': gettext('Receive'),
	  'icon': 'icon-receive2',
	  'link': 'receive'
	}, {
	  'title': gettext('Send'),
	  'icon': 'icon-paperplane',
	  'link': 'send'
	}, {
	  'title': gettext('History'),
	  'icon': 'icon-history',
	  'link': 'history'
	}, {
	  'title': gettext('Chat'),
	  'icon': 'icon-bubble',
	  'new_state': 'correspondentDevices',
	  'link': 'chat'
	}];
  
	self.addonViews = addonManager.addonViews();
	self.menu = self.menu.concat(addonManager.addonMenuItems());
	self.menuItemSize = self.menu.length > 5 ? 2 : 3;
	self.txTemplateUrl = addonManager.txTemplateUrl() || 'views/includes/transaction.html';
  
	self.tab = 'walletHome';
  
  
	self.setOngoingProcess = function(processName, isOn) {
	  $log.debug('onGoingProcess', processName, isOn);
	  self[processName] = isOn;
	  self.onGoingProcess[processName] = isOn;
  
	  var name;
	  self.anyOnGoingProcess = lodash.any(self.onGoingProcess, function(isOn, processName) {
		if (isOn)
		  name = name || processName;
		return isOn;
	  });
	  // The first one
	  self.onGoingProcessName = name;
	  $timeout(function() {
		$rootScope.$apply();
	  });
	};
  
	self.setFocusedWallet = function() {
	  var fc = profileService.focusedClient;
	  if (!fc) return;
		
	  breadcrumbs.add('setFocusedWallet '+fc.credentials.walletId);
  
	  // Clean status
	  self.totalBalanceBytes = null;
	  self.lockedBalanceBytes = null;
	  self.availableBalanceBytes = null;
	  self.pendingAmount = null;
  
	  self.totalBalanceStr = null;
	  self.availableBalanceStr = null;
	  self.lockedBalanceStr = null;
  
	  self.assetsSet = {};
	  self.arrBalances = [];
	  self.assetIndex = 0;
	  self.shared_address = null;
	  self.bHasMerkle = false;
  
	  self.txHistory = [];
	  self.completeHistory = [];
	  self.txProgress = 0;
	  self.historyShowShowAll = false;
	  self.balanceByAddress = null;
	  self.pendingTxProposalsCountForUs = null;
  
	  $timeout(function() {
		  //$rootScope.$apply();
		  self.hasProfile = true;
		  self.noFocusedWallet = false;
		  self.onGoingProcess = {};
  
		  // Credentials Shortcuts
		  self.m = fc.credentials.m;
		  self.n = fc.credentials.n;
		  self.network = fc.credentials.network;
		  self.requiresMultipleSignatures = fc.credentials.m > 1;
		  //self.isShared = fc.credentials.n > 1;
		  self.walletName = fc.credentials.walletName;
		  self.walletId = fc.credentials.walletId;
		  self.isComplete = fc.isComplete();
		  self.canSign = fc.canSign();
		  self.isPrivKeyExternal = fc.isPrivKeyExternal();
		  self.isPrivKeyEncrypted = fc.isPrivKeyEncrypted();
		  self.externalSource = fc.getPrivKeyExternalSourceName();
		  self.account = fc.credentials.account;
  
		  self.txps = [];
		  self.copayers = [];
		  self.updateColor();
		  self.updateAlias();
		  self.updateSingleAddressFlag();
		  self.setAddressbook();
  
		  console.log("reading cosigners");
		  var walletDefinedByKeys = require('ocore/wallet_defined_by_keys.js');
		  walletDefinedByKeys.readCosigners(self.walletId, function(arrCosignerInfos){
			  self.copayers = arrCosignerInfos;
			  $timeout(function(){
				  $rootScope.$digest();
			  });
		  });
  
		  self.needsBackup = false;
		  self.singleAddressWallet = false;
		  self.openWallet();
		  /*if (fc.isPrivKeyExternal()) {
			  self.needsBackup = false;
			  self.openWallet();
		  } else {
			  storageService.getBackupFlag('all', function(err, val) {
				self.needsBackup = self.network == 'testnet' ? false : !val;
				self.openWallet();
			  });
		  }*/
	  });
	};
  
  
	self.setTab = function(tab, reset, tries, switchState) {
	  console.log("setTab", tab, reset, tries, switchState);
	  tries = tries || 0;
  
	  var changeTab = function(tab) {
		if (document.querySelector('.tab-in.tab-view')) {
			var el = angular.element(document.querySelector('.tab-in.tab-view'));
		  el.removeClass('tab-in').addClass('tab-out');
		  var old = document.getElementById('menu-' + self.tab);
		  if (old) {
			old.className = '';
		  }
		}
  
		if (document.getElementById(tab)) {
			var el = angular.element(document.getElementById(tab));
		  el.removeClass('tab-out').addClass('tab-in');
		  var newe = document.getElementById('menu-' + tab);
		  if (newe) {
			newe.className = 'active';
		  }
		}
  
		$rootScope.tab = self.tab = tab;
		$rootScope.$emit('Local/TabChanged', tab);
	  };
  
	  // check if the whole menu item passed
	  if (typeof tab == 'object') {
		  if(!tab.new_state) backButton.clearHistory();
		if (tab.open) {
		  if (tab.link) {
			$rootScope.tab = self.tab = tab.link;
		  }
		  tab.open();
		  return;
		} else if (tab.new_state) {
			changeTab(tab.link);
			$rootScope.tab = self.tab = tab.link;
			go.path(tab.new_state);
			return;
		} else {
		  return self.setTab(tab.link, reset, tries, switchState);
		}
	  }
	  console.log("current tab "+self.tab+", requested to set tab "+tab+", reset="+reset);
	  if (self.tab === tab && !reset)
		return;
  
	  if (!document.getElementById('menu-' + tab) && ++tries < 5) {
		  console.log("will retry setTab later:", tab, reset, tries, switchState);
		  return $timeout(function() {
			  self.setTab(tab, reset, tries, switchState);
		  }, (tries === 1) ? 10 : 300);
	  }
  
	  if (!self.tab || !$state.is('walletHome'))
		$rootScope.tab = self.tab = 'walletHome';
  
	  if (switchState && !$state.is('walletHome')) {
		go.path('walletHome', function() {
		  changeTab(tab);
		});
		return;
	  }
  
	  changeTab(tab);
	};
  
  
  
  
  
  
	self.updateAll = function(opts) {
	  opts = opts || {};
  
	  var fc = profileService.focusedClient;
	  if (!fc) 
		  return breadcrumbs.add('updateAll no fc');
  
	  if (!fc.isComplete())
		  return breadcrumbs.add('updateAll not complete yet');
		
	  // reconnect if lost connection
	  var device = require('ocore/device.js');
	  device.loginToHub();
  
	  $timeout(function() {
  
		  if (!opts.quiet)
			  self.setOngoingProcess('updatingStatus', true);
  
		  $log.debug('Updating Status:', fc.credentials.walletName);
		  if (!opts.quiet)
			  self.setOngoingProcess('updatingStatus', false);
  
  
		  fc.getBalance(self.shared_address, function(err, assocBalances, assocSharedBalances) {
			  if (err)
				  throw "impossible getBal";
			  $log.debug('updateAll Wallet Balance:', assocBalances, assocSharedBalances);
			  self.setBalance(assocBalances, assocSharedBalances);
			  // Notify external addons or plugins
			  $rootScope.$emit('Local/BalanceUpdated', assocBalances);
			  if (!self.isPrivKeyEncrypted)
				  $rootScope.$emit('Local/BalanceUpdatedAndWalletUnlocked');
		  });
		  
		  self.otherWallets = lodash.filter(profileService.getWallets(self.network), function(w) {
			  return (w.id != self.walletId || self.shared_address);
		  });
  
  
		  //$rootScope.$apply();
  
		  if (opts.triggerTxUpdate) {
			  $timeout(function() {
				  breadcrumbs.add('triggerTxUpdate');
				  self.updateTxHistory();
			  }, 1);
		  }
	  });
	};
  
  
	self.updateBalance = function() {
	  var fc = profileService.focusedClient;
	  $timeout(function() {
		self.setOngoingProcess('updatingBalance', true);
		$log.debug('Updating Balance');
		fc.getBalance(self.shared_address, function(err, assocBalances, assocSharedBalances) {
		  self.setOngoingProcess('updatingBalance', false);
		  if (err)
			  throw "impossible error from getBalance";
		  $log.debug('updateBalance Wallet Balance:', assocBalances, assocSharedBalances);
		  self.setBalance(assocBalances, assocSharedBalances);
		});
	  });
	};
  
  
	  
	self.openWallet = function() {
	  console.log("index.openWallet called");
	  var fc = profileService.focusedClient;
	  breadcrumbs.add('openWallet '+fc.credentials.walletId);
	  $timeout(function() {
		//$rootScope.$apply();
		self.setOngoingProcess('openingWallet', true);
		self.updateError = false;
		fc.openWallet(function onOpenedWallet(err, walletStatus) {
		  self.setOngoingProcess('openingWallet', false);
		  if (err)
			  throw "impossible error from openWallet";
		  $log.debug('Wallet Opened');
		  self.updateAll(lodash.isObject(walletStatus) ? {
			walletStatus: walletStatus
		  } : null);
		  //$rootScope.$apply();
		});
	  });
	};
  
  
  
	self.processNewTxs = function(txs) {
	  var config = configService.getSync().wallet.settings;
	  var now = Math.floor(Date.now() / 1000);
	  var ret = [];
  
	  lodash.each(txs, function(tx) {
		  tx = txFormatService.processTx(tx);
  
		  // no future transactions...
		  if (tx.time > now)
			  tx.time = now;
		  ret.push(tx);
	  });
  
	  return ret;
	};
  
	self.updateAlias = function() {
	  var config = configService.getSync();
	  config.aliasFor = config.aliasFor || {};
	  self.alias = config.aliasFor[self.walletId];
	  var fc = profileService.focusedClient;
	  fc.alias = self.alias;
	};
  
	self.updateColor = function() {
	  var config = configService.getSync();
	  config.colorFor = config.colorFor || {};
	  self.backgroundColor = config.colorFor[self.walletId] || '#4A90E2';
	  var fc = profileService.focusedClient;
	  fc.backgroundColor = self.backgroundColor;
	};
  
	self.updateSingleAddressFlag = function() {
	  var config = configService.getSync();
	  config.isSingleAddress = config.isSingleAddress || {};
	  self.isSingleAddress = config.isSingleAddress[self.walletId];
	  var fc = profileService.focusedClient;
	  fc.isSingleAddress = self.isSingleAddress;
	};
  
	self.getCurrentWalletHiddenAssets = function () {
	  var hiddenAssets = configService.getSync().hiddenAssets;
	  var fc = profileService.focusedClient;
	  var walletId = fc.credentials.walletId;
	  if (hiddenAssets.hasOwnProperty(walletId)) {
		return hiddenAssets[walletId];
	  } else {
		return {};
	  }
	};
  
	self.isAssetHidden = function (asset, assetsSet) {
	  if (!assetsSet) {
		assetsSet = self.getCurrentWalletHiddenAssets();
	  }
	  return assetsSet[asset];
	};
	  
	self.setBalance = function(assocBalances, assocSharedBalances) {
	  if (!assocBalances) return;
	  var config = configService.getSync().wallet.settings;
	  var fc = profileService.focusedClient;
	  var hiddenAssets = self.getCurrentWalletHiddenAssets();
	  console.log('setBalance hiddenAssets:', hiddenAssets);
  
	  // Selected unit
	  self.unitValue = config.unitValue;
	  self.unitName = config.unitName;
	  self.bbUnitName = config.bbUnitName;
	
	  self.assetsSet = {};
	  self.arrBalances = [];
	  for (var asset in assocBalances){
		  var balanceInfo = assocBalances[asset];
		  balanceInfo.asset = asset;
		  balanceInfo.total = balanceInfo.stable + balanceInfo.pending;
		  if (assocSharedBalances[asset]){
			  balanceInfo.shared = 0;
			  balanceInfo.assocSharedByAddress = {};
			  for (var sa in assocSharedBalances[asset]){
				  var total_on_shared_address = (assocSharedBalances[asset][sa].stable || 0) + (assocSharedBalances[asset][sa].pending || 0);
				  balanceInfo.shared += total_on_shared_address;
				  balanceInfo.assocSharedByAddress[sa] = total_on_shared_address;
			  }
		  }
		  if (balanceInfo.name)
			  profileService.assetMetadata[asset] = {decimals: balanceInfo.decimals, name: balanceInfo.name};
		  if (asset === "base" || asset == self.BLACKBYTES_ASSET || balanceInfo.name){
			  balanceInfo.totalStr = profileService.formatAmountWithUnit(balanceInfo.total, asset);
			  balanceInfo.totalStrWithoutUnit = profileService.formatAmount(balanceInfo.total, asset);
			  balanceInfo.stableStr = profileService.formatAmountWithUnit(balanceInfo.stable, asset);
			  balanceInfo.pendingStr = profileService.formatAmountWithUnitIfShort(balanceInfo.pending, asset);
			  if (typeof balanceInfo.shared === 'number')
				  balanceInfo.sharedStr = profileService.formatAmountWithUnitIfShort(balanceInfo.shared, asset);
			  if (!balanceInfo.name){
				  if (!Math.log10) // android 4.4
					  Math.log10 = function(x) { return Math.log(x) * Math.LOG10E; };
				  if (asset === "base"){
					  balanceInfo.name = self.unitName;
					  balanceInfo.decimals = Math.round(Math.log10(config.unitValue));
				  }
				  else if (asset === self.BLACKBYTES_ASSET){
					  balanceInfo.name = self.bbUnitName;
					  balanceInfo.decimals = Math.round(Math.log10(config.bbUnitValue));
				  }
			  }
		  }
		  self.assetsSet[asset] = balanceInfo;
		  if (self.isAssetHidden(asset, hiddenAssets)) {
			continue;
		  }
		  self.arrBalances.push(balanceInfo);
	  }
	  self.assetIndex = self.assetIndex || 0;
	  if (!self.arrBalances[self.assetIndex]) // if no such index in the subwallet, reset to bytes
		  self.assetIndex = 0;
	  if (!self.shared_address)
		  self.arrMainWalletBalances = self.arrBalances;
	  if(isCordova) wallet.showCompleteClient();
	  console.log('========= setBalance done, balances: '+JSON.stringify(self.arrBalances));
	  breadcrumbs.add('setBalance done, balances: '+JSON.stringify(self.arrBalances));
  
		/*
	  // SAT
	  if (configService.getSync().wallet.spendUnconfirmed) {
		self.totalBalanceBytes = balance.totalAmount;
		self.lockedBalanceBytes = balance.lockedAmount || 0;
		self.availableBalanceBytes = balance.availableAmount || 0;
		self.pendingAmount = null;
	  } else {
		self.totalBalanceBytes = balance.totalConfirmedAmount;
		self.lockedBalanceBytes = balance.lockedConfirmedAmount || 0;
		self.availableBalanceBytes = balance.availableConfirmedAmount || 0;
		self.pendingAmount = balance.totalAmount - balance.totalConfirmedAmount;
	  }
  
	  //STR
	  self.totalBalanceStr = profileService.formatAmount(self.totalBalanceBytes) + ' ' + self.unitName;
	  self.lockedBalanceStr = profileService.formatAmount(self.lockedBalanceBytes) + ' ' + self.unitName;
	  self.availableBalanceStr = profileService.formatAmount(self.availableBalanceBytes) + ' ' + self.unitName;
  
	  if (self.pendingAmount) {
		self.pendingAmountStr = profileService.formatAmount(self.pendingAmount) + ' ' + self.unitName;
	  } else {
		self.pendingAmountStr = null;
	  }
		*/
  
	  self.calculateTotalUsdBalance();
  
	  $timeout(function() {
		$rootScope.$apply();
	  });
	};
  
	  
	  
	this.csvHistory = function() {
  
	  function saveFile(name, data) {
		var chooser = document.querySelector(name);
		chooser.addEventListener("change", function(evt) {
		  var fs = require('fs');
		  fs.writeFile(this.value, data, function(err) {
			if (err) {
			  $log.debug(err);
			}
		  });
		}, false);
		chooser.click();
	  }
  
	  function formatDate(date) {
		var dateObj = new Date(date);
		if (!dateObj) {
		  $log.debug('Error formating a date');
		  return 'DateError'
		}
		if (!dateObj.toJSON()) {
		  return '';
		}
  
		return dateObj.toJSON();
	  }
  
	  function formatString(str) {
		if (!str) return '';
  
		if (str.indexOf('"') !== -1) {
		  //replace all
		  str = str.replace(new RegExp('"', 'g'), '\'');
		}
  
		//escaping commas
		str = '\"' + str + '\"';
  
		return str;
	  }
  
	  var step = 6;
	  var unique = {};
  
  
	  if (isCordova) {
		$log.info('CSV generation not available in mobile');
		return;
	  }
	  var isNode = nodeWebkit.isDefined();
	  var fc = profileService.focusedClient;
	  var c = fc.credentials;
	  if (!fc.isComplete()) return;
	  var self = this;
	  var allTxs = [];
  
	  $log.debug('Generating CSV from History');
	  self.setOngoingProcess('generatingCSV', true);
  
	  $timeout(function() {
		fc.getTxHistory(self.arrBalances[self.assetIndex].asset, self.shared_address, function(txs) {
			self.setOngoingProcess('generatingCSV', false);
			$log.debug('Wallet Transaction History:', txs);
  
			var data = txs;
			var filename = 'Obyte-' + (self.alias || self.walletName) + '.csv';
			var csvContent = '';
  
			if (!isNode) csvContent = 'data:text/csv;charset=utf-8,';
			csvContent += 'Date,Destination,Note,Amount,Currency,Spot Value,Total Value,Tax Type,Category\n';
  
			var _amount, _note;
			var dataString;
			data.forEach(function(it, index) {
			  var amount = it.amount;
  
			  if (it.action == 'moved')
				amount = 0;
  
			  _amount = (it.action == 'sent' ? '-' : '') + amount;
			  _note = formatString((it.message ? it.message : '') + ' unit: ' + it.unit);
  
			  if (it.action == 'moved')
				_note += ' Moved:' + it.amount
  
			  dataString = formatDate(it.time * 1000) + ',' + formatString(it.addressTo) + ',' + _note + ',' + _amount + ',byte,,,,';
			  csvContent += dataString + "\n";
  
			});
  
			if (isNode) {
			  saveFile('#export_file', csvContent);
			} else {
			  var encodedUri = encodeURI(csvContent);
			  var link = document.createElement("a");
			  link.setAttribute("href", encodedUri);
			  link.setAttribute("download", filename);
			  link.click();
			}
			$timeout(function(){
				$rootScope.$apply();
			});
		});
	  });
	};
  
  
  
	self.updateLocalTxHistory = function(client, cb) {
	  var walletId = client.credentials.walletId;
	  if (self.arrBalances.length === 0)
		  return console.log('updateLocalTxHistory: no balances yet');
	  breadcrumbs.add('index: '+self.assetIndex+'; balances: '+JSON.stringify(self.arrBalances));
	  if (!client.isComplete())
		  return console.log('fc incomplete yet');
	  client.getTxHistory(self.arrBalances[self.assetIndex].asset, self.shared_address, function onGotTxHistory(txs) {
		  $timeout(function(){
			  var newHistory = self.processNewTxs(txs);
			  $log.debug('Tx History synced. Total Txs: ' + newHistory.length);
  
			  if (walletId ==  profileService.focusedClient.credentials.walletId) {
				  self.completeHistory = newHistory;
				  self.txHistory = newHistory.slice(0, self.historyShowLimit);
				  self.historyShowShowAll = newHistory.length >= self.historyShowLimit;
			  }
  
			  return cb();
		  });
	  });
	}
	
	self.showAllHistory = function() {
	  self.historyShowShowAll = false;
	  self.historyRendering = true;
	  $timeout(function() {
		$rootScope.$apply();
		$timeout(function() {
		  self.historyRendering = false;
		  self.txHistory = self.completeHistory;
		}, 100);
	  }, 100);
	};
  
  
	self.updateHistory = function() {
	  var fc = profileService.focusedClient;
	  var walletId = fc.credentials.walletId;
  
	  if (!fc.isComplete() || self.arrBalances.length === 0) return;
  
	  $log.debug('Updating Transaction History');
	  self.txHistoryError = false;
  
	  mutex.lock(['update-history-'+walletId], function(unlock){
		  self.updatingTxHistory[walletId] = true;
		  $timeout(function onUpdateHistoryTimeout() {
			self.updateLocalTxHistory(fc, function(err) {
				self.updatingTxHistory[walletId] = false;
				unlock();
			  if (err)
				  self.txHistoryError = true;
			  $timeout(function() {
				  $rootScope.$apply();
			  });
			});
		  });
	  });
	};
  
	self.updateTxHistory = lodash.debounce(function() {
	  self.updateHistory();
	}, 1000);
  
  //  self.throttledUpdateHistory = lodash.throttle(function() {
  //    self.updateHistory();
  //  }, 5000);
	  
  //    self.onMouseDown = function(){
  //        console.log('== mousedown');
  //        self.oldAssetIndex = self.assetIndex;
  //    };
	  
	  self.onClick = function(){
		  console.log('== click');
		  self.oldAssetIndex = self.assetIndex;
	  };
	  
	  // for light clients only
	  self.updateHistoryFromNetwork = lodash.throttle(function(){
		  setTimeout(function(){
			  if (self.assetIndex !== self.oldAssetIndex) // it was a swipe
				  return console.log("== swipe");
			  console.log('== updateHistoryFromNetwork');
			  var lightWallet = require('ocore/light_wallet.js');
			  lightWallet.refreshLightClientHistory();
		  }, 500);
	  }, 5000);
  
	self.showPopup = function(msg, msg_icon, cb) {
	  $log.warn('Showing '+msg_icon+' popup:' + msg);
	  self.showAlert = {
		msg: msg.toString(),
		msg_icon: msg_icon,
		close: function(err) {
		  self.showAlert = null;
		  if (cb) return cb(err);
		},
	  };
	  $timeout(function() {
		$rootScope.$apply();
	  });
	};
  
	self.showErrorPopup = function(msg, cb) {
	  $log.warn('Showing err popup:' + msg);
	  self.showPopup(msg, 'fi-alert', cb);
	};
  
	self.recreate = function(cb) {
	  var fc = profileService.focusedClient;
	  self.setOngoingProcess('recreating', true);
	  fc.recreateWallet(function(err) {
		self.setOngoingProcess('recreating', false);
  
		if (err)
			throw "impossible err from recreateWallet";
  
		profileService.setWalletClients();
		$timeout(function() {
		  $rootScope.$emit('Local/WalletImported', self.walletId);
		}, 100);
	  });
	};
  
	self.openMenu = function() {
		backButton.menuOpened = true;
	  go.swipe(true);
	};
  
	self.closeMenu = function() {
		backButton.menuOpened = false;
	  go.swipe();
	};
	  
	  self.swipeRight = function(){
		  if (!self.bSwipeSuspended)
			  self.openMenu();
		  else
			  console.log('ignoring swipe');
	  };
	  
	  self.suspendSwipe = function(){
		  if (self.arrBalances.length <= 1)
			  return;
		  self.bSwipeSuspended = true;
		  console.log('suspending swipe');
		  $timeout(function(){
			  self.bSwipeSuspended = false;
			  console.log('resuming swipe');
		  }, 100);
	  };
  
	self.retryScan = function() {
	  var self = this;
	  self.startScan(self.walletId);
	}
  
	self.startScan = function(walletId) {
	  $log.debug('Scanning wallet ' + walletId);
	  var c = profileService.walletClients[walletId];
	  if (!c.isComplete()) return;
		/*
	  if (self.walletId == walletId)
		self.setOngoingProcess('scanning', true);
  
	  c.startScan({
		includeCopayerBranches: true,
	  }, function(err) {
		if (err && self.walletId == walletId) {
		  self.setOngoingProcess('scanning', false);
		  self.handleError(err);
		  $rootScope.$apply();
		}
	  });
		*/
	};
  
	self.setUxLanguage = function() {
	  var userLang = uxLanguage.update();
	  self.defaultLanguageIsoCode = userLang;
	  self.defaultLanguageName = uxLanguage.getName(userLang);
	};
  
  
  
	self.setAddressbook = function(ab) {
	  if (ab) {
		self.addressbook = ab;
		return;
	  }
  
	  addressbookService.list(function(err, ab) {
		if (err) {
		  $log.error('Error getting the addressbook');
		  return;
		}
		self.addressbook = ab;
	  });
	};   
	  
  
	  function getNumberOfSelectedSigners(){
		  var count = 1; // self
		  self.copayers.forEach(function(copayer){
			  if (copayer.signs)
				  count++;
		  });
		  return count;
	  }
	  
	  self.isEnoughSignersSelected = function(){
		  if (self.m === self.n)
			  return true;
		  return (getNumberOfSelectedSigners() >= self.m);
	  };
	  
	  self.getWallets = function(){
		  return profileService.getWallets('livenet');
	  };
	  
	self.getToAddressLabel = function(value) {
	  var validationResult = aliasValidationService.validate(value);
  
	  if (validationResult.isValid) {
		var aliasObj = aliasValidationService.getAliasObj(validationResult.attestorKey);
		return gettextCatalog.getString('To') + " " + gettextCatalog.getString(aliasObj.title);
	  }
  
	  return gettextCatalog.getString('To email');
	};
	self.getAddressValue = function(value) {
	  var validationResult = aliasValidationService.validate(value);
  
	  if (validationResult.isValid) {
		return validationResult.account;
	  }
  
	  return value;
	};
  
	$rootScope.$on('Local/ClearHistory', function(event) {
	  $log.debug('The wallet transaction history has been deleted');
	  self.txHistory = self.completeHistory = [];
	  self.updateHistory();
	});
  
	$rootScope.$on('Local/AddressbookUpdated', function(event, ab) {
	  self.setAddressbook(ab);
	});
  
	// UX event handlers
	$rootScope.$on('Local/ColorUpdated', function(event) {
	  self.updateColor();
	  $timeout(function() {
		$rootScope.$apply();
	  });
	});
  
	$rootScope.$on('Local/AliasUpdated', function(event) {
	  self.updateAlias();
	  $timeout(function() {
		$rootScope.$apply();
	  });
	});
  
	$rootScope.$on('Local/SingleAddressFlagUpdated', function(event) {
	  self.updateSingleAddressFlag();
	  $timeout(function() {
		$rootScope.$apply();
	  });
	});
  
	$rootScope.$on('Local/ProfileBound', function() {
	});
  
	$rootScope.$on('Local/NewFocusedWallet', function() {
	  self.setUxLanguage();
	});
  
	$rootScope.$on('Local/LanguageSettingUpdated', function() {
	  self.setUxLanguage();
	});
  
	$rootScope.$on('Local/UnitSettingUpdated', function(event) {
	  breadcrumbs.add('UnitSettingUpdated');
	  self.updateAll();
	  self.updateTxHistory();
	});
  
	$rootScope.$on('Local/NeedFreshHistory', function(event) {
	  breadcrumbs.add('NeedFreshHistory');
	  self.updateHistory();
	});
  
  
	$rootScope.$on('Local/WalletCompleted', function(event) {
	  self.setFocusedWallet();
	  go.walletHome();
	});
  
  //  self.debouncedUpdate = lodash.throttle(function() {
  //    self.updateAll({
  //      quiet: true
  //    });
  //    self.updateTxHistory();
  //  }, 4000, {
  //    leading: false,
  //    trailing: true
  //  });
  
	$rootScope.$on('Local/Resume', function(event) {
	  $log.debug('### Resume event');
	  var lightWallet = require('ocore/light_wallet.js');
	  lightWallet.refreshLightClientHistory();
	  //self.debouncedUpdate();
	});
  
	$rootScope.$on('Local/BackupDone', function(event) {
	  self.needsBackup = false;
	  $log.debug('Backup done');
	  storageService.setBackupFlag('all', function(err) {
		  if (err)
			  return $log.warn("setBackupFlag failed: "+JSON.stringify(err));
		$log.debug('Backup done stored');
	  });
	});
  
	$rootScope.$on('Local/DeviceError', function(event, err) {
	  self.showErrorPopup(err, function() {
		if (self.isCordova && navigator && navigator.app) {
		  navigator.app.exitApp();
		}
	  });
	});
  
  
	$rootScope.$on('Local/WalletImported', function(event, walletId) {
	  self.needsBackup = false;
	  storageService.setBackupFlag(walletId, function() {
		$log.debug('Backup done stored');
		addressService.expireAddress(walletId, function(err) {
		  $timeout(function() {
			self.txHistory = self.completeHistory = [];
			  self.startScan(walletId);
		  }, 500);
		});
	  });
	});
  
	$rootScope.$on('NewIncomingTx', function() {
	  self.updateAll({
		walletStatus: null,
		untilItChanges: true,
		triggerTxUpdate: true,
	  });
	});
  
  
  
	$rootScope.$on('NewOutgoingTx', function() {
	  breadcrumbs.add('NewOutgoingTx');
	  self.updateAll({
		walletStatus: null,
		untilItChanges: true,
		triggerTxUpdate: true,
	  });
	});
  
	lodash.each(['NewTxProposal', 'TxProposalFinallyRejected', 'TxProposalRemoved', 'NewOutgoingTxByThirdParty',
	  'Local/NewTxProposal', 'Local/TxProposalAction'
	], function(eventName) {
	  $rootScope.$on(eventName, function(event, untilItChanges) {
		self.updateAll({
		  walletStatus: null,
		  untilItChanges: untilItChanges,
		  triggerTxUpdate: true,
		});
	  });
	});
  
	$rootScope.$on('ScanFinished', function() {
	  $log.debug('Scan Finished. Updating history');
		self.updateAll({
		  walletStatus: null,
		  triggerTxUpdate: true,
		});
	});
  
  
	$rootScope.$on('Local/NoWallets', function(event) {
	  $timeout(function() {
		self.hasProfile = true;
		self.noFocusedWallet = true;
		self.isComplete = null;
		self.walletName = null;
		go.path('preferencesGlobal.import');
	  });
	});
  
	$rootScope.$on('Local/NewFocusedWallet', function() {
		console.log('on Local/NewFocusedWallet');
	  self.setFocusedWallet();
	  //self.updateTxHistory();
	  go.walletHome();
	});
  
	$rootScope.$on('Local/SetTab', function(event, tab, reset, swtichToHome) {
	  console.log("SetTab "+tab+", reset "+reset);
	  self.setTab(tab, reset, null, swtichToHome);
	});
  
	$rootScope.$on('Local/RequestTouchid', function(event, cb) {
	  window.plugins.touchid.verifyFingerprint(
		gettextCatalog.getString('Scan your fingerprint please'),
		function(msg) {
		  // OK
		  return cb();
		},
		function(msg) {
		  // ERROR
		  return cb(gettext('Invalid Touch ID'));
		}
	  );
	});
  
	$rootScope.$on('Local/ShowAlert', function(event, msg, msg_icon, cb) {
		self.showPopup(msg, msg_icon, cb);
	});
  
	$rootScope.$on('Local/ShowErrorAlert', function(event, msg, cb) {
		self.showErrorPopup(msg, cb);
	});
  
	$rootScope.$on('Local/NeedsPassword', function(event, isSetup, error_message, cb) {
	  console.log('NeedsPassword');
	  self.askPassword = {
		  isSetup: isSetup,
		  error: error_message,
		  callback: function(err, pass) {
			  self.askPassword = null;
			  return cb(err, pass);
		  },
	  };
	  $timeout(function() {
		$rootScope.$apply();
	  });
	});
  
	lodash.each(['NewCopayer', 'CopayerUpdated'], function(eventName) {
	  $rootScope.$on(eventName, function() {
		// Re try to open wallet (will triggers)
		self.setFocusedWallet();
	  });
	});
  
	$rootScope.$on('Local/NewEncryptionSetting', function() {
	  var fc = profileService.focusedClient;
	  self.isPrivKeyEncrypted = fc.isPrivKeyEncrypted();
	  $timeout(function() {
		$rootScope.$apply();
	  });
	});
	
	$rootScope.$on('Local/pushNotificationsReady', function() {
		self.usePushNotifications = true;
	  $timeout(function() {
		$rootScope.$apply();
	  });
	});
  
	(function() {
		  "drag dragover dragstart dragenter".split(" ").forEach(function(e){
			  window.addEventListener(e, function(e){
				  e.preventDefault();
				  e.stopPropagation();
				  e.dataTransfer.dropEffect = "copy";
			  }, false);
		  });
		  document.addEventListener('drop', function(e){
			  e.preventDefault();
			  e.stopPropagation();
			  for (var i = 0; i < e.dataTransfer.files.length; ++i) {
				  go.handleUri(e.dataTransfer.files[i].path);
			  }
		  }, false);
	  })();
  });
  
  'use strict';
  
  var eventBus = require('ocore/event_bus.js');
  
  angular.module('copayApp.controllers').controller('inviteCorrespondentDeviceController',
	function($scope, $timeout, profileService, go, isCordova, correspondentListService, gettextCatalog) {
	  
	  var self = this;
	  
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
  
  'use strict';
  
  angular.module('copayApp.controllers').controller('newVersionIsAvailable', function($scope, $modalInstance, go, newVersion, isMobile){
  
	$scope.version = newVersion.version;
  
	$scope.openDownloadLink = function(){
	  var link = '';
	  if (navigator && navigator.app) {
		link = 'https://play.google.com/store/apps/details?id=org.byteball.wallet';
		if (newVersion.version.match('t$'))
			link += '.testnet';
	  }
	  else if(navigator && isMobile.iOS()){
		  link = 'https://itunes.apple.com/us/app/byteball/id1147137332';
	  }
	  else {
		link = 'https://github.com/byteball/obyte-gui-wallet/releases/tag/v' + newVersion.version;
	  }
	  go.openExternalLink(link);
	  $modalInstance.close('closed result');
	};
  
	$scope.later = function(){
	  $modalInstance.close('closed result');
	};
  });
  
  /*
  
  This should be rewritten!
  - accept the private key
  - derive its address
  - find all outputs to this address (requires full node or light/get_history)
  - spend them to one of my own addresses
  
  */
  
  angular.module('copayApp.controllers').controller('paperWalletController',
	function($scope, $http, $timeout, $log, configService, profileService, go, addressService, txStatus, bitcore) {
	  self = this;
	  var fc = profileService.focusedClient;
	  var rawTx;
  
	  self.onQrCodeScanned = function(data) {
		$scope.inputData = data;
		self.onData(data);
	  }
  
	  self.onData = function(data) {
		self.error = '';
		self.scannedKey = data;
		self.isPkEncrypted = (data.charAt(0) == '6');
	  }
  
	  self._scanFunds = function(cb) {
		function getPrivateKey(scannedKey, isPkEncrypted, passphrase, cb) {
		  if (!isPkEncrypted) return cb(null, scannedKey);
		  fc.decryptBIP38PrivateKey(scannedKey, passphrase, null, cb);
		};
  
		function getBalance(privateKey, cb) {
		  fc.getBalanceFromPrivateKey(privateKey, cb);
		};
  
		function checkPrivateKey(privateKey) {
		  try {
			new bitcore.PrivateKey(privateKey, 'livenet');
		  } catch (err) {
			return false;
		  }
		  return true;
		}
  
		getPrivateKey(self.scannedKey, self.isPkEncrypted, $scope.passphrase, function(err, privateKey) {
		  if (err) return cb(err);
		  if (!checkPrivateKey(privateKey)) return cb(new Error('Invalid private key'));
  
		  getBalance(privateKey, function(err, balance) {
			if (err) return cb(err);
			return cb(null, privateKey, balance);
		  });
		});
	  }
  
	  self.scanFunds = function() {
		self.error = 'Unimplemented';
		return;
		  
		self.scanning = true;
		self.privateKey = '';
		self.balanceBytes = 0;
		self.error = '';
  
		$timeout(function() {
		  self._scanFunds(function(err, privateKey, balance) {
			self.scanning = false;
			if (err) {
			  $log.error(err);
			  self.error = err.message || err.toString();
			} else {
			  self.privateKey = privateKey;
			  self.balanceBytes = balance;
			  var config = configService.getSync().wallet.settings;
			  self.balance = profileService.formatAmount(balance) + ' ' + config.unitName;
			}
			$timeout(function() {
				$scope.$apply();
			});
		  });
		}, 100);
	  }
  
	  self._sweepWallet = function(cb) {
		addressService.getAddress(fc.credentials.walletId, true, function(err, destinationAddress) {
		  if (err) return cb(err);
  
		  fc.buildTxFromPrivateKey(self.privateKey, destinationAddress, null, function(err, tx) {
			if (err) return cb(err);
  
			fc.broadcastRawTx({
			  rawTx: tx.serialize(),
			  network: 'livenet'
			}, function(err, txid) {
			  if (err) return cb(err);
			  return cb(null, destinationAddress, txid);
			});
		  });
		});
	  };
  
	  self.sweepWallet = function() {
		self.sending = true;
		self.error = '';
  
		$timeout(function() {
		  self._sweepWallet(function(err, destinationAddress, txid) {
			self.sending = false;
  
			if (err) {
			  self.error = err.message || err.toString();
			  $log.error(err);
			} else {
			  txStatus.notify({
				status: 'broadcasted'
			  }, function() {
				go.walletHome();
			  });
			}
			$timeout(function() {
				$scope.$apply();
			});
		  });
		}, 100);
	  }
	});
  
  'use strict';
  
  angular.module('copayApp.controllers').controller('passwordController',
	function($rootScope, $scope, $timeout, profileService, notification, go, gettext) {
  
	  var self = this;
  
	  var pass1;
  
	  self.isVerification = false;
	  
	  var fc = profileService.focusedClient;
	  self.bHasMnemonic = (fc.credentials && fc.credentials.mnemonic);
  
	  document.getElementById("passwordInput").focus();
  
	  self.close = function(cb) {
		return cb(gettext('No password given'));
	  };
  
	  self.set = function(isSetup, cb) {
		self.error = false;
  
		if (isSetup && !self.isVerification) {
		  document.getElementById("passwordInput").focus();
		  self.isVerification = true;
		  pass1 = self.password;
		  self.password = null;
		  $timeout(function() {
			$rootScope.$apply();
		  })
		  return;
		}
		if (isSetup) {
		  if (pass1 != self.password) {
			self.error = gettext('Passwords do not match');
			self.isVerification = false;
			self.password = null;
			pass1 = null;
  
			return;
		  }
		}
		return cb(null, self.password);
	  };
  
	});
  'use strict';
  angular.module('copayApp.controllers').controller('paymentUriController',
	function($rootScope, $stateParams, $location, $timeout, profileService, configService, lodash, bitcore, go) {
  
	  function strip(number) {
		return (parseFloat(number.toPrecision(12)));
	  };
  
	  // Build bitcoinURI with querystring
	  this.checkBitcoinUri = function() {
		var query = [];
		angular.forEach($location.search(), function(value, key) {
		  query.push(key + "=" + value);
		});
		var queryString = query ? query.join("&") : null;
		this.bitcoinURI = $stateParams.data + (queryString ? '?' + queryString : '');
  
		var URI = bitcore.URI;
		var isUriValid = URI.isValid(this.bitcoinURI);
		if (!URI.isValid(this.bitcoinURI)) {
		  this.error = true;
		  return;
		}
		var uri = new URI(this.bitcoinURI);
  
		if (uri && uri.address) {
		  var config = configService.getSync().wallet.settings;
		  var unitValue = config.unitValue;
		  var unitName = config.unitName;
  
		  if (uri.amount) {
			uri.amount = strip(uri.amount / unitValue) + ' ' + unitName;
		  }
		  uri.network = uri.address.network.name;
		  this.uri = uri;
		}
	  };
  
	  this.getWallets = function(network) {
		return profileService.getWallets(network);
	  };
  
	  this.selectWallet = function(wid) {
		var self = this;
		if (wid != profileService.focusedClient.credentials.walletId) {
		  profileService.setAndStoreFocus(wid, function() {});
		}
		go.send();
		$timeout(function() {
		  $rootScope.$emit('paymentUri', self.bitcoinURI);
		}, 100);
	  };
	});
  
  'use strict';
  
  angular.module('copayApp.controllers')
	  .controller('preferencesController',
		  function($scope, $rootScope, $filter, $timeout, $modal, $log, lodash, configService, profileService, uxLanguage, $q) {
  
			  this.init = function() {
				  var config = configService.getSync();
				  this.unitName = config.wallet.settings.unitName;
				  this.currentLanguageName = uxLanguage.getCurrentLanguageName();
				  var fc = profileService.focusedClient;
				  if (!fc)
					  return;
				  
				  if (window.touchidAvailable) {
					  var walletId = fc.credentials.walletId;
					  this.touchidAvailable = true;
					  config.touchIdFor = config.touchIdFor || {};
					  $scope.touchid = config.touchIdFor[walletId];
				  }
				  
				  //$scope.encrypt = fc.hasPrivKeyEncrypted();
				  this.externalSource = null;
  
				  $scope.numCosigners = fc.credentials.n;
				  var walletDefinedByKeys = require('ocore/wallet_defined_by_keys.js');
				  var db = require('ocore/db.js');
				  walletDefinedByKeys.readAddresses(fc.credentials.walletId, {}, function(addresses) {
					  $scope.numAddresses = addresses.length;
					  db.query(
						  "SELECT 1 FROM private_profiles WHERE address=? UNION SELECT 1 FROM attestations WHERE address=?", 
						  [addresses[0], addresses[0]], 
						  function(rows){
							  $scope.bHasAttestations = (rows.length > 0);
							  $scope.bEditable = ($scope.numAddresses === 1 && $scope.numCosigners === 1 && !$scope.bHasAttestations);
							  $timeout(function(){
								  $rootScope.$apply();
							  });
						  }
					  );
				  });
				  // TODO externalAccount
				  //this.externalIndex = fc.getExternalIndex();
			  };
	  
			  var unwatchRequestTouchid = $scope.$watch('touchid', function(newVal, oldVal) {
				  if (newVal == oldVal || $scope.touchidError) {
					  $scope.touchidError = false;
					  return;
				  }
				  var walletId = profileService.focusedClient.credentials.walletId;
  
				  var opts = {
					  touchIdFor: {}
				  };
				  opts.touchIdFor[walletId] = newVal;
  
				  $rootScope.$emit('Local/RequestTouchid', function(err) {
					  if (err) {
						  $log.debug(err);
						  $timeout(function() {
							  $scope.touchidError = true;
							  $scope.touchid = oldVal;
						  }, 100);
					  }
					  else {
						  configService.set(opts, function(err) {
							  if (err) {
								  $log.debug(err);
								  $scope.touchidError = true;
								  $scope.touchid = oldVal;
							  }
						  });
					  }
				  });
			  });
  
			  $scope.$on('$destroy', function() {
				  unwatchRequestTouchid();
			  });
  
			  $scope.$watch('index.isSingleAddress', function(newValue, oldValue) {
				  if (oldValue == newValue) return;
				  profileService.setSingleAddressFlag(newValue);
			  });
		  });
  'use strict';
  
  angular.module('copayApp.controllers').controller('preferencesAbout',
	function() {});
  
  'use strict';
  
  angular.module('copayApp.controllers').controller('preferencesAdvancedController',
	function($scope) {
  
	});
  'use strict';
  
  angular.module('copayApp.controllers').controller('preferencesAliasController',
	function($scope, $timeout, configService, profileService, go) {
	  var config = configService.getSync();
	  var fc = profileService.focusedClient;
	  var walletId = fc.credentials.walletId;
  
	  var config = configService.getSync();
	  config.aliasFor = config.aliasFor || {};
	  this.alias = config.aliasFor[walletId] || fc.credentials.walletName;
  
	  this.save = function() {
		var self = this;
		var opts = {
		  aliasFor: {}
		};
		opts.aliasFor[walletId] = self.alias;
  
		configService.set(opts, function(err) {
		  if (err) {
			$scope.$emit('Local/DeviceError', err);
			return;
		  }
		  $scope.$emit('Local/AliasUpdated');
		  $timeout(function(){
			go.path('preferences');
		  }, 50);
		});
  
	  };
	});
  
  'use strict';
  
  angular
	  .module('copayApp.controllers')
	  .controller('preferencesAttestorAddressesCtrl', PreferencesAttestorAddressesCtrl);
  
  function PreferencesAttestorAddressesCtrl(
	  $scope, $timeout,
	  configService, go,
	  attestorAddressListService, aliasValidationService
  ) {
	  this.go = go;
	  var config = configService.getSync();
	  var configAttestorAddresses = config.attestorAddresses;
	  console.log('!!!configAttestorAddresses', JSON.stringify(configAttestorAddresses, null, 4));
	  var listOfAliases = aliasValidationService.getListOfAliases();
  
	  this.arrAttestorAddresses = [];
	  for (var attestorKey in configAttestorAddresses) {
		  if (!configAttestorAddresses.hasOwnProperty(attestorKey)) continue;
  
		  var value = configAttestorAddresses[attestorKey];
		  var obj = aliasValidationService.getAliasObj(attestorKey);
		  var title = obj.title;
		  title = title[0].toUpperCase() + title.substr(1);
		  this.arrAttestorAddresses.push({attestorKey: attestorKey, value: value, title: title});
	  }
	  for (var attestorKey in listOfAliases) {
		  if (
			  !listOfAliases.hasOwnProperty(attestorKey) ||
			  configAttestorAddresses.hasOwnProperty(attestorKey)
		  ) continue;
  
		  var obj = listOfAliases[attestorKey];
		  var title = obj.title;
		  title = title[0].toUpperCase() + title.substr(1);
		  this.arrAttestorAddresses.push({attestorKey: attestorKey, value: "", title: title});
	  }
  
	  this.arrAttestorAddresses.sort(function (a, b) {
		  if (a.title > b.title) {
			  return 1;
		  }
		  if (a.title < b.title) {
			  return -1;
		  }
		  return 0;
	  });
  
	  this.realNameAttestorAddresses = config.realNameAttestorAddresses;
  
	  this.edit = function (attestorKey) {
		  attestorAddressListService.currentAttestorKey = attestorKey;
		  go.path('preferencesGlobal.preferencesAttestorAddresses.preferencesEditAttestorAddress');
	  };
  }
  
  'use strict';
  
  angular.module('copayApp.controllers').controller('preferencesBbUnitController',
	function($rootScope, $scope, $log, configService, go, $deepStateRedirect) {
	  var config = configService.getSync();
	  this.bbUnitName = config.wallet.settings.bbUnitName;
	  this.unitOpts = [
		// TODO : add Satoshis to bitcore-wallet-client formatAmount()
		// {
		//     name: 'Satoshis (100,000,000 satoshis = 1BTC)',
		//     shortName: 'SAT',
		//     value: 1,
		//     decimals: 0,
		//     code: 'sat',
		//   }, 
		/*{
		  name: 'bits (1,000,000 bits = 1BTC)',
		  shortName: 'bits',
		  value: 100,
		  decimals: 2,
		  code: 'bit',
		}*/
		// TODO : add mBTC to bitcore-wallet-client formatAmount()
		// ,{
		//   name: 'mBTC (1,000 mBTC = 1BTC)',
		//   shortName: 'mBTC',
		//   value: 100000,
		//   decimals: 5,
		//   code: 'mbtc',
		// }
		/*, {
		  name: 'BTC',
		  shortName: 'BTC',
		  value: 100000000,
		  decimals: 8,
		  code: 'btc',
		}
		, */{
		  name: 'blackbytes',
		  shortName: 'blackbytes',
		  value: 1,
		  decimals: 0,
		  code: 'one'
		}
		, {
		  name: 'kBlackBytes (1,000 blackbytes)',
		  shortName: 'kBB',
		  value: 1000,
		  decimals: 3,
		  code: 'kilo'
		}
		, {
		  name: 'MBlackBytes (1,000,000 blackbytes)',
		  shortName: 'MBB',
		  value: 1000000,
		  decimals: 6,
		  code: 'mega'
		}
		, {
		  name: 'GBlackBytes (1,000,000,000 blackbytes)',
		  shortName: 'GBB',
		  value: 1000000000,
		  decimals: 9,
		  code: 'giga'
		}
	  ];
  
	  this.save = function(newUnit) {
		var opts = {
		  wallet: {
			settings: {
			  bbUnitName: newUnit.shortName,
			  bbUnitValue: newUnit.value,
				bbUnitDecimals: newUnit.decimals,
			  bbUnitCode: newUnit.code
			}
		  }
		};
		this.unitName = newUnit.shortName;
  
		configService.set(opts, function(err) {
		  if (err) $log.warn(err);
		  $scope.$emit('Local/UnitSettingUpdated');
		  if ($rootScope.tab === 'send') {
			$deepStateRedirect.reset('walletHome');
			go.path('walletHome', function() {
			  $rootScope.$emit('Local/SetTab', 'send');
			});
		  }
		  else {
			go.preferencesGlobal();
		  }
		});
  
	  };
	  
	  go.onBackButton = function(){
		  console.log('units backbutton');
	  };
	  //console.log('topbar: '+$scope.topbar);
	});
  
  'use strict';
  
  angular.module('copayApp.controllers').controller('preferencesColorController',
	function($scope, configService, profileService, go) {
	  var config = configService.getSync();
	  this.colorOpts = configService.colorOpts;
  
	  var fc = profileService.focusedClient;
	  var walletId = fc.credentials.walletId;
  
	  var config = configService.getSync();
	  config.colorFor = config.colorFor || {};
	  this.color = config.colorFor[walletId] || '#4A90E2';
  
	  this.save = function(color) {
		var self = this;
		var opts = {
		  colorFor: {}
		};
		opts.colorFor[walletId] = color;
  
		configService.set(opts, function(err) {
		  if (err) {
			$scope.$emit('Local/DeviceError', err);
			return;
		  }
		  self.color = color;
		  $scope.$emit('Local/ColorUpdated');
		});
  
	  };
	});
  
  'use strict';
  
  angular.module('copayApp.controllers').controller('preferencesDeleteWalletController',
	function($scope, $rootScope, $filter, $timeout, $modal, $log, storageService, notification, profileService, isCordova, go, gettext, gettextCatalog, animationService) {
	  this.isCordova = isCordova;
	  this.error = null;
  
	  var delete_msg = gettextCatalog.getString('Are you sure you want to delete this wallet?');
	  var accept_msg = gettextCatalog.getString('Accept');
	  var cancel_msg = gettextCatalog.getString('Cancel');
	  var confirm_msg = gettextCatalog.getString('Confirm');
  
	  var _modalDeleteWallet = function() {
		var ModalInstanceCtrl = function($scope, $modalInstance, $sce, gettext) {
		  $scope.title = $sce.trustAsHtml(delete_msg);
		  $scope.loading = false;
  
		  $scope.ok = function() {
			$scope.loading = true;
			$modalInstance.close(accept_msg);
  
		  };
		  $scope.cancel = function() {
			$modalInstance.dismiss(cancel_msg);
		  };
		};
  
		var modalInstance = $modal.open({
		  templateUrl: 'views/modals/confirmation.html',
		  windowClass: animationService.modalAnimated.slideUp,
		  controller: ModalInstanceCtrl
		});
  
		modalInstance.result.finally(function() {
		  var m = angular.element(document.getElementsByClassName('reveal-modal'));
		  m.addClass(animationService.modalAnimated.slideOutDown);
		});
  
		modalInstance.result.then(function(ok) {
		  if (ok) {
			_deleteWallet();
		  }
		});
	  };
  
	  var _deleteWallet = function() {
		var fc = profileService.focusedClient;
		var name = fc.credentials.walletName;
		var walletName = (fc.alias || '') + ' [' + name + ']';
		var self = this;
  
		profileService.deleteWallet({}, function(err) {
		  if (err) {
			self.error = err.message || err;
		  } else {
			notification.success(gettextCatalog.getString('Success'), gettextCatalog.getString('The wallet "{{walletName}}" was deleted', {
			  walletName: walletName
			}));
		  }
		});
	  };
  
	  this.deleteWallet = function() {
		if (profileService.profile.credentials.length === 1 || profileService.getWallets().length === 1)
			return $rootScope.$emit('Local/ShowErrorAlert', "Can't delete the last remaining wallet");
		if (isCordova) {
		  navigator.notification.confirm(
			delete_msg,
			function(buttonIndex) {
			  if (buttonIndex == 1) {
				_deleteWallet();
			  }
			},
			confirm_msg, [accept_msg, cancel_msg]
		  );
		} else {
		  _modalDeleteWallet();
		}
	  };
	});
  
  'use strict';
  
  angular.module('copayApp.controllers').controller('preferencesDeviceNameController',
	function($scope, $timeout, configService, go) {
	  var config = configService.getSync();
	  this.deviceName = config.deviceName;
  
	  this.save = function() {
		var self = this;
		var device = require('ocore/device.js');
		device.setDeviceName(self.deviceName);
		var opts = {deviceName: self.deviceName};
  
		configService.set(opts, function(err) {
		  if (err) {
			$scope.$emit('Local/DeviceError', err);
			return;
		  }
		  $timeout(function(){
			go.path('preferencesGlobal');
		  }, 50);
		});
  
	  };
	});
  
  'use strict';
  
  angular
	  .module('copayApp.controllers')
	  .controller('preferencesEditAttestorAddressCtrl', PreferencesEditAttestorAddressCtrl);
  
  function PreferencesEditAttestorAddressCtrl(
	  $scope, $timeout,
	  go, configService,
	  attestorAddressListService, aliasValidationService
  ) {
	  var ValidationUtils = require("ocore/validation_utils.js");
	  var currAttestorAddressKey = attestorAddressListService.currentAttestorKey;
	  var objAttestorAddress = aliasValidationService.getAliasObj(currAttestorAddressKey);
	  var configAttestorAddresses = configService.getSync().attestorAddresses;
	  var self = this;
  
	  this.title = objAttestorAddress.title + " attestor address";
	  this.attestorAddress = configAttestorAddresses[currAttestorAddressKey] || "";
  
	  this.save = function () {
		  var newAddress = self.attestorAddress.trim();
  
		  if (newAddress !== '' && !ValidationUtils.isValidAddress(newAddress)) {
			  return setError("new attestor address is invalid");
		  }
  
		  var savingConfigData = {attestorAddresses:{}};
		  savingConfigData.attestorAddresses[currAttestorAddressKey] = newAddress;
  
		  configService.set(savingConfigData, function (err) {
			  if (err)
				  return $scope.$emit('Local/DeviceError', err);
  
			  $timeout(function () {
				  goBack();
			  }, 50);
		  });
	  };
  
	  function setError (error) {
		  self.error = error;
		  $timeout(function () {
			  $scope.$apply();
		  }, 100);
	  }
  
	  function goBack () {
		  go.path('preferencesGlobal.preferencesAttestorAddresses');
	  }
  }
  
  'use strict';
  
  angular
	  .module('copayApp.controllers')
	  .controller('preferencesEditRealNameAttestorsCtrl', PreferencesEditRealNameAttestorsCtrl);
  
  function PreferencesEditRealNameAttestorsCtrl(
	  $scope, $timeout,
	  go, configService,
	  attestorAddressListService, aliasValidationService
  ) {
	  var ValidationUtils = require("ocore/validation_utils.js");
	  //var currAttestorAddressKey = attestorAddressListService.currentAttestorKey;
	  //var objAttestorAddress = aliasValidationService.getAliasObj(currAttestorAddressKey);
	  var self = this;
  
	  this.attestorAddresses = configService.getSync().realNameAttestorAddresses || {};
  
	  this.save = function () {
		  var savingConfigData = {realNameAttestorAddresses:[]};
  
		  for (var i = 0; i < this.attestorAddresses.length; i++) {
			  var pair = this.attestorAddresses[i];
			  var newAddress = pair.address.trim();
			  if (newAddress !== '' && !ValidationUtils.isValidAddress(newAddress)) {
				  return setError("new attestor address is invalid");
			  }
  
			  savingConfigData.realNameAttestorAddresses.push({address: newAddress});
		  }
  
		  configService.set(savingConfigData, function (err) {
			  if (err)
				  return $scope.$emit('Local/DeviceError', err);
  
			  $timeout(function () {
				  goBack();
			  }, 50);
		  });
	  };
  
	  this.removeAttestorAddress = function (address) {
		  var idx = this.attestorAddresses.findIndex(function(pair) {return pair.address == address;});
		  if (idx > -1)
			  this.attestorAddresses.splice(idx, 1);
	  }
  
	  function setError (error) {
		  self.error = error;
		  $timeout(function () {
			  $scope.$apply();
		  }, 100);
	  }
  
	  function goBack () {
		  go.path('preferencesGlobal.preferencesAttestorAddresses');
	  }
  }
  
  'use strict';
  
  angular.module('copayApp.controllers').controller('preferencesEditWitnessController',
	function($scope, $timeout, go, witnessListService) {
	  
	  var self = this;
	  this.witness = witnessListService.currentWitness;
  
	  this.save = function() {
		  var new_address = this.witness.trim();
		  if (new_address === witnessListService.currentWitness)
			  return goBack();
		  var myWitnesses = require('ocore/my_witnesses.js');
		  myWitnesses.replaceWitness(witnessListService.currentWitness, new_address, function(err){
			  console.log(err);
			  if (err)
				  return setError(err);
			  goBack();
		  });
	  };
	  
	  function setError(error){
		  self.error = error;
		  $timeout(function(){
			  $scope.$apply();
		  }, 100);
	  }
  
	  function goBack(){
		  go.path('preferencesGlobal.preferencesWitnesses');
	  }
	});
  
  'use strict';
  
  angular.module('copayApp.controllers').controller('preferencesEmailController',
	function($scope, go, profileService, gettext, $log) {
	  this.save = function(form) {
		var self = this;
		this.error = null;
  
		var fc = profileService.focusedClient;
		this.saving = true;
		$scope.$emit('Local/EmailSettingUpdated', self.email, function() {
		  self.saving = false;
		  go.path('preferencesGlobal');
		});
	  };
	});
  
  'use strict';
  
  angular.module('copayApp.controllers').controller('preferencesGlobalController',
	function($scope, $rootScope, $log, configService, uxLanguage, pushNotificationsService, profileService) {
	  
		  var conf = require('ocore/conf.js');
	
	  $scope.encrypt = !!profileService.profile.xPrivKeyEncrypted;
	  
	  this.init = function() {
		var config = configService.getSync();
		this.unitName = config.wallet.settings.unitName;
		this.bbUnitName = config.wallet.settings.bbUnitName;
		this.deviceName = config.deviceName;
		this.myDeviceAddress = require('ocore/device.js').getMyDeviceAddress();
		this.hub = config.hub;
		this.currentLanguageName = uxLanguage.getCurrentLanguageName();
		this.torEnabled = conf.socksHost && conf.socksPort;
		$scope.pushNotifications = config.pushNotifications.enabled;
		$scope.spendUnconfirmed = config.wallet.spendUnconfirmed;
	  };
  
  
	  var unwatchSpendUnconfirmed = $scope.$watch('spendUnconfirmed', function(newVal, oldVal) {
		  if (newVal == oldVal) return;
		  var opts = {
			  wallet: {
				  spendUnconfirmed: newVal
			  }
		  };
		  configService.set(opts, function(err) {
		  //	$rootScope.$emit('Local/SpendUnconfirmedUpdated');
			  if (err) $log.debug(err);
		  });
	  });
	  
	  var unwatchPushNotifications = $scope.$watch('pushNotifications', function(newVal, oldVal) {
		if (newVal == oldVal) return;
		var opts = {
		  pushNotifications: {
			enabled: newVal
		  }
		};
		configService.set(opts, function(err) {
		  if (opts.pushNotifications.enabled)
			pushNotificationsService.pushNotificationsInit();
		  else
			pushNotificationsService.pushNotificationsUnregister();
		  if (err) $log.debug(err);
		});
	  });
  
	  var unwatchEncrypt = $scope.$watch('encrypt', function(val) {
		var fc = profileService.focusedClient;
		if (!fc) return;
  
		if (val && !fc.hasPrivKeyEncrypted()) {
		  $rootScope.$emit('Local/NeedsPassword', true, null, function(err, password) {
			if (err || !password) {
			  $scope.encrypt = false;
			  return;
			}
			profileService.setPrivateKeyEncryptionFC(password, function() {
			  $rootScope.$emit('Local/NewEncryptionSetting');
			  $scope.encrypt = true;
			});
		  });
		} else {
		  if (!val && fc.hasPrivKeyEncrypted())  {
			profileService.unlockFC(null, function(err){
			  if (err) {
				$scope.encrypt = true;
				return;
			  }
			  profileService.disablePrivateKeyEncryptionFC(function(err) {
				$rootScope.$emit('Local/NewEncryptionSetting');
				if (err) {
				  $scope.encrypt = true;
				  $log.error(err);
				  return;
				}
				$scope.encrypt = false;
			  });
			});
		  }
		}
	  });
  
  
	  $scope.$on('$destroy', function() {
		  unwatchSpendUnconfirmed();
		  unwatchPushNotifications();
		  unwatchEncrypt();
	  });
	});
  
  'use strict';
  
  angular.module('copayApp.controllers')
	.controller('preferencesHiddenAssetsCtrl', PreferencesHiddenAssetsCtrl);
  
  PreferencesHiddenAssetsCtrl.$inject = ['$scope','configService'];
  function PreferencesHiddenAssetsCtrl($scope, configService) {
	var ctrl = this;
	var configHiddenAssets = configService.getSync().hiddenAssets;
	var indexScope = $scope.index;
	var walletId = indexScope.walletId;
	var hiddenAssetsSet = {};
	if (configHiddenAssets.hasOwnProperty(walletId)) {
	  hiddenAssetsSet = Object.assign({}, configHiddenAssets[walletId]);
	}
	
	var assetsSet = indexScope.assetsSet;
	var resAssetsData = [];
  
	Object.keys(assetsSet).forEach(function (asset) {
	  var balanceInfo = assetsSet[asset];
	  resAssetsData.push({
		key: asset,
		name: balanceInfo.name || asset,
		value: isAssetHidden(asset),
	  });
	});
  
	ctrl.arrAssetsData = resAssetsData;
	ctrl.isChanged = false;
	ctrl.isOneAssetLeft = false;
  
	checkOneAssetLeft();
  
	ctrl.hanldeAssetChangeVisibility = function (assetData) {
	  var prevValue = hiddenAssetsSet[assetData.key];
	  if (prevValue === assetData.value) {
		return;
	  }
  
	  hiddenAssetsSet[assetData.key] = assetData.value;
	  checkOneAssetLeft();
	  saveConfig();
	  ctrl.isChanged = true;
	};
  
	ctrl.isSwitchAssetDisabled = function (assetData) {
	  return !assetData.value && ctrl.isOneAssetLeft;
	};
  
	$scope.$on("$destroy", function() {
	  if (ctrl.isChanged) {
		indexScope.updateBalance();
	  }
	});
  
	function checkOneAssetLeft() {
	  var countAssetLeft = 0;
	  ctrl.arrAssetsData.forEach(function (assetData) {
		if (!assetData.value) {
		  countAssetLeft++;
		}
	  });
	  ctrl.isOneAssetLeft = countAssetLeft <= 1;
	}
  
	function isAssetHidden(asset) {
	  return indexScope.isAssetHidden(asset, hiddenAssetsSet);
	}
  
	function saveConfig() {
	  var data = {};
	  data[walletId] = hiddenAssetsSet;
	  Object.keys(configHiddenAssets).forEach(function (wId) {
		if (wId === walletId) {
		  return;
		}
		data[wId] = configHiddenAssets[wId];
	  });
	  
	  configService.set(
		{
		  hiddenAssets: data
		},
		function (err) {
		  if (err)
			return $scope.$emit('Local/DeviceError', err);
		}
		  );
	}
  }
  
  'use strict';
  
  angular.module('copayApp.controllers').controller('preferencesHubController',
	function($scope, $timeout, configService, go, autoUpdatingWitnessesList){
	  var config = configService.getSync();
	  var initHubEdit = false;
	  this.hub = config.hub;
  
	  this.currentAutoUpdWitnessesList = autoUpdatingWitnessesList.autoUpdate;
	  $scope.autoUpdWitnessesList = autoUpdatingWitnessesList.autoUpdate;
  
	  this.save = function() {
		var self = this;
		var device = require('ocore/device.js');
		var lightWallet = require('ocore/light_wallet.js');
		self.hub = self.hub.replace(/^wss?:\/\//i, '').replace(/^https?:\/\//i, '');
		device.setDeviceHub(self.hub);
		lightWallet.setLightVendorHost(self.hub);
		var opts = {hub: self.hub};
  
		configService.set(opts, function(err) {
		  if (err) {
			$scope.$emit('Local/DeviceError', err);
			return;
		  }
		  $timeout(function(){
			go.path('preferencesGlobal');
		  }, 50);
		});
		if (this.currentAutoUpdWitnessesList != $scope.autoUpdWitnessesList) {
		  autoUpdatingWitnessesList.setAutoUpdate($scope.autoUpdWitnessesList);
		}
	  };
  
	  var unwatchEditHub = $scope.$watch(angular.bind(this, function(){
		return this.hub;
	  }), function(){
		if (initHubEdit) {
		  $scope.autoUpdWitnessesList = false;
		}
		else {
		  initHubEdit = true;
		}
	  });
  
  
	  $scope.$on('$destroy', function(){
		unwatchEditHub();
	  });
	});
  
  'use strict';
  
  angular.module('copayApp.controllers').controller('preferencesInformation',
	function($scope, $log, $timeout, isMobile, gettextCatalog, lodash, profileService, storageService, go, configService) {
	  var constants = require('ocore/constants.js');
	  var fc = profileService.focusedClient;
	  var c = fc.credentials;
  
	  this.init = function() {
		var basePath = c.getBaseAddressDerivationPath();
		var config = configService.getSync().wallet.settings;
  
		$scope.walletName = c.walletName;
		$scope.walletId = c.walletId;
		$scope.network = c.network;
		$scope.derivationStrategy = c.derivationStrategy || 'BIP44';
		$scope.basePath = basePath;
		$scope.M = c.m;
		$scope.N = c.n;
		$scope.addrs = null;
  
		fc.getAddresses({
		  doNotVerify: true
		}, function(err, addrs) {
		  if (err) {
			$log.warn(err);
			return;
		  };
		  /*var last10 = [],
			i = 0,
			e = addrs.pop();
		  while (i++ < 10 && e) {
			e.path = e.path;
			last10.push(e);
			e = addrs.pop();
		  }
		  $scope.addrs = last10;*/
		  $scope.addrs = addrs;
		  $timeout(function() {
			$scope.$apply();
		  });
  
		});
		
		fc.getListOfBalancesOnAddresses(function(listOfBalances) {
			listOfBalances = listOfBalances.map(function(row) {
			  row.amount = profileService.formatAmountWithUnit(row.amount, row.asset, {dontRound: true});
			  return row;
		  });
			//groupBy address
			var assocListOfBalances = {};
			listOfBalances.forEach(function(row) {
			  if (assocListOfBalances[row.address] === undefined) assocListOfBalances[row.address] = [];
			  assocListOfBalances[row.address].push(row);
		  });
			$scope.assocListOfBalances = assocListOfBalances;
			$timeout(function() {
				$scope.$apply();
		  });
		});			
	  };
	  
	  $scope.hasListOfBalances = function() {
		  return !!Object.keys($scope.assocListOfBalances || {}).length;
	  };
  
	  this.sendAddrs = function() {
		var self = this;
  
		if (isMobile.Android() || isMobile.Windows()) {
		  window.ignoreMobilePause = true;
		}
  
		self.loading = true;
  
		function formatDate(ts) {
		  var dateObj = new Date(ts * 1000);
		  if (!dateObj) {
			$log.debug('Error formating a date');
			return 'DateError';
		  }
		  if (!dateObj.toJSON()) {
			return '';
		  }
		  return dateObj.toJSON();
		};
  
		$timeout(function() {
		  fc.getAddresses({
			doNotVerify: true
		  }, function(err, addrs) {
			self.loading = false;
			if (err) {
			  $log.warn(err);
			  return;
			};
  
			var body = 'Obyte Wallet "' + $scope.walletName + '" Addresses.\n\n';
			body += "\n";
			body += addrs.map(function(v) {
			  return ('* ' + v.address + ' ' + v.path + ' ' + formatDate(v.createdOn));
			}).join("\n");
  
			window.plugins.socialsharing.shareViaEmail(
			  body,
			  'Obyte Addresses',
			  null, // TO: must be null or an array
			  null, // CC: must be null or an array
			  null, // BCC: must be null or an array
			  null, // FILES: can be null, a string, or an array
			  function() {},
			  function() {}
			);
  
			$timeout(function() {
			  $scope.$apply();
			}, 1000);
		  });
		}, 100);
	  };
  
	  this.clearTransactionHistory = function() {
		  $scope.$emit('Local/ClearHistory');
  
		  $timeout(function() {
			go.walletHome();
		  }, 100);
	  }
	});
  
  'use strict';
  
  angular.module('copayApp.controllers').controller('preferencesLanguageController',
	function($scope, $log, $timeout, configService, go, uxLanguage) {
  
	  this.availableLanguages = uxLanguage.getLanguages();
  
	  this.save = function(newLang) {
  
		var opts = {
		  wallet: {
			settings: {
			  defaultLanguage: newLang
			}
		  }
		};
  
		configService.set(opts, function(err) {
		  if (err) $log.warn(err);
		  $scope.$emit('Local/LanguageSettingUpdated');
		  $timeout(function() {
			go.preferencesGlobal();
		  }, 100);
		});
	  };
	});
  
  'use strict';
  
  angular.module('copayApp.controllers').controller('preferencesLogs',
  function(historicLog) {
	this.logs = historicLog.get();
  
	this.sendLogs = function() {
	  var body = 'Obyte Session Logs\n Be careful, this could contain sensitive private data\n\n';
	  body += '\n\n';
	  body += this.logs.map(function(v) {
		return v.msg;
	  }).join('\n');
  
	  window.plugins.socialsharing.shareViaEmail(
		body,
		'Obyte Logs',
		null, // TO: must be null or an array
		null, // CC: must be null or an array
		null, // BCC: must be null or an array
		null, // FILES: can be null, a string, or an array
		function() {},
		function() {}
	  );
	};
  });
  
  'use strict';
  
  angular.module('copayApp.controllers').controller('preferencesTorController',
	  function($scope, $log, $timeout, go, configService) {
		  
		  var conf = require('ocore/conf.js');
		  var network = require('ocore/network.js');
		  
		  var bInitialized = false;
		  
		  var root = {};
		  root.socksHost = null;
		  root.socksPort = null;
		  root.socksLocalDNS = false;
		  
		  $scope.errorHostInput = '';
		  $scope.errorPortInput = '';
		  
		  $scope.torEnabled = conf.socksHost && conf.socksPort;
		  configService.get(function(err, confService) {
			  $scope.socksHost = conf.socksHost || confService.socksHost || '127.0.0.1';
			  $scope.socksPort = conf.socksPort || confService.socksPort || '9150';
		  });
		  
		  function setConfAndCloseConnections() {
			  conf.socksHost = root.socksHost;
			  conf.socksPort = root.socksPort;
			  conf.socksLocalDNS = root.socksLocalDNS;
			  network.closeAllWsConnections();
		  }
		  
		  function saveConfToFile(cb) {
			  var fs = require('fs' + '');
			  var desktopApp = require('ocore/desktop_app.js');
			  var appDataDir = desktopApp.getAppDataDir();
			  var confJson;
			  try {
				  confJson = require(appDataDir + '/conf.json');
			  } catch (e) {
				  confJson = {};
			  }
			  confJson.socksHost = root.socksHost;
			  confJson.socksPort = root.socksPort;
			  confJson.socksLocalDNS = root.socksLocalDNS;
			  fs.writeFile(appDataDir + '/conf.json', JSON.stringify(confJson, null, '\t'), 'utf8', function(err) {
				  if (err) {
					  $scope.$emit('Local/DeviceError', err);
					  return;
				  }
				  cb();
			  });
		  }
		  
		  
		  $scope.save = function(close, oldVal) {
			  $scope.socksHost = (!$scope.socksHost) ? '127.0.0.1' : $scope.socksHost;
			  $scope.socksPort = (!$scope.socksPort) ? 9150 : parseInt($scope.socksPort);
			  if (!$scope.socksPort || !($scope.socksPort > 0 && $scope.socksPort <= 65535)) {
				  $scope.errorPortInput = 'Port is invalid';
				  if(!close && !oldVal) $scope.torEnabled = false;
				  return;
			  }
			  $scope.errorPortInput = '';
			  root.socksHost = $scope.torEnabled ? $scope.socksHost : null;
			  root.socksPort = $scope.torEnabled ? $scope.socksPort : null;
			  setConfAndCloseConnections();
			  saveConfToFile(function() {
				  configService.set({
					  socksHost: $scope.socksHost,
					  socksPort: $scope.socksPort
				  }, function(err) {
					  if (err) {
						  $scope.$emit('Local/DeviceError', err);
						  return;
					  }
					  if (close) {
						  $timeout(function() {
							  go.path('preferencesGlobal');
						  }, 50);
					  }
				  });
			  });
		  };
		  
		  
		  var unwatchTorEnabled = $scope.$watch('torEnabled', function(newVal, oldVal) {
			  if (!bInitialized) {
				  bInitialized = true;
				  return;
			  }
			  $scope.save(false, oldVal);
		  });
		  
		  $scope.$on('$destroy', function() {
			  unwatchTorEnabled();
		  });
		  
	  });
  
  'use strict';
  
  angular.module('copayApp.controllers').controller('preferencesUnitController',
	function($rootScope, $scope, $log, configService, go, $deepStateRedirect) {
	  var config = configService.getSync();
	  this.unitName = config.wallet.settings.unitName;
	  this.unitOpts = [
		// TODO : add Satoshis to bitcore-wallet-client formatAmount()
		// {
		//     name: 'Satoshis (100,000,000 satoshis = 1BTC)',
		//     shortName: 'SAT',
		//     value: 1,
		//     decimals: 0,
		//     code: 'sat',
		//   }, 
		/*{
		  name: 'bits (1,000,000 bits = 1BTC)',
		  shortName: 'bits',
		  value: 100,
		  decimals: 2,
		  code: 'bit',
		}*/
		// TODO : add mBTC to bitcore-wallet-client formatAmount()
		// ,{
		//   name: 'mBTC (1,000 mBTC = 1BTC)',
		//   shortName: 'mBTC',
		//   value: 100000,
		//   decimals: 5,
		//   code: 'mbtc',
		// }
		/*, {
		  name: 'BTC',
		  shortName: 'BTC',
		  value: 100000000,
		  decimals: 8,
		  code: 'btc',
		}
		, */{
		  name: 'bytes',
		  shortName: 'bytes',
		  value: 1,
		  decimals: 0,
		  code: 'one',
		}
		, {
		  name: 'kBytes (1,000 bytes)',
		  shortName: 'kB',
		  value: 1000,
		  decimals: 3,
		  code: 'kilo',
		}
		, {
		  name: 'MBytes (1,000,000 bytes)',
		  shortName: 'MB',
		  value: 1000000,
		  decimals: 6,
		  code: 'mega',
		}
		, {
		  name: 'GBytes (1,000,000,000 bytes)',
		  shortName: 'GB',
		  value: 1000000000,
		  decimals: 9,
		  code: 'giga',
		}
	  ];
  
	  this.save = function(newUnit) {
		var opts = {
		  wallet: {
			settings: {
			  unitName: newUnit.shortName,
			  unitValue: newUnit.value,
			  unitDecimals: newUnit.decimals,
			  unitCode: newUnit.code,
			}
		  }
		};
		this.unitName = newUnit.shortName;
  
		configService.set(opts, function(err) {
		  if (err) $log.warn(err);
		  $scope.$emit('Local/UnitSettingUpdated');
		  if ($rootScope.tab === 'send') {
			$deepStateRedirect.reset('walletHome');
			go.path('walletHome', function() {
			  $rootScope.$emit('Local/SetTab', 'send');
			});
		  }
		  else {
			go.preferencesGlobal();
		  }
		});
  
	  };
	  
	  go.onBackButton = function(){
		  console.log('units backbutton');
	  };
	  //console.log('topbar: '+$scope.topbar);
	});
  
  'use strict';
  
  angular.module('copayApp.controllers').controller('preferencesWitnessesController',
	function($scope, go, witnessListService, autoUpdatingWitnessesList, $timeout){
	  var self = this;
	  this.witnesses = [];
	  console.log('preferencesWitnessesController');
  
	  $scope.autoUpdWitnessesList = autoUpdatingWitnessesList.autoUpdate;
  
	  var myWitnesses = require('ocore/my_witnesses.js');
	  myWitnesses.readMyWitnesses(function(arrWitnesses){
		  self.witnesses = arrWitnesses;
		  $timeout(function(){
			  $scope.$apply();
		  });
		  console.log('preferencesWitnessesController set witnesses '+arrWitnesses);
	  }, 'wait');
  
	  this.edit = function(witness) {
		if ($scope.autoUpdWitnessesList) return;
  
		witnessListService.currentWitness = witness;
		go.path('preferencesGlobal.preferencesWitnesses.preferencesEditWitness');
	  };
  
  
	  var unwatchAutoUpdWitnessesList = $scope.$watch('autoUpdWitnessesList', function(val){
		autoUpdatingWitnessesList.setAutoUpdate(val);
  
		if (val) {
		  autoUpdatingWitnessesList.checkChangeWitnesses();
		}
	  });
  
	  $scope.$on('$destroy', function(){
		unwatchAutoUpdWitnessesList();
	  });
	});
  
  'use strict';
  
  angular.module('copayApp.controllers').controller('recoveryFromSeed',
	  function ($rootScope, $scope, $log, $timeout, profileService) {
  
		  var async = require('async');
		  var conf = require('ocore/conf.js');
		  var wallet_defined_by_keys = require('ocore/wallet_defined_by_keys.js');
		  var objectHash = require('ocore/object_hash.js');
		  try{
			  var ecdsa = require('secp256k1');
		  }
		  catch(e){
			  var ecdsa = require('ocore/node_modules/secp256k1' + '');
		  }
		  var Mnemonic = require('bitcore-mnemonic');
		  var Bitcore = require('bitcore-lib');
		  var db = require('ocore/db.js');
		  var network = require('ocore/network');
		  var myWitnesses = require('ocore/my_witnesses');
  
		  var self = this;
  
		  self.error = '';
		  self.bLight = conf.bLight;
		  self.scanning = false;
		  self.inputMnemonic = '';
		  self.xPrivKey = '';
		  self.assocIndexesToWallets = {};
  
		  function determineIfAddressUsed(address, cb) {
			  db.query("SELECT 1 FROM outputs WHERE address = ? LIMIT 1", [address], function(outputsRows) {
				  if (outputsRows.length === 1)
					  cb(true);
				  else {
					  db.query("SELECT 1 FROM unit_authors WHERE address = ? LIMIT 1", [address], function(unitAuthorsRows) {
						  cb(unitAuthorsRows.length === 1);
					  });
				  }
			  });
		  }
  
		  function scanForAddressesAndWallets(mnemonic, cb) {
			  self.xPrivKey = new Mnemonic(mnemonic).toHDPrivateKey();
			  var xPubKey;
			  var lastUsedAddressIndex = -1;
			  var lastUsedWalletIndex = -1;
			  var currentAddressIndex = 0;
			  var currentWalletIndex = 0;
			  var assocMaxAddressIndexes = {};
  
			  function checkAndAddCurrentAddress(is_change) {
				  var address = objectHash.getChash160(["sig", {"pubkey": wallet_defined_by_keys.derivePubkey(xPubKey, 'm/' + is_change + '/' + currentAddressIndex)}]);
				  determineIfAddressUsed(address, function(bUsed) {
					  if (bUsed) {
						  lastUsedAddressIndex = currentAddressIndex;
						  if (!assocMaxAddressIndexes[currentWalletIndex]) assocMaxAddressIndexes[currentWalletIndex] = {main: 0};
						  if (is_change) {
							  assocMaxAddressIndexes[currentWalletIndex].change = currentAddressIndex;
						  } else {
							  assocMaxAddressIndexes[currentWalletIndex].main = currentAddressIndex;
						  }
						  currentAddressIndex++;
						  checkAndAddCurrentAddress(is_change);
					  } else {
						  currentAddressIndex++;
						  if (currentAddressIndex - lastUsedAddressIndex >= 20) {
							  if (is_change) {
								  if (lastUsedAddressIndex !== -1) {
									  lastUsedWalletIndex = currentWalletIndex;
								  }
								  if (currentWalletIndex - lastUsedWalletIndex >= 20) {
									  cb(assocMaxAddressIndexes);
								  } else {
									  currentWalletIndex++;
									  setCurrentWallet();
								  }
							  } else {
								  currentAddressIndex = 0;
								  checkAndAddCurrentAddress(1);
							  }
						  } else {
							  checkAndAddCurrentAddress(is_change);
						  }
					  }
				  })
			  }
  
			  function setCurrentWallet() {
				  xPubKey = Bitcore.HDPublicKey(self.xPrivKey.derive("m/44'/0'/" + currentWalletIndex + "'"));
				  lastUsedAddressIndex = -1;
				  currentAddressIndex = 0;
				  checkAndAddCurrentAddress(0);
			  }
  
			  setCurrentWallet();
		  }
  
		  function removeAddressesAndWallets(cb) {
			  var arrQueries = [];
			  db.addQuery(arrQueries, "DELETE FROM pending_shared_address_signing_paths");
			  db.addQuery(arrQueries, "DELETE FROM shared_address_signing_paths");
			  db.addQuery(arrQueries, "DELETE FROM pending_shared_addresses");
			  db.addQuery(arrQueries, "DELETE FROM shared_addresses");
			  db.addQuery(arrQueries, "DELETE FROM my_addresses");
			  db.addQuery(arrQueries, "DELETE FROM wallet_signing_paths");
			  db.addQuery(arrQueries, "DELETE FROM extended_pubkeys");
			  db.addQuery(arrQueries, "DELETE FROM wallets");
			  db.addQuery(arrQueries, "DELETE FROM correspondent_devices");
  
			  async.series(arrQueries, cb);
		  }
  
		  function createAddresses(assocMaxAddressIndexes, cb) {
			  var accounts = Object.keys(assocMaxAddressIndexes);
			  var currentAccount = 0;
  
			  function addAddress(wallet, is_change, index, maxIndex) {
				  wallet_defined_by_keys.issueAddress(wallet, is_change, index, function(addressInfo) {
					  index++;
					  if (index <= maxIndex) {
						  addAddress(wallet, is_change, index, maxIndex);
					  } else {
						  if (is_change) {
							  currentAccount++;
							  (currentAccount < accounts.length) ? startAddToNewWallet(0) : cb();
						  } else {
							  startAddToNewWallet(1);
						  }
					  }
				  });
			  }
  
			  function startAddToNewWallet(is_change) {
				  if (is_change) {
					  if (assocMaxAddressIndexes[accounts[currentAccount]].change !== undefined) {
						  addAddress(self.assocIndexesToWallets[accounts[currentAccount]], 1, 0, assocMaxAddressIndexes[accounts[currentAccount]].change);
					  } else {
						  currentAccount++;
						  (currentAccount < accounts.length) ? startAddToNewWallet(0) : cb();
					  }
				  } else {
					  var maxIndex = assocMaxAddressIndexes[accounts[currentAccount]].main ? (assocMaxAddressIndexes[accounts[currentAccount]].main + 20) : 0;
					  addAddress(self.assocIndexesToWallets[accounts[currentAccount]], 0, 0, maxIndex);
				  }
			  }
  
  
			  startAddToNewWallet(0);
		  }
  
		  function createWallets(arrWalletIndexes, assocMaxAddressIndexes, cb) {
  
			  function createWallet(n) {
				  var account = parseInt(arrWalletIndexes[n]);
				  var opts = {};
				  opts.m = 1;
				  opts.n = 1;
				  opts.name = 'Wallet #' + account;
				  opts.network = 'livenet';
				  opts.cosigners = [];
				  opts.extendedPrivateKey = self.xPrivKey;
				  opts.mnemonic = self.inputMnemonic;
				  opts.account = account;
				  opts.isSingleAddress = assocMaxAddressIndexes[account].main === 0 && assocMaxAddressIndexes[account].change === undefined;
  
				  profileService.createWallet(opts, function(err, walletId) {
					  if (opts.isSingleAddress)
						  profileService.setSingleAddressFlag(true);
					  self.assocIndexesToWallets[account] = walletId;
					  n++;
					  (n < arrWalletIndexes.length) ? createWallet(n) : cb();
				  });
			  }
  
			  createWallet(0);
		  }
  
		  function scanForAddressesAndWalletsInLightClient(mnemonic, cb) {
			  self.xPrivKey = new Mnemonic(mnemonic).toHDPrivateKey();
			  var xPubKey;
			  var currentWalletIndex = 0;
			  var lastUsedWalletIndex = -1;
			  var assocMaxAddressIndexes = {};
  
			  function checkAndAddCurrentAddresses(is_change) {
				  var type = is_change ? 'change' : 'main';
				  var batchSize = assocMaxAddressIndexes[currentWalletIndex] ? 20 : 1; // first invocation checks only 1 address to detect single-address wallets
				  if (!assocMaxAddressIndexes[currentWalletIndex])
					  assocMaxAddressIndexes[currentWalletIndex] = {};
				  var arrTmpAddresses = [];
				  var startIndex = (assocMaxAddressIndexes[currentWalletIndex][type] === undefined) ? 0 : (assocMaxAddressIndexes[currentWalletIndex][type] + 1);
				  for (var i = 0; i < batchSize; i++) {
					  var index = startIndex + i;
					  arrTmpAddresses.push(objectHash.getChash160(["sig", {"pubkey": wallet_defined_by_keys.derivePubkey(xPubKey, 'm/' + is_change + '/' + index)}]));
				  }
				  myWitnesses.readMyWitnesses(function (arrWitnesses) {
					  network.requestFromLightVendor('light/get_history', {
						  addresses: arrTmpAddresses,
						  witnesses: arrWitnesses
					  }, function (ws, request, response) {
						  if(response && response.error){
							  var breadcrumbs = require('ocore/breadcrumbs.js');
							  breadcrumbs.add('Error scanForAddressesAndWalletsInLightClient: ' + response.error);
							  self.error = 'When scanning an error occurred, please try again later.';
							  self.scanning = false;
							  $timeout(function () {
								  $rootScope.$apply();
							  });
							  return;
						  }
						  if (Object.keys(response).length) {
							  lastUsedWalletIndex = currentWalletIndex;
							  assocMaxAddressIndexes[currentWalletIndex][type] = startIndex + batchSize - 1;
							  checkAndAddCurrentAddresses(is_change);
						  } else {
							  if (batchSize === 1) // not a single-address wallet, retry for multi-address wallet
								  return checkAndAddCurrentAddresses(is_change);
							  if (is_change) {
								  if(assocMaxAddressIndexes[currentWalletIndex].change === undefined && assocMaxAddressIndexes[currentWalletIndex].main === undefined)
									  delete assocMaxAddressIndexes[currentWalletIndex];
								  currentWalletIndex++;
								  if(currentWalletIndex - lastUsedWalletIndex > 3){
									  cb(assocMaxAddressIndexes);
								  }else{
									  setCurrentWallet();
								  }
							  } else {
								  checkAndAddCurrentAddresses(1);
							  }
						  }
					  });
				  });
			  }
  
			  function setCurrentWallet() {
				  xPubKey = Bitcore.HDPublicKey(self.xPrivKey.derive("m/44'/0'/" + currentWalletIndex + "'"));
				  checkAndAddCurrentAddresses(0);
			  }
  
			  setCurrentWallet();
		  }
  
		  function cleanAndAddWalletsAndAddresses(assocMaxAddressIndexes) {
			  var device = require('ocore/device');
			  var arrWalletIndexes = Object.keys(assocMaxAddressIndexes);
			  if (arrWalletIndexes.length) {
				  removeAddressesAndWallets(function () {
					  var myDeviceAddress = objectHash.getDeviceAddress(ecdsa.publicKeyCreate(self.xPrivKey.derive("m/1'").privateKey.bn.toBuffer({size: 32}), true).toString('base64'));
					  profileService.replaceProfile(self.xPrivKey.toString(), self.inputMnemonic, myDeviceAddress, function () {
						  device.setDevicePrivateKey(self.xPrivKey.derive("m/1'").privateKey.bn.toBuffer({size: 32}));
						  createWallets(arrWalletIndexes, assocMaxAddressIndexes, function () {
							  createAddresses(assocMaxAddressIndexes, function () {
								  self.scanning = false;
								  $rootScope.$emit('Local/ShowAlert', arrWalletIndexes.length + " wallets recovered, please restart the application to finish.", 'fi-check', function () {
									  if (navigator && navigator.app) // android
										  navigator.app.exitApp();
									  else if (process.exit) // nwjs
										  process.exit();
								  });
							  });
						  });
					  });
				  });
			  } else {
				  self.error = 'No active addresses found.';
				  self.scanning = false;
				  $timeout(function () {
					  $rootScope.$apply();
				  });
			  }
		  }
  
		  self.recoveryForm = function() {
			  if (self.inputMnemonic) {
				  self.error = '';
				  self.inputMnemonic = self.inputMnemonic.toLowerCase();
				  if ((self.inputMnemonic.split(' ').length % 3 === 0) && Mnemonic.isValid(self.inputMnemonic)) {
					  self.scanning = true;
					  if (self.bLight) {
						  scanForAddressesAndWalletsInLightClient(self.inputMnemonic, cleanAndAddWalletsAndAddresses);
					  } else {
						  scanForAddressesAndWallets(self.inputMnemonic, cleanAndAddWalletsAndAddresses);
					  }
				  } else {
					  self.error = 'Seed is not valid';
				  }
			  }
		  }
  
	  });
  
  'use strict';
  
  angular.module('copayApp.controllers').controller('sidebarController',
	function($rootScope, $timeout, lodash, profileService, configService, go, isMobile, isCordova, backButton) {
	  var self = this;
	  self.isWindowsPhoneApp = isMobile.Windows() && isCordova;
	  self.walletSelection = false;
  
	  // wallet list change
	  $rootScope.$on('Local/WalletListUpdated', function(event) {
		self.walletSelection = false;
		self.setWallets();
	  });
  
	  $rootScope.$on('Local/ColorUpdated', function(event) {
		self.setWallets();
	  });
  
	  $rootScope.$on('Local/AliasUpdated', function(event) {
		self.setWallets();
	  });
  
  
	  self.signout = function() {
		profileService.signout();
	  };
  
	  self.switchWallet = function(selectedWalletId, currentWalletId) {
		  backButton.menuOpened = false;
		if (selectedWalletId == currentWalletId) return;
		self.walletSelection = false;
		profileService.setAndStoreFocus(selectedWalletId, function() {
		});
	  };
  
	  self.toggleWalletSelection = function() {
		self.walletSelection = !self.walletSelection;
		if (!self.walletSelection) return;
		self.setWallets();
	  };
  
	  self.setWallets = function() {
		if (!profileService.profile) return;
		var config = configService.getSync();
		config.colorFor = config.colorFor || {};
		config.aliasFor = config.aliasFor || {};
		var ret = lodash.map(profileService.profile.credentials, function(c) {
		  return {
			m: c.m,
			n: c.n,
			name: config.aliasFor[c.walletId] || c.walletName,
			id: c.walletId,
			color: config.colorFor[c.walletId] || '#4A90E2',
		  };
		});
		self.wallets = lodash.sortBy(ret, 'name');
	  };
  
	  self.setWallets();
  
	});
  
  'use strict';
  
  angular.module('copayApp.controllers').controller('splashController',
	function($scope, $timeout, $log, configService, profileService, storageService, go, isCordova) {
	  
	  var self = this;
	  
	  this.saveDeviceName = function(){
		  console.log('saveDeviceName: '+self.deviceName);
		  var device = require('ocore/device.js');
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
		  var desktopApp = require('ocore/desktop_app.js');
		  var appDataDir = desktopApp.getAppDataDir();
		  var userConfFile = appDataDir + '/conf.json';
		  fs.writeFile(userConfFile, JSON.stringify({bLight: bLight}, null, '\t'), 'utf8', function(err){
			  if (err)
				  throw Error('failed to write conf.json: '+err);
			  var conf = require('ocore/conf.js');
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
  
  'use strict';
  
  angular.module('copayApp.controllers').controller('topbarController', function($scope, $rootScope, go) {
  
	  this.onQrCodeScanned = function(data) {
		  go.handleUri(data);
		  //$rootScope.$emit('dataScanned', data);
	  };
  
	  this.openSendScreen = function() {
		  go.send();
	  };
  
	  this.onBeforeScan = function() {
	  };
  
	  this.goHome = function() {
		  go.walletHome();
	  };
  
  });
  
  'use strict';
  
  angular.module('copayApp.controllers').controller('versionController', function() {
	this.version = window.version;
	this.commitHash = window.commitHash;
  });
  
  'use strict';
  
  angular.module('copayApp.controllers').controller('versionAndWalletTypeController', function() {
	  
	  // wallet type
	  var conf = require('ocore/conf.js');
	  //this.type = (conf.bLight ? 'light wallet' : 'full wallet');
	  this.type = (conf.bLight ? 'light' : '');
  
	  // version
	  this.version = window.version;
	  this.commitHash = window.commitHash;
  });
  
  'use strict';
  
  var constants = require('ocore/constants.js');
  var eventBus = require('ocore/event_bus.js');
  var breadcrumbs = require('ocore/breadcrumbs.js');
  var ValidationUtils = require('ocore/validation_utils.js');
  
  angular.module('copayApp.controllers')
	  .controller('walletHomeController', function($scope, $rootScope, $timeout, $filter, $modal, $log, notification, isCordova, profileService, lodash, configService, storageService, gettext, gettextCatalog, nodeWebkit, addressService, confirmDialog, animationService, addressbookService, correspondentListService, newVersion, autoUpdatingWitnessesList, go, aliasValidationService) {
  
		  var self = this;
		  var home = this;
		  $scope.Math = window.Math;
		  var conf = require('ocore/conf.js');
		  var chatStorage = require('ocore/chat_storage.js');
		  this.bb_protocol = conf.program;
		  this.protocol = conf.program.replace(/byteball/i, 'obyte');
		  $rootScope.hideMenuBar = false;
		  $rootScope.wpInputFocused = false;
		  var config = configService.getSync();
		  var configWallet = config.wallet;
		  var indexScope = $scope.index;
		  var network = require('ocore/network.js');
  
		  // INIT
		  var walletSettings = configWallet.settings;
		  this.unitValue = walletSettings.unitValue;
		  this.bbUnitValue = walletSettings.bbUnitValue;
		  this.unitName = walletSettings.unitName;
		  this.bbUnitName = walletSettings.bbUnitName;
		  this.unitDecimals = walletSettings.unitDecimals;
		  this.isCordova = isCordova;
		  this.addresses = [];
		  this.isMobile = isMobile.any();
		  this.isWindowsPhoneApp = isMobile.Windows() && isCordova;
		  this.blockUx = false;
		  this.showScanner = false;
		  this.addr = {};
		  this.isTestnet = constants.version.match(/t$/);
		  this.testnetName = (constants.alt === '2') ? '[NEW TESTNET]' : '[TESTNET]';
		  this.exchangeRates = network.exchangeRates;
		  $scope.index.tab = 'walletHome'; // for some reason, current tab state is tracked in index and survives re-instatiations of walletHome.js
  
		  var disablePaymentRequestListener = $rootScope.$on('paymentRequest', function(event, address, amount, asset, recipient_device_address) {
			  console.log('paymentRequest event ' + address + ', ' + amount);
			  $rootScope.$emit('Local/SetTab', 'send');
			  self.setForm(address, amount, null, asset, recipient_device_address);
  
			  /*var form = $scope.sendPaymentForm;
			  if (form.address && form.address.$invalid && !self.blockUx) {
				  console.log("invalid address, resetting form");
				  self.resetForm();
				  self.error = gettext('Could not recognize a valid Obyte QR Code');
			  }*/
		  });
  
		  var disableDataPromptListener = $rootScope.$on('dataPrompt', function(event, dataPrompt) {
			  console.log('dataPrompt event ', dataPrompt);
			  $rootScope.$emit('Local/SetTab', 'send');
			  self.setDataForm(dataPrompt);
		  });
  
		  var disablePaymentUriListener = $rootScope.$on('paymentUri', function(event, uri) {
			  $timeout(function() {
				  $rootScope.$emit('Local/SetTab', 'send');
				  self.setForm(uri);
			  }, 100);
		  });
  
		  var disableAddrListener = $rootScope.$on('Local/NeedNewAddress', function() {
			  self.setAddress(true);
		  });
  
		  var disableFocusListener = $rootScope.$on('Local/NewFocusedWallet', function() {
			  self.addr = {};
			  self.resetForm();
			  self.setAddress();
		  });
  
		  var disableResumeListener = $rootScope.$on('Local/Resume', function() {
			  // This is needed then the apps go to sleep
			  // looks like it already works ok without rebinding touch events after every resume
			  //self.bindTouchDown();
		  });
  
		  var disableTabListener = $rootScope.$on('Local/TabChanged', function(e, tab) {
			  // This will slow down switch, do not add things here!
			  console.log("tab changed " + tab);
			  switch (tab) {
				  case 'receive':
					  // just to be sure we have an address
					  self.setAddress();
					  break;
				  case 'history':
					  $rootScope.$emit('Local/NeedFreshHistory');
					  break;
				  case 'send':
					  self.resetError();
			  };
		  });
  
		  var disableOngoingProcessListener = $rootScope.$on('Addon/OngoingProcess', function(e, name) {
			  self.setOngoingProcess(name);
		  });
  
		  function onNewWalletAddress(new_address) {
			  console.log("==== NEW ADDRESSS " + new_address);
			  self.addr = {};
			  self.setAddress();
		  }
  
		  eventBus.on("new_wallet_address", onNewWalletAddress);
  
		  $scope.$on('$destroy', function() {
			  console.log("walletHome $destroy");
			  disableAddrListener();
			  disablePaymentRequestListener();
			  disableDataPromptListener();
			  disablePaymentUriListener();
			  disableTabListener();
			  disableFocusListener();
			  disableResumeListener();
			  disableOngoingProcessListener();
			  disableClaimTextcoinListener();
			  $rootScope.hideMenuBar = false;
			  eventBus.removeListener("new_wallet_address", onNewWalletAddress);
		  });
  
		  //$rootScope.$digest();
  
		  var accept_msg = gettextCatalog.getString('Accept');
		  var cancel_msg = gettextCatalog.getString('Cancel');
		  var confirm_msg = gettextCatalog.getString('Confirm');
  
		  $scope.openDestinationAddressModal = function(wallets, address) {
			  $rootScope.modalOpened = true;
			  var fc = profileService.focusedClient;
			  //self.resetForm();
  
			  var ModalInstanceCtrl = function($scope, $modalInstance) {
				  $scope.wallets = wallets;
				  $scope.editAddressbook = false;
				  $scope.addAddressbookEntry = false;
				  $scope.selectedAddressbook = {};
				  $scope.newAddress = address;
				  $scope.addressbook = {
					  'address': ($scope.newAddress || ''),
					  'label': ''
				  };
				  $scope.color = fc.backgroundColor;
				  $scope.bAllowAddressbook = self.canSendExternalPayment();
  
				  $scope.beforeQrCodeScann = function() {
					  $scope.error = null;
					  $scope.addAddressbookEntry = true;
					  $scope.editAddressbook = false;
				  };
  
				  $scope.onQrCodeScanned = function(data, addressbookForm) {
					  $timeout(function() {
						  var form = addressbookForm;
						  if (data && form) {
							  data = data.replace(self.protocol + ':', '');
							  data = data.replace(self.bb_protocol + ':', '');
							  form.address.$setViewValue(data);
							  form.address.$isValid = true;
							  form.address.$render();
						  }
						  
						  $scope.$digest();
					  }, 100);
				  };
  
				  $scope.selectAddressbook = function(addr) {
					  $modalInstance.close(addr);
				  };
  
				  $scope.toggleEditAddressbook = function() {
					  $scope.editAddressbook = !$scope.editAddressbook;
					  $scope.selectedAddressbook = {};
					  $scope.addAddressbookEntry = false;
				  };
  
				  $scope.toggleSelectAddressbook = function(addr) {
					  $scope.selectedAddressbook[addr] = $scope.selectedAddressbook[addr] ? false : true;
				  };
  
				  $scope.toggleAddAddressbookEntry = function() {
					  $scope.error = null;
					  $scope.addressbook = {
						  'address': ($scope.newAddress || ''),
						  'label': ''
					  };
					  $scope.addAddressbookEntry = !$scope.addAddressbookEntry;
				  };
  
				  $scope.listEntries = function() {
					  $scope.error = null;
					  addressbookService.list(function(err, ab) {
						  if (err) {
							  $scope.error = err;
							  return;
						  }
						  $scope.list = ab;
						  $timeout(function() {
							  $scope.$digest();
						  });
					  });
				  };
  
				  $scope.add = function(addressbook) {
					  $scope.error = null;
					  $timeout(function() {
						  addressbookService.add(addressbook, function(err, ab) {
							  if (err) {
								  $scope.error = err;
								  return;
							  }
							  $rootScope.$emit('Local/AddressbookUpdated', ab);
							  $scope.list = ab;
							  $scope.editAddressbook = true;
							  $scope.toggleEditAddressbook();
							  $scope.$digest();
						  });
					  }, 100);
				  };
  
				  $scope.remove = function(addr) {
					  $scope.error = null;
					  $timeout(function() {
						  addressbookService.remove(addr, function(err, ab) {
							  if (err) {
								  $scope.error = err;
								  return;
							  }
							  $rootScope.$emit('Local/AddressbookUpdated', ab);
							  $scope.list = ab;
							  $scope.$digest();
						  });
					  }, 100);
				  };
  
				  $scope.cancel = function() {
					  breadcrumbs.add('openDestinationAddressModal cancel');
					  $modalInstance.dismiss('cancel');
				  };
  
				  $scope.selectWallet = function(walletId, walletName) {
					  //$scope.gettingAddress = true; // this caused a weird hang under cordova if used after pulling "..." drop-up menu in chat
					  $scope.selectedWalletName = walletName;
					  //$timeout(function() { // seems useless
					  //  $scope.$apply();
					  //});
					  addressService.getAddress(walletId, false, function onGotAddress(err, addr) {
						  $scope.gettingAddress = false;
  
						  if (err) {
							  self.error = err;
							  breadcrumbs.add('openDestinationAddressModal getAddress err: ' + err);
							  $modalInstance.dismiss('cancel');
							  return;
						  }
  
						  $modalInstance.close(addr);
					  });
				  };
			  };
  
			  var modalInstance = $modal.open({
				  templateUrl: 'views/modals/destination-address.html',
				  windowClass: animationService.modalAnimated.slideUp,
				  controller: ModalInstanceCtrl,
			  });
  
			  var disableCloseModal = $rootScope.$on('closeModal', function() {
				  breadcrumbs.add('openDestinationAddressModal on closeModal');
				  modalInstance.dismiss('cancel');
			  });
  
			  modalInstance.result.finally(function() {
				  $rootScope.modalOpened = false;
				  disableCloseModal();
				  var m = angular.element(document.getElementsByClassName('reveal-modal'));
				  m.addClass(animationService.modalAnimated.slideOutDown);
			  });
  
			  modalInstance.result.then(function onDestModalDone(addr) {
				  if (addr) {
					  self.setToAddress(addr);
				  }
			  });
		  };
  
		  $scope.openSharedAddressDefinitionModal = function(address) {
			  $rootScope.modalOpened = true;
			  var fc = profileService.focusedClient;
  
			  var ModalInstanceCtrl = function($scope, $modalInstance) {
				  $scope.color = fc.backgroundColor;
				  $scope.address = address;
				  $scope.shared_address_cosigners = indexScope.shared_address_cosigners;
  
				  var walletGeneral = require('ocore/wallet_general.js');
				  var walletDefinedByAddresses = require('ocore/wallet_defined_by_addresses.js');
				  walletGeneral.readMyAddresses(function(arrMyAddresses) {
					  walletDefinedByAddresses.readSharedAddressDefinition(address, function(arrDefinition, creation_ts) {
						  walletDefinedByAddresses.readSharedAddressPeers(address, function(assocPeerNamesByAddress) {
							  $scope.humanReadableDefinition = correspondentListService.getHumanReadableDefinition(arrDefinition, arrMyAddresses, [], assocPeerNamesByAddress, true);
							  $scope.creation_ts = creation_ts;
							  $timeout(function() {
								  $scope.$apply();
							  });
						  });
					  });
				  });
  
				  // clicked a link in the definition
				  $scope.sendPayment = function(address, amount, asset) {
					  if (asset && indexScope.arrBalances.filter(function(balance) {
							  return (balance.asset === asset);
						  })
						  .length === 0)
						  return console.log("i do not own anything of asset " + asset);
					  $modalInstance.dismiss('done');
					  $timeout(function() {
						  indexScope.shared_address = null;
						  indexScope.updateAll();
						  indexScope.updateTxHistory();
						  $rootScope.$emit('paymentRequest', address, amount, asset);
					  });
				  };
  
				  $scope.cancel = function() {
					  breadcrumbs.add('openSharedAddressDefinitionModal cancel');
					  $modalInstance.dismiss('cancel');
				  };
  
			  };
  
			  var modalInstance = $modal.open({
				  templateUrl: 'views/modals/address-definition.html',
				  windowClass: animationService.modalAnimated.slideUp,
				  controller: ModalInstanceCtrl,
			  });
  
			  var disableCloseModal = $rootScope.$on('closeModal', function() {
				  breadcrumbs.add('openSharedAddressDefinitionModal on closeModal');
				  modalInstance.dismiss('cancel');
			  });
  
			  modalInstance.result.finally(function() {
				  $rootScope.modalOpened = false;
				  disableCloseModal();
				  var m = angular.element(document.getElementsByClassName('reveal-modal'));
				  m.addClass(animationService.modalAnimated.slideOutDown);
			  });
  
		  };
  
		  this.openTxpModal = function(tx, copayers) {
			  // deleted, maybe restore from copay sometime later
			  // actually, nothing to display here that was not already shown
		  };
  
		  this.setAddress = function(forceNew) {
			  self.addrError = null;
			  var fc = profileService.focusedClient;
			  if (!fc)
				  return;
  
			  // Address already set?
			  if (!forceNew && self.addr[fc.credentials.walletId])
				  return;
  
			  if (indexScope.shared_address && forceNew)
				  throw Error('attempt to generate for shared address');
  
			  if (fc.isSingleAddress && forceNew)
				  throw Error('attempt to generate for single address wallets');
  
			  self.generatingAddress = true;
			  $timeout(function() {
				  addressService.getAddress(fc.credentials.walletId, forceNew, function(err, addr) {
					  self.generatingAddress = false;
  
					  if (err) {
						  self.addrError = err;
					  }
					  else {
						  if (addr)
							  self.addr[fc.credentials.walletId] = addr;
					  }
  
					  $timeout(function() {
						  $scope.$digest();
					  });
				  });
			  });
		  };
  
		  this.copyAddress = function(addr) {
			  if (isCordova) {
				  window.cordova.plugins.clipboard.copy(addr);
				  window.plugins.toast.showShortCenter(gettextCatalog.getString('Copied to clipboard'));
			  }
			  else if (nodeWebkit.isDefined()) {
				  nodeWebkit.writeToClipboard(addr);
			  }
		  };
  
		  this.shareAddress = function(addr) {
			  if (isCordova) {
				  if (isMobile.Android() || isMobile.Windows()) {
					  window.ignoreMobilePause = true;
				  }
				  window.plugins.socialsharing.shareWithOptions({message: "My Obyte address " + self.protocol +  ':' + addr, subject: "My Obyte address"/*, url: self.protocol +  ':' + addr*/}, function(){}, function(){});
			  }
		  };
  
		  this.openCustomizedAmountModal = function(addr) {
			  $rootScope.modalOpened = true;
			  var self = this;
			  var fc = profileService.focusedClient;
			  var ModalInstanceCtrl = function($scope, $modalInstance) {
				  $scope.addr = addr;
				  $scope.color = fc.backgroundColor;
				  $scope.unitName = self.unitName;
				  $scope.unitValue = self.unitValue;
				  $scope.unitDecimals = self.unitDecimals;
				  $scope.bbUnitValue = walletSettings.bbUnitValue;
				  $scope.bbUnitName = walletSettings.bbUnitName;
				  $scope.isCordova = isCordova;
				  $scope.buttonLabel = gettextCatalog.getString('Generate QR Code');
				  $scope.protocol = conf.program.replace(/byteball/i, 'obyte');
  
				  Object.defineProperty($scope, "_customAmount", {
					  get: function() {
						  return $scope.customAmount;
					  },
					  set: function(newValue) {
						  $scope.customAmount = newValue;
					  },
					  enumerable: true,
					  configurable: true
				  });
  
				  $scope.submitForm = function(form) {
					  if ($scope.index.arrBalances.length === 0)
						  return console.log('openCustomizedAmountModal: no balances yet');
					  var amount = form.amount.$modelValue;
					  var assetInfo = $scope.index.arrBalances[$scope.index.assetIndex];
					  var asset = assetInfo.asset;
					  if (!asset)
						  throw Error("no asset");
					  var amountInSmallestUnits = profileService.getAmountInSmallestUnits(amount, asset);
					  $timeout(function() {
						  $scope.customizedAmountUnit =
							  amount + ' ' + ((asset === 'base') ? $scope.unitName : (asset === constants.BLACKBYTES_ASSET ? $scope.bbUnitName : (assetInfo.name || 'of ' + asset)));
						  $scope.amountInSmallestUnits = amountInSmallestUnits;
						  $scope.asset_param = (asset === 'base') ? '' : '&asset=' + encodeURIComponent(asset);
					  }, 1);
				  };
  
				  $scope.shareAddress = function(uri) {
					  if (isCordova) {
						  if (isMobile.Android() || isMobile.Windows())
							  window.ignoreMobilePause = true;
						  window.plugins.socialsharing.share(uri, null, null, null);
					  }
				  };
  
				  $scope.cancel = function() {
					  breadcrumbs.add('openCustomizedAmountModal: cancel');
					  $modalInstance.dismiss('cancel');
				  };
			  };
  
			  var modalInstance = $modal.open({
				  templateUrl: 'views/modals/customized-amount.html',
				  windowClass: animationService.modalAnimated.slideUp,
				  controller: ModalInstanceCtrl,
				  scope: $scope
			  });
  
			  var disableCloseModal = $rootScope.$on('closeModal', function() {
				  breadcrumbs.add('openCustomizedAmountModal: on closeModal');
				  modalInstance.dismiss('cancel');
			  });
  
			  modalInstance.result.finally(function() {
				  $rootScope.modalOpened = false;
				  disableCloseModal();
				  var m = angular.element(document.getElementsByClassName('reveal-modal'));
				  m.addClass(animationService.modalAnimated.slideOutDown);
			  });
		  };
  
		  this.openClaimTextcoinModal = function(addr) {
			  $rootScope.modalOpened = true;
			  var fc = profileService.focusedClient;
			  var ModalInstanceCtrl = function($scope, $modalInstance) {
				  $scope.color = fc.backgroundColor;
				  $scope.buttonLabel = gettextCatalog.getString('Claim funds');
  
				  $scope.submitForm = function(form) {
					  $modalInstance.close(form.mnemonic.$modelValue);
				  };
  
				  $scope.cancel = function() {
					  breadcrumbs.add('openCustomizedAmountModal: cancel');
					  $modalInstance.dismiss('cancel');
				  };
			  };
  
			  var modalInstance = $modal.open({
				  templateUrl: 'views/modals/claim-textcoin.html',
				  windowClass: animationService.modalAnimated.slideUp,
				  controller: ModalInstanceCtrl,
				  scope: $scope
			  });
  
			  var disableCloseModal = $rootScope.$on('closeModal', function() {
				  breadcrumbs.add('openClaimTextcoinModal: on closeModal');
				  modalInstance.dismiss('cancel');
			  });
  
			  modalInstance.result.finally(function(val) {
				  $rootScope.modalOpened = false;
				  disableCloseModal();
				  var m = angular.element(document.getElementsByClassName('reveal-modal'));
				  m.addClass(animationService.modalAnimated.slideOutDown);
			  });
  
			  modalInstance.result.then(function(mnemonic) {
				  if (mnemonic) {
					  claimTextCoin(mnemonic, addr);
				  }
			  });
		  };
  
		  function claimTextCoin(mnemonic, addr) {
			  var wallet = require('ocore/wallet.js');
			  $rootScope.$emit('process_status_change', 'claiming', true);
			  wallet.receiveTextCoin(mnemonic, addr, function(err, unit, asset) {
				  $timeout(function() {
					  $rootScope.$emit('closeModal');
					  if (err) {
						  if (err.indexOf("not confirmed") !== -1) {
							  store_mnemonic_back();
						  }
						  $rootScope.$emit('process_status_change', 'claiming', false);
						  return $rootScope.$emit('Local/ShowErrorAlert', err);
					  }
					  if (asset) {
						  var disableBalanceListener = $rootScope.$on('Local/BalanceUpdated', function(assocBalances) {
							  var assetIndex = lodash.findIndex(indexScope.arrBalances, {
								  asset: asset
							  });
							  indexScope.assetIndex = assetIndex;
							  indexScope.updateTxHistory();
							  $rootScope.$emit('Local/SetTab', 'history', null, true);
							  disableBalanceListener();
						  });
						  indexScope.updateAll();
					  } else {
						  indexScope.assetIndex = 0;
						  indexScope.updateAll({triggerTxUpdate: true});
						  $rootScope.$emit('Local/SetTab', 'history', null, true);
					  }
					  $scope.$digest();
					  $rootScope.$emit('process_status_change', 'claiming', false);
				  });
			  });
		  }
	  
		  var disableClaimTextcoinListener = $rootScope.$on('claimTextcoin', function(event, mnemonic) {
			  breadcrumbs.add("received claimTextcoin event with mnemonic: " + mnemonic.substr(0, 10) + "...");
			  var addr = self.addr[profileService.focusedClient.credentials.walletId];
			  if (addr) {
				  claimTextCoin(mnemonic, addr);
			  } else {
				  addressService.getAddress(profileService.focusedClient.credentials.walletId, false, function(err, addr) {
					  if (addr) {
						  self.addr[profileService.focusedClient.credentials.walletId] = addr;
						  claimTextCoin(mnemonic, addr);
					  }
  
					  $timeout(function() {
						  $scope.$digest();
					  });
				  });
			  }
		  });
  
		  // Send 
  
		  $scope.$on('$destroy', function() {
		  //	unwatchSpendUnconfirmed();
		  });
  
		  this.resetError = function() {
			  this.error = this.success = null;
		  };
  
		  this.bindTouchDown = function(tries) {
			  var self = this;
			  tries = tries || 0;
			  if (tries > 5) return;
			  var e = document.getElementById('menu-walletHome');
			  if (!e) return $timeout(function() {
				  self.bindTouchDown(++tries);
			  }, 500);
  
			  // on touchdown elements
			  $log.debug('Binding touchstart elements...');
			  ['hamburger', 'menu-walletHome', 'menu-send', 'menu-receive', 'menu-history'].forEach(function(id) {
				  var e = document.getElementById(id);
				  if (e) e.addEventListener('touchstart', function() {
					  try {
						  event.preventDefault();
					  }
					  catch (e) {};
					  $timeout(function(){
						  try {
							  angular.element(e).triggerHandler('click');
						  } catch (e) {};
					  });
				  }, true);
			  });
		  }
  
		  this.hideMenuBar = lodash.debounce(function(hide) {
			  if (hide) {
				  $rootScope.hideMenuBar = true;
				  this.bindTouchDown();
			  }
			  else {
				  $rootScope.hideMenuBar = false;
			  }
			  $timeout(function(){
				  $rootScope.$digest();
			  });
		  }, 100);
  
		  this.formFocus = function(what) {
			  if (isCordova && !this.isWindowsPhoneApp) {
				  this.hideMenuBar(what);
			  }
			  if (!this.isWindowsPhoneApp) return
  
			  if (!what) {
				  this.hideAddress = false;
				  this.hideAmount = false;
  
			  }
			  else {
				  if (what == 'amount') {
					  this.hideAddress = true;
				  }
				  else if (what == 'msg') {
					  this.hideAddress = true;
					  this.hideAmount = true;
				  }
			  }
			  $timeout(function() {
				  $rootScope.$digest();
			  }, 1);
		  };
  
		  this.setSendPaymentFormInputs = function() {
			  /**
			   * Setting the two related amounts as properties prevents an infinite
			   * recursion for watches while preserving the original angular updates
			   *
			   */
			  Object.defineProperty($scope,
				  "_amount", {
					  get: function() {
						  return $scope.__amount;
					  },
					  set: function(newValue) {
						  $scope.__amount = newValue;
						  self.resetError();
					  },
					  enumerable: true,
					  configurable: true
				  });
  
			  Object.defineProperty($scope,
				  "_address", {
					  get: function() {
						  return $scope.__address;
					  },
					  set: function(newValue) {
						  $scope.__address = self.onAddressChange(newValue);
					  },
					  enumerable: true,
					  configurable: true
				  });
  
			  var fc = profileService.focusedClient;
			  // ToDo: use a credential's (or fc's) function for this
			  this.hideNote = true;
		  };
  
		  this.setSendError = function(err) {
			  var fc = profileService.focusedClient;
			  var prefix =
				  fc.credentials.m > 1 ? gettextCatalog.getString('Could not create payment proposal') : gettextCatalog.getString('Could not send payment');
  
			  this.error = prefix + ": " + err;
			  console.log(this.error);
  
			  $timeout(function() {
				  $scope.$digest();
			  }, 1);
		  };
  
		  this.setOngoingProcess = function(name) {
			  var self = this;
			  self.blockUx = !!name;
  
			  if (isCordova) {
				  if (name) {
					  window.plugins.spinnerDialog.hide();
					  window.plugins.spinnerDialog.show(null, name + '...', true);
				  }
				  else {
					  window.plugins.spinnerDialog.hide();
				  }
			  }
			  else {
				  self.onGoingProcess = name;
				  $timeout(function() {
					  $rootScope.$apply();
				  });
			  };
		  };
  
		  function getShareMessage(amount, mnemonic, asset) {
			  var usd_amount_str = "";
			  var is_private = (asset == constants.BLACKBYTES_ASSET);
			  if (!asset || asset == "base" || asset == constants.BLACKBYTES_ASSET) {
				  var pair = asset == constants.BLACKBYTES_ASSET ? "GBB_USD" : "GBYTE_USD";
				  if (network.exchangeRates[pair]) {
					  usd_amount_str = " (≈" + ((amount/1e9)*network.exchangeRates[pair]).toLocaleString([], {maximumFractionDigits: 2}) + " USD)";
				  }
				  amount = (amount/1e9).toLocaleString([], {maximumFractionDigits: 9});
				  asset = asset == constants.BLACKBYTES_ASSET ? "GBB" : "GB";
			  } else {
				  //indexScope.arrBalances[$scope.index.assetIndex]
				  var assetInfo = lodash.find(indexScope.arrBalances, function(balance){return balance.asset == asset});
				  if (assetInfo) {
					  is_private = assetInfo.is_private;
					  var pair = asset + "_USD";
					  if (network.exchangeRates[pair]) {
						  usd_amount_str = " (≈" + (amount / Math.pow(10, assetInfo.decimals || 0) * network.exchangeRates[pair]).toLocaleString([], {maximumFractionDigits: 2}) + " USD)";
					  }
					  if (assetInfo.decimals) {
						  amount /= Math.pow(10, assetInfo.decimals);
					  }
					  asset = assetInfo.name ? assetInfo.name : asset;
				  }
			  }
			  return {
				  message: "Here is your " + (is_private ? "file" : "link") + " to receive " + amount + " " + asset + usd_amount_str + (is_private ? ".  If you don't have a Obyte wallet yet, install it from https://obyte.org." : (": https://obyte.org/#textcoin?" + mnemonic)),
				  subject: "Obyte user beamed you money"
			  }
		  }
  
		  this.openShareTextcoinModal = function(addr, mnemonic, amount, asset, isResend, filePath) {
			  if (!addr && isCordova) {
				  if (isMobile.Android() || isMobile.Windows()) {
					  window.ignoreMobilePause = true;
				  }
				  var removeFile = function() {};
				  window.plugins.socialsharing.shareWithOptions(lodash.assign(getShareMessage(amount, mnemonic, asset), {files: filePath ? [filePath] : []}), removeFile, removeFile);
				  return;
			  }
			  if (filePath)
				  return;
			  var msg = getShareMessage(amount, mnemonic, asset);
			  var text = msg.message;
			  var subject = msg.subject;
			  $rootScope.modalOpened = true;
			  var fc = profileService.focusedClient;
			  var ModalInstanceCtrl = function($scope, $modalInstance) {
				  $scope.color = fc.backgroundColor;
				  $scope.buttonLabel = gettextCatalog.getString((isResend ? 're' : '' ) + 'send email');
				  $scope.isCordova = isCordova;
				  $scope.address = addr;
				  $scope.mnemonic = mnemonic;
				  $scope.text = text;
				  $scope.subject = subject;
				  $scope.isResend = isResend;
				  $scope.filePath = filePath;
  
				  $scope.shareToEmail = function() {
					  window.plugins.socialsharing.shareViaEmail(text, subject, [addr]);
					  $modalInstance.close();
				  };
  
				  $scope.cancel = function() {
					  breadcrumbs.add('openShareTextcoinModal: cancel');
					  $modalInstance.dismiss('cancel');
				  };
			  };
  
			  var modalInstance = $modal.open({
				  templateUrl: 'views/modals/share.html',
				  windowClass: animationService.modalAnimated.slideUp,
				  controller: ModalInstanceCtrl,
				  scope: $scope
			  });
  
			  var disableCloseModal = $rootScope.$on('closeModal', function() {
				  breadcrumbs.add('openShareTextcoinModal: on closeModal');
				  modalInstance.dismiss('cancel');
			  });
  
			  modalInstance.result.finally(function(val) {
				  $rootScope.modalOpened = false;
				  disableCloseModal();
				  var m = angular.element(document.getElementsByClassName('reveal-modal'));
				  m.addClass(animationService.modalAnimated.slideOutDown);
			  });
		  };
  
		  this.validateAADefinition = function () {
			  var form = $scope.sendDataForm;
			  form.definition.$setValidity('aaDef', false);
			  lodash.debounce(function () {
				  try {
					  var arrDefinition = JSON.parse(self.definition);
				  }
				  catch (e) {
					  self.aa_validation_error = e.toString();
					  $timeout(function() {
						  $scope.$digest();
					  });
					  return;
				  }
				  if (!ValidationUtils.isArrayOfLength(arrDefinition, 2) && ValidationUtils.isNonemptyObject(arrDefinition))
					  arrDefinition = ['autonomous agent', arrDefinition];
				  var aa_validation = require('ocore/aa_validation.js');
				  aa_validation.validateAADefinition(arrDefinition, function (err) {
					  self.aa_validation_error = err;
					  form.definition.$setValidity('aaDef', !err);
					  $timeout(function() {
						  $scope.$digest();
					  });
				  });
			  }, 500)();
		  }
  
		  this.onAddressChanged = function () {
			  var form = $scope.sendPaymentForm;
			  if (form.address.$invalid) {
				  self.aa_destinations = [];
				  self.aa_data_field_defined = []; // empty this list as well
				  return console.log('address still invalid');
			  }
			  var address = form.address.$modelValue;
			  if (ValidationUtils.isValidAddress(address))
				  return checkIfAAAndUpdateResults(address);
			  var accountValidationResult = aliasValidationService.validate(address);
			  if (!accountValidationResult.isValid)
				  return;
			  var attestorKey = accountValidationResult.attestorKey;
			  var account = accountValidationResult.account;
			  var bb_address = aliasValidationService.getBbAddress(attestorKey, account);
			  if (!bb_address) {
				  return aliasValidationService.resolveValueToBbAddress(attestorKey, account, function () {
					  // assocBbAddresses in aliasValidationService is now filled
					  self.onAddressChanged();
				  });
			  }
			  if (bb_address === 'unknown' || bb_address === 'none' || !ValidationUtils.isValidAddress(bb_address))
				  return;
			  checkIfAAAndUpdateResults(bb_address);
		  };
  
		  function checkIfAAAndUpdateResults(address) {
			  var aa_addresses = require('ocore/aa_addresses.js');
			  aa_addresses.readAADefinitions([address], function (rows) {
				  self.aa_destinations = rows;
				  self.aa_data_field_defined = [];
				  if (rows.length > 0)
					  return updateAAResults();
				  $timeout(function() {
					  $scope.$digest();
				  });
			  });
		  }
  
		  this.onChanged = function () {
			  if ($scope.assetIndexSelectorValue >= 0)
				  lodash.debounce(updateAAResults, 500)();
		  };
  
		  this.onMultiAddressesChanged = function () {
			  var form = $scope.sendPaymentForm;
			  var errors = form.addresses.$error;
			  if (errors.validAddresses) // not valid yet
				  return;
			  var arrAddresses = getOutputsForMultiSend().map(function (output) { return output.address; });
			  var aa_addresses = require('ocore/aa_addresses.js');
			  aa_addresses.readAADefinitions(arrAddresses, function (rows) {
				  form.addresses.$setValidity('noAA', rows.length === 0);
				  $timeout(function() {
					  $scope.$digest();
				  });
			  });
		  };
  
		  function addBounceFees(asset, amount, address) {
			  if (!self.added_bounce_fees)
				  self.added_bounce_fees = [];
			  if (self.added_bounce_fees.filter(function (feeInfo) { return feeInfo.asset === asset; }).length === 0) {
				  var feeInfo = {
					  asset: asset,
					  address: address,
					  amount: amount,
					  display_amount: profileService.formatAmountWithUnit(amount, asset, {dontRound: true})
				  };
				  self.added_bounce_fees.push(feeInfo);
			  }
		  }
  
		  function dryRunPrimaryAATrigger(trigger, aa_address, arrDefinition, handleResponses) {
			  if (!conf.bLight) {
				  var aa_composer = require('ocore/aa_composer.js');
				  return aa_composer.dryRunPrimaryAATrigger(trigger, aa_address, arrDefinition, function (arrResponses) {
					  if (constants.COUNT_WITNESSES === 1) { // the temp unit might rebuild the MC
						  var storage = require('ocore/storage.js');
						  var db = require('ocore/db.js');
						  db.executeInTransaction(function (conn, onDone) {
							  storage.resetMemory(conn, onDone);
						  });
					  }
					  handleResponses(null, arrResponses);
				  });
			  }
			  network.requestFromLightVendor('light/dry_run_aa', { trigger: trigger, address: aa_address }, function (ws, request, response) {
				  if (response.error)
					  return handleResponses(response.error);
				  var arrResponses = response;
				  handleResponses(null, arrResponses);
			  });
		  }
  
		  function updateAAResults () {
			  var form = $scope.sendPaymentForm;
			  var amount = form.amount.$modelValue || 0;
			  if (!self.aa_destinations || self.aa_destinations.length === 0)
				  return console.log('no AA destinations');
			  var target_to_find = /trigger\.data\.[A-Za-z_.]+/g; // Getting data field for keys suggestions
			  var data_fields_to_input = [... new Set (self.aa_destinations[0].definition.match(target_to_find))];
			  if (data_fields_to_input.length) {
				  var defined_data_list = []
				  for (i = 0; i < data_fields_to_input.length; i++) {
					  if (data_fields_to_input[i].split('.').length < 4) {
						  defined_data_list.push(data_fields_to_input[i].split('.')[2])
					  }
				  }
				  self.aa_data_field_defined = defined_data_list;
			  }
			  var row = self.aa_destinations[0];
			  var aa_address = row.address;
			  var arrDefinition = JSON.parse(row.definition);
			  var bounce_fees = arrDefinition[1].bounce_fees || { base: constants.MIN_BYTES_BOUNCE_FEE };
			  if (!bounce_fees.base) {
				  bounce_fees = lodash.clone(bounce_fees); // do not modify the definition
				  bounce_fees.base = constants.MIN_BYTES_BOUNCE_FEE;
			  }
			  var address = indexScope.shared_address || self.addr[profileService.focusedClient.credentials.walletId];
			  if (!address)
				  throw Error('no address');
			  var trigger = { outputs: {}, address: address };
			  if ($scope.home.feedvaluespairs.length > 0)
				  trigger.data = {};
			  $scope.home.feedvaluespairs.forEach(function(pair) {
				  trigger.data[pair.name] = pair.value;
			  });
			  var assetInfo = $scope.index.arrBalances[$scope.index.assetIndex];
			  var asset = assetInfo.asset;
			  if (asset === "base")
				  amount *= self.unitValue;
			  else if (asset === constants.BLACKBYTES_ASSET)
				  amount *= self.bbUnitValue;
			  else if (assetInfo.decimals)
				  amount *= Math.pow(10, assetInfo.decimals);
			  amount = Math.round(amount);
			  if (self.bSendAll)
				  amount = assetInfo.total;
			  if (amount < (bounce_fees[asset] || 0)) {
				  if (amount === 0) {
					  amount = bounce_fees[asset];
					  form.amount.$setViewValue("" + profileService.getAmountInDisplayUnits(amount, asset));
					  form.amount.$isValid = true;
					  form.amount.$render();
					  addBounceFees(asset, amount, aa_address);
				  }
				  else {
					  self.custom_amount_error = gettext("Minimum amount") + " " + profileService.getAmountInDisplayUnits(bounce_fees[asset], asset);
					  form.amount.$setValidity('aaBounceFees', false);
					  form.amount.$render();
				  }
			  }
			  else {
				  self.custom_amount_error = null;
				  if (amount > 0)
					  form.amount.$setValidity('aaBounceFees', true);
			  }
			  if (!amount)
				  return console.log('no amount yet');
			  if (!$scope.sendPaymentForm.$valid)
				  return console.log('form not valid yet');
			  trigger.outputs[asset] = amount;
			  for (var a in bounce_fees) {
				  if (a !== asset) {
					  addBounceFees(a, bounce_fees[a], aa_address);
					  trigger.outputs[a] = bounce_fees[a];
				  }
			  }
			  console.log("trigger", trigger);
			  self.aa_dry_run_error = null;
			  dryRunPrimaryAATrigger(trigger, aa_address, arrDefinition, function (err, arrResponses) {
				  self.aa_dry_run_error = err;
				  var results = [];
				  var state_changes = [];
				  self.aa_message_results = results;
				  self.aa_state_changes = state_changes;
				  if (err) {
					  return $timeout(function() {
						  $scope.$digest();
					  });
				  }
				  // the array includes the primary AA address too but it doesn't matter
				  var arrSecondaryAAAdresses = arrResponses.map(function (objResponse) { return objResponse.aa_address; });
				  arrResponses.forEach(function (objResponse) {
					  if (objResponse.bounced)
						  results.push(gettext("Bounce the request"));
					  if (objResponse.updatedStateVars && objResponse.updatedStateVars[aa_address]) {
						  for (var variable in objResponse.updatedStateVars[aa_address]) {
							  var state_change = { variable: variable };
							  var varInfo = objResponse.updatedStateVars[aa_address][variable];
							  if (varInfo.delta > 0) {
								  state_change.action = gettext('increased by');
								  state_change.value = varInfo.delta;
							  }
							  else if (varInfo.delta < 0) {
								  state_change.action = gettext('decreased by');
								  state_change.value = -varInfo.delta;
							  }
							  else {
								  state_change.action = gettext('set to');
								  state_change.value = varInfo.value;
							  }
							  state_changes.push(state_change);
						  }
					  }
					  if (!objResponse.objResponseUnit)
						  return;
					  objResponse.objResponseUnit.messages.forEach(function (message) {
						  if (message.app === 'payment') {
							  message.payload.outputs.forEach(function (output) {
								  if (output.address === objResponse.aa_address) // change
									  return;
								  if (arrSecondaryAAAdresses.indexOf(output.address) >= 0) // to another AA
									  return;
								  var display_address = (output.address === objResponse.trigger_address) ? gettext('you') : output.address;
								  var display_amount = profileService.formatAmountWithUnit(output.amount, message.payload.asset || "base", {dontRound: true});
								  results.push(gettext("Send") + " " + display_amount + " " + gettext('to') + " " + display_address);
							  });
						  }
						  else if (message.app === 'data_feed') {
							  var pairs = [];
							  for (var field in message.payload)
								  pairs.push(field + ' = ' + message.payload[field]);
							  results.push(gettext("Post a data feed ") + pairs.join(', '));
						  }
						  else if (message.app === 'asset') {
							  results.push(gettext("Define a new asset with cap ") + (message.payload.cap || gettext('unlimited'))); // todo add more details
						  }
						  // todo add other apps
						  else {
							  results.push(gettext("Post a ") + message.app);
						  }
					  });
				  });
				  if (results.length === 0 && state_changes.length === 0)
					  results.push(gettext("none"));
				  $timeout(function() {
					  $scope.$digest();
				  });
			  });
		  }
  
		  function getOutputsForMultiSend() {
			  var outputs = [];
			  var form = $scope.sendPaymentForm;
			  var assetInfo = $scope.index.arrBalances[$scope.index.assetIndex];
			  var asset = assetInfo.asset;
			  form.addresses.$modelValue.split('\n').forEach(function(line){
				  var tokens = line.trim().split(/[\s,;]/);
				  var address = tokens[0];
				  var amount = tokens.pop();
				  if (asset === "base")
					  amount *= self.unitValue;
				  else if (assetInfo.decimals)
					  amount *= Math.pow(10, assetInfo.decimals);
				  amount = Math.round(amount);
				  outputs.push({address: address, amount: +amount});
			  });
			  return outputs;
		  }
  
		  this.submitPayment = function() {
			  if ($scope.index.arrBalances.length === 0)
				  return console.log('send payment: no balances yet');
			  var fc = profileService.focusedClient;
			  var unitValue = this.unitValue;
			  var bbUnitValue = this.bbUnitValue;
  
			  if (isCordova && this.isWindowsPhoneApp) {
				  this.hideAddress = false;
				  this.hideAmount = false;
			  }
  
			  var form = $scope.sendPaymentForm;
			  var isMultipleSend = !!form.addresses;
			  if (!form)
				  return console.log('form is gone');
			  if (self.bSendAll)
				  form.amount.$setValidity('validAmount', true);
  
			  var resetAddressValidation = function(){};
			  if ($scope.mtab == 2 && !isMultipleSend && !form.address.$modelValue) { // clicked 'share via message' button
				  resetAddressValidation = function() {
					  if (form && form.address)
						  form.address.$setValidity('validAddressOrAccount', false);
				  }
				  form.address.$setValidity('validAddressOrAccount', true);
			  }
  
			  if (form.$invalid) {
				  this.error = gettext('Unable to send transaction proposal');
				  return;
			  }
  
			  var data_payload = {};
			  var errored = false;
			  $scope.home.feedvaluespairs.forEach(function(pair) {
				  if (data_payload[pair.name]) {
					  self.setSendError("All keys must be unique");
					  errored = true;
					  return;
				  }
				  data_payload[pair.name] = pair.value;
			  });
			  if (errored)
				  return;
			  var objDataMessage;
			  if (Object.keys(data_payload).length > 0) {
				  var objectHash = require('ocore/object_hash.js');
				  var storage = require('ocore/storage.js');
				  objDataMessage = {
					  app: 'data',
					  payload_location: "inline",
					  payload_hash: objectHash.getBase64Hash(data_payload, storage.getMinRetrievableMci() >= constants.timestampUpgradeMci),
					  payload: data_payload
				  };
			  }
  
			  if (fc.isPrivKeyEncrypted()) {
				  profileService.unlockFC(null, function(err) {
					  if (err)
						  return self.setSendError(err.message);
					  return self.submitPayment();
				  });
				  return;
			  }
  
			  var comment = form.comment.$modelValue;
  
			  // ToDo: use a credential's (or fc's) function for this
			  if (comment) {
				  var msg = 'Could not add message to imported wallet without shared encrypting key';
				  $log.warn(msg);
				  return self.setSendError(gettext(msg));
			  }
  
			  var wallet = require('ocore/wallet.js');
			  var assetInfo = $scope.index.arrBalances[$scope.index.assetIndex];
			  var asset = assetInfo.asset;
			  console.log("asset " + asset);
			  if (assetInfo.is_private && self.aa_destinations && self.aa_destinations.length > 0)
				  return self.setSendError(gettext("It is not allowed to send private assets to autonomous agents"));
			  if (self.binding && self.aa_destinations && self.aa_destinations.length > 0)
				  return self.setSendError(gettext("It is not allowed to bind conditions to payments to autonomous agents"));
  
			  if (conf.bLight && indexScope.copayers.length > 1 && indexScope.onGoingProcess['Syncing']) //wait for sync before sending
					  return self.setSendError(gettext("wait for sync to complete before sending payments"));
  
			  if (isMultipleSend) {
				  if (assetInfo.is_private)
					  return self.setSendError("private assets can not be sent to multiple addresses");
				  var outputs = getOutputsForMultiSend();
				  var current_payment_key = form.addresses.$modelValue.replace(/[^a-zA-Z0-9]/g, '');
			  } else {
				  var address = form.address.$modelValue;
				  var recipient_device_address = assocDeviceAddressesByPaymentAddress[address];
				  var amount = form.amount.$modelValue;
				  // address can be [obyte_addr, email, account, empty => social sharing]
				  var accountValidationResult = aliasValidationService.validate(address);
				  var isEmail = ValidationUtils.isValidEmail(address);
				  var isTextcoin = (isEmail || !address);
  
				  var original_address;  // might be sent to email if the email address is attested
				  if (isTextcoin)
					  address = "textcoin:" + (address ? address : (Date.now() + "-" + amount));
				  if (asset === "base")
					  amount *= unitValue;
				  else if (asset === constants.BLACKBYTES_ASSET)
					  amount *= bbUnitValue;
				  else if (assetInfo.decimals)
					  amount *= Math.pow(10, assetInfo.decimals);
				  amount = Math.round(amount);
  
				  var current_payment_key = '' + asset + address + amount;
			  }
			  var merkle_proof = '';
			  if (form.merkle_proof && form.merkle_proof.$modelValue)
				  merkle_proof = form.merkle_proof.$modelValue.trim();
  
			  if (current_payment_key === self.current_payment_key)
				  return $rootScope.$emit('Local/ShowErrorAlert', "This payment is already under way");
			  self.current_payment_key = current_payment_key;
  
			  indexScope.setOngoingProcess(gettext('sending'), true);
			  $timeout(function() {
  
				  if (!isMultipleSend && accountValidationResult.isValid) { // try to replace validation result with attested BB address
					  var attestorKey = accountValidationResult.attestorKey;
					  var account = accountValidationResult.account;
					  var bb_address = aliasValidationService.getBbAddress(
						  attestorKey,
						  account
					  );
					  console.log('attestorKey='+attestorKey+' : account='+account+' : bb_address='+bb_address);
  
					  if (!bb_address) {
						  return aliasValidationService.resolveValueToBbAddress(
							  attestorKey,
							  account,
							  function () {
								  // assocBbAddresses in aliasValidationService is now filled
								  delete self.current_payment_key;
								  self.submitPayment();
							  }
						  );
					  }
  
					  if (!isEmail) {
  
						  if (bb_address === 'unknown' || bb_address === 'none') {
							  if (bb_address === 'unknown') {
								  aliasValidationService.deleteAssocBbAddress(
									  attestorKey,
									  account
								  );
							  }
  
							  delete self.current_payment_key;
							  indexScope.setOngoingProcess(gettext('sending'), false);
							  return self.setSendError('Attested account not found');
						  } else if (ValidationUtils.isValidAddress(bb_address)) {
							  original_address = address;
							  address = bb_address;
							  isEmail = false;
							  isTextcoin = false;
						  } else {
							  throw Error("unrecognized bb_address: "+bb_address);
						  }
  
					  } else {
  
						  if (bb_address === 'unknown') {
							  aliasValidationService.deleteAssocBbAddress(
								  attestorKey,
								  account
							  ); // send textcoin now but retry next time
						  } else if (bb_address === 'none') {
							  // go on to send textcoin
						  } else if (ValidationUtils.isValidAddress(bb_address)) {
							  original_address = account;
							  address = bb_address;
							  isEmail = false;
							  isTextcoin = false;
						  } else {
							  throw Error("unrecognized bb_address: "+bb_address);
						  }
  
					  }
				  }
  
				  profileService.requestTouchid(function(err) {
					  if (err) {
						  profileService.lockFC();
						  indexScope.setOngoingProcess(gettext('sending'), false);
						  self.error = err;
						  $timeout(function() {
							  delete self.current_payment_key;
							  $scope.$digest();
						  }, 1);
						  return;
					  }
					  
					  var device = require('ocore/device.js');
					  if (self.binding) {
						  if (isTextcoin) {
							  delete self.current_payment_key;
							  indexScope.setOngoingProcess(gettext('sending'), false);
							  return self.setSendError("you can send bound payments to Obyte adresses only");
						  }
						  if (!recipient_device_address)
							  throw Error('recipient device address not known');
						  var walletDefinedByAddresses = require('ocore/wallet_defined_by_addresses.js');
						  var walletDefinedByKeys = require('ocore/wallet_defined_by_keys.js');
						  var my_address;
						  // never reuse addresses as the required output could be already present
						  useOrIssueNextAddress(fc.credentials.walletId, 0, function(addressInfo) {
							  my_address = addressInfo.address;
							  if (self.binding.type === 'reverse_payment') {
								  var arrSeenCondition = ['seen', {
									  what: 'output',
									  address: my_address,
									  asset: self.binding.reverseAsset,
									  amount: self.binding.reverseAmount
								  }];
								  var arrDefinition = ['or', [
									  ['and', [
										  ['address', address],
										  arrSeenCondition
									  ]],
									  ['and', [
										  ['address', my_address],
										  ['not', arrSeenCondition],
										  ['in data feed', [
											  [configService.TIMESTAMPER_ADDRESS], 'timestamp', '>', Date.now() + Math.round(self.binding.timeout * 3600 * 1000)
										  ]]
									  ]]
								  ]];
								  var assocSignersByPath = {
									  'r.0.0': {
										  address: address,
										  member_signing_path: 'r',
										  device_address: recipient_device_address
									  },
									  'r.1.0': {
										  address: my_address,
										  member_signing_path: 'r',
										  device_address: device.getMyDeviceAddress()
									  }
								  };
							  }
							  else {
								  if (self.binding.relation !== '=')
									  self.binding.feed_type = 'explicit';
								  if (self.binding.oracle_address === configService.TIMESTAMPER_ADDRESS)
									  self.binding.feed_value = parseInt(self.binding.feed_value);
								  var arrExplicitEventCondition =
									  ['in data feed', [
										  [self.binding.oracle_address], self.binding.feed_name, self.binding.relation, self.binding.feed_value
									  ]];
								  var arrMerkleEventCondition =
									  ['in merkle', [
										  [self.binding.oracle_address], self.binding.feed_name, self.binding.feed_value
									  ]];
								  var arrEventCondition;
								  if (self.binding.feed_type === 'explicit')
									  arrEventCondition = arrExplicitEventCondition;
								  else if (self.binding.feed_type === 'merkle')
									  arrEventCondition = arrMerkleEventCondition;
								  else if (self.binding.feed_type === 'either')
									  arrEventCondition = ['or', [arrMerkleEventCondition, arrExplicitEventCondition]];
								  else
									  throw Error("unknown feed type: " + self.binding.feed_type);
								  var arrDefinition = ['or', [
									  ['and', [
										  ['address', address],
										  arrEventCondition
									  ]],
									  ['and', [
										  ['address', my_address],
										  ['in data feed', [
											  [configService.TIMESTAMPER_ADDRESS], 'timestamp', '>', Date.now() + Math.round(self.binding.timeout * 3600 * 1000)
										  ]]
									  ]]
								  ]];
								  var assocSignersByPath = {
									  'r.0.0': {
										  address: address,
										  member_signing_path: 'r',
										  device_address: recipient_device_address
									  },
									  'r.1.0': {
										  address: my_address,
										  member_signing_path: 'r',
										  device_address: device.getMyDeviceAddress()
									  }
								  };
								  if (self.binding.feed_type === 'merkle' || self.binding.feed_type === 'either')
									  assocSignersByPath[(self.binding.feed_type === 'merkle') ? 'r.0.1' : 'r.0.1.0'] = {
										  address: '',
										  member_signing_path: 'r',
										  device_address: recipient_device_address
									  };
							  }
							  walletDefinedByAddresses.createNewSharedAddress(arrDefinition, assocSignersByPath, {
								  ifError: function(err) {
									  delete self.current_payment_key;
									  indexScope.setOngoingProcess(gettext('sending'), false);
									  self.setSendError(err);
								  },
								  ifOk: function(shared_address) {
									  composeAndSend(shared_address);
								  }
							  });
						  });
					  }
					  else
						  composeAndSend(address);
  
					  // compose and send
					  function composeAndSend(to_address) {
						  var arrSigningDeviceAddresses = []; // empty list means that all signatures are required (such as 2-of-2)
						  if (fc.credentials.m < fc.credentials.n)
							  $scope.index.copayers.forEach(function(copayer) {
								  if (copayer.me || copayer.signs)
									  arrSigningDeviceAddresses.push(copayer.device_address);
							  });
						  else if (indexScope.shared_address)
							  arrSigningDeviceAddresses = indexScope.copayers.map(function(copayer) {
								  return copayer.device_address;
							  });
						  breadcrumbs.add('sending payment in ' + asset);
						  profileService.bKeepUnlocked = true;
						  var opts = {
							  shared_address: indexScope.shared_address,
							  merkle_proof: merkle_proof,
							  asset: asset,
							  do_not_email: true,
							  send_all: self.bSendAll,
							  spend_unconfirmed: configWallet.spendUnconfirmed ? 'all' : 'own',
							  arrSigningDeviceAddresses: arrSigningDeviceAddresses,
							  recipient_device_address: recipient_device_address
						  };
						  if (!isMultipleSend) {
							  opts.to_address = to_address;
							  opts.amount = amount;
						  } else {
							  if (asset !== "base")
								  opts.asset_outputs = outputs;
							  else
								  opts.base_outputs = outputs;
						  }
						  // add bounce fees if necessary
						  if (self.added_bounce_fees && self.added_bounce_fees.length > 0) {
							  var other_asset_added_bounce_fees = self.added_bounce_fees.filter(function (feeInfo) { return feeInfo.asset !== 'base' && feeInfo.asset !== asset; });
							  if (other_asset_added_bounce_fees.length > 0) {
								  delete self.current_payment_key;
								  indexScope.setOngoingProcess(gettext('sending'), false);
								  return self.setSendError("cannot add bounce fees in asset " + other_asset_added_bounce_fees[0].asset);
							  }
							  if (asset !== "base") { // add base_outputs to pay for bounce fees
								  if (!isMultipleSend) {
									  opts.asset_outputs = [{ address: to_address, amount: amount }];
									  delete opts.to_address;
									  delete opts.amount;
								  }
								  opts.base_outputs = self.added_bounce_fees.filter(function (feeInfo) { return feeInfo.asset === 'base'; }).map(function (feeInfo) { return { address: feeInfo.address, amount: feeInfo.amount }; });
							  }
						  }
  
						  var filePath;
						  if (assetInfo.is_private) {
							  opts.getPrivateAssetPayloadSavePath = function(cb) {
								  self.getPrivatePayloadSavePath(function(fullPath, cordovaPathObj){
									  filePath = fullPath ? fullPath : (cordovaPathObj ? cordovaPathObj.root + cordovaPathObj.path + '/' + cordovaPathObj.fileName : null);
									  cb(fullPath, cordovaPathObj);
								  });
							  };
						  }
						  if (objDataMessage)
							  opts.messages = [objDataMessage];
						  fc.sendMultiPayment(opts, function(err, unit, mnemonics) {
							  // if multisig, it might take very long before the callback is called
							  indexScope.setOngoingProcess(gettext('sending'), false);
							  breadcrumbs.add('done payment in ' + asset + ', err=' + err);
							  delete self.current_payment_key;
							  resetAddressValidation();
							  profileService.bKeepUnlocked = false;
							  if (err) {
								  if (typeof err === 'object') {
									  err = err.toString();
								  //	err = JSON.stringify(err);
								  //	eventBus.emit('nonfatal_error', "error object from sendMultiPayment: " + err, new Error());
								  }
								  else if (err.match(/device address/))
									  err = "This is a private asset, please send it only by clicking links from chat";
								  else if (err.match(/no funded/))
									  err = "Not enough spendable funds, make sure all your funds are confirmed";
								  else if (err.match(/authentifier verification failed/))
									  err = "Check that smart contract conditions are satisfied and signatures are correct";
								  else if (err.match(/precommit/))
									  err = err.replace('precommit callback failed: ', '');
								  return self.setSendError(err);
							  }
							  var binding = self.binding;
							  self.resetForm();
						  //	$rootScope.$emit("NewOutgoingTx"); // we are already updating UI in response to new_my_transactions event which is triggered by broadcast
							  if (original_address){
								  var db = require('ocore/db.js');
								  db.query("INSERT INTO original_addresses (unit, address, original_address) VALUES(?,?,?)", 
									  [unit, to_address, original_address]);
							  }
							  if (recipient_device_address) { // show payment in chat window
								  eventBus.emit('sent_payment', recipient_device_address, amount || 'all', asset, !!binding);
								  if (binding && binding.reverseAmount) { // create a request for reverse payment
									  if (!my_address)
										  throw Error('my address not known');
									  var paymentRequestCode = 'byteball:' + my_address + '?amount=' + binding.reverseAmount + '&asset=' + encodeURIComponent(binding.reverseAsset);
									  var paymentRequestText = '[reverse payment](' + paymentRequestCode + ')';
									  device.sendMessageToDevice(recipient_device_address, 'text', paymentRequestText);
									  var body = correspondentListService.formatOutgoingMessage(paymentRequestText);
									  correspondentListService.addMessageEvent(false, recipient_device_address, body);
									  device.readCorrespondent(recipient_device_address, function(correspondent) {
										  if (correspondent.my_record_pref && correspondent.peer_record_pref) chatStorage.store(correspondent.device_address, body, 0, 'html');
									  });
  
									  // issue next address to avoid reusing the reverse payment address
									  if (!fc.isSingleAddress) walletDefinedByKeys.issueNextAddress(fc.credentials.walletId, 0, function() {});
								  }
							  }
							  else if (Object.keys(mnemonics).length) {
								  var mnemonic = mnemonics[to_address];
								  if (opts.send_all && asset === "base")
									  amount = assetInfo.stable;
  
								  self.openShareTextcoinModal(isEmail ? address.slice("textcoin:".length) : null, mnemonic, amount, asset, false, filePath);
								  $rootScope.$emit('Local/SetTab', 'history');
							  }
							  else // redirect to history
								  $rootScope.$emit('Local/SetTab', 'history');
						  });
  
					  }
  
					  function useOrIssueNextAddress(wallet, is_change, handleAddress) {
						  if (fc.isSingleAddress) {
							  addressService.getAddress(fc.credentials.walletId, false, function(err, addr) {
								  handleAddress({
									  address: addr
								  });
							  });
						  }
						  else walletDefinedByKeys.issueNextAddress(wallet, is_change, handleAddress);
					  }
  
				  });
			  }, 100);
		  };
  
		  $scope.$watch('index.assetIndex', function(newVal, oldVal) {
			  $scope.assetIndexSelectorValue = newVal;
			  self.switchForms();
		  });
		  this.switchForms = function() {
			   this.bSendAll = false;
			   if (this.send_multiple && $scope.index.arrBalances[$scope.index.assetIndex] && $scope.index.arrBalances[$scope.index.assetIndex].is_private)
				   this.lockAmount = this.send_multiple = false;
			  if ($scope.assetIndexSelectorValue < 0) {
				  this.shownForm = 'data';
				  if (!this.feedvaluespairs || this.feedvaluespairs.length === 0)
					  this.feedvaluespairs = [{}];
				  if ($scope.assetIndexSelectorValue === -6)
					  $timeout(function () {
						  if (self.definition && self.definition.length > 0)
							  self.validateAADefinition();
					  });
			  }
			  else {
				  $scope.index.assetIndex = $scope.assetIndexSelectorValue;
				  this.shownForm = 'payment';
				  if (!this.feedvaluespairs || this.feedvaluespairs.length > 0 && (!this.feedvaluespairs[0].name || !this.feedvaluespairs[0].value))
					  this.feedvaluespairs = [];
			  }
			  $scope.mtab = $scope.index.arrBalances[$scope.index.assetIndex] && $scope.index.arrBalances[$scope.index.assetIndex].is_private && !this.lockAddress ? 2 : 1;
		  }
  
		  this.submitData = function() {
			  var objectHash = require('ocore/object_hash.js');
			  var storage = require('ocore/storage.js');
			  var fc = profileService.focusedClient;
			  var value = {};
			  var app;
			  switch ($scope.assetIndexSelectorValue) {
				  case -1:
					  app = "data_feed";
					  break;
				  case -2:
					  app = "attestation";
					  break;
				  case -3:
					  app = "profile";
					  break;
				  case -4:
					  app = "data";
					  break;
				  case -5:
					  app = "poll";
					  break;
				  case -6:
					  app = "definition";
					  break;
				  default:
					  throw new Error("invalid app selected");
			  }
			  var errored = false;
			  $scope.home.feedvaluespairs.forEach(function(pair) {
				  if (value[pair.name]) {
					  self.setSendError("All keys must be unique");
					  errored = true;
					  return;
				  }
				  value[pair.name] = pair.value;
			  });
			  if (errored) return;
			  if (Object.keys(value)
				  .length === 0) {
				  self.setSendError("Provide at least one value");
				  return;
			  }
  
			  if (fc.isPrivKeyEncrypted()) {
				  profileService.unlockFC(null, function(err) {
					  if (err)
						  return self.setSendError(err.message);
					  return self.submitData();
				  });
				  return;
			  }
  
			  profileService.requestTouchid(function(err) {
				  if (err) {
					  profileService.lockFC();
					  indexScope.setOngoingProcess(gettext('sending'), false);
					  self.error = err;
					  $timeout(function() {
						  $scope.$digest();
					  }, 1);
					  return;
				  }
  
				  if (app == "attestation") {
					  value = {
						  address: $scope.home.attested_address,
						  profile: value
					  };
				  }
				  if (app == "poll") {
					  value = {
						  question: $scope.home.poll_question,
						  choices: Object.keys(value)
					  };
				  }
				  if (app == "definition") {
					  try {
						  var arrDefinition = JSON.parse($scope.home.definition);
						  if (!ValidationUtils.isArrayOfLength(arrDefinition, 2) && ValidationUtils.isNonemptyObject(arrDefinition))
							  arrDefinition = ['autonomous agent', arrDefinition];
						  value = {
							  definition: arrDefinition,
							  address: objectHash.getChash160(arrDefinition)
						  };
					  }
					  catch (e) {
						  self.setSendError(e.toString());
						  $timeout(function() {
							  $scope.$digest();
						  });
						  return;
					  }
				  }
				  var objMessage = {
					  app: app,
					  payload_location: "inline",
					  payload_hash: objectHash.getBase64Hash(value, storage.getMinRetrievableMci() >= constants.timestampUpgradeMci),
					  payload: value
				  };
				  var arrSigningDeviceAddresses = []; // empty list means that all signatures are required (such as 2-of-2)
				  if (fc.credentials.m < fc.credentials.n)
					  indexScope.copayers.forEach(function(copayer) {
						  if (copayer.me || copayer.signs)
							  arrSigningDeviceAddresses.push(copayer.device_address);
					  });
				  else if (indexScope.shared_address)
					  arrSigningDeviceAddresses = indexScope.copayers.map(function(copayer) {
						  return copayer.device_address;
					  });
  
				  indexScope.setOngoingProcess(gettext('sending'), true);
  
				  fc.sendMultiPayment({
					  spend_unconfirmed: configWallet.spendUnconfirmed ? 'all' : 'own',
					  arrSigningDeviceAddresses: arrSigningDeviceAddresses,
					  shared_address: indexScope.shared_address,
					  messages: [objMessage]
				  }, function(err) { // can take long if multisig
					  indexScope.setOngoingProcess(gettext('sending'), false);
					  if (err) {
						  self.setSendError(err);
						  return;
					  }
					  breadcrumbs.add('done submitting data into feeds ' + Object.keys(value)
						  .join(','));
					  self.resetDataForm();
					  $rootScope.$emit('Local/SetTab', 'history');
				  });
			  });
		  }
  
		  this.resetDataForm = function() {
			  this.resetError();
			  $scope.home.feedvaluespairs = [{}];
			  $timeout(function() {
				  $rootScope.$digest();
			  }, 1);
		  };
  
		  var assocDeviceAddressesByPaymentAddress = {};
  
		  this.canSendExternalPayment = function() {
			  if ($scope.index.arrBalances.length === 0 || $scope.index.assetIndex < 0) // no balances yet, assume can send
				  return true;
			  if (!$scope.index.arrBalances[$scope.index.assetIndex]) // no balances yet, assume can send
				   return true;
			  if (!$scope.index.arrBalances[$scope.index.assetIndex].is_private)
				   return true;
			  var form = $scope.sendPaymentForm;
			  if (!form || !form.address) // disappeared
				  return true;
			  var address = form.address.$modelValue;
			  var recipient_device_address = assocDeviceAddressesByPaymentAddress[address];
			  return !!recipient_device_address;
		  };
  
		  this.deviceAddressIsKnown = function() {
			  //	return true;
			  if ($scope.index.arrBalances.length === 0) // no balances yet
				  return false;
			  var form = $scope.sendPaymentForm;
			  if (!form || !form.address) // disappeared
				  return false;
			  var address = form.address.$modelValue;
			  var recipient_device_address = assocDeviceAddressesByPaymentAddress[address];
			  return !!recipient_device_address;
		  };
  
		  this.openBindModal = function() {
			  $rootScope.modalOpened = true;
			  var fc = profileService.focusedClient;
			  var form = $scope.sendPaymentForm;
			  if (!form || !form.address) // disappeared
				  return;
			  var address = form.address;
  
			  var ModalInstanceCtrl = function($scope, $modalInstance) {
				  $scope.color = fc.backgroundColor;
				  $scope.arrRelations = ["=", ">", "<", ">=", "<=", "!="];
				  $scope.arrPublicAssetInfos = indexScope.arrBalances.filter(function(b) {
						  return !b.is_private;
					  })
					  .map(function(b) {
						  var info = {
							  asset: b.asset
						  };
						  if (b.asset === 'base')
							  info.displayName = self.unitName;
						  else if (b.asset === constants.BLACKBYTES_ASSET)
							  info.displayName = self.bbUnitName;
						  else if (profileService.assetMetadata[b.asset])
							  info.displayName = profileService.assetMetadata[b.asset].name;
						  else
							  info.displayName = 'of ' + b.asset.substr(0, 4);
						  return info;
					  });
				  $scope.binding = { // defaults
					  type: fc.isSingleAddress ? 'data' : 'reverse_payment',
					  timeout: 4,
					  relation: '=',
					  reverseAsset: 'base',
					  feed_type: 'either'
				  };
				  if (self.binding) {
					  $scope.binding.type = self.binding.type;
					  $scope.binding.timeout = self.binding.timeout;
					  if (self.binding.type === 'reverse_payment') {
						  $scope.binding.reverseAsset = self.binding.reverseAsset;
						  $scope.binding.reverseAmount = profileService.getAmountInDisplayUnits(self.binding.reverseAmount, self.binding.reverseAsset);
					  }
					  else {
						  $scope.binding.oracle_address = self.binding.oracle_address;
						  $scope.binding.feed_name = self.binding.feed_name;
						  $scope.binding.relation = self.binding.relation;
						  $scope.binding.feed_value = self.binding.feed_value;
						  $scope.binding.feed_type = self.binding.feed_type;
					  }
				  }
				  $scope.oracles = configService.oracles;
				  $scope.isSingleAddress = fc.isSingleAddress;
				  $scope.index = indexScope;
  
				  $scope.cancel = function() {
					  $modalInstance.dismiss('cancel');
				  };
  
				  $scope.bind = function() {
					  var binding = {
						  type: $scope.binding.type
					  };
					  if (binding.type === 'reverse_payment') {
						  binding.reverseAsset = $scope.binding.reverseAsset;
						  binding.reverseAmount = profileService.getAmountInSmallestUnits($scope.binding.reverseAmount, $scope.binding.reverseAsset);
					  }
					  else {
						  binding.oracle_address = $scope.binding.oracle_address;
						  binding.feed_name = $scope.binding.feed_name;
						  binding.relation = $scope.binding.relation;
						  binding.feed_value = $scope.binding.feed_value;
						  binding.feed_type = $scope.binding.feed_type;
					  }
					  binding.timeout = $scope.binding.timeout;
					  self.binding = binding;
					  $modalInstance.dismiss('done');
				  };
  
			  };
  
			  var modalInstance = $modal.open({
				  templateUrl: 'views/modals/bind.html',
				  windowClass: animationService.modalAnimated.slideUp,
				  controller: ModalInstanceCtrl,
			  });
  
			  var disableCloseModal = $rootScope.$on('closeModal', function() {
				  modalInstance.dismiss('cancel');
			  });
  
			  modalInstance.result.finally(function() {
				  $rootScope.modalOpened = false;
				  disableCloseModal();
				  var m = angular.element(document.getElementsByClassName('reveal-modal'));
				  m.addClass(animationService.modalAnimated.slideOutDown);
			  });
  
		  };
  
		  this.setToAddress = function(to) {
			  var form = $scope.sendPaymentForm;
			  if (!form || !form.address) // disappeared?
				  return console.log('form.address has disappeared');
			  form.address.$setViewValue(to);
			  form.address.$isValid = true;
			  form.address.$render();
		  }
  
		  this.setForm = function(to, amount, comment, asset, recipient_device_address) {
			  this.resetError();
			  $timeout((function() {
				  delete this.binding;
				  var form = $scope.sendPaymentForm;
				  if (!form || !form.address) // disappeared?
					  return console.log('form.address has disappeared');
				  if (form.merkle_proof) {
					  form.merkle_proof.$setViewValue('');
					  form.merkle_proof.$render();
				  }
				  if (comment) {
					  form.comment.$setViewValue(comment);
					  form.comment.$isValid = true;
					  form.comment.$render();
				  }
  
				  if (asset) {
					  var assetIndex = lodash.findIndex($scope.index.arrBalances, {
						  asset: asset
					  });
					  if (assetIndex < 0) {
						  notification.error("failed to find asset index of asset " + asset);
						  return self.resetForm();
					  }
					  $scope.index.assetIndex = assetIndex;
					  $scope.assetIndexSelectorValue = assetIndex;
					  this.lockAsset = true;
				  }
				  else
					  this.lockAsset = false;
  
				  if (to) {
					  form.address.$setViewValue(to);
					  form.address.$isValid = true;
					  form.address.$render();
					  this.lockAddress = true;
					  $scope.mtab = 1;
					  if (recipient_device_address) // must be already paired
						  assocDeviceAddressesByPaymentAddress[to] = recipient_device_address;
					  if ($scope.assetIndexSelectorValue < 0 && !asset) // a data form was selected
						  $scope.assetIndexSelectorValue = 0;
				  }
				  
				  this.switchForms();
  
				  $timeout((function () {
					  if (amount) {
						  //	form.amount.$setViewValue("" + amount);
						  //	form.amount.$isValid = true;
						  this.lockAmount = true;
						  form.amount.$setViewValue("" + profileService.getAmountInDisplayUnits(amount, asset));
						  form.amount.$isValid = true;
						  form.amount.$render();
					  }
					  else  {
						  this.lockAmount = false;
						  form.amount.$setViewValue("");
						  form.amount.$pristine = true;
						  form.amount.$render();
					  }
				  }).bind(this));
				  
			  }).bind(this), 1);
		  };
  
		  this.setDataForm = function (dataPrompt) {
			  var app = dataPrompt.app;
			  delete dataPrompt.app;
			  this.resetError();
			  $timeout((function() {
				  switch (app) {
					  case 'data_feed':
						  $scope.assetIndexSelectorValue = -1;
						  break;
					  case 'attestation':
						  $scope.assetIndexSelectorValue = -2;
						  $scope.home.attested_address = dataPrompt.address;
						  delete dataPrompt.address;
						  break;
					  case 'profile':
						  $scope.assetIndexSelectorValue = -3;
						  break;
					  case 'data':
						  $scope.assetIndexSelectorValue = -4;
						  break;
					  case 'poll':
						  $scope.assetIndexSelectorValue = -5;
						  $scope.home.poll_question = dataPrompt.question;
						  delete dataPrompt.question;
						  break;
					  case 'vote':
						  notification.error('voting not yet supported via uri');
						  return self.resetForm();
					  case 'definition':
						  $scope.assetIndexSelectorValue = -6;
						  $scope.home.definition = dataPrompt.definition;
						  delete dataPrompt.definition;
						  break;
				  }
				  $scope.home.feedvaluespairs = [];
				  for (var key in dataPrompt) {
					  var value = dataPrompt[key];
					  $scope.home.feedvaluespairs.push(app === 'poll' ? {name: value, value: 'anything'} : {name: key, value: value});
				  }
				  this.switchForms();
			  //	$timeout(function () {
			  //		$rootScope.$digest();
			  //	})
			  }).bind(this), 1);
		  };
  
		  this.resetForm = function(bKeepData) {
			  this.resetError();
			  delete this.binding;
  
			  this.lockAsset = false;
			  this.lockAddress = false;
			  this.lockAmount = false;
			  this.hideAdvSend = true;
			  this.send_multiple = false;
  
			  this._amount = this._address = null;
			  this.bSendAll = false;
			  if (!bKeepData)
				  this.feedvaluespairs = [];
			  this.aa_destinations = [];
			  this.aa_data_field_defined = [];
			  this.custom_amount_error = null;
			  this.aa_dry_run_error = null;
  
			  var form = $scope.sendPaymentForm;
			  var self = this;
  
			  $timeout(function() {
				  if (form && form.amount) {
					  if (!$scope.$root) $scope.$root = {};
					  form.amount.$pristine = true;
					  if (form.amount) {
						  form.amount.$setViewValue('');
						  form.amount.$render();
					  }
  
					  if (form.merkle_proof) {
						  form.merkle_proof.$setViewValue('');
						  form.merkle_proof.$render();
					  }
					  if (form.comment) {
						  form.comment.$setViewValue('');
						  form.comment.$render();
					  }
					  form.$setPristine();
  
					  if (form.address) {
						  form.address.$setPristine();
						  form.address.$setViewValue('');
						  form.address.$render();
					  }
				  }
				  self.switchForms();
				  $timeout(function() {
					  $rootScope.$digest();
				  }, 1);
			  });
		  };
  
		  this.setSendAll = function() {
			  var form = $scope.sendPaymentForm;
			  if (!form || !form.amount) // disappeared?
				  return console.log('form.amount has disappeared');
			  if (indexScope.arrBalances.length === 0)
				  return;
			  var assetInfo = indexScope.arrBalances[indexScope.assetIndex];
			  if (assetInfo.asset === 'base') {
				  this._amount = null;
				  this.bSendAll = true;
				  form.amount.$setViewValue('');
				  form.amount.$setValidity('validAmount', true);
				  form.amount.$render();
			  }
			  else {
				  var full_amount = assetInfo.stable;
				  if (assetInfo.asset === constants.BLACKBYTES_ASSET)
					  full_amount /= this.bbUnitValue;
				  else if (assetInfo.decimals)
					  full_amount /= Math.pow(10, assetInfo.decimals);
				  form.amount.$setViewValue('' + full_amount);
				  form.amount.$render();
			  }
			  //console.log('done setsendall')
			  /*$timeout(function() {
				  $rootScope.$digest();
				  console.log('-- amount invalid? '+form.amount.$invalid);
				  console.log('-- form invalid? '+form.$invalid);
			  }, 1);*/
		  };
  
		  this.setFromUri = function(uri) {
			  var objRequest;
			  require('ocore/uri.js')
				  .parseUri(uri, {
					  ifError: function(err) {},
					  ifOk: function(_objRequest) {
						  objRequest = _objRequest; // the callback is called synchronously
					  }
				  });
  
			  if (!objRequest) // failed to parse
				  return uri;
			  if (objRequest.amount) {
				  // setForm() cares about units conversion
				  //var amount = (objRequest.amount / this.unitValue).toFixed(this.unitDecimals);
				  this.setForm(objRequest.address, objRequest.amount);
			  }
			  return objRequest.address;
		  };
  
		  this.onAddressChange = function(value) {
			  this.resetError();
			  if (!value) return '';
  
			  if (value.indexOf(self.protocol + ':') === 0 || value.indexOf(self.bb_protocol + ':') === 0)
				  return this.setFromUri(value);
			  else
				  return value;
		  };
  
		  // History 
  
		  function strip(number) {
			  return (parseFloat(number.toPrecision(12)));
		  }
  
		  this.getUnitName = function() {
			  return this.unitName;
		  };
  
		  this.getPrivatePayloadSavePath = function(cb) {
			  var fileName = 'ObytePayment-' + $filter('date')(Date.now(), 'yyyy-MM-dd-HH-mm-ss') + '.' + configService.privateTextcoinExt;
			  if (!isCordova) {
				  var inputFile = document.createElement("input"); 
				  inputFile.type = "file";
				  inputFile.setAttribute("nwsaveas", fileName);
				  inputFile.click();
				  var wasCalled = false;
				  inputFile.onchange = function() {
					  if (wasCalled) return;
					  wasCalled = true;
					  $timeout(function() {
						  cb(inputFile.value ? inputFile.value : null);
						  window.removeEventListener('focus', inputFile.onchange, true);
					  }, 1000);
				  };
				  window.addEventListener('focus', inputFile.onchange, true);
			  }
			  else {
				  var root = window.cordova.file.cacheDirectory;//isMobile.iOS() ? window.cordova.file.documentsDirectory : window.cordova.file.externalRootDirectory;
				  var path = 'Obyte';
				  cb(null, {root: root, path: path, fileName: fileName});
			  }
		  };
  
		  this.openInExplorer = function(unit) {
			  var testnet = home.isTestnet ? 'testnet' : '';
			  var url = 'https://' + testnet + 'explorer.obyte.org/#' + unit;
			  if (typeof nw !== 'undefined')
				  nw.Shell.openExternal(url);
			  else if (isCordova)
				  cordova.InAppBrowser.open(url, '_system');
		  };
  
		  this.openTxModal = function(btx) {
			  $rootScope.modalOpened = true;
			  var self = this;
			  var fc = profileService.focusedClient;
			  var ModalInstanceCtrl = function($scope, $modalInstance) {
				  $scope.btx = btx;
				  var assetIndex = lodash.findIndex(indexScope.arrBalances, {
					  asset: btx.asset
				  });
				  $scope.isPrivate = indexScope.arrBalances[assetIndex].is_private;
				  $scope.Math = window.Math;
				  $scope.assetDecimals = indexScope.arrBalances[assetIndex].decimals;
				  $scope.settings = walletSettings;
				  $scope.color = fc.backgroundColor;
				  $scope.n = fc.credentials.n;
				  $scope.exchangeRates = network.exchangeRates;
				  $scope.BLACKBYTES_ASSET = constants.BLACKBYTES_ASSET;
  
				  $scope.shareAgain = function() {
					  if ($scope.isPrivate) {
						  var indivisible_asset = require('ocore/indivisible_asset');
						  var wallet = require('ocore/wallet.js');
						  indivisible_asset.restorePrivateChains(btx.asset, btx.unit, btx.addressTo, function(arrRecipientChains, arrCosignerChains){
							  self.getPrivatePayloadSavePath(function(fullPath, cordovaPathObj){
								  if (!fullPath && !cordovaPathObj)
									  return;
								  var filePath = fullPath ? fullPath : (cordovaPathObj.root + cordovaPathObj.path + '/' + cordovaPathObj.fileName);
								  wallet.storePrivateAssetPayload(fullPath, cordovaPathObj, btx.mnemonic, arrRecipientChains, function(err) {
									  if (err)
										  throw Error(err);
									  self.openShareTextcoinModal(btx.textAddress, btx.mnemonic, btx.amount, btx.asset, true, filePath);
								  });
							  });
						  });
					  } else
						  self.openShareTextcoinModal(btx.textAddress, btx.mnemonic, btx.amount, btx.asset, true);
				  }
  
				  $scope.eraseTextcoin = function() {
					  (function(){
						  var wallet = require('ocore/wallet.js');
						  var ModalInstanceCtrl = function($scope, $modalInstance, $sce) {
							  $scope.title = $sce.trustAsHtml(gettextCatalog.getString('Deleting the textcoin will remove the ability to claim it back or resend'));
							  $scope.cancel_button_class = 'light-gray outline';
							  $scope.loading = false;
							  $scope.confirm_label = gettextCatalog.getString('Confirm');
  
							  $scope.ok = function() {
								  $scope.loading = true;
								  $modalInstance.close(gettextCatalog.getString('Confirm'));
								  
								  wallet.eraseTextcoin(btx.unit, btx.addressTo);
								  
								  indexScope.updateTxHistory();
								  $rootScope.$emit('Local/SetTab', 'history');
							  };
							  $scope.cancel = function() {
								  $modalInstance.dismiss(gettextCatalog.getString('No'));
							  };
						  };
  
						  var modalInstance = $modal.open({
							  templateUrl: 'views/modals/confirmation.html',
							  windowClass: animationService.modalAnimated.slideUp,
							  controller: ModalInstanceCtrl
						  });
  
						  modalInstance.result.finally(function() {
							  var m = angular.element(document.getElementsByClassName('reveal-modal'));
							  m.addClass(animationService.modalAnimated.slideOutDown);
						  });
					  })();
				  }
  
  
				  $scope.getAmount = function(amount) {
					  return self.getAmount(amount);
				  };
  
				  $scope.getUnitName = function() {
					  return self.getUnitName();
				  };
  
				  $scope.openInExplorer = function() {
					  return self.openInExplorer(btx.unit);
				  };
  
				  $scope.copyAddress = function(addr) {
					  if (!addr) return;
					  self.copyAddress(addr);
				  };
  
				  $scope.getToAddressLabel = function(value) {
					  return indexScope.getToAddressLabel(value);
				  };
				  $scope.getAddressValue = function(value) {
					  return indexScope.getAddressValue(value);
				  };
  
				  $scope.showCorrespondentList = function() {
					  self.showCorrespondentListToReSendPrivPayloads(btx);
				  };
  
				  $scope.reSendPrivateMultiSigPayment = function() {
					  var indivisible_asset = require('ocore/indivisible_asset');
					  var wallet_defined_by_keys = require('ocore/wallet_defined_by_keys');
					  var walletDefinedByAddresses = require('ocore/wallet_defined_by_addresses');
					  var fc = profileService.focusedClient;
  
					  function success() {
						  $timeout(function() {
							  notification.success(gettextCatalog.getString('Success'), gettextCatalog.getString('Private payloads sent', {}));
						  });
					  }
  
					  indivisible_asset.restorePrivateChains(btx.asset, btx.unit, btx.addressTo, function(arrRecipientChains, arrCosignerChains) {
						  if (indexScope.shared_address) {
							  walletDefinedByAddresses.forwardPrivateChainsToOtherMembersOfAddresses(arrCosignerChains, [indexScope.shared_address], null, success);
						  }
						  else {
							  wallet_defined_by_keys.forwardPrivateChainsToOtherMembersOfWallets(arrCosignerChains, [fc.credentials.walletId], null, success);
						  }
					  });
				  };
  
				  $scope.cancel = function() {
					  breadcrumbs.add('dismiss tx details');
					  try {
						  $modalInstance.dismiss('cancel');
					  }
					  catch (e) {
						  //	indexScope.sendBugReport('simulated in dismiss tx details', e);
					  }
				  };
  
			  };
  
			  var modalInstance = $modal.open({
				  templateUrl: 'views/modals/tx-details.html',
				  windowClass: animationService.modalAnimated.slideRight,
				  controller: ModalInstanceCtrl,
			  });
  
			  var disableCloseModal = $rootScope.$on('closeModal', function() {
				  breadcrumbs.add('on closeModal tx details');
				  modalInstance.dismiss('cancel');
			  });
  
			  modalInstance.result.finally(function() {
				  $rootScope.modalOpened = false;
				  disableCloseModal();
				  var m = angular.element(document.getElementsByClassName('reveal-modal'));
				  m.addClass(animationService.modalAnimated.slideOutRight);
			  });
		  };
  
		  this.showCorrespondentListToReSendPrivPayloads = function(btx) {
			  $rootScope.modalOpened = true;
			  var self = this;
			  var fc = profileService.focusedClient;
			  var ModalInstanceCtrl = function($scope, $modalInstance, $timeout, go, notification) {
				  $scope.btx = btx;
				  $scope.settings = walletSettings;
				  $scope.color = fc.backgroundColor;
  
				  $scope.readList = function() {
					  $scope.error = null;
					  correspondentListService.list(function(err, ab) {
						  if (err) {
							  $scope.error = err;
							  return;
						  }
						  $scope.list = ab;
						  $timeout(function(){
							  $scope.$digest();
						  });
					  });
				  };
  
				  $scope.sendPrivatePayments = function(correspondent) {
					  var indivisible_asset = require('ocore/indivisible_asset');
					  var wallet_general = require('ocore/wallet_general');
					  indivisible_asset.restorePrivateChains(btx.asset, btx.unit, btx.addressTo, function(arrRecipientChains, arrCosignerChains) {
						  wallet_general.sendPrivatePayments(correspondent.device_address, arrRecipientChains, true, null, function() {
							  modalInstance.dismiss('cancel');
							  go.history();
							  $timeout(function() {
								  notification.success(gettextCatalog.getString('Success'), gettextCatalog.getString('Private payloads sent', {}));
							  });
						  });
					  });
  
				  };
  
				  $scope.back = function() {
					  self.openTxModal(btx);
				  };
  
			  };
  
			  var modalInstance = $modal.open({
				  templateUrl: 'views/modals/correspondentListToReSendPrivPayloads.html',
				  windowClass: animationService.modalAnimated.slideRight,
				  controller: ModalInstanceCtrl,
			  });
  
			  var disableCloseModal = $rootScope.$on('closeModal', function() {
				  modalInstance.dismiss('cancel');
			  });
  
			  modalInstance.result.finally(function() {
				  $rootScope.modalOpened = false;
				  disableCloseModal();
				  var m = angular.element(document.getElementsByClassName('reveal-modal'));
				  m.addClass(animationService.modalAnimated.slideOutRight);
			  });
		  };
  
		  this.hasAction = function(actions, action) {
			  return actions.hasOwnProperty('create');
		  };
  
  
		  /* Start setup */
  
		  this.bindTouchDown();
		  this.setSendPaymentFormInputs();
		  if (profileService.focusedClient && profileService.focusedClient.isComplete()) {
			  this.setAddress();
		  }
  
		  var store_mnemonic_back = function(){};
		  if (isCordova){
			  window.plugins.appPreferences.fetch(function(referrer){
				  if (referrer) {
					  console.log('==== referrer: '+referrer);
					  window.plugins.appPreferences.remove(function(){}, function(){}, 'referrer');
					  store_mnemonic_back = function() {
						  window.plugins.appPreferences.store(function(){}, function(){}, 'referrer', referrer);
					  };
					  if (referrer.split('-').length % 3 === 0)
						  $rootScope.$emit("claimTextcoin", referrer);
				  }
			  }, function(){}, "referrer");
		  }
	  });
  window.version="2.7.2";
  window.commitHash="dda1a2d";
  'use strict';
  
  angular.element(document).ready(function() {
  
	// Run copayApp after device is ready.
	var startAngular = function() {
	  angular.bootstrap(document, ['copayApp']);
	};
  
	  /*
	var handleBitcoinURI = function(url) {
	  if (!url) return;
	  if (url.indexOf('glidera') != -1) {
		url = '#/uri-glidera' + url.replace('bitcoin://glidera', '');
	  }
	  else {
		url = '#/uri-payment/' + url;
	  }
	  setTimeout(function() {
		window.location = url;
	  }, 1000);
	};
	*/
  
	/* Cordova specific Init */
	if (window.cordova !== undefined) {
  
	  document.addEventListener('deviceready', function() {
  
		  /*
		document.addEventListener('pause', function() {
		  if (!window.ignoreMobilePause) {
			setTimeout(function() {
			  window.location = '#/cordova/pause/';
			}, 100);
		  }
		  setTimeout(function() {
			window.ignoreMobilePause = false;
		  }, 100);
		}, false);
  
		document.addEventListener('resume', function() {
		  if (!window.ignoreMobilePause) {
			setTimeout(function() {
			  window.location = '#/cordova/resume/';
			}, 100);
		  }
		  setTimeout(function() {
			window.ignoreMobilePause = false;
		  }, 100);
		}, false);
		  */
  
		  /*
		// Back button event
		document.addEventListener('backbutton', function() {
		  var loc = window.location;
		  var isHome = loc.toString().match(/index\.html#\/$/) ? 'true' : '';
		  if (!window.ignoreMobilePause) {
			window.location = '#/cordova/backbutton/'+isHome;
		  }
		  setTimeout(function() {
			window.ignoreMobilePause = false;
		  }, 100);
		}, false);
		  */
  
		document.addEventListener('menubutton', function() {
		  window.location = '#/preferences';
		}, false);
		  
		  /*
		window.plugins.webintent.getUri(handleBitcoinURI);
		window.plugins.webintent.onNewIntent(handleBitcoinURI);
		window.handleOpenURL = handleBitcoinURI;
		  */
  
		window.plugins.touchid.isAvailable(
		  function(msg) { window.touchidAvailable = true; }, // success handler: TouchID available
		  function(msg) { window.touchidAvailable = false; } // error handler: no TouchID available
		);
  
		startAngular();
	  }, false);
	} else {
	  /*
	  try {
		window.handleOpenURL = handleBitcoinURI;
		window.plugins.webintent.getUri(handleBitcoinURI);
		window.plugins.webintent.onNewIntent(handleBitcoinURI);
	  } catch (e) {}
	  */
	  startAngular();
	}
  
  });
  
  
  
  
  