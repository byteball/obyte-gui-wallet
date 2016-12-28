'use strict';

var device = require('byteballcore/device.js');
var myWitnesses = require('byteballcore/my_witnesses.js');

angular.module('copayApp.services')
.factory('autoUpdatingWitnessesList', function($timeout, $modal, configService){
  var root = {};

  root.autoUpdate = true;
  root.timerNextCheck = null;

  root.checkChangeWitnesses = function(){
    if (!root.autoUpdate) return;

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
            $modal.open({
              templateUrl: 'views/modals/newWitnesses.html',
              controller: 'approveNewWitnesses'
            });
          }
          if (root.timerNextCheck) $timeout.cancel(root.timerNextCheck);
          root.timerNextCheck = $timeout(root.checkChangeWitnesses, 1000 * 60 * 60 * 24);
        }, 'ignore');
      }
      else {
        if (root.timerNextCheck) $timeout.cancel(root.timerNextCheck);
        root.timerNextCheck = $timeout(root.checkChangeWitnesses, 1000 * 60);
      }
    });
  };

  root.setAutoUpdate = function(bUpdate){
    configService.set({autoUpdateWitnessesList: bUpdate},function(){
    });
    root.autoUpdate = bUpdate;
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
