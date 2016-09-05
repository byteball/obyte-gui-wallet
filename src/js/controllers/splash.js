'use strict';

angular.module('copayApp.controllers').controller('splashController',
  function($scope, $timeout, $log, configService, profileService, storageService, go) {
    
    var self = this;
    
    function saveDeviceName(){
        console.log('saveDeviceName: '+self.deviceName);
        device.setDeviceName(self.deviceName);
        var opts = {deviceName: self.deviceName};
        configService.set(opts, function(err) {
            if (err)
                self.$emit('Local/DeviceError', err);
        });
    }
   
    configService.get(function(err, config) {
        if (err)
            throw Error("failed to read config");
        self.deviceName = config.deviceName;
    });
    
    
    this.create = function(noWallet) {
        self.creatingProfile = true;
        saveDeviceName();

        $timeout(function() {
            profileService.create({noWallet: noWallet}, function(err) {
                if (err) {
                    self.creatingProfile = false;
                    $log.warn(err);
                    self.error = err;
                    self.$apply();
                    $timeout(function() {
                        self.create(noWallet);
                    }, 3000);
                }
            });
        }, 100);
    };

    this.init = function() {
      storageService.getDisclaimerFlag(function(err, val) {
        if (!val) go.path('disclaimer');
        
        if (profileService.profile) {
          go.walletHome();
        }
      });
    };
  });
