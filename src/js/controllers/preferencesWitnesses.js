'use strict';

angular.module('copayApp.controllers').controller('preferencesWitnessesController',
  function($scope, go, witnessListService) {
    var self = this;
    this.witnesses = [];
    console.log('preferencesWitnessesController');
    
	var myWitnesses = require('byteballcore/my_witnesses.js');
    myWitnesses.readMyWitnesses(function(arrWitnesses){
        self.witnesses = arrWitnesses;
        $scope.$apply();
        console.log('preferencesWitnessesController set witnesses '+arrWitnesses);
    });

    this.edit = function(witness) {
        witnessListService.currentWitness = witness;
        go.path('preferencesEditWitness');
    };
  });
