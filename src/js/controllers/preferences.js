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

	$scope.$watch('singleAddressWallet', function(newValue, oldValue) {

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


		if (!oldValue && newValue) {
			
		}
	});
  });
