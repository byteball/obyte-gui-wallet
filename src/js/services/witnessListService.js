'use strict';


angular.module('copayApp.services').factory('witnessListService', function($state, $rootScope, go) {
    var root = {};
    
    console.log("witnessListService");

    
    root.currentWitness = null;


    return root;
});
