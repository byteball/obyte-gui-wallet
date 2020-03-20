'use strict';

angular.module('copayApp.controllers').controller('preferencesEditWitnessController',
  function ($scope, $timeout, go, witnessListService, lodash) {

    var self = this;
    this.witness = witnessListService.currentWitness;
    this.witnesses = [];
    this.suggestToggle = false;
    this.witnessesAddInfo = require('ocore/network.js').knownWitnesses;
    this.witnessesKnown = Object.keys(this.witnessesAddInfo);

    var witnessList = require('ocore/my_witnesses.js');

    witnessList.readMyWitnesses(function (arrWitnesses) {
      self.witnesses = arrWitnesses;
      $timeout(function () {
        $scope.$apply();
      });
      self.witnessesKnown = lodash.difference(self.witnessesKnown, self.witnesses);
    }, 'wait');

    this.save = function () {
      var new_address = this.witness.trim();
      if (new_address === witnessListService.currentWitness)
        return goBack();

      var myWitnesses = require('ocore/my_witnesses.js');
      myWitnesses.replaceWitness(witnessListService.currentWitness, new_address, function (err) {
        console.log(err);
        if (err)
          return setError(err);
        goBack();
      });
    };

    this.toggleList = function(wtn) {
      self.suggestToggle = false;

      self.witnessesKnown.push($scope.ewc.witness);
      var witnessesUpdated = self.witnessesKnown.filter(w => w !== wtn);
      self.witnessesKnown = witnessesUpdated;
      $scope.ewc.witness = wtn;
    };

    function setError(error) {
      self.error = error;
      $timeout(function () {
        $scope.$apply();
      }, 100);
    }

    function goBack() {
      go.path('preferencesGlobal.preferencesWitnesses');
    }
  });
