'use strict';
angular.module('copayApp.services')
.factory('bottomBarService', function($rootScope, $timeout, lodash, isCordova) {
	if (!isCordova)
		return {};

	window.addEventListener('keyboardDidShow', function() {
		$timeout(function(){
			angular.element(document).find('body').addClass('keyboard-open');
		}, 1);
	});

	window.addEventListener('keyboardDidHide', function() {
		$timeout(function(){
			angular.element(document).find('body').removeClass('keyboard-open');
		}, 1);
	});

	return {};
});