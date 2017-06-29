'use strict';


angular.module('copayApp.services').factory('backButton', function($log, $rootScope, gettextCatalog, $deepStateRedirect, $document, $timeout, go, $state, lodash) {
	var root = {};
	
	root.menuOpened = false;
	root.dontDeletePath = false;
	
	var arrHistory = [];
	var body = $document.find('body').eq(0);
	var shownExitMessage = false;
	
	$rootScope.$on('$stateChangeSuccess', function(event, to, toParams, from, fromParams){
		// if we navigated to point already been somewhere in history -> cut all the history past this point
		/*for (var i = 0; i < arrHistory.length; i++) {
			var state = arrHistory[i];
			if (to.name == state.to && lodash.isEqual(toParams, state.toParams)) {
				arrHistory.splice(i+1);
				break;
			}
		}*/

		lastState = arrHistory.length ? arrHistory[arrHistory.length - 1] : null;
		if (from.name == "" // first state
			|| (lastState && !(to.name == lastState.to && lodash.isEqual(toParams, lastState.toParams)))) // jumped back in history 
			arrHistory.push({to: to.name, toParams: toParams, from: from.name, fromParams: fromParams});
		if (to.name == "walletHome") {
			$rootScope.$emit('Local/SetTab', 'walletHome', true);
		}
		root.menuOpened = false;
	});
	
	function back() {
		if (body.hasClass('modal-open')) {
			$rootScope.$emit('closeModal');
		}
		else if (root.menuOpened) {
			go.swipe();
			root.menuOpened = false;
		}
		else {
			var currentState = arrHistory.pop();
			if (!currentState || currentState.from == "") {
				arrHistory.push(currentState);
				askAndExit();
			} else {
				var parent_state = $state.get('^');
				if (parent_state.name) { // go up on state tree
					$deepStateRedirect.reset(parent_state.name);
					$state.go(parent_state);	
				} else { // go back across history
					var targetState = $state.get(currentState.from);
					if (targetState.modal || (currentState.to == "walletHome" && $rootScope.tab == "walletHome")) { // don't go to modal and don't go to anywhere wfom home screen 
						arrHistory.push(currentState);
						askAndExit();
					} else if (currentState.from.indexOf(currentState.to) != -1) { // prev state is a child of current one
						go.walletHome();
					} else {
						$state.go(currentState.from, currentState.fromParams);
					}
				}
			}
		}
	}
	
	function askAndExit(){
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

	function clearHistory() {
		arrHistory.splice(1);
	}
	
	document.addEventListener('backbutton', function() {
		back();
	}, false);

	/*document.addEventListener('keydown', function(e) {
		if (e.which == 37) back();
	}, false);*/
	
	root.back = back;
	root.arrHistory = arrHistory;
	root.clearHistory = clearHistory;
	return root;
});