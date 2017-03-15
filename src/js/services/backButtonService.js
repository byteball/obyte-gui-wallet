'use strict';


angular.module('copayApp.services').factory('backButton', function($log, $rootScope, gettextCatalog, $deepStateRedirect, $document, $timeout, go) {
	var root = {};
	
	root.menuOpened = false;
	
	var arrHistory = [];
	var body = $document.find('body').eq(0);
	var shownExitMessage = false;
	
	window.addEventListener("hashchange", function() {
		var path = location.hash.replace(/\//g, '.');
		if (path == arrHistory[arrHistory.length - 2]) {
			arrHistory.pop();
		}
		else {
			arrHistory.push(path);
		}
	}, false);
	
	function back() {
		if (body.hasClass('modal-open')) {
			$rootScope.$emit('closeModal');
		}
		else if (root.menuOpened) {
			go.swipe();
			root.menuOpened = false;
		}
		else if (location.hash == '#/' && arrHistory.length == 1) {
			if (shownExitMessage) {
				navigator.app.exitApp();
			}
			else {
				shownExitMessage = true;
				window.plugins.toast.showShortBottom(gettextCatalog.getString('Press again to exit'));
				$timeout(function() {
					shownExitMessage = false;
				}, 2000);
			}
		}
		else {
			var path = arrHistory[arrHistory.length - 2].substr(2);
			if (path) {
				if (/\//.test(path)) {
					go.path(path);
				}
				else {
					$deepStateRedirect.reset(path);
					go.path(path);
				}
			}
			else {
				go.walletHome()
			}
		}
	}
	
	document.addEventListener('backbutton', function() {
		back();
	}, false);
	
	root.back = back;
	root.arrHistory = arrHistory;
	return root;
});