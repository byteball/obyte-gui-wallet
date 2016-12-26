'use strict';

var myWitnesses = require('byteballcore/my_witnesses.js');

angular.module('copayApp.controllers').controller('autoUpdatingWitnessesList', function($scope, $modalInstance, go, localStorageService, autoUpdatingWitnessesList){
  $scope.addWitnesses = autoUpdatingWitnessesList.addWitnesses;
  $scope.delWitnesses = autoUpdatingWitnessesList.delWitnesses;

  $scope.replace = function(){
    var oldWitness = $scope.delWitnesses;
    var newWitness = $scope.addWitnesses;

    var n = 0, l = newWitness.length;

    function r(n, oldWitness, newWitness){
      myWitnesses.replaceWitness(oldWitness[n], newWitness[n], function(err){

        if (l < n) {
          r(n++, oldWitness, newWitness)
        }
      });
    }

    r(n, oldWitness, newWitness);
  };

  $scope.later = function(){
    $modalInstance.close('closed result');
  };
});
