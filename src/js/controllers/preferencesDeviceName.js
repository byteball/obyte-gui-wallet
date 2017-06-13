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
