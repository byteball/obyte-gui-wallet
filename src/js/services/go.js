'use strict';

var eventBus = require('byteballcore/event_bus.js');

angular.module('copayApp.services').factory('go', function($window, $rootScope, $location, $state, profileService, fileSystemService, nodeWebkit, notification, gettextCatalog, authService, $deepStateRedirect, $stickyState, configService) {
	var root = {};

	var hideSidebars = function() {
		if (typeof document === 'undefined')
			return;

		var elem = document.getElementById('off-canvas-wrap');
		elem.className = 'off-canvas-wrap';
	};

	var toggleSidebar = function(invert) {
		if (typeof document === 'undefined')
			return;

		var elem = document.getElementById('off-canvas-wrap');
		var leftbarActive = elem.className.indexOf('move-right') >= 0;

		if (invert) {
			if (profileService.profile && !$rootScope.hideNavigation) {
				elem.className = 'off-canvas-wrap move-right';
			}
		} else {
			if (leftbarActive) {
				hideSidebars();
			}
		}
	};

	root.openExternalLink = function(url, target) {
		if (nodeWebkit.isDefined()) {
			nodeWebkit.openExternalLink(url);
		}
		else {
			target = target || '_blank';
			var ref = window.open(url, target, 'location=no');
		}
	};

	root.path = function(path, cb) {
		$state.go(path)
		.then(function() {
			console.log("transition done "+path);
			if (cb) return cb();
		}, function() {
			console.log("transition failed "+path);
			if (cb) return cb('animation in progress');
		});
		hideSidebars();
	};

	root.swipe = function(invert) {
		toggleSidebar(invert);
	};

	root.walletHome = function() {
		var fc = profileService.focusedClient;
		if (fc && !fc.isComplete())
			root.path('copayers');
		else {
			root.path('walletHome', function() {
				$rootScope.$emit('Local/SetTab', 'walletHome', true);
			});
		}
	};


	root.send = function(cb) {
		$stickyState.reset('walletHome');
		root.path('walletHome', function() {
			$rootScope.$emit('Local/SetTab', 'send');
			if (cb)
				cb();
		});
	};

	root.history = function(cb) {
		root.path('walletHome', function() {
			$rootScope.$emit('Local/SetTab', 'history');
			if (cb)
				cb();
		});
	};

	root.addWallet = function() {
		$state.go('add');
	};

	root.preferences = function() {
		$state.go('preferences');
	};

	root.preferencesGlobal = function() {
		$state.go('preferencesGlobal');
	};

	root.reload = function() {
		$state.reload();
	};


	// Global go. This should be in a better place TODO
	// We dont do a 'go' directive, to use the benefits of ng-touch with ng-click
	$rootScope.go = function(path, resetState) {
		var targetState = $state.get(path);
		if (resetState) $deepStateRedirect.reset(targetState.name);
		root.path(path);
	};

	$rootScope.openExternalLink = function(url, target) {
		root.openExternalLink(url, target);
	};


	function handleUri(uri){
		if (uri.indexOf("byteball:") == -1) return handleFile(uri);

		console.log("handleUri "+uri);

		require('byteballcore/uri.js').parseUri(uri, {
			ifError: function(err){
				console.log(err);
				notification.error(err);
				//notification.success(gettextCatalog.getString('Success'), err);
			},
			ifOk: function(objRequest){
				console.log("request: "+JSON.stringify(objRequest));
				if (objRequest.type === 'address'){
					root.send(function(){
						$rootScope.$emit('paymentRequest', objRequest.address, objRequest.amount, objRequest.asset);
					});
				}
				else if (objRequest.type === 'pairing'){
					$rootScope.$emit('Local/CorrespondentInvitation', objRequest.pubkey, objRequest.hub, objRequest.pairing_secret);
				}
				else if (objRequest.type === 'auth'){
					authService.objRequest = objRequest;
					root.path('authConfirmation');
				}
				else if (objRequest.type === 'textcoin') {
					$rootScope.$emit('claimTextcoin', objRequest.mnemonic);
				}
				else
					throw Error('unknown url type: '+objRequest.type);
			}
		});
	}

	var last_handle_file_ts = 0;

	function handleFile(uri) {
		var checkDoubleClaim = function() {
			if (double_claim)
				eventBus.emit('nonfatal_error', "double claim of private textcoin", new Error());
		}
		var double_claim = false;
		if (Date.now() - last_handle_file_ts < 500) {
			double_claim = true;
		}
		last_handle_file_ts = Date.now();
		var breadcrumbs = require('byteballcore/breadcrumbs.js');
		console.log("handleFile "+uri);
		root.walletHome();
		$rootScope.$emit('process_status_change', 'claiming', true);
		var cb = function(err, data) {
			breadcrumbs.add("callback from handlePrivatePaymentFile");
			if (err) {
				$rootScope.$emit('process_status_change', 'claiming', false);
				return notification.error(err);
			}
			$rootScope.$emit('claimTextcoin', data.mnemonic);
		}
		if (uri.indexOf("content:") !== -1) {
			window.plugins.intent.readFileFromContentUrl(uri.replace(/#/g,'%23'), function (content) {
				breadcrumbs.add("handleFile - content url");
				require('byteballcore/wallet.js').handlePrivatePaymentFile(null, content, cb);
			}, function (err) {throw err});
			return checkDoubleClaim();
		}
		if (uri.indexOf("." + configService.privateTextcoinExt) != -1) {
			breadcrumbs.add("handleFile - file path url");
			require('byteballcore/wallet.js').handlePrivatePaymentFile(uri, null, cb);
			return checkDoubleClaim();
		}
		$rootScope.$emit('process_status_change', 'claiming', false);
	}
	
	function extractByteballArgFromCommandLine(commandLine){
		var conf = require('byteballcore/conf.js');
		var url = new RegExp('^'+conf.program+':', 'i');
		var file = new RegExp("\\."+configService.privateTextcoinExt+'$', 'i');
		var arrParts = commandLine.split(' '); // on windows includes exe and all args, on mac just our arg
		for (var i=0; i<arrParts.length; i++){
			var part = arrParts[i].trim().replace(/"/g, '');
			if (part.match(url) || part.match(file))
				return part;
		}
		return null;
	}
	
	function registerWindowsProtocolHandler(){
		// now we do it in inno setup
	}
	
	function createLinuxDesktopFile(){
		console.log("will write .desktop file");
		var fs = require('fs'+'');
		var path = require('path'+'');
		var child_process = require('child_process'+'');
		var package = require('../package.json'+''); // relative to html root
		var applicationsDir = process.env.HOME + '/.local/share/applications';
		var mimeDir = process.env.HOME + '/.local/share/mime';
		fileSystemService.recursiveMkdir(applicationsDir, parseInt('700', 8), function(err){
			console.log('mkdir applications: '+err);
			fs.writeFile(applicationsDir + '/' +package.name+'.desktop', "[Desktop Entry]\n\
Type=Application\n\
Version=1.0\n\
Name="+package.name+"\n\
Comment="+package.description+"\n\
Exec="+process.execPath.replace(/ /g, '\\ ')+" %u\n\
Icon="+path.dirname(process.execPath)+"/public/img/icons/logo-circle-256.png\n\
Terminal=false\n\
Categories=Office;Finance;\n\
MimeType=x-scheme-handler/"+package.name+";application/x-"+package.name+";\n\
X-Ubuntu-Touch=true\n\
X-Ubuntu-StageHint=SideStage\n", {mode: 0755}, function(err){
				if (err)
					throw Error("failed to write desktop file: "+err);
				child_process.exec('update-desktop-database '+applicationsDir, function(err){
					if (err)
						throw Error("failed to exec update-desktop-database: "+err);
					if (!fs.existsSync(mimeDir + '/packages')) {
						fs.mkdirSync(mimeDir + '/packages');
					}
					fs.writeFile(mimeDir + '/packages/' + package.name+'.xml', "<?xml version=\"1.0\"?>\n\
 <mime-info xmlns='http://www.freedesktop.org/standards/shared-mime-info'>\n\
   <mime-type type=\"application/x-"+package.name+"\">\n\
   <comment>Byteball Private Coin</comment>\n\
   <glob pattern=\"*."+configService.privateTextcoinExt+"\"/>\n\
  </mime-type>\n\
 </mime-info>\n", {mode: 0755}, function(err) {
 						if (err)
							throw Error("failed to write MIME config file: "+err);
						child_process.exec('update-mime-database '+mimeDir, function(err){
							if (err)
								throw Error("failed to exec update-mime-database: "+err);
							child_process.exec('xdg-icon-resource install --context mimetypes --size 64 '+path.dirname(process.execPath)+'/public/img/icons/logo-circle-64.png application-x-'+package.name, function(err){});
						});
 						console.log(".desktop done");
 					});
				});
			});
		});
	}
	
	var gui;
	try{
		gui = require('nw.gui');
	}
	catch(e){
	}
	
	if (gui){ // nwjs
		var removeListenerForOnopen = $rootScope.$on('Local/BalanceUpdatedAndWalletUnlocked', function(){
			removeListenerForOnopen();
			gui.App.on('open', function(commandLine) {
				console.log("Open url: " + commandLine);
				if (commandLine){
					var file = extractByteballArgFromCommandLine(commandLine);
					if (!file)
						return console.log("no byteball: arg found");
					handleUri(file);
					gui.Window.get().focus();
				}
			});
		});
		console.log("argv: "+gui.App.argv);
		if (gui.App.argv[0]){
			// wait till the wallet fully loads
			var removeListener = $rootScope.$on('Local/BalanceUpdatedAndWalletUnlocked', function(){
				setTimeout(function(){
					handleUri(gui.App.argv[0]);
				}, 100);
				removeListener();
			});
		}
		if (process.platform === 'win32' || process.platform === 'linux'){
			// wait till the wallet fully loads
			var removeRegListener = $rootScope.$on('Local/BalanceUpdated', function(){
				setTimeout(function(){
					(process.platform === 'win32') ? registerWindowsProtocolHandler() : createLinuxDesktopFile();
					gui.desktop = process.env.HOME + '/.local/share/applications';
				}, 200);
				removeRegListener();
			});
		}
		/*var win = gui.Window.get();
		win.on('close', function(){
			console.log('close event');
			var db = require('byteballcore/db.js');
			db.close(function(err){
				console.log('close err: '+err);
			});
			this.close(true);
		});*/
	}
	else if (window.cordova){
		//console.log("go service: setting temp handleOpenURL");
		//window.handleOpenURL = tempHandleUri;
		// wait till the wallet fully loads
		var removeListener = $rootScope.$on('Local/BalanceUpdatedAndWalletUnlocked', function(){
			console.log("setting permanent handleOpenURL");
			window.handleOpenURL = handleUri;
			if (window.open_url){ // use cached url at startup
				console.log("using cached open url "+window.open_url);
				setTimeout(function(){
					handleUri(window.open_url);
				}, 100);
			}
			removeListener();
		});
		/*
		document.addEventListener('backbutton', function() {
			console.log('doc backbutton');
			if (root.onBackButton)
				root.onBackButton();
		});*/
		document.addEventListener('resume', function() {
			console.log('resume');
			$rootScope.$emit('Local/Resume');
		}, false);

		if (window.plugins.intent) {
			window.plugins.intent.setNewIntentHandler(function(intent){
				if (typeof intent.data === "string")
					handleFile(intent.data);
			});
		}
	}
   
	
	root.handleUri = handleUri;
	
	return root;
}).factory('$exceptionHandler', function($log){
	return function myExceptionHandler(exception, cause) {
		console.log("angular $exceptionHandler");
		$log.error(exception, cause);
		eventBus.emit('uncaught_error', "An exception occurred: "+exception+"; cause: "+cause, exception);
	};
});

function tempHandleUri(url){
	console.log("saving open url "+url);
	window.open_url = url;
}


console.log("parsing go.js");
if (window.cordova){
	// this is temporary, before angular starts
	console.log("go file: setting temp handleOpenURL");
	window.handleOpenURL = tempHandleUri;
}

window.onerror = function(msg, url, line, col, error){
	console.log("onerror");
	eventBus.emit('uncaught_error', "Javascript error: "+msg, error);
};

process.on('uncaughtException', function(e){
	console.log("uncaughtException");
	eventBus.emit('uncaught_error', "Uncaught exception: "+e, e);
});