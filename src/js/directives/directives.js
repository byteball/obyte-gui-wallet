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
        for (var i = 0; i < lines.length; i++) {
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
        	if (typeof value === "string")
        		value = value.replace(",", ".");
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
  .directive('clickOutside', function ($document) {
    return {
      restrict: 'A',
      scope: {
        clickOutside: '&'
      },
      link: function (scope, el) {
        var handler = function (e) {
          if (el !== e.target && !el[0].contains(e.target)) {
              scope.$apply(function () {
                  scope.$eval(scope.clickOutside);
              });
          }
        }
        $document.on('click', handler);
        scope.$on('$destroy', function() {
          $document.off('click', handler);
        });
      }
    }
  })
.directive('onEscape', function($rootScope, isCordova) {
	return {
		restrict: 'A',
		scope: {
			fn: '&onEscape'
		},
		link: function (scope, elem, attrs) {
			elem.on('keydown', function (event) {
				if (event.keyCode === 27)
					scope.fn();
				scope.$apply();
			});
		}
	}
})
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
}])
.filter('capitalize', function() {
	return function(str) {
		str = str || '';
		return str.charAt(0).toUpperCase() + str.slice(1);
	}
})
.filter('balancesFilter', function() {
	return function(balances, substring) {
		if (!substring)
			return balances;
		substring = substring.toLocaleLowerCase();
		return balances.filter(function(b) {
			var name = b.name || b.asset;
			if (b.asset === 'base')
				name = 'bytes';
			if (b.asset === constants.BLACKBYTES_ASSET)
				name = 'blackbytes';
			return name.toLocaleLowerCase().includes(substring) || (b.totalStr ? b.totalStr.toLocaleLowerCase().includes(substring) : false);
		});
	}
});
