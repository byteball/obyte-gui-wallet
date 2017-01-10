'use strict';

angular.module('copayApp.controllers').controller('approveNewWitnesses', function($scope, $modalInstance, $document, autoUpdatingWitnessesList){
  $scope.addWitnesses = autoUpdatingWitnessesList.addWitnesses;
  $scope.delWitnesses = autoUpdatingWitnessesList.delWitnesses;


  $scope.replace = function(){
    var oldWitnesses = $scope.delWitnesses;
    var newWitnesses = $scope.addWitnesses;

    var n = 0, l = newWitnesses.length;

    function replaceWitness(n, oldWitnesses, newWitnesses){
	  var myWitnesses = require('byteballcore/my_witnesses.js');
      myWitnesses.replaceWitness(oldWitnesses[n], newWitnesses[n], function(err){

        if (l < n) {
          replaceWitness(n++, oldWitnesses, newWitnesses)
        } else {
          $modalInstance.close('closed result');
        }
      });
    }

    replaceWitness(n, oldWitnesses, newWitnesses);
  };

  $scope.later = function(){
    $modalInstance.close('closed result');
  };
});
