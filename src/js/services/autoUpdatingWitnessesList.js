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
