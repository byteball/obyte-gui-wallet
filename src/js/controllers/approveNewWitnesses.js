'use strict';

var myWitnesses = require('byteballcore/my_witnesses.js');

angular.module('copayApp.controllers').controller('approveNewWitnesses', function($scope, $modalInstance, $document, autoUpdatingWitnessesList){
  $scope.addWitnesses = autoUpdatingWitnessesList.addWitnesses;
  $scope.delWitnesses = autoUpdatingWitnessesList.delWitnesses;

  var body = angular.element($document[0].body);
  body.css({position: 'relative', overflow: 'auto'});

  $scope.replace = function(){
    var oldWitnesses = $scope.delWitnesses;
    var newWitnesses = $scope.addWitnesses;

    var n = 0, l = newWitnesses.length;

    function replaceWitness(n, oldWitnesses, newWitnesses){
      myWitnesses.replaceWitness(oldWitnesses[n], newWitnesses[n], function(err){

        if (l < n) {
          replaceWitness(n++, oldWitnesses, newWitnesses)
        } else {
          body.css({position: '', overflow: ''});
          $modalInstance.close('closed result');
        }
      });
    }

    replaceWitness(n, oldWitnesses, newWitnesses);
  };

  $scope.later = function(){
    body.css({position: '', overflow: ''});
    $modalInstance.close('closed result');
  };
});
