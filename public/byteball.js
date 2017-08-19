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
var breadcrumbs = require('byteballcore/breadcrumbs.js');

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
  .config(function(historicLogProvider, $provide, $logProvider, $stateProvider, $urlRouterProvider, $compileProvider) {
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
    $compileProvider.imgSrcSanitizationWhitelist(/^\s*((https?|ftp|file|blob|chrome-extension):|data:image\/)/);

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
      .state('preferencesGlobal.preferencesUnit', {
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
        nativeMenuBar.createMacBuiltin("Byteball");
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
              $state.transitionTo('splash');
            } else if (err.message && err.message.match('NONAGREEDDISCLAIMER')) {
              $log.debug('Display disclaimer... redirecting');
              $state.transitionTo('preferencesGlobal.preferencesAbout.disclaimer');
            } else {
              throw new Error(err); // TODO
            }
          } else {
            $log.debug('Profile loaded ... Starting UX.');
            $state.transitionTo(toState.name || toState, toParams);
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
angular.module('copayApp.directives')
.directive('validAddress', ['$rootScope', 'profileService',
    function($rootScope, profileService) {
      return {
        require: 'ngModel',
        link: function(scope, elem, attrs, ctrl) {
          var ValidationUtils = require('byteballcore/validation_utils.js');
          var validator = function(value) {
            if (!profileService.focusedClient)
              return;
			  
            if (typeof value == 'undefined') {
              ctrl.$pristine = true;
              return;
            }

            // Regular url
            if (/^https?:\/\//.test(value)) {
              ctrl.$setValidity('validAddress', true);
              return value;
            }

            // byteball uri
			var conf = require('byteballcore/conf.js');
			var re = new RegExp('^'+conf.program+':([A-Z2-7]{32})\b', 'i');
			var arrMatches = value.match(re);
            if (arrMatches) {
              ctrl.$setValidity('validAddress', ValidationUtils.isValidAddress(arrMatches[1]));
              return value;
            }

            // Regular Address
            ctrl.$setValidity('validAddress', ValidationUtils.isValidAddress(value));
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
  .directive('validAmount', ['configService',
    function(configService) {

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
			var constants = require('byteballcore/constants.js');
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
			  
            var vNum = Number((value * unitValue).toFixed(0));

            if (typeof value == 'undefined' || value == 0) {
              ctrl.$pristine = true;
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
      };
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
        negative: "="
      },
      controller: function($scope) {
        //$scope.logo_url = $scope.negative ? 'img/logo-negative.svg' : 'img/logo.svg';
        $scope.logo_url = $scope.negative ? 'img/icons/icon-white-32.png' : 'img/icons/icon-black-32.png';
      },
      replace: true,
      //template: '<img ng-src="{{ logo_url }}" alt="Byteball">'
      template: '<div><img ng-src="{{ logo_url }}" alt="Byteball"><br>Byteball</div>'
    }
  })
  .directive('availableBalance', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'views/includes/available-balance.html'
    }
  });

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

var breadcrumbs = require('byteballcore/breadcrumbs.js');

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
                video.src = (window.URL && window.URL.createObjectURL(stream)) || stream;
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
  .factory('addressService', function(profileService, $log, $timeout, lodash, gettextCatalog) {
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
                if (err)
                    return cb(err);
                cb(null, addr);
            });
        }
        else {
            var client = profileService.getClient(walletId);
            client.getAddresses({reverse: true, limit: 1, is_change: 0}, function(err, addr) {
                if (err)
                    return cb(err);
                if (addr.length > 0)
                    return cb(null, addr[0].address);
                else // issue new address
                    root.getAddress(walletId, true, cb);
            });
        }
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
      c.appendChild(cachedBackPanel);

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

	var device = require('byteballcore/device.js');
	var myWitnesses = require('byteballcore/my_witnesses.js');
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

		lastState = arrHistory.length ? arrHistory[arrHistory.length - 1] : null;
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

  root.oracles = {
		"FOPUBEUPBC6YLIQDLKL6EW775BMV7YOH": {
			name: "Bitcoin Oracle",
			feednames_filter: ["^bitcoin_merkle$", "^random[\\d]+$"],
			feedvalues_filter: ["^[13][a-km-zA-HJ-NP-Z1-9]{25,34}\\:[0-9\\.]+$", "^\\d{1,6}$"]
		},
		"JPQKPRI5FMTQRJF4ZZMYZYDQVRD55OTC" : {
			name: "Crypto exchange rates",
			feednames_filter: ["^[\\dA-Z]+_[\\dA-Z]+$"],
			feedvalues_filter: ["^[\\d\\.]+$"]
		},
		"GFK3RDAPQLLNCMQEVGGD2KCPZTLSG3HN" : {
			name: "Flight delay tracker",
			feednames_filter: ["^[\\w\\d]+-\\d{4}-\\d{2}-\\d{2}$"],
			feedvalues_filter: ["^[\\d]+$"]
		},
		"TKT4UESIKTTRALRRLWS4SENSTJX6ODCW" : {
			name: "Sports betting on soccer",
			feednames_filter: ["^[\\w\\d]+_[\\w\\d]+_\\d{4}-\\d{2}-\\d{2}$"],
			feedvalues_filter: ["^[\\w\\d]+$"]
		},
		"I2ADHGP4HL6J37NQAD73J7E5SKFIXJOT" : {
			name: "Timestamp",
			feednames_filter: ["^timestamp$"],
			feedvalues_filter: ["^\\d{13,}$"]
		}
	};
	
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

var constants = require('byteballcore/constants.js');
var eventBus = require('byteballcore/event_bus.js');
var ValidationUtils = require('byteballcore/validation_utils.js');
var objectHash = require('byteballcore/object_hash.js');

angular.module('copayApp.services').factory('correspondentListService', function($state, $rootScope, $sce, $compile, configService, storageService, profileService, go, lodash, $stickyState, $deepStateRedirect, $timeout, gettext) {
	var root = {};
	var device = require('byteballcore/device.js');
	var wallet = require('byteballcore/wallet.js');

	var chatStorage = require('byteballcore/chat_storage.js');
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
		var walletGeneral = require('byteballcore/wallet_general.js');
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
					message: 'new messages',
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
		if ($state.is('walletHome') && $rootScope.tab == 'walletHome') {
			setCurrentCorrespondent(peer_address, function(bAnotherCorrespondent){
				$stickyState.reset('correspondentDevices.correspondentDevice');
				go.path('correspondentDevices.correspondentDevice');
			});
		}
		else
			$rootScope.$digest();
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
	
	var payment_request_regexp = /\[.*?\]\(byteball:([0-9A-Z]{32})\?([\w=&;+%]+)\)/g; // payment description within [] is ignored
	
	function highlightActions(text, arrMyAddresses){
		return text.replace(/\b[2-7A-Z]{32}\b(?!(\?(amount|asset|device_address)|"))/g, function(address){
			if (!ValidationUtils.isValidAddress(address))
				return address;
		//	if (arrMyAddresses.indexOf(address) >= 0)
		//		return address;
			//return '<a send-payment address="'+address+'">'+address+'</a>';
			return '<a dropdown-toggle="#pop'+address+'">'+address+'</a><ul id="pop'+address+'" class="f-dropdown drop-to4p drop-4up" style="left:0px" data-dropdown-content><li><a ng-click="sendPayment(\''+address+'\')">'+gettext('Pay to this address')+'</a></li><li><a ng-click="offerContract(\''+address+'\')">'+gettext('Offer a contract')+'</a></li></ul>';
		//	return '<a ng-click="sendPayment(\''+address+'\')">'+address+'</a>';
			//return '<a send-payment ng-click="sendPayment(\''+address+'\')">'+address+'</a>';
			//return '<a send-payment ng-click="console.log(\''+address+'\')">'+address+'</a>';
			//return '<a onclick="console.log(\''+address+'\')">'+address+'</a>';
		}).replace(payment_request_regexp, function(str, address, query_string){
			if (!ValidationUtils.isValidAddress(address))
				return str;
		//	if (arrMyAddresses.indexOf(address) >= 0)
		//		return str;
			var objPaymentRequest = parsePaymentRequestQueryString(query_string);
			if (!objPaymentRequest)
				return str;
			return '<a ng-click="sendPayment(\''+address+'\', '+objPaymentRequest.amount+', \''+objPaymentRequest.asset+'\', \''+objPaymentRequest.device_address+'\')">'+objPaymentRequest.amountStr+'</a>';
		}).replace(/\[(.+?)\]\(command:(.+?)\)/g, function(str, description, command){
			return '<a ng-click="sendCommand(\''+escapeQuotes(command)+'\', \''+escapeQuotes(description)+'\')" class="command">'+description+'</a>';
		}).replace(/\[(.+?)\]\(payment:(.+?)\)/g, function(str, description, paymentJsonBase64){
			var arrMovements = getMovementsFromJsonBase64PaymentRequest(paymentJsonBase64, true);
			if (!arrMovements)
				return '[invalid payment request]';
			description = 'Payment request: '+arrMovements.join(', ');
			return '<a ng-click="sendMultiPayment(\''+paymentJsonBase64+'\')">'+description+'</a>';
		}).replace(/\[(.+?)\]\(vote:(.+?)\)/g, function(str, description, voteJsonBase64){
			var objVote = getVoteFromJsonBase64(voteJsonBase64);
			if (!objVote)
				return '[invalid vote request]';
			return '<a ng-click="sendVote(\''+voteJsonBase64+'\')">'+objVote.choice+'</a>';
		}).replace(/\bhttps?:\/\/\S+/g, function(str){
			return '<a ng-click="openExternalLink(\''+escapeQuotes(str)+'\')" class="external-link">'+str+'</a>';
		});
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
		return escapeHtmlAndInsertBr(text).replace(payment_request_regexp, function(str, address, query_string){
			if (!ValidationUtils.isValidAddress(address))
				return str;
			var objPaymentRequest = parsePaymentRequestQueryString(query_string);
			if (!objPaymentRequest)
				return str;
			return '<i>'+objPaymentRequest.amountStr+' to '+address+'</i>';
		}).replace(/\[(.+?)\]\(payment:(.+?)\)/g, function(str, description, paymentJsonBase64){
			var arrMovements = getMovementsFromJsonBase64PaymentRequest(paymentJsonBase64);
			if (!arrMovements)
				return '[invalid payment request]';
			return '<i>Payment request: '+arrMovements.join(', ')+'</i>';
		}).replace(/\[(.+?)\]\(vote:(.+?)\)/g, function(str, description, voteJsonBase64){
			var objVote = getVoteFromJsonBase64(voteJsonBase64);
			if (!objVote)
				return '[invalid vote request]';
			return '<i>Vote request: '+objVote.choice+'</i>';
		}).replace(/\bhttps?:\/\/\S+/g, function(str){
			return '<a ng-click="openExternalLink(\''+escapeQuotes(str)+'\')" class="external-link">'+str+'</a>';
		});
	}
	
	function parsePaymentRequestQueryString(query_string){
		var URI = require('byteballcore/uri.js');
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
		var amountStr = 'Payment request: ' + getAmountText(amount, asset);
		return {
			amount: amount,
			asset: asset,
			device_address: device_address,
			amountStr: amountStr
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
		else
			return amount + ' of ' + asset;
	}
		
	function getHumanReadableDefinition(arrDefinition, arrMyAddresses, arrMyPubKeys, bWithLinks){
		function parse(arrSubdefinition){
			var op = arrSubdefinition[0];
			var args = arrSubdefinition[1];
			switch(op){
				case 'sig':
					var pubkey = args.pubkey;
					return 'signed by '+(arrMyPubKeys.indexOf(pubkey) >=0 ? 'you' : 'public key '+pubkey);
				case 'address':
					var address = args;
					return 'signed by '+(arrMyAddresses.indexOf(address) >=0 ? 'you' : address);
				case 'cosigned by':
					var address = args;
					return 'co-signed by '+(arrMyAddresses.indexOf(address) >=0 ? 'you' : address);
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
					if (feed_name === 'timestamp' && relation === '>')
						return 'after ' + ((typeof value === 'number') ? new Date(value).toString() : value);
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
						return 'sends at least ' + getAmountText(args.amount_at_least, args.asset) + ' to ' + (arrMyAddresses.indexOf(args.address) >=0 ? 'you' : args.address);
					if (args.what === 'output' && args.asset && args.amount && args.address)
						return 'sends ' + getAmountText(args.amount, args.asset) + ' to ' + (arrMyAddresses.indexOf(args.address) >=0 ? 'you' : args.address);
					return JSON.stringify(arrSubdefinition);
				case 'seen':
					if (args.what === 'output' && args.asset && args.amount && args.address){
						var dest_address = ((args.address === 'this address') ? objectHash.getChash160(arrDefinition) : args.address);
						var bOwnAddress = (arrMyAddresses.indexOf(args.address) >= 0);
						var display_dest_address = (bOwnAddress ? 'you' : args.address);
						var expected_payment = getAmountText(args.amount, args.asset) + ' to ' + display_dest_address;
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
		var limit = 10;
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
			var walletGeneral = require('byteballcore/wallet_general.js');
			walletGeneral.readMyAddresses(function(arrMyAddresses){
				if (messages.length < limit)
					historyEndForCorrespondent[correspondent.device_address] = true;
				for (var i in messages) {
					var message = messages[i];
					var msg_ts = new Date(message.creation_date.replace(' ', 'T')+'.000Z');
					if (last_msg_ts && last_msg_ts.getDay() != msg_ts.getDay()) {
						messageEvents.unshift({type: 'system', bIncoming: false, message: last_msg_ts.toDateString(), timestamp: Math.floor(msg_ts.getTime() / 1000)});	
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
					messageEvents.unshift({type: 'system', bIncoming: false, message: (last_msg_ts ? last_msg_ts : new Date()).toDateString(), timestamp: Math.floor((last_msg_ts ? last_msg_ts : new Date()).getTime() / 1000)});
				}
				$rootScope.$digest();
				if (cb) cb();
			});
		});
	}

	function checkAndInsertDate(messageEvents, message) {
		if (messageEvents.length == 0 || typeof messageEvents[messageEvents.length-1].timestamp == "undefined") return;

		var msg_ts = new Date(message.timestamp * 1000);
		var last_msg_ts = new Date(messageEvents[messageEvents.length-1].timestamp * 1000);
		if (last_msg_ts.getDay() != msg_ts.getDay()) {
			messageEvents.push({type: 'system', bIncoming: false, message: msg_ts.toDateString(), timestamp: Math.floor(msg_ts.getTime() / 1000)});	
		}
	}

	function parseMessage(message) {
		switch (message.type) {
			case "system":
				message.message = JSON.parse(message.message);
				message.message = "chat recording " + (message.message.state ? "&nbsp;" : "") + "<b dropdown-toggle=\"#recording-drop\">" + (message.message.state ? "ON" : "OFF") + "</b><span class=\"padding\"></span>";
				message.chat_recording_status = true;
				break;
		}
		return message;
	}
	
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
				$rootScope.$digest();
				chatStorage.store(correspondent_address, JSON.stringify({state: newState}), 0, 'system');
			}
			if (root.currentCorrespondent && root.currentCorrespondent.device_address == correspondent_address) {
				root.currentCorrespondent.peer_record_pref = enabled ? 1 : 0;
			}
		});
	});
	
	eventBus.on("sent_payment", function(peer_address, amount, asset){
		setCurrentCorrespondent(peer_address, function(bAnotherCorrespondent){
			var body = '<a ng-click="showPayment(\''+asset+'\')" class="payment">Payment: '+getAmountText(amount, asset)+'</a>';
			addMessageEvent(false, peer_address, body);
			device.readCorrespondent(peer_address, function(correspondent){
				if (correspondent.my_record_pref && correspondent.peer_record_pref) chatStorage.store(peer_address, body, 0, 'html');
			});
			go.path('correspondentDevices.correspondentDevice');
		});
	});
	
	eventBus.on("received_payment", function(peer_address, amount, asset, message_counter){
		var body = '<a ng-click="showPayment(\''+asset+'\')" class="payment">Payment: '+getAmountText(amount, asset)+'</a>';
		addMessageEvent(true, peer_address, body, message_counter);
		device.readCorrespondent(peer_address, function(correspondent){
			if (correspondent.my_record_pref && correspondent.peer_record_pref) chatStorage.store(peer_address, body, 1, 'html');
		});
	});
	
	eventBus.on('paired', function(device_address){
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
			$rootScope.$digest();
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
	
	var fs = require('fs' + '');
	try {
		var desktopApp = require('byteballcore/desktop_app.js' + '');
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
	
	function _cordovaWriteFile(dirEntry, name, data, cb) {
		if(typeof data != 'string') data = data.buffer;
		dirEntry.getFile(name, {create: true, exclusive: false}, function(file) {
			file.createWriter(function(writer) {
				writer.onwriteend = function() {
					cb(null); 
				};
				writer.write(data);
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

var eventBus = require('byteballcore/event_bus.js');

angular.module('copayApp.services').factory('go', function($window, $rootScope, $location, $state, profileService, fileSystemService, nodeWebkit, notification, gettextCatalog, authService, $deepStateRedirect, $stickyState) {
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
		console.log("handleUri "+uri);
		require('byteballcore/uri.js').parseUri(uri, {
			ifError: function(err){
				console.log(err);
				notification.error(err);
				//notification.success(gettextCatalog.getString('Success'), err);
			},
			ifOk: function(objRequest){
				console.log("request: "+JSON.stringify(objRequest));
				if (objRequest.type === 'address'){
					root.send(function(){
						$rootScope.$emit('paymentRequest', objRequest.address, objRequest.amount, objRequest.asset);
					});
				}
				else if (objRequest.type === 'pairing'){
					$rootScope.$emit('Local/CorrespondentInvitation', objRequest.pubkey, objRequest.hub, objRequest.pairing_secret);
				}
				else if (objRequest.type === 'auth'){
					authService.objRequest = objRequest;
					root.path('authConfirmation');
				}
				else
					throw Error('unknown url type: '+objRequest.type);
			}
		});
	}
	
	function extractByteballArgFromCommandLine(commandLine){
		var conf = require('byteballcore/conf.js');
		var re = new RegExp('^'+conf.program+':', 'i');
		var arrParts = commandLine.split(' '); // on windows includes exe and all args, on mac just our arg
		for (var i=0; i<arrParts.length; i++){
			var part = arrParts[i].trim();
			if (part.match(re))
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
		var pkg = require('../package.json'+''); // relative to html root
		var applicationsDir = process.env.HOME + '/.local/share/applications';
		fileSystemService.recursiveMkdir(applicationsDir, parseInt('700', 8), function(err){
			console.log('mkdir applications: '+err);
			fs.writeFile(applicationsDir + '/' +pkg.name+'.desktop', "[Desktop Entry]\n\
Type=Application\n\
Version=1.0\n\
Name="+pkg.name+"\n\
Comment="+pkg.description+"\n\
Exec="+process.execPath.replace(/ /g, '\\ ')+" %u\n\
Icon="+path.dirname(process.execPath)+"/public/img/icons/icon-white-outline.iconset/icon_256x256.png\n\
Terminal=false\n\
Categories=Office;Finance;\n\
MimeType=x-scheme-handler/"+pkg.name+";\n\
X-Ubuntu-Touch=true\n\
X-Ubuntu-StageHint=SideStage\n", {mode: 0755}, function(err){
				if (err)
					throw Error("failed to write desktop file: "+err);
				child_process.exec('update-desktop-database ~/.local/share/applications', function(err){
					if (err)
						throw Error("failed to exec update-desktop-database: "+err);
					console.log(".desktop done");
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
					var file = extractByteballArgFromCommandLine(commandLine);
					if (!file)
						return console.log("no byteball: arg found");
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
			var db = require('byteballcore/db.js');
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
	console.log("saving open url "+url);
	window.open_url = url;
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
    $log.info('Starting Byteball v' + window.version + ' #' + window.commitHash);
    $log.info('Client: isCordova:', isCordova, 'isNodeWebkit:', nodeWebkit.isDefined());
    $log.info('Navigator:', navigator.userAgent);
    return {};
  });

'use strict';

var eventBus = require('byteballcore/event_bus.js');

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
      html5DefaultIcon: 'img/icons/favicon-white.ico'
    };

    function html5Notify(icon, title, content, ondisplay, onclose) {
      if (window.webkitNotifications && window.webkitNotifications.checkPermission() === 0) {
        if (!icon) {
          icon = 'img/icons/favicon-white.ico';
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

var breadcrumbs = require('byteballcore/breadcrumbs.js');

angular.module('copayApp.services')
  .factory('profileService', function profileServiceFactory($rootScope, $location, $timeout, $filter, $log, lodash, storageService, bwcService, configService, pushNotificationsService, isCordova, gettext, gettextCatalog, nodeWebkit, uxLanguage) {

    var root = {};

    root.profile = null;
    root.focusedClient = null;
    root.walletClients = {};
    

    root.Utils = bwcService.getUtils();
    root.formatAmount = function(amount, asset, opts) {
      var config = configService.getSync().wallet.settings;
      //if (config.unitCode == 'byte') return amount;

      //TODO : now only works for english, specify opts to change thousand separator and decimal separator
		if(asset == 'blackbytes') {
			return this.Utils.formatAmount(amount, config.bbUnitCode, opts);
		}else if(asset == 'base'){
			return this.Utils.formatAmount(amount, config.unitCode, opts);
		}else{
		    return amount;
        }
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
					require('byteballcore/wallet.js');
					var device = require('byteballcore/device.js');
                    var config = configService.getSync();
                    var firstWc = root.walletClients[lodash.keys(root.walletClients)[0]];
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
			require('byteballcore/wallet.js'); // load hub/ message handlers
			var device = require('byteballcore/device.js');
            var tempDeviceKey = device.genPrivKey();
			// initDeviceProperties sets my_device_address needed by walletClient.createWallet
			walletClient.initDeviceProperties(walletClient.credentials.xPrivKey, null, config.hub, config.deviceName);
            var walletName = gettextCatalog.getString('Small Expenses Wallet');
            walletClient.createWallet(walletName, 1, 1, {
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
		var walletDefinedByKeys = require('byteballcore/wallet_defined_by_keys.js');
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
                    cosigners: opts.cosigners
                }, function(err) {
                    if (err) 
                        return cb(gettext('Error creating wallet')+": "+err);
                    root._addWalletClient(walletClient, opts, cb);
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
            return cb(gettext('Wallet already in Byteball' + ": ") + w.walletName);

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
		var device = require('byteballcore/device.js');
		
		root.profile.credentials = [];
		root.profile.xPrivKey = xPrivKey;
		root.profile.mnemonic = mnemonic;
		root.profile.my_device_address = myDeviceAddress;
		device.setNewDeviceAddress(myDeviceAddress);
		
		storageService.storeProfile(root.profile, function () {
			return cb();
		});
	};


    return root;
  });

'use strict';
angular.module('copayApp.services')
.factory('pushNotificationsService', function($http, $rootScope, $log, isMobile, $timeout, storageService, configService, lodash, isCordova) {
	var root = {};
	var defaults = configService.getDefaults();
	var usePushNotifications = isCordova && !isMobile.Windows() && isMobile.Android();
	var projectNumber;
	var _ws;
	
	var eventBus = require('byteballcore/event_bus.js');	
	
	function sendRequestEnableNotification(ws, registrationId) {
		var network = require('byteballcore/network.js');
		network.sendRequest(ws, 'hub/enable_notification', registrationId, false, function(ws, request, response) {
			if (!response || (response && response !== 'ok')) return $log.error('Error sending push info');
		});
	}
	
	window.onNotification = function(data) {
		if (data.event === 'registered') {
			storageService.setPushInfo(projectNumber, data.regid, true, function() {
				sendRequestEnableNotification(_ws, data.regid);
			});
		}
		else {
			return false;
		}
	};
	
	eventBus.on('receivedPushProjectNumber', function(ws, data) {
		if (!usePushNotifications) return;
		_ws = ws;
		if (data && data.projectNumber !== undefined) {
			$timeout(function(){
				storageService.getPushInfo(function(err, pushInfo) {
					var config = configService.getSync();
					projectNumber = data.projectNumber + "";
					if (pushInfo && projectNumber === "0") {
						root.pushNotificationsUnregister(function() {

						});
					}
					else if (projectNumber && config.pushNotifications.enabled) {
						root.pushNotificationsInit();
					}
				});
			});
		}
	});
	
	root.pushNotificationsInit = function() {
		if (!usePushNotifications) return;
		
		window.plugins.pushNotification.register(function(data) {
			},
			function(e) {
				alert('err= ' + e);
			}, {
				"senderID": projectNumber,
				"ecb": "onNotification"
			});
		
		configService.set({pushNotifications: {enabled: true}}, function(err) {
			if (err) $log.debug(err);
		});
	};
	
	function disable_notification() {
		storageService.getPushInfo(function(err, pushInfo) {
			storageService.removePushInfo(function() {
				var network = require('byteballcore/network.js');
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
		if (!usePushNotifications) return;
		window.plugins.pushNotification.unregister(function() {
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

var constants = require('byteballcore/constants.js');

angular.module('copayApp.services').factory('txFormatService', function(profileService, configService, lodash) {
  var root = {};

  var formatAmountStr = function(amount, asset) {
    if (!amount) return;
      if (asset !== "base" && asset !==  constants.BLACKBYTES_ASSET)
          return amount;
    var config = configService.getSync().wallet.settings;
    var assetName = asset !== "base" ? 'blackbytes' : 'base';
	  var unitName = asset !== "base" ? config.bbUnitName : config.unitName;
		return profileService.formatAmount(amount, assetName) + ' ' + unitName;
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
      name: 'Svenska',
      isoCode: 'sv_SE',
    }, {
      name: 'Polski',
      isoCode: 'pl_PL',
    }, {
      name: 'Magyar',
      isoCode: 'hu_HU',
    }, {
      name: 'Shqip',
      isoCode: 'sq_AL',
    }, {
      name: 'Ελληνικά',
      isoCode: 'el_GR',
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

'use strict';

angular.module('copayApp.controllers').controller('approveNewWitnesses', function($scope, $modalInstance, $document, autoUpdatingWitnessesList){
  $scope.addWitnesses = autoUpdatingWitnessesList.addWitnesses;
  $scope.delWitnesses = autoUpdatingWitnessesList.delWitnesses;


  $scope.replace = function(){
    var oldWitnesses = $scope.delWitnesses;
    var newWitnesses = $scope.addWitnesses;

    var n = 0, l = newWitnesses.length;

    function replaceWitness(n, oldWitnesses, newWitnesses){
	  var myWitnesses = require('byteballcore/my_witnesses.js');
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

var ecdsaSig = require('byteballcore/signature.js');

angular.module('copayApp.controllers').controller('authConfirmationController',
  function($scope, $timeout, configService, profileService, go, authService) {
    
    function extractDomainFromUrl(url){
        var domain_with_path = url.replace(/^https?:\/\//i, '');
        var domain = domain_with_path.replace(/\/.*$/, '');
        domain = domain.replace(/^www\./i, '');
        return domain;
    }
    
    var self = this;
	var bbWallet = require('byteballcore/wallet.js');
    
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
	
	if (isCordova)
		self.text = "To protect your funds, please use multisig wallets with redundancy, e.g. 1-of-2 wallet with one key on this device and another key on your laptop computer.  Just the wallet seed is not enough.";
	else{
		var desktopApp = require('byteballcore/desktop_app.js'+'');
		var appDataDir = desktopApp.getAppDataDir();
        restoreText1 = gettext("To restore your wallets, you will need a full backup of Byteball data at ");
        restoreText2 = gettext(".  Better yet, use multisig wallets with redundancy, e.g. 1-of-2 wallet with one key on this device and another key on your smartphone.  Just the wallet seed is not enough.");
		self.text = restoreText1 + appDataDir + restoreText2;
	}


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

'use strict';


var constants = require('byteballcore/constants.js');

angular.module('copayApp.controllers').controller('correspondentDeviceController',
  function($scope, $rootScope, $timeout, $sce, $modal, configService, profileService, animationService, isCordova, go, correspondentListService, addressService, lodash, $deepStateRedirect, $state, backButton) {
	
	var chatStorage = require('byteballcore/chat_storage.js');
	var self = this;
	console.log("correspondentDeviceController");
	var device = require('byteballcore/device.js');
	var eventBus = require('byteballcore/event_bus.js');
	var conf = require('byteballcore/conf.js');
	var storage = require('byteballcore/storage.js');
	var breadcrumbs = require('byteballcore/breadcrumbs.js');
	
	var fc = profileService.focusedClient;
	var chatScope = $scope;
	var indexScope = $scope.index;
	$rootScope.tab = $scope.index.tab = 'chat';
	var correspondent = correspondentListService.currentCorrespondent;
	$scope.correspondent = correspondent;
//	var myPaymentAddress = indexScope.shared_address;
	if (document.chatForm && document.chatForm.message)
		document.chatForm.message.focus();
	
	if (!correspondentListService.messageEventsByCorrespondent[correspondent.device_address])
		correspondentListService.messageEventsByCorrespondent[correspondent.device_address] = [];
	$scope.messageEvents = correspondentListService.messageEventsByCorrespondent[correspondent.device_address];

	$scope.$watch("correspondent.my_record_pref", function(pref, old_pref) {
		if (pref == old_pref) return;
		var device = require('byteballcore/device.js');
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
		readMyPaymentAddress(appendMyPaymentAddress);
	//	issueNextAddressIfNecessary(appendMyPaymentAddress);
	};
	
	$scope.requestPayment = function(){
		if (!profileService.focusedClient.credentials.isComplete())
			return $rootScope.$emit('Local/ShowErrorAlert', "The wallet is not approved yet");
		readMyPaymentAddress(showRequestPaymentModal);
	//	issueNextAddressIfNecessary(showRequestPaymentModal);
	};
	
	$scope.sendPayment = function(address, amount, asset){
		console.log("will send payment to "+address);
		if (asset && $scope.index.arrBalances.filter(function(balance){ return (balance.asset === asset); }).length === 0){
			console.log("i do not own anything of asset "+asset);
			return;
		}
		backButton.dontDeletePath = true;
		go.send(function(){
			//$rootScope.$emit('Local/SetTab', 'send', true);
			$rootScope.$emit('paymentRequest', address, amount, asset, correspondent.device_address);
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
	

	
	
	$scope.offerContract = function(address){
		var walletDefinedByAddresses = require('byteballcore/wallet_defined_by_addresses.js');
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
			$scope.arrPeerPaysTos = [{value: 'me', display_value: "me"}, {value: 'contract', display_value: "this contract"}];
			$scope.arrAssetInfos = indexScope.arrBalances.map(function(b){
				var info = {asset: b.asset, is_private: b.is_private};
				if (b.asset === 'base')
					info.displayName = walletSettings.unitName;
				else if (b.asset === constants.BLACKBYTES_ASSET)
					info.displayName = walletSettings.bbUnitName;
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
					my_amount = Math.round(my_amount);
					
					var peer_amount = contract.peerAmount;
					if (contract.peerAsset === "base")
						peer_amount *= walletSettings.unitValue;
					if (contract.peerAsset === constants.BLACKBYTES_ASSET)
						throw Error("peer asset cannot be blackbytes");
					peer_amount = Math.round(peer_amount);
					
					if (my_amount === peer_amount && contract.myAsset === contract.peerAsset && contract.peer_pays_to === 'contract'){
						$scope.error = "The amounts are equal, you cannot require the peer to pay to the contract.  Please either change the amounts slightly or fund the entire contract yourself and require the peer to pay his half to you.";
						$timeout(function() {
							$scope.$digest();
						}, 1);
						return;
					}
					
					var fnReadMyAddress = (contract.peer_pays_to === 'contract') ? readMyPaymentAddress : issueNextAddress;
					fnReadMyAddress(function(my_address){
						var arrSeenCondition = ['seen', {
							what: 'output', 
							address: (contract.peer_pays_to === 'contract') ? 'this address' : my_address, 
							asset: contract.peerAsset, 
							amount: peer_amount
						}];
						readLastMainChainIndex(function(err, last_mci){
							if (err){
								$scope.error = err;
								$timeout(function() {
									$scope.$digest();
								}, 1);
								return;
							}
							var arrExplicitEventCondition = 
								['in data feed', [[contract.oracle_address], contract.feed_name, contract.relation, contract.feed_value+'', last_mci]];
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
						var arrSigningDeviceAddresses = []; // empty list means that all signatures are required (such as 2-of-2)
						if (fc.credentials.m < fc.credentials.n)
							indexScope.copayers.forEach(function(copayer){
								if (copayer.me || copayer.signs)
									arrSigningDeviceAddresses.push(copayer.device_address);
							});
						else if (indexScope.shared_address)
							arrSigningDeviceAddresses = indexScope.copayers.map(function(copayer){ return copayer.device_address; });
						profileService.bKeepUnlocked = true;
						var opts = {
							shared_address: indexScope.shared_address,
							asset: contract.myAsset,
							to_address: shared_address,
							amount: my_amount,
							arrSigningDeviceAddresses: arrSigningDeviceAddresses,
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
							eventBus.emit('sent_payment', correspondent.device_address, my_amount, contract.myAsset);
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
								issueNextAddress(); // make sure the address is not reused
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
	
	
	

	$scope.sendMultiPayment = function(paymentJsonBase64){
		var async = require('async');
		var db = require('byteballcore/db.js');
		var walletDefinedByAddresses = require('byteballcore/wallet_defined_by_addresses.js');
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
								$scope.arrHumanReadableDefinitions.push({
									destinationAddress: destinationAddress,
									humanReadableDefinition: correspondentListService.getHumanReadableDefinition(arrDefinition, arrMyAddresses, [])
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
						var arrSigningDeviceAddresses = []; // empty list means that all signatures are required (such as 2-of-2)
						if (fc.credentials.m < fc.credentials.n)
							indexScope.copayers.forEach(function(copayer){
								if (copayer.me || copayer.signs)
									arrSigningDeviceAddresses.push(copayer.device_address);
							});
						else if (indexScope.shared_address)
							arrSigningDeviceAddresses = indexScope.copayers.map(function(copayer){ return copayer.device_address; });
						var current_multi_payment_key = require('crypto').createHash("sha256").update(paymentJson).digest('base64');
						if (current_multi_payment_key === indexScope.current_multi_payment_key){
							$rootScope.$emit('Local/ShowErrorAlert', "This payment is already under way");
							$modalInstance.dismiss('cancel');
							return;
						}
						indexScope.current_multi_payment_key = current_multi_payment_key;
						var recipient_device_address = lodash.clone(correspondent.device_address);
						fc.sendMultiPayment({
							asset: asset,
							arrSigningDeviceAddresses: arrSigningDeviceAddresses,
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
							for (var asset in assocPaymentsByAsset)
								eventBus.emit('sent_payment', recipient_device_address, assocPaymentsByAsset[asset], asset);
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
		var async = require('async');
		var db = require('byteballcore/db.js');
		var objectHash = require('byteballcore/object_hash.js');
		var network = require('byteballcore/network.js');
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
							payload_hash: objectHash.getBase64Hash(payload),
							payload: payload
						};

						var arrSigningDeviceAddresses = []; // empty list means that all signatures are required (such as 2-of-2)
						if (fc.credentials.m < fc.credentials.n)
							indexScope.copayers.forEach(function(copayer){
								if (copayer.me || copayer.signs)
									arrSigningDeviceAddresses.push(copayer.device_address);
							});
						else if (indexScope.shared_address)
							arrSigningDeviceAddresses = indexScope.copayers.map(function(copayer){ return copayer.device_address; });
						var current_vote_key = require('crypto').createHash("sha256").update(voteJson).digest('base64');
						if (current_vote_key === indexScope.current_vote_key){
							$rootScope.$emit('Local/ShowErrorAlert', "This vote is already under way");
							$modalInstance.dismiss('cancel');
							return;
						}
						var recipient_device_address = lodash.clone(correspondent.device_address);
						indexScope.current_vote_key = current_vote_key;
						fc.sendMultiPayment({
							arrSigningDeviceAddresses: arrSigningDeviceAddresses,
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
	
	
	
	
	// send a command to the bot
	$scope.sendCommand = function(command, description){
		console.log("will send command "+command);
		$scope.message = command;
		$scope.send();
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
		correspondentListService.loadMoreHistory(correspondent, cb);
	}

	$scope.autoScrollEnabled = true;
	$scope.loadMoreHistory(function(){
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
	
	function readLastMainChainIndex(cb){
		if (conf.bLight){
			var network = require('byteballcore/network.js');
			network.requestFromLightVendor('get_last_mci', null, function(ws, request, response){
				response.error ? cb(response.error) : cb(null, response);
			});
		}
		else
			storage.readLastMainChainIndex(function(last_mci){
				cb(null, last_mci);
			})
	}
	
	function readMyPaymentAddress(cb){
		if (indexScope.shared_address)
			return cb(indexScope.shared_address);
		addressService.getAddress(profileService.focusedClient.credentials.walletId, false, function(err, address) {
			cb(address);
		});
	}
	
	function issueNextAddress(cb){
		var walletDefinedByKeys = require('byteballcore/wallet_defined_by_keys.js');
		walletDefinedByKeys.issueNextAddress(profileService.focusedClient.credentials.walletId, 0, function(addressInfo){
			if (cb)
				cb(addressInfo.address);
		});
	}
	
	/*
	function issueNextAddressIfNecessary(onDone){
		if (myPaymentAddress) // do not issue new address
			return onDone();
		var walletDefinedByKeys = require('byteballcore/wallet_defined_by_keys.js');
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
		$timeout(function(){$rootScope.$digest()});
		msgField.selectionStart = msgField.selectionEnd = msgField.value.length;
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
				var amountInSmallestUnits = (asset === 'base') ? parseInt((amount * $scope.unitValue).toFixed(0)) : (asset === constants.BLACKBYTES_ASSET ? parseInt((amount * $scope.bbUnitValue).toFixed(0)) : amount);
				var params = 'amount='+amountInSmallestUnits;
				if (asset !== 'base')
					params += '&asset='+encodeURIComponent(asset);
				var units = (asset === 'base') ? $scope.unitName : (asset === constants.BLACKBYTES_ASSET ? $scope.bbUnitName : ('of '+asset));
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
}).directive('ngEnter', function() {
    return function(scope, element, attrs) {
        element.bind("keydown", function(e) {
            if(e.which === 13 && !e.shiftKey) {
                scope.$apply(function(){
                    scope.$eval(attrs.ngEnter, {'e': e});
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
        	if (raw.scrollTop + raw.offsetHeight != raw.scrollHeight) 
        		scope.autoScrollEnabled = false;
        	else 
        		scope.autoScrollEnabled = true;
            if (raw.scrollTop <= 20 && !scope.loadingHistory) { // load more items before you hit the top
                scope.loadingHistory = true;
                chatScrollPosition.prepareFor('up');
            	scope[attr.whenScrolled](function(){
            		scope.$digest();
                	chatScrollPosition.restore();
                	scope.loadingHistory = false;
                });
            }
        });
    };
}]);

'use strict';

angular.module('copayApp.controllers').controller('correspondentDevicesController',
  function($scope, $timeout, configService, profileService, go, correspondentListService, $state, $rootScope) {
	
	var self = this;
	
	var wallet = require('byteballcore/wallet.js');
	var bots = require('byteballcore/bots.js');
	var mutex = require('byteballcore/mutex.js');
	$scope.editCorrespondentList = false;
	$scope.selectedCorrespondentList = {};
	var fc = profileService.focusedClient;
	$scope.backgroundColor = fc.backgroundColor;

	$scope.state = $state;

	$scope.hideRemove = true;

	var listScrollTop = 0;

	$scope.$on('$stateChangeStart', function(evt, toState, toParams, fromState) {
	    if (toState.name === 'correspondentDevices') {
	        $scope.readList();
	    	setTimeout(function(){document.querySelector('[ui-view=chat]').scrollTop = listScrollTop;$rootScope.$emit('Local/SetTab', 'chat', true);}, 5);
	    }
	});

	$scope.showCorrespondent = function(correspondent) {
		console.log("showCorrespondent", correspondent);
		correspondentListService.currentCorrespondent = correspondent;
		listScrollTop = document.querySelector('[ui-view=chat]').scrollTop;
		go.path('correspondentDevices.correspondentDevice');
	};

	$scope.showBot = function(bot) {
		$state.go('correspondentDevices.bot', {id: bot.id});
	};

	$scope.toggleEditCorrespondentList = function() {
		$scope.editCorrespondentList = !$scope.editCorrespondentList;
		$scope.selectedCorrespondentList = {};
	};

	$scope.toggleSelectCorrespondentList = function(addr) {
		$scope.selectedCorrespondentList[addr] = $scope.selectedCorrespondentList[addr] ? false : true;
	};

	$scope.newMsgByAddressComparator = function(correspondent) {
	      return (-$scope.newMessagesCount[correspondent.device_address]||correspondent.name.toLowerCase());
	};

	$scope.beginAddCorrespondent = function() {
		console.log("beginAddCorrespondent");
		listScrollTop = document.querySelector('[ui-view=chat]').scrollTop;
		go.path('correspondentDevices.addCorrespondentDevice');
	};


	$scope.readList = function() {
		$scope.error = null;
		correspondentListService.list(function(err, ab) {
			if (err) {
				$scope.error = err;
				return;
			}

			wallet.readDeviceAddressesUsedInSigningPaths(function(arrNotRemovableDeviceAddresses) {

				// add a new property indicating whether the device can be removed or not
				
				var length = ab.length;
				for (var i = 0; i < length; i++) {
 				 	corrDev = ab[i];

				 	corrDevAddr = corrDev.device_address;
					
				 	var ix = arrNotRemovableDeviceAddresses.indexOf(corrDevAddr);
					
					// device is removable when not in list
				 	corrDev.removable = (ix == -1);
				}
			});
		
			$scope.list = ab;

			bots.load(function(err, rows){
				if (err) $scope.botsError = err.toString();
				$scope.bots = rows;
				$scope.$digest();
			});
		});
	};
	
	$scope.hideRemoveButton = function(removable){
		return $scope.hideRemove || !removable;
	}

	$scope.remove = function(device_address) {
		mutex.lock(["remove_device"], function(unlock){
			// check to be safe
			wallet.determineIfDeviceCanBeRemoved(device_address, function(bRemovable) {
				if (!bRemovable) {
					unlock();
					return console.log('device '+device_address+' is not removable');
				}
				var device = require('byteballcore/device.js');

				// send message to paired device
				// this must be done before removing the device
				device.sendMessageToDevice(device_address, "removed_paired_device", "removed");

				// remove device
				device.removeCorrespondentDevice(device_address, function() {
					unlock();
					$scope.hideRemove = true;
					correspondentListService.currentCorrespondent = null;
					$scope.readList();
					$rootScope.$emit('Local/SetTab', 'chat', true);
					setTimeout(function(){document.querySelector('[ui-view=chat]').scrollTop = listScrollTop;}, 5);
				});
			});
		});
	};

	$scope.cancel = function() {
		console.log("cancel clicked");
		go.walletHome();
	};

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
		$scope.$digest();
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
			cosigners: []
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
  function($scope, $rootScope, $timeout, configService, profileService, isCordova, go, correspondentListService, $modal, animationService) {
	
	var self = this;
	
	var fc = profileService.focusedClient;
	$scope.backgroundColor = fc.backgroundColor;
	var correspondent = correspondentListService.currentCorrespondent;
	$scope.correspondent = correspondent;
	$scope.name = correspondent.name;
	$scope.hub = correspondent.hub;

	$scope.save = function() {
		$scope.error = null;
		correspondent.name = $scope.name;
		correspondent.hub = $scope.hub;
		var device = require('byteballcore/device.js');
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
          	var chatStorage = require('byteballcore/chat_storage.js');
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
		var conf = require('byteballcore/conf');
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
				if(!inputFile.value && self.exporting){
					self.exporting = false;
					$timeout(function() {
						$rootScope.$apply();
					});
				}
				if(!inputFile.value && self.connection){
					self.connection.release();
					self.connection = false;
				}
				window.removeEventListener('focus', checkValueFileAndChangeStatusExported, true);
			}, 1000);
		}


		function saveFile(file, cb) {
			var backupFilename = 'ByteballBackup-' + $filter('date')(Date.now(), 'yyyy-MM-dd-HH-mm-ss') + '.encrypted';
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
				fileSystemService.cordovaWriteFile((isMobile.iOS() ? window.cordova.file.documentsDirectory : window.cordova.file.externalRootDirectory), 'Byteball', backupFilename, file, function(err) {
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
			var db = require('byteballcore/db');
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
		var conf = require('byteballcore/conf');
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
			var backupDirPath = window.cordova.file.documentsDirectory + '/Byteball/';
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
			var db = require('byteballcore/db');
			var dbDirPath = fileSystemService.getDatabaseDirPath() + '/';
			db.close(function() {
				async.forEachOfSeries(zip.files, function(objFile, key, callback) {
					if (key == 'profile') {
						zip.file(key).async('string').then(function(data) {
							storageService.storeProfile(Profile.fromString(data), callback);
						});
					}
					else if (key == 'config') {
						zip.file(key).async('string').then(function(data) {
							storageService.storeConfig(data, callback);
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
			var db = require('byteballcore/db');
			var dbDirPath = fileSystemService.getDatabaseDirPath() + '/';
			db.close(function() {
				async.series([
					function(callback) {
						fileSystemService.readFile(dbDirPath + 'temp/' + 'profile', function(err, data) {
							if(err) return callback(err);
							storageService.storeProfile(Profile.fromString(data.toString()), callback)
						});
					},
					function(callback) {
						fileSystemService.readFile(dbDirPath + 'temp/' + 'config', function(err, data) {
							if(err) return callback(err);
							storageService.storeConfig(data.toString(), callback);
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
					var backupDirPath = window.cordova.file.documentsDirectory + '/Byteball/';
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
var constants = require('byteballcore/constants.js');
var mutex = require('byteballcore/mutex.js');
var eventBus = require('byteballcore/event_bus.js');
var objectHash = require('byteballcore/object_hash.js');
var ecdsaSig = require('byteballcore/signature.js');
var breadcrumbs = require('byteballcore/breadcrumbs.js');
var Bitcore = require('bitcore-lib');
var EventEmitter = require('events').EventEmitter;

angular.module('copayApp.controllers').controller('indexController', function($rootScope, $scope, $log, $filter, $timeout, lodash, go, profileService, configService, isCordova, storageService, addressService, gettext, gettextCatalog, amMoment, nodeWebkit, addonManager, txFormatService, uxLanguage, $state, isMobile, addressbookService, notification, animationService, $modal, bwcService, backButton, pushNotificationsService) {
  breadcrumbs.add('index.js');
  var self = this;
  self.BLACKBYTES_ASSET = constants.BLACKBYTES_ASSET;
  self.isCordova = isCordova;
  self.isSafari = isMobile.Safari();
  self.onGoingProcess = {};
  self.historyShowLimit = 10;
  self.updatingTxHistory = {};
  self.bSwipeSuspended = false;
  self.arrBalances = [];
  self.assetIndex = 0;
  self.$state = $state;
  self.usePushNotifications = isCordova && !isMobile.Windows() &&  isMobile.Android();
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
		var walletDefinedByKeys = require('byteballcore/wallet_defined_by_keys.js');
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
        var conf = require('byteballcore/conf.js');
        var network = require('byteballcore/network.js');
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
			description += "Program: "+conf.program+' '+conf.program_version+"\n";
            network.sendJustsaying(ws, 'bugreport', {message: error_message, exception: description});
        });
    }
	
	self.sendBugReport = sendBugReport;
	
	if (isCordova && constants.version === '1.0'){
        var db = require('byteballcore/db.js');
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
            if (self.isCordova && navigator && navigator.app) // android
                navigator.app.exitApp();
            else if (process.exit) // nwjs
                process.exit();
            // ios doesn't exit
        });
    });
	
	function readLastDateString(cb){
		var conf = require('byteballcore/conf.js');
		if (conf.storage !== 'sqlite')
			return cb();
		var db = require('byteballcore/db.js');
		db.query(
			"SELECT int_value FROM unit_authors JOIN data_feeds USING(unit) \n\
			WHERE address=? AND feed_name='timestamp' \n\
			ORDER BY unit_authors.rowid DESC LIMIT 1",
			[configService.TIMESTAMPER_ADDRESS],
			function(rows){
				if (rows.length === 0)
					return cb();
				var ts = rows[0].int_value;
				cb('at '+$filter('date')(ts, 'short'));
			}
		);
	}
	
	function setSyncProgress(percent){
		readLastDateString(function(strProgress){
			self.syncProgress = strProgress || (percent + "% of new units");
			$timeout(function() {
				$rootScope.$apply();
			});
		});
	}
    
    var catchup_balls_at_start = -1;
    eventBus.on('catching_up_started', function(){
        self.setOngoingProcess('Syncing', true);
		setSyncProgress(0);
    });
    eventBus.on('catchup_balls_left', function(count_left){
    	if (catchup_balls_at_start === -1) {
    		catchup_balls_at_start = count_left;
    	}
    	var percent = Math.round((catchup_balls_at_start - count_left) / catchup_balls_at_start * 100);
		setSyncProgress(percent);
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
        $rootScope.$emit('Local/ShowAlert', "Transaction created.\nPlease approve it on the other devices.", 'fi-key', function(){
            go.walletHome();
        });
    });

    eventBus.on("refused_to_sign", function(device_address){
		var device = require('byteballcore/device.js');
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
		var device = require('byteballcore/device.js');
        device.readCorrespondent(device_address, function(correspondent){
            notification.success(gettextCatalog.getString('Success'), "Wallet "+walletName+" approved by "+correspondent.name);
        });
    });

    eventBus.on("wallet_declined", function(walletId, device_address){
        var client = profileService.walletClients[walletId];
        if (!client) // already deleted (maybe declined by another device)
            return;
        var walletName = client.credentials.walletName;
		var device = require('byteballcore/device.js');
        device.readCorrespondent(device_address, function(correspondent){
            notification.info(gettextCatalog.getString('Declined'), "Wallet "+walletName+" declined by "+correspondent.name);
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
    
    // in arrOtherCosigners, 'other' is relative to the initiator
    eventBus.on("create_new_wallet", function(walletId, arrWalletDefinitionTemplate, arrDeviceAddresses, walletName, arrOtherCosigners){
		var device = require('byteballcore/device.js');
		var walletDefinedByKeys = require('byteballcore/wallet_defined_by_keys.js');
        device.readCorrespondentsByDeviceAddresses(arrDeviceAddresses, function(arrCorrespondentInfos){
            // my own address is not included in arrCorrespondentInfos because I'm not my correspondent
            var arrNames = arrCorrespondentInfos.map(function(correspondent){ return correspondent.name; });
            var name_list = arrNames.join(", ");
            var question = gettextCatalog.getString('Create new wallet '+walletName+' together with '+name_list+' ?');
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
        
		var bbWallet = require('byteballcore/wallet.js');
		var walletDefinedByKeys = require('byteballcore/wallet_defined_by_keys.js');
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
	                    var unitName = config.unitName;
	                    var bbUnitName = config.bbUnitName;
	                    
                        var arrDestinations = [];
                        for (var asset in assocAmountByAssetAndAddress){
							var formatted_asset = isCordova ? asset : ("<span class='small'>"+asset+'</span><br/>');
							var currency = "of asset "+formatted_asset;
							var assetName = asset; 
							if(asset === 'base'){
								currency = unitName;
								assetName = 'base';
							}else if(asset === constants.BLACKBYTES_ASSET){
								currency = bbUnitName;
								assetName = 'blackbytes';
							}
                            for (var address in assocAmountByAssetAndAddress[asset])
                                arrDestinations.push(profileService.formatAmount(assocAmountByAssetAndAddress[asset][address], assetName) + " " + currency + " to " + address);
                        }
                        var dest = (arrDestinations.length > 0) ? arrDestinations.join(", ") : "to myself";
                        var question = gettextCatalog.getString('Sign transaction spending '+dest+' from wallet '+credentials.walletName+'?');
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
		var assocSharedByAddress = self.arrBalances[self.assetIndex].assocSharedByAddress;
		for (var sa in assocSharedByAddress) {
			var objSharedWallet = {};
			objSharedWallet.shared_address = sa;
			objSharedWallet.total = assocSharedByAddress[sa];
			if($scope.asset == 'base'){
				objSharedWallet.totalStr = profileService.formatAmount(assocSharedByAddress[sa], 'base') + ' ' + self.unitName;
			}else if($scope.asset == constants.BLACKBYTES_ASSET){
				objSharedWallet.totalStr = profileService.formatAmount(assocSharedByAddress[sa], 'blackbytes') + ' ' + self.bbUnitName;
			}
			arrSharedWallets.push(objSharedWallet);
		}
		$scope.arrSharedWallets = arrSharedWallets;

		var walletDefinedByAddresses = require('byteballcore/wallet_defined_by_addresses.js');
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
    self.anyOnGoingProcess = lodash.some(self.onGoingProcess, function(isOn, processName) {
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
    self.spendUnconfirmed = null;

    self.totalBalanceStr = null;
    self.availableBalanceStr = null;
    self.lockedBalanceStr = null;

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
    self.setSpendUnconfirmed();

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
        self.setAddressbook();

        console.log("reading cosigners");
		var walletDefinedByKeys = require('byteballcore/wallet_defined_by_keys.js');
        walletDefinedByKeys.readCosigners(self.walletId, function(arrCosignerInfos){
            self.copayers = arrCosignerInfos;
			$timeout(function(){
				$rootScope.$digest();
			});
        });

		self.needsBackup = false;
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
	var device = require('byteballcore/device.js');
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

  self.setSpendUnconfirmed = function() {
    self.spendUnconfirmed = configService.getSync().wallet.spendUnconfirmed;
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

  self.setBalance = function(assocBalances, assocSharedBalances) {
    if (!assocBalances) return;
    var config = configService.getSync().wallet.settings;

    // Selected unit
    self.unitValue = config.unitValue;
    self.unitName = config.unitName;
    self.bbUnitName = config.bbUnitName;
	
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
        if (asset === "base" || asset == self.BLACKBYTES_ASSET){
			var assetName = asset !== "base" ? 'blackbytes' : 'base';
			var unitName = asset !== "base" ? config.bbUnitName : config.unitName;
            balanceInfo.totalStr = profileService.formatAmount(balanceInfo.total, assetName) + ' ' + unitName;
            balanceInfo.stableStr = profileService.formatAmount(balanceInfo.stable, assetName) + ' ' + unitName;
            balanceInfo.pendingStr = profileService.formatAmount(balanceInfo.pending, assetName) + ' ' + unitName;
			if (typeof balanceInfo.shared === 'number')
				balanceInfo.sharedStr = profileService.formatAmount(balanceInfo.shared, assetName) + ' ' + unitName;
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
    if (self.spendUnconfirmed) {
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
          var filename = 'Byteball-' + (self.alias || self.walletName) + '.csv';
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
          $rootScope.$apply();
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
        var newHistory = self.processNewTxs(txs);
        $log.debug('Tx History synced. Total Txs: ' + newHistory.length);

        if (walletId ==  profileService.focusedClient.credentials.walletId) {
            self.completeHistory = newHistory;
            self.txHistory = newHistory.slice(0, self.historyShowLimit);
            self.historyShowShowAll = newHistory.length >= self.historyShowLimit;
        }

        return cb();
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

    if (!fc.isComplete() || self.updatingTxHistory[walletId]) return;

    $log.debug('Updating Transaction History');
    self.txHistoryError = false;
    self.updatingTxHistory[walletId] = true;

    $timeout(function onUpdateHistoryTimeout() {
      self.updateLocalTxHistory(fc, function(err) {
        self.updatingTxHistory[walletId] = false;
        if (err)
			self.txHistoryError = true;
		$timeout(function() {
        	$rootScope.$apply();
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
			var lightWallet = require('byteballcore/light_wallet.js');
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

  $rootScope.$on('Local/SpendUnconfirmedUpdated', function(event) {
    self.setSpendUnconfirmed();
    self.updateAll();
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
	var lightWallet = require('byteballcore/light_wallet.js');
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

  $rootScope.$on('Local/SetTab', function(event, tab, reset) {
    console.log("SetTab "+tab+", reset "+reset);
    self.setTab(tab, reset);
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
});

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

'use strict';

angular.module('copayApp.controllers').controller('newVersionIsAvailable', function($scope, $modalInstance, go, newVersion){

  $scope.version = newVersion.version;
	
  $scope.openDownloadLink = function(){
    var link = '';
    if (navigator && navigator.app) {
      link = 'https://play.google.com/store/apps/details?id=org.byteball.wallet';
	  if (newVersion.version.match('t$'))
		  link += '.testnet';
    }
    else {
      link = 'https://github.com/byteball/byteball/releases/tag/v' + newVersion.version;
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

          $scope.$apply();
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

          $scope.$apply();
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

angular.module('copayApp.controllers').controller('preferencesController',
  function($scope, $rootScope, $filter, $timeout, $modal, $log, lodash, configService, profileService, uxLanguage) {
    
    this.init = function() {
      var config = configService.getSync();
      this.unitName = config.wallet.settings.unitName;
      this.currentLanguageName = uxLanguage.getCurrentLanguageName();
      $scope.spendUnconfirmed = config.wallet.spendUnconfirmed;
      var fc = profileService.focusedClient;
      if (fc) {
        //$scope.encrypt = fc.hasPrivKeyEncrypted();
        this.externalSource = null;
        // TODO externalAccount
        //this.externalIndex = fc.getExternalIndex();
      }

      if (window.touchidAvailable) {
        var walletId = fc.credentials.walletId;
        this.touchidAvailable = true;
        config.touchIdFor = config.touchIdFor || {};
        $scope.touchid = config.touchIdFor[walletId];
      }
    };

    var unwatchSpendUnconfirmed = $scope.$watch('spendUnconfirmed', function(newVal, oldVal) {
      if (newVal == oldVal) return;
      var opts = {
        wallet: {
          spendUnconfirmed: newVal
        }
      };
      configService.set(opts, function(err) {
        $rootScope.$emit('Local/SpendUnconfirmedUpdated');
        if (err) $log.debug(err);
      });
    });


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
      unwatchSpendUnconfirmed();
      unwatchRequestTouchid();
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

angular.module('copayApp.controllers').controller('preferencesBbUnitController',
  function($rootScope, $scope, $log, configService, go) {
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
        go.preferencesGlobal();
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
	  var device = require('byteballcore/device.js');
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

angular.module('copayApp.controllers').controller('preferencesEditWitnessController',
  function($scope, $timeout, go, witnessListService) {
    
    var self = this;
    this.witness = witnessListService.currentWitness;

    this.save = function() {
        var new_address = this.witness.trim();
        if (new_address === witnessListService.currentWitness)
            return goBack();
		var myWitnesses = require('byteballcore/my_witnesses.js');
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
	
		var conf = require('byteballcore/conf.js');
  
    $scope.encrypt = !!profileService.profile.xPrivKeyEncrypted;
    
    this.init = function() {
      var config = configService.getSync();
      this.unitName = config.wallet.settings.unitName;
      this.bbUnitName = config.wallet.settings.bbUnitName;
      this.deviceName = config.deviceName;
      this.myDeviceAddress = require('byteballcore/device.js').getMyDeviceAddress();
      this.hub = config.hub;
      this.currentLanguageName = uxLanguage.getCurrentLanguageName();
      this.torEnabled = conf.socksHost && conf.socksPort;
      $scope.pushNotifications = config.pushNotifications.enabled;
    };


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
        unwatchPushNotifications();
        unwatchEncrypt();
    });
  });

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
	  var device = require('byteballcore/device.js');
	  var lightWallet = require('byteballcore/light_wallet.js');
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
	var constants = require('byteballcore/constants.js');
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
      		if (row.asset == 'base' || row.asset == constants.BLACKBYTES_ASSET) {
      			var assetName = row.asset !== "base" ? 'blackbytes' : 'base';
      			var unitName = row.asset !== "base" ? config.bbUnitName : config.unitName;
				row.amount = profileService.formatAmount(row.amount, assetName, {dontRound: true}) + ' ' + unitName;
				return row;
			}
			else {
				return row;
			}
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

          var body = 'Byteball Wallet "' + $scope.walletName + '" Addresses.\n\n';
          body += "\n";
          body += addrs.map(function(v) {
            return ('* ' + v.address + ' ' + v.path + ' ' + formatDate(v.createdOn));
          }).join("\n");

          window.plugins.socialsharing.shareViaEmail(
            body,
            'Byteball Addresses',
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
    var body = 'Byteball Session Logs\n Be careful, this could contain sensitive private data\n\n';
    body += '\n\n';
    body += this.logs.map(function(v) {
      return v.msg;
    }).join('\n');

    window.plugins.socialsharing.shareViaEmail(
      body,
      'Byteball Logs',
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
		
		var conf = require('byteballcore/conf.js');
		var network = require('byteballcore/network.js');
		
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
			var desktopApp = require('byteballcore/desktop_app.js');
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
  function($rootScope, $scope, $log, configService, go) {
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
        go.preferencesGlobal();
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

    var myWitnesses = require('byteballcore/my_witnesses.js');
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
	function($rootScope, $scope, $log, $timeout, profileService, isCordova) {
	
		var async = require('async');
		var conf = require('byteballcore/conf.js');
		var wallet_defined_by_keys = require('byteballcore/wallet_defined_by_keys.js');
		var objectHash = require('byteballcore/object_hash.js');
		try{
			var ecdsa = isCordova ? null : require('secp256k1'+'');
		}
		catch(e){
			var ecdsa = require('byteballcore/node_modules/secp256k1'+'');
		}
		var Mnemonic = require('bitcore-mnemonic');
		var Bitcore = require('bitcore-lib');
		var db = require('byteballcore/db.js');

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
			var arrWalletIndexes = [];
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
									arrWalletIndexes.push(currentWalletIndex);
								}
								if (currentWalletIndex - lastUsedWalletIndex >= 20) {
									cb(assocMaxAddressIndexes, arrWalletIndexes);
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
					addAddress(self.assocIndexesToWallets[accounts[currentAccount]], 0, 0, assocMaxAddressIndexes[accounts[currentAccount]].main + 20);
				}
			}
			
			
			startAddToNewWallet(0);
		}
		
		function createWallets(arrWalletIndexes, cb) {
			
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
				
				profileService.createWallet(opts, function(err, walletId) {
					self.assocIndexesToWallets[account] = walletId;
					n++;
					(n < arrWalletIndexes.length) ? createWallet(n) : cb();
				});
			}
			
			createWallet(0);
		}
		
		self.recoveryForm = function() {
			if (self.inputMnemonic) {
				if ((self.inputMnemonic.split(' ').length % 3 === 0) && Mnemonic.isValid(self.inputMnemonic)) {
					self.scanning = true;
					scanForAddressesAndWallets(self.inputMnemonic, function(assocMaxAddressIndexes, arrWalletIndexes) {
						if (arrWalletIndexes.length) {
							removeAddressesAndWallets(function() {
								var myDeviceAddress = objectHash.getDeviceAddress(ecdsa.publicKeyCreate(self.xPrivKey.derive("m/1'").privateKey.bn.toBuffer({size: 32}), true).toString('base64'));
								profileService.replaceProfile(self.xPrivKey.toString(), self.inputMnemonic, myDeviceAddress, function() {
									createWallets(arrWalletIndexes, function() {
										createAddresses(assocMaxAddressIndexes, function() {
											self.scanning = false;
											$rootScope.$emit('Local/ShowAlert', arrWalletIndexes.length+" wallets recovered, please restart the application to finish.", 'fi-check', function() {
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
							$timeout(function() {
								$rootScope.$apply();
							});
						}
					});
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
					$scope.$apply();
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
    var conf = require('byteballcore/conf.js');
    //this.type = (conf.bLight ? 'light wallet' : 'full wallet');
    this.type = (conf.bLight ? 'light' : '');

    // version
    this.version = window.version;
    this.commitHash = window.commitHash;
});

'use strict';

var constants = require('byteballcore/constants.js');
var eventBus = require('byteballcore/event_bus.js');
var breadcrumbs = require('byteballcore/breadcrumbs.js');

angular.module('copayApp.controllers').controller('walletHomeController', function($scope, $rootScope, $timeout, $filter, $modal, $log, notification, isCordova, profileService, lodash, configService, storageService, gettext, gettextCatalog, nodeWebkit, addressService, confirmDialog, animationService, addressbookService, correspondentListService, newVersion, autoUpdatingWitnessesList) {

  var self = this;
  var home = this;
  var conf = require('byteballcore/conf.js');
  var chatStorage = require('byteballcore/chat_storage.js');
  this.protocol = conf.program;
  $rootScope.hideMenuBar = false;
  $rootScope.wpInputFocused = false;
  var config = configService.getSync();
  var configWallet = config.wallet;
  var indexScope = $scope.index;
  $scope.currentSpendUnconfirmed = configWallet.spendUnconfirmed;
    
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
  this.isMobile = isMobile.any();
  this.addr = {};
  this.isTestnet = constants.version.match(/t$/);
  this.testnetName = (constants.alt === '2') ? '[NEW TESTNET]' : '[TESTNET]';
  $scope.index.tab = 'walletHome'; // for some reason, current tab state is tracked in index and survives re-instatiations of walletHome.js

  var disablePaymentRequestListener = $rootScope.$on('paymentRequest', function(event, address, amount, asset, recipient_device_address) {
    console.log('paymentRequest event '+address+', '+amount);
    $rootScope.$emit('Local/SetTab', 'send');
    self.setForm(address, amount, null, asset, recipient_device_address);

    var form = $scope.sendForm;
    if (form.address.$invalid && !self.blockUx) {
        console.log("invalid address, resetting form");
        self.resetForm();
        self.error = gettext('Could not recognize a valid Byteball QR Code');
    }
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
  });

  var disableResumeListener = $rootScope.$on('Local/Resume', function() {
    // This is needed then the apps go to sleep
	// looks like it already works ok without rebinding touch events after every resume
    //self.bindTouchDown();
  });

  var disableTabListener = $rootScope.$on('Local/TabChanged', function(e, tab) {
    // This will slow down switch, do not add things here!
      console.log("tab changed "+tab);
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
	
	function onNewWalletAddress(new_address){
        console.log("==== NEW ADDRESSS "+new_address);
        self.addr = {};
        self.setAddress();
    }
    
    eventBus.on("new_wallet_address", onNewWalletAddress);

  $scope.$on('$destroy', function() {
    console.log("walletHome $destroy");
    disableAddrListener();
    disablePaymentRequestListener();
    disablePaymentUriListener();
    disableTabListener();
    disableFocusListener();
    disableResumeListener();
    disableOngoingProcessListener();
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
            data = data.replace(self.protocol+':', '');
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
			breadcrumbs.add('openDestinationAddressModal getAddress err: '+err);
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
	  
	  var walletGeneral = require('byteballcore/wallet_general.js');
	  var walletDefinedByAddresses = require('byteballcore/wallet_defined_by_addresses.js');
	  walletGeneral.readMyAddresses(function(arrMyAddresses){
		  walletDefinedByAddresses.readSharedAddressDefinition(address, function(arrDefinition, creation_ts){
			  $scope.humanReadableDefinition = correspondentListService.getHumanReadableDefinition(arrDefinition, arrMyAddresses, [], true);
			  $scope.creation_ts = creation_ts;
			  $timeout(function(){
				  $scope.$apply();
			  });
		  });
	  });
	
	  // clicked a link in the definition
	  $scope.sendPayment = function(address, amount, asset){
		if (asset && indexScope.arrBalances.filter(function(balance){ return (balance.asset === asset); }).length === 0)
			return console.log("i do not own anything of asset "+asset);
		$modalInstance.dismiss('done');
		$timeout(function(){
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

    self.generatingAddress = true;
    $timeout(function() {
      addressService.getAddress(fc.credentials.walletId, forceNew, function(err, addr) {
        self.generatingAddress = false;

        if (err) {
          self.addrError = err;
        } else {
          if (addr)
            self.addr[fc.credentials.walletId] = addr;
        }

        $timeout(function(){
			$scope.$digest();
		});
      });
    });
  };

  this.copyAddress = function(addr) {
    if (isCordova) {
      window.cordova.plugins.clipboard.copy(addr);
      window.plugins.toast.showShortCenter(gettextCatalog.getString('Copied to clipboard'));
    } else if (nodeWebkit.isDefined()) {
      nodeWebkit.writeToClipboard(addr);
    }
  };

  this.shareAddress = function(addr) {
    if (isCordova) {
      if (isMobile.Android() || isMobile.Windows()) {
        window.ignoreMobilePause = true;
      }
      window.plugins.socialsharing.share(self.protocol+':' + addr, null, null, null);
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
		$scope.protocol = conf.program;


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
			var asset = $scope.index.arrBalances[$scope.index.assetIndex].asset;
			if (!asset)
				throw Error("no asset");
			var amountInSmallestUnits = (asset === 'base') 
				? parseInt((amount * $scope.unitValue).toFixed(0)) 
				: (asset === constants.BLACKBYTES_ASSET ? parseInt((amount * $scope.bbUnitValue).toFixed(0)) : amount);
			$timeout(function() {
				$scope.customizedAmountUnit = 
					amount + ' ' + ((asset === 'base') ? $scope.unitName : (asset === constants.BLACKBYTES_ASSET ? $scope.bbUnitName : 'of ' + asset));
				$scope.amountInSmallestUnits = amountInSmallestUnits;
				$scope.asset_param = (asset === 'base') ? '' : '&asset='+encodeURIComponent(asset);
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

  // Send 

  var unwatchSpendUnconfirmed = $scope.$watch('currentSpendUnconfirmed', function(newVal, oldVal) {
    if (newVal == oldVal) return;
    $scope.currentSpendUnconfirmed = newVal;
  });

  $scope.$on('$destroy', function() {
    unwatchSpendUnconfirmed();
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
        } catch (e) {};
        angular.element(e).triggerHandler('click');
      }, true);
    });
  }

  this.hideMenuBar = lodash.debounce(function(hide) {
    if (hide) {
      $rootScope.hideMenuBar = true;
      this.bindTouchDown();
    } else {
      $rootScope.hideMenuBar = false;
    }
    $rootScope.$digest();
  }, 100);


  this.formFocus = function(what) {
    if (isCordova && !this.isWindowsPhoneApp) {
      this.hideMenuBar(what);
    }
    if (!this.isWindowsPhoneApp) return

    if (!what) {
      this.hideAddress = false;
      this.hideAmount = false;

    } else {
      if (what == 'amount') {
        this.hideAddress = true;
      } else if (what == 'msg') {
        this.hideAddress = true;
        this.hideAmount = true;
      }
    }
    $timeout(function() {
      $rootScope.$digest();
    }, 1);
  };

  this.setSendFormInputs = function() {
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
          if ($scope.sendForm && $scope.sendForm.address.$valid) {
            self.lockAddress = true;
          }
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

    this.error = prefix + ": "+err;
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
      } else {
        window.plugins.spinnerDialog.hide();
      }
    } else {
      self.onGoingProcess = name;
      $timeout(function() {
        $rootScope.$apply();
      });
    };
  };

  this.submitForm = function() {
	if ($scope.index.arrBalances.length === 0)
		return console.log('send payment: no balances yet');
    var fc = profileService.focusedClient;
    var unitValue = this.unitValue;
    var bbUnitValue = this.bbUnitValue;

    if (isCordova && this.isWindowsPhoneApp) {
        this.hideAddress = false;
        this.hideAmount = false;
    }

    var form = $scope.sendForm;
	if (!form)
		return console.log('form is gone');
	if (self.bSendAll)
		form.amount.$setValidity('validAmount', true);
    if (form.$invalid) {
        this.error = gettext('Unable to send transaction proposal');
        return;
    }

    if (fc.isPrivKeyEncrypted()) {
        profileService.unlockFC(null, function(err) {
            if (err)
                return self.setSendError(err.message);
            return self.submitForm();
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

	var asset = $scope.index.arrBalances[$scope.index.assetIndex].asset;
	console.log("asset "+asset);
	var address = form.address.$modelValue;
	var recipient_device_address = assocDeviceAddressesByPaymentAddress[address];
	var amount = form.amount.$modelValue;
	var merkle_proof = '';
	if (form.merkle_proof && form.merkle_proof.$modelValue)
		merkle_proof = form.merkle_proof.$modelValue.trim();
	if (asset === "base")
		amount *= unitValue;
	if (asset === constants.BLACKBYTES_ASSET)
		amount *= bbUnitValue;
	amount = Math.round(amount);

	var current_payment_key = ''+asset+address+amount;
	if (current_payment_key === self.current_payment_key)
		return $rootScope.$emit('Local/ShowErrorAlert', "This payment is already under way");
	self.current_payment_key = current_payment_key;
	  
    indexScope.setOngoingProcess(gettext('sending'), true);
    $timeout(function() {

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
			
			var device = require('byteballcore/device.js');
			if (self.binding){
				if (!recipient_device_address)
					throw Error('recipient device address not known');
				var walletDefinedByAddresses = require('byteballcore/wallet_defined_by_addresses.js');
				var walletDefinedByKeys = require('byteballcore/wallet_defined_by_keys.js');
				var my_address;
				// never reuse addresses as the required output could be already present
				walletDefinedByKeys.issueNextAddress(fc.credentials.walletId, 0, function(addressInfo){
					my_address = addressInfo.address;
					if (self.binding.type === 'reverse_payment'){
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
								['in data feed', [[configService.TIMESTAMPER_ADDRESS], 'timestamp', '>', Date.now() + Math.round(self.binding.timeout*3600*1000)]]
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
					else{
						var arrExplicitEventCondition = 
							['in data feed', [[self.binding.oracle_address], self.binding.feed_name, '=', self.binding.feed_value]];
						var arrMerkleEventCondition = 
							['in merkle', [[self.binding.oracle_address], self.binding.feed_name, self.binding.feed_value]];
						var arrEventCondition;
						if (self.binding.feed_type === 'explicit')
							arrEventCondition = arrExplicitEventCondition;
						else if (self.binding.feed_type === 'merkle')
							arrEventCondition = arrMerkleEventCondition;
						else if (self.binding.feed_type === 'either')
							arrEventCondition = ['or', [arrMerkleEventCondition, arrExplicitEventCondition]];
						else
							throw Error("unknown feed type: "+self.binding.feed_type);
						var arrDefinition = ['or', [
							['and', [
								['address', address],
								arrEventCondition
							]],
							['and', [
								['address', my_address],
								['in data feed', [[configService.TIMESTAMPER_ADDRESS], 'timestamp', '>', Date.now() + Math.round(self.binding.timeout*3600*1000)]]
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
						ifError: function(err){
							delete self.current_payment_key;
							indexScope.setOngoingProcess(gettext('sending'), false);
							self.setSendError(err);
						},
						ifOk: function(shared_address){
							composeAndSend(shared_address);
						}
					});
				});
			}
			else
				composeAndSend(address);
          
            // compose and send
			function composeAndSend(to_address){
				var arrSigningDeviceAddresses = []; // empty list means that all signatures are required (such as 2-of-2)
				if (fc.credentials.m < fc.credentials.n)
					$scope.index.copayers.forEach(function(copayer){
						if (copayer.me || copayer.signs)
							arrSigningDeviceAddresses.push(copayer.device_address);
					});
				else if (indexScope.shared_address)
					arrSigningDeviceAddresses = indexScope.copayers.map(function(copayer){ return copayer.device_address; });
				breadcrumbs.add('sending payment in '+asset);
				profileService.bKeepUnlocked = true;
				var opts = {
					shared_address: indexScope.shared_address,
					merkle_proof: merkle_proof,
					asset: asset,
					to_address: to_address,
					amount: amount,
					send_all: self.bSendAll,
					arrSigningDeviceAddresses: arrSigningDeviceAddresses,
					recipient_device_address: recipient_device_address
				};
				fc.sendMultiPayment(opts, function(err){
					// if multisig, it might take very long before the callback is called
					indexScope.setOngoingProcess(gettext('sending'), false);
					breadcrumbs.add('done payment in '+asset+', err='+err);
					delete self.current_payment_key;
					profileService.bKeepUnlocked = false;
					if (err){
						if (typeof err === 'object'){
							err = JSON.stringify(err);
							eventBus.emit('nonfatal_error', "error object from sendMultiPayment: "+err, new Error());
						}
						else if (err.match(/device address/))
							err = "This is a private asset, please send it only by clicking links from chat";
						else if (err.match(/no funded/))
							err = "Not enough spendable funds, make sure all your funds are confirmed";
						return self.setSendError(err);
					}
					var binding = self.binding;
					self.resetForm();
					$rootScope.$emit("NewOutgoingTx");
					if (recipient_device_address){ // show payment in chat window
						eventBus.emit('sent_payment', recipient_device_address, amount || 'all', asset);
						if (binding && binding.reverseAmount){ // create a request for reverse payment
							if (!my_address)
								throw Error('my address not known');
							var paymentRequestCode = 'byteball:'+my_address+'?amount='+binding.reverseAmount+'&asset='+encodeURIComponent(binding.reverseAsset);
							var paymentRequestText = '[reverse payment]('+paymentRequestCode+')';
							device.sendMessageToDevice(recipient_device_address, 'text', paymentRequestText);
							var body = correspondentListService.formatOutgoingMessage(paymentRequestText);
 							correspondentListService.addMessageEvent(false, recipient_device_address, body);
 							device.readCorrespondent(recipient_device_address, function(correspondent){
 			 					if (correspondent.my_record_pref && correspondent.peer_record_pref) chatStorage.store(correspondent.device_address, body, 0, 'html');
			 				});

							// issue next address to avoid reusing the reverse payment address
							walletDefinedByKeys.issueNextAddress(fc.credentials.walletId, 0, function(){});
						}
					}
					else // redirect to history
						$rootScope.$emit('Local/SetTab', 'history');
				});
				/*
				if (fc.credentials.n > 1){
					$rootScope.$emit('Local/ShowAlert', "Transaction created.\nPlease approve it on the other devices.", 'fi-key', function(){
						go.walletHome();
					});
				}*/
			}
        
        });
    }, 100);
  };


	var assocDeviceAddressesByPaymentAddress = {};
	
	this.canSendExternalPayment = function(){
		if ($scope.index.arrBalances.length === 0) // no balances yet, assume can send
			return true;
		if (!$scope.index.arrBalances[$scope.index.assetIndex].is_private)
			return true;
		var form = $scope.sendForm;
		if (!form || !form.address) // disappeared
			return true;
        var address = form.address.$modelValue;
        var recipient_device_address = assocDeviceAddressesByPaymentAddress[address];
		return !!recipient_device_address;
	};

	this.deviceAddressIsKnown = function(){
	//	return true;
		if ($scope.index.arrBalances.length === 0) // no balances yet
			return false;
		var form = $scope.sendForm;
		if (!form || !form.address) // disappeared
			return false;
        var address = form.address.$modelValue;
        var recipient_device_address = assocDeviceAddressesByPaymentAddress[address];
		return !!recipient_device_address;
	};
	
	
	this.openBindModal = function() {
		$rootScope.modalOpened = true;
		var fc = profileService.focusedClient;
		var form = $scope.sendForm;
		if (!form || !form.address) // disappeared
			return;
		var address = form.address;



		var ModalInstanceCtrl = function($scope, $modalInstance) {
			$scope.color = fc.backgroundColor;
			$scope.arrPublicAssetInfos = indexScope.arrBalances.filter(function(b){ return !b.is_private; }).map(function(b){
				var info = {asset: b.asset};
				if (b.asset === 'base')
					info.displayName = self.unitName;
				else if (b.asset === constants.BLACKBYTES_ASSET)
					info.displayName = self.bbUnitName;
				else
					info.displayName = 'of '+b.asset.substr(0, 4);
				return info;
			});
			$scope.binding = { // defaults
				type: 'reverse_payment',
				timeout: 4,
				reverseAsset: 'base',
				feed_type: 'either'
			};
			if (self.binding){
				$scope.binding.type = self.binding.type;
				$scope.binding.timeout = self.binding.timeout;
				if (self.binding.type === 'reverse_payment'){
					$scope.binding.reverseAsset = self.binding.reverseAsset;
					$scope.binding.reverseAmount = getAmountInDisplayUnits(self.binding.reverseAmount, self.binding.reverseAsset);
				}
				else{
					$scope.binding.oracle_address = self.binding.oracle_address;
					$scope.binding.feed_name = self.binding.feed_name;
					$scope.binding.feed_value = self.binding.feed_value;
					$scope.binding.feed_type = self.binding.feed_type;
				}
			}
			$scope.oracles = configService.oracles;
			
			$scope.cancel = function() {
				$modalInstance.dismiss('cancel');
			};
			
			$scope.bind = function(){
				var binding = {type: $scope.binding.type};
				if (binding.type === 'reverse_payment'){
					binding.reverseAsset = $scope.binding.reverseAsset;
					binding.reverseAmount = getAmountInSmallestUnits($scope.binding.reverseAmount, $scope.binding.reverseAsset);
				}
				else{
					binding.oracle_address = $scope.binding.oracle_address;
					binding.feed_name = $scope.binding.feed_name;
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
	
	function getAmountInSmallestUnits(amount, asset){
		console.log(amount, asset, self.unitValue);
		if (asset === 'base')
			amount *= self.unitValue;
		else if (asset === constants.BLACKBYTES_ASSET)
			amount *= self.bbUnitValue;
		return Math.round(amount);
	}
	
	function getAmountInDisplayUnits(amount, asset){
		if (asset === 'base')
			amount /= self.unitValue;
		else if (asset === constants.BLACKBYTES_ASSET)
			amount /= self.bbUnitValue;
		return amount;
	}

	this.setToAddress = function(to) {
		var form = $scope.sendForm;
		if (!form || !form.address) // disappeared?
			return console.log('form.address has disappeared');
		form.address.$setViewValue(to);
		form.address.$isValid = true;
		form.address.$render();
		this.lockAddress = true;
	}
  
  this.setForm = function(to, amount, comment, asset, recipient_device_address) {
	this.resetError();
	delete this.binding;
    var form = $scope.sendForm;
	if (!form || !form.address) // disappeared?
		return console.log('form.address has disappeared');
    if (to) {
        form.address.$setViewValue(to);
        form.address.$isValid = true;
        form.address.$render();
        this.lockAddress = true;
        if (recipient_device_address) // must be already paired
            assocDeviceAddressesByPaymentAddress[to] = recipient_device_address;
    }

	if (amount) {
		if (asset === 'base')
			amount /= this.unitValue;
		if (asset === constants.BLACKBYTES_ASSET)
			amount /= this.bbUnitValue;
	//	form.amount.$setViewValue("" + amount);
	//	form.amount.$isValid = true;
        this.lockAmount = true;
		$timeout(function(){
			form.amount.$setViewValue("" + amount);
			form.amount.$isValid = true;
			form.amount.$render();
		});
    }
	else{
		this.lockAmount = false;
		form.amount.$pristine = true;
		form.amount.$setViewValue('');
		form.amount.$render();
	}
//	form.amount.$render();

	if (form.merkle_proof){
		form.merkle_proof.$setViewValue('');
		form.merkle_proof.$render();
	}
    if (comment) {
        form.comment.$setViewValue(comment);
        form.comment.$isValid = true;
        form.comment.$render();
    }
      
    if (asset){
        var assetIndex = lodash.findIndex($scope.index.arrBalances, {asset: asset});
        if (assetIndex < 0)
            throw Error("failed to find asset index of asset "+asset);
        $scope.index.assetIndex = assetIndex;
		this.lockAsset = true;
    }
	else
		this.lockAsset = false;
  };



  this.resetForm = function() {
    this.resetError();
	delete this.binding;

	this.lockAsset = false;
    this.lockAddress = false;
    this.lockAmount = false;
    this.hideAdvSend = true;
    $scope.currentSpendUnconfirmed = configService.getSync().wallet.spendUnconfirmed;

    this._amount = this._address = null;
	this.bSendAll = false;

    var form = $scope.sendForm;


    if (form && form.amount) {
      form.amount.$pristine = true;
      form.amount.$setViewValue('');
	  if (form.amount)
		  form.amount.$render();

	  if (form.merkle_proof){
		  form.merkle_proof.$setViewValue('');
		  form.merkle_proof.$render();
	  }
	  if (form.comment){
		  form.comment.$setViewValue('');
		  form.comment.$render();
	  }
      form.$setPristine();

      if (form.address) {
        form.address.$pristine = true;
        form.address.$setViewValue('');
        form.address.$render();
      }
    }
    $timeout(function() {
      $rootScope.$digest();
    }, 1);
  };

	this.setSendAll = function(){
		var form = $scope.sendForm;
		if (!form || !form.amount) // disappeared?
			return console.log('form.amount has disappeared');
		if (indexScope.arrBalances.length === 0)
			return;
		if (indexScope.arrBalances[indexScope.assetIndex].asset === 'base'){
			this._amount = null;
			this.bSendAll = true;
			form.amount.$setViewValue('');
			form.amount.$setValidity('validAmount', true);
			form.amount.$render();
		}
		else{
			var full_amount = indexScope.arrBalances[indexScope.assetIndex].stable;
			if (indexScope.arrBalances[indexScope.assetIndex].asset === constants.BLACKBYTES_ASSET)
				full_amount /= this.bbUnitValue;
			form.amount.$setViewValue(''+full_amount);
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
      require('byteballcore/uri.js').parseUri(uri, {
          ifError: function(err){
          },
          ifOk: function(_objRequest){
              objRequest = _objRequest; // the callback is called synchronously
          }
      });
      
      if (!objRequest) // failed to parse
          return uri;
	  if (objRequest.amount){
		  // setForm() cares about units conversion
		  //var amount = (objRequest.amount / this.unitValue).toFixed(this.unitDecimals);
		  this.setForm(objRequest.address, objRequest.amount);
	  }
      return objRequest.address;
  };

  this.onAddressChange = function(value) {
    this.resetError();
    if (!value) return '';

    if (value.indexOf(self.protocol+':') === 0)
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


  this.openTxModal = function(btx) {
    $rootScope.modalOpened = true;
    var self = this;
    var fc = profileService.focusedClient;
    var ModalInstanceCtrl = function($scope, $modalInstance) {
      $scope.btx = btx;
      var assetIndex = lodash.findIndex(indexScope.arrBalances, {asset: btx.asset});
      $scope.isPrivate = indexScope.arrBalances[assetIndex].is_private;
      $scope.settings = walletSettings;
      $scope.color = fc.backgroundColor;
      $scope.n = fc.credentials.n;

      $scope.getAmount = function(amount) {
        return self.getAmount(amount);
      };

      $scope.getUnitName = function() {
        return self.getUnitName();
      };

	  $scope.openInExplorer = function(){
		var testnet = home.isTestnet ? 'testnet' : '';
		var url = 'https://'+testnet+'explorer.byteball.org/#'+btx.unit;
		if (typeof nw !== 'undefined')
			nw.Shell.openExternal(url);
		else if (isCordova)
			cordova.InAppBrowser.open(url, '_system');
	  };

      $scope.copyAddress = function(addr) {
        if (!addr) return;
        self.copyAddress(addr);
      };
	
      $scope.showCorrespondentList = function() {
        self.showCorrespondentListToReSendPrivPayloads(btx);
      };

		$scope.reSendPrivateMultiSigPayment = function () {
			var indivisible_asset = require('byteballcore/indivisible_asset');
			var wallet_defined_by_keys = require('byteballcore/wallet_defined_by_keys');
			var walletDefinedByAddresses = require('byteballcore/wallet_defined_by_addresses');
			var fc = profileService.focusedClient;

			function success() {
				$timeout(function () {
					notification.success(gettextCatalog.getString('Success'), gettextCatalog.getString('Private payloads sent', {}));
				});
			}

			indivisible_asset.restorePrivateChains(btx.asset, btx.unit, btx.addressTo, function (arrRecipientChains, arrCosignerChains) {
				if(indexScope.shared_address){
					walletDefinedByAddresses.forwardPrivateChainsToOtherMembersOfAddresses(arrCosignerChains, [indexScope.shared_address], null, success);
				}else {
					wallet_defined_by_keys.forwardPrivateChainsToOtherMembersOfWallets(arrCosignerChains, [fc.credentials.walletId], null, success);
				}
			});
		};

      $scope.cancel = function() {
		breadcrumbs.add('dismiss tx details');
		try{
			$modalInstance.dismiss('cancel');
		}
		catch(e){
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
					$scope.$digest();
				});
			};
			
			$scope.sendPrivatePayments = function(correspondent) {
				var indivisible_asset =  require('byteballcore/indivisible_asset');
				var wallet_general = require('byteballcore/wallet_general');
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

  this._doSendAll = function(amount) {
    this.setForm(null, amount, null);
  };

  this.sendAll = function(amount, feeStr) {
    var self = this;
    var msg = gettextCatalog.getString("{{fee}} will be deducted for bitcoin networking fees", {
      fee: feeStr
    });

    confirmDialog.show(msg, function(confirmed) {
      if (confirmed)
        self._doSendAll(amount);
    });
  };

  /* Start setup */

  this.bindTouchDown();
  this.setSendFormInputs();
  if (profileService.focusedClient && profileService.focusedClient.isComplete()) {
    this.setAddress();
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
					a.append('<span class="check">✔</span>');
					if (scope.bindObj[scope.bindProp] == li.attr('data-value')) {
						a[0].click();
						selected = true;
					}
				});
				if (!selected) dropdown.find('a').eq(0)[0].click();

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
	};
});

window.version="1.10.0";
window.commitHash="94f7e3a";
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




