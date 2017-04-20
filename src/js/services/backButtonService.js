'use strict';


angular.module('copayApp.services').factory('backButton', function($log, $rootScope, gettextCatalog, $deepStateRedirect, $document, $timeout, go) {
	var root = {};
	
	root.menuOpened = false;
	root.dontDeletePath = false;
	
	var arrHistory = [];
	var body = $document.find('body').eq(0);
	var shownExitMessage = false;
	
	window.addEventListener("hashchange", function() {
		var path = location.hash.replace(/\//g, '.');
		if (!root.dontDeletePath && path == arrHistory[arrHistory.length - 2]) {
			arrHistory.pop();
		}
		else {
			if (arrHistory[arrHistory.length - 1] == '#.correspondentDevices' && !(/correspondentDevices/.test(path))) arrHistory = [];
			arrHistory.push(path);
			if (arrHistory[arrHistory.length - 2] == '#.correspondentDevices.correspondentDevice' && path == '#.correspondentDevices') arrHistory.splice(arrHistory.length - 2, 1);
			if (root.dontDeletePath) root.dontDeletePath = false;
		}
		root.menuOpened = false;
	}, false);
	
	function back() {
		if (body.hasClass('modal-open')) {
			$rootScope.$emit('closeModal');
		}
		else if (root.menuOpened) {
			go.swipe();
			root.menuOpened = false;
		}
		else if (location.hash == '#/' && arrHistory.length <= 1) {
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
		else if (location.hash == '#/correspondentDevices/correspondentDevice') {
			$deepStateRedirect.reset('correspondentDevices');
			go.path('correspondentDevices');
		}
		else {
			if (arrHistory[arrHistory.length - 2]) {
				var path = arrHistory[arrHistory.length - 2].substr(2);
				arrHistory.splice(arrHistory.length - 2, 2);
				if (path) {
					$deepStateRedirect.reset(path);
					go.path(path);
					if(path === 'correspondentDevices.correspondentDevice'){
						$timeout(function() {
							$rootScope.$emit('Local/SetTab', 'chat', true);
						}, 100);
					}
				}
				else {
					go.walletHome();
				}
			}
			else {
				arrHistory = [];
				go.walletHome();
			}
		}
	}
	
	function clearHistory() {
		arrHistory = [];
	}
	
	document.addEventListener('backbutton', function() {
		back();
	}, false);
	
	root.back = back;
	root.arrHistory = arrHistory;
	root.clearHistory = clearHistory;
	return root;
});