'use strict';

angular.module('copayApp.controllers').controller('newVersionIsAvailable', function($scope, $modalInstance, go, localStorageService){

  $scope.openDownloadLink = function(){
    var link = '';
    if (navigator && navigator.app) {
      link = 'https://play.google.com/store/apps/details?id=org.byteball.wallet.testnet'
    }
    else {
      link = 'https://github.com/byteball/byteball';
    }
    localStorageService.remove('lastShowNewVersion', function(){
    });
    go.openExternalLink(link);
    $modalInstance.close('closed result');
  };

  $scope.later = function(){
    var date = new Date();
    localStorageService.set('lastShowNewVersion', date.getDate() + '-' + date.getMonth() + '-' + date.getFullYear(), function(){
    });
    $modalInstance.close('closed result');
  };
});
