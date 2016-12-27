'use strict';

var device = require('byteballcore/device.js');
var network = require('byteballcore/network.js');
var myWitnesses = require('byteballcore/my_witnesses.js');

angular.module('copayApp.services')
.factory('autoUpdatingWitnessesList', function($timeout, $modal, localStorageService){
  var root = {};

  root.autoUpdate = true;
  root.tmrNextCheck = null;

  root.checkChangeWitnesses = function(){
    if (!root.autoUpdate) return;

    network.getWitnessesFromHub(function(arrWitnessesFromHub){
      if (arrWitnessesFromHub) {
        myWitnesses.readMyWitnesses(function(arrWitnesses){
          root.addWitnesses = [];
          root.delWitnesses = [];
          arrWitnesses.forEach(function(witness){
            if (arrWitnessesFromHub.indexOf(witness) == -1) {
              root.delWitnesses.push(witness);
            }
          });
          arrWitnessesFromHub.forEach(function(witness){
            if (arrWitnesses.indexOf(witness) == -1) {
              root.addWitnesses.push(witness);
            }
          });
          if (root.addWitnesses.length != 0) {
            $modal.open({
              templateUrl: 'views/modals/newWitnesses.html',
              controller: 'autoUpdatingWitnessesList'
            });
          }
          if (root.tmrNextCheck) $timeout.cancel(root.tmrNextCheck);
          root.tmrNextCheck = $timeout(root.checkChangeWitnesses, 1000 * 60 * 60 * 24);
        }, 'ignore');
      }
      else {
        if (root.tmrNextCheck) $timeout.cancel(root.tmrNextCheck);
        root.tmrNextCheck = $timeout(root.checkChangeWitnesses, 1000 * 60);
      }
    });
  };

  root.setAutoUpdate = function(bUpdate){
    localStorageService.set('autoUpdateWitnessesList', bUpdate, function(){
    });
    root.autoUpdate = bUpdate;
  };

  localStorageService.get('autoUpdateWitnessesList', function(err, autoUpdate){
    if (autoUpdate === null) {
      root.setAutoUpdate(true);
    }
    root.autoUpdate = autoUpdate;
    root.checkChangeWitnesses();
  });

  return root;
});
