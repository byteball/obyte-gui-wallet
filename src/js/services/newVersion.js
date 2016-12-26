'use strict';

var eventBus = require('byteballcore/event_bus.js');

angular.module('copayApp.services')
.factory('newVersion', function($modal, localStorageService){
  var root = {};

  eventBus.on('justsaying', function(ws, data){
    if (data.subject == 'newVersion') {
      var date = new Date();
      localStorageService.get('lastShowNewVersion', function(err, lastShowNewVersion){
        if (!lastShowNewVersion || lastShowNewVersion != date.getDate() + '-' + date.getMonth() + '-' + date.getFullYear()) {
          $modal.open({
            templateUrl: 'views/modals/newVersionIsAvailable.html',
            controller: 'newVersionIsAvailable'
          });
        }
      });
    }
  });

  return root;
});
