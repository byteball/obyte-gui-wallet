'use strict';

angular.module('copayApp.controllers').controller('newVersionIsAvailable', function($scope, $modalInstance, go, newVersion){

  $scope.version = newVersion.version;
	
  $scope.openDownloadLink = function(){
    var link = '';
    if (navigator && navigator.app) {
      link = 'https://play.google.com/store/apps/details?id=org.byteball.wallet';
	  if (newVersion.version.match('t$'))
		  link += '.testnet';
    }
    else {
      link = 'https://github.com/byteball/byteball/releases/tag/v' + newVersion.version;
    }
    go.openExternalLink(link);
    $modalInstance.close('closed result');
  };

  $scope.later = function(){
    $modalInstance.close('closed result');
  };
});
