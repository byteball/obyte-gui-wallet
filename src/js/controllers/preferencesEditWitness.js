'use strict';

angular.module('copayApp.controllers').controller('preferencesEditWitnessController',
  function($scope, $timeout, go, witnessListService) {
    
    var self = this;
    this.witness = witnessListService.currentWitness;

    this.save = function() {
        var new_address = this.witness.trim();
        if (new_address === witnessListService.currentWitness)
            return goBack();
		var myWitnesses = require('byteballcore/my_witnesses.js');
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
