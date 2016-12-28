'use strict';

var eventBus = require('byteballcore/event_bus.js');

angular.module('copayApp.services')
.factory('newVersion', function($modal, $timeout){
  var root = {};
  root.shown = false;
  root.timerNextShow = false;

  eventBus.on('new_version', function(ws, data){
    root.version = data.version;
    if(!root.shown) {
      $modal.open({
        templateUrl: 'views/modals/newVersionIsAvailable.html',
        controller: 'newVersionIsAvailable'
      });
      root.shown = true;
      startTimerNextShow();
    }
  });

  function startTimerNextShow(){
    if (root.timerNextShow) $timeout.cancel(root.timerNextShow);
    root.timerNextShow = $timeout(function(){
      root.shown = false;
    }, 1000 * 60 * 60 * 24);
  }

  return root;
});
