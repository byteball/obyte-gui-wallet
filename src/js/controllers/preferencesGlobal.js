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
	  this.lastBackupDate = config.lastBackupDate;
	  this.restoredFromBackupCreatedOn = config.restoredFromBackupCreatedOn;
	  this.restoreDate = config.restoreDate;

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
