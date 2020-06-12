'use strict';

angular.module('copayApp.controllers').controller('approveNewWitnesses', function($scope, $modalInstance, $document, autoUpdatingWitnessesList){
  $scope.addWitnesses = autoUpdatingWitnessesList.addWitnesses;
  $scope.delWitnesses = autoUpdatingWitnessesList.delWitnesses;
  $scope.witnessesAddInfo = require('ocore/network.js').knownWitnesses;

  $scope.replace = function(){
    var oldWitnesses = $scope.delWitnesses;
    var newWitnesses = $scope.addWitnesses;

    var l = newWitnesses.length;

    function replaceWitness(n, oldWitnesses, newWitnesses){
      var myWitnesses = require('ocore/my_witnesses.js');
      myWitnesses.replaceWitness(oldWitnesses[n], newWitnesses[n], function (err) {
        n++;
        if (n < l) {
          replaceWitness(n, oldWitnesses, newWitnesses)
        } else {
          $modalInstance.close('closed result');
        }
      });
    }

    replaceWitness(0, oldWitnesses, newWitnesses);
  };

  $scope.later = function(){
    $modalInstance.close('closed result');
  };
});
