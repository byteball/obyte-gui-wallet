'use strict';

angular.module('copayApp.controllers').controller('preferencesEditWitnessController',
  function($scope, $timeout, go, witnessListService, lodash) {
    
    var self = this;
    this.witness = witnessListService.currentWitness;
    this.witnesses = [];
    this.witnessesKnown = [];

    this.witnessList = require('ocore/my_witnesses.js');

    this.witnessesAddInfo = require('ocore/network.js').knownWitnesses;

    this.witnessesKnown = Object.keys(this.witnessesAddInfo);

    this.witnessList.readMyWitnesses(function(arrWitnesses){
        self.witnesses = arrWitnesses;
        $timeout(function () {
            $scope.$apply();
        });
        self.witnessesKnown = lodash.difference(lodash.difference(self.witnessesKnown, self.witnesses), lodash.difference(self.witnesses, self.witnessesKnown));
    }, 'wait');




    this.save = function() {
        var new_address = this.witness.trim();
        if (new_address === witnessListService.currentWitness)
            return goBack();

		    var myWitnesses = require('ocore/my_witnesses.js');
        myWitnesses.replaceWitness(witnessListService.currentWitness, new_address, function(err){
            console.log(err);
            if (err)
                return setError(err);
            goBack();
        });
    };
    
    function setError(error){
        self.error = error;
        $timeout(function(){
            $scope.$apply();
        }, 100);
    }

    function goBack(){
        go.path('preferencesGlobal.preferencesWitnesses');
    }
  });
