'use strict';

angular.module('copayApp.controllers').controller('correspondentDevicesController',
  function($scope, $timeout, configService, profileService, go, correspondentListService) {
	
	var self = this;
	
	$scope.editCorrespondentList = false;
	$scope.selectedCorrespondentList = {};
	var fc = profileService.focusedClient;
	$scope.backgroundColor = fc.backgroundColor;
	
	
	$scope.showCorrespondent = function(correspondent) {
		console.log("showCorrespondent", correspondent);
		correspondentListService.currentCorrespondent = correspondent;
		go.path('correspondentDevice');
	};

	$scope.toggleEditCorrespondentList = function() {
		$scope.editCorrespondentList = !$scope.editCorrespondentList;
		$scope.selectedCorrespondentList = {};
	};

	$scope.toggleSelectCorrespondentList = function(addr) {
		$scope.selectedCorrespondentList[addr] = $scope.selectedCorrespondentList[addr] ? false : true;
	};



	$scope.beginAddCorrespondent = function() {
		console.log("beginAddCorrespondent");
		go.path('addCorrespondentDevice');
	};


	$scope.readList = function() {
		$scope.error = null;
		correspondentListService.list(function(err, ab) {
			if (err) {
				$scope.error = err;
				return;
			}
			$scope.list = ab;
			$scope.$digest();
		});
	};
	

	$scope.remove = function(addr) {
		throw Error("unimplemented");
		$scope.error = null;
		$timeout(function() {
		  correspondentListService.remove(addr, function(err, ab) {
			if (err) {
			  $scope.error = err;
			  return;
			}
			$rootScope.$emit('Local/CorrespondentListUpdated', ab);
			$scope.list = ab;
			$scope.$digest();
		  });
		}, 100);
	};

	$scope.cancel = function() {
		console.log("cancel clicked");
		go.walletHome();
	};

  });
