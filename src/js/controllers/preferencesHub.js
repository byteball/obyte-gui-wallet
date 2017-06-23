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
