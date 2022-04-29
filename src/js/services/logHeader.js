'use strict';
angular.module('copayApp.services')
  .factory('logHeader', function($log, isCordova, electron) {
    $log.info('Starting Obyte v' + window.version + ' #' + window.commitHash);
    $log.info('Client: isCordova:', isCordova, 'isElectron:', electron.isDefined());
    $log.info('Navigator:', navigator.userAgent);
    return {};
  });
