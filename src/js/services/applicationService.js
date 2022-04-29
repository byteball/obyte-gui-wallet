'use strict';
angular.module('copayApp.services')
  .factory('applicationService', function($rootScope, $timeout, isCordova, electron, go) {
    var root = {};

    root.restart = function() {
      var hashIndex = window.location.href.indexOf('#/');
      if (isCordova) {
        window.location = window.location.href.substr(0, hashIndex);
        $timeout(function() {
          $rootScope.$digest();
        }, 1);

      } else {
        // Go home reloading the application
        if (electron.isDefined()) {
          go.walletHome();
          $timeout(function() {
            require('electron').remote.getCurrentWindow.reload();
          }, 100);
        } else {
          window.location = window.location.href.substr(0, hashIndex);
        }
      }
    };

    return root;
  });
