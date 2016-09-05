'use strict';

var device = require('byteballcore/device.js');
var lightWallet = require('byteballcore/light_wallet.js');

angular.module('copayApp.controllers').controller('preferencesHubController',
  function($scope, $timeout, configService, go) {
    var config = configService.getSync();
    this.hub = config.hub;

    this.save = function() {
      var self = this;
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

    };
  });
