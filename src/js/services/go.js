'use strict';

var eventBus = require('ocore/event_bus.js');

angular.module('copayApp.services').factory('go', function($window, $rootScope, $timeout, $location, $state, profileService, fileSystemService, notification, gettextCatalog, authService, $deepStateRedirect, $stickyState, configService, isCordova) {
	var root = {};

	let electron;
	try {
		electron = require('electron');
	}
	catch(e){}

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

	root.openExternalLink = function(url) {
		url = url.replace(/&amp;/g, '&');
		if (electron)
			electron.shell.openExternal(url);
		else if (isCordova)
			cordova.InAppBrowser.open(url, '_system');
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

	$rootScope.openExternalLink = root.openExternalLink;


	function handleUri(uri){
		var conf = require('ocore/conf.js');
		var bb_program_url = new RegExp('^'+conf.program+':', 'i');
		var ob_program_url = new RegExp('^'+conf.program.replace(/byteball/i, 'obyte')+':', 'i');
		var ob_url = new RegExp('^obyte:', 'i');
		if (!uri.match(bb_program_url) && !uri.match(ob_program_url) && !uri.match(ob_url)) return handleFile(uri);

		console.log("handleUri "+uri);

		require('ocore/uri.js').parseUri(uri, {
			ifError: function (err) {
				console.log(err);
				$rootScope.$emit('Local/ShowErrorAlert', err);
			},
			ifOk: function (objRequest) {
				console.log("request: " + JSON.stringify(objRequest));
				setTimeout(function () {
					if (objRequest.type === 'address') {
						var emitPaymentRequest = function () {
							root.send(function () {
								$rootScope.$emit('paymentRequest', objRequest.address, objRequest.amount, objRequest.asset, null, objRequest.base64data, objRequest.from_address, objRequest.single_address, objRequest.additional_assets);
							});
						}
						if (!objRequest.from_address)
							return emitPaymentRequest();
						var db = require('ocore/db.js');
						db.query("SELECT address, wallet FROM my_addresses WHERE address=?", [objRequest.from_address], function (rows) {
							$timeout(function () {
								if (rows.length === 0)
									return $rootScope.$emit('Local/ShowErrorAlert', "Payment cannot be sent from address " + objRequest.from_address + " as this address doesn't belong to this wallet");
								var row = rows[0];
								// same wallet
								if (row.wallet === profileService.focusedClient.credentials.walletId)
									return emitPaymentRequest();
								// switch to another wallet first
								console.log("will switch to another wallet where from_address is member of");
								profileService.setAndStoreFocus(row.wallet, function () {
									emitPaymentRequest();	
								});
							});
						});
					}
					else if (objRequest.type === 'data') {
						delete objRequest.type;
						root.send(function () {
							$rootScope.$emit('dataPrompt', objRequest);
						});
					}
					else if (objRequest.type === 'pairing') {
						$rootScope.$emit('Local/CorrespondentInvitation', objRequest.pubkey, objRequest.hub, objRequest.pairing_secret);
					}
					else if (objRequest.type === 'auth') {
						authService.objRequest = objRequest;
						root.path('authConfirmation');
					}
					else if (objRequest.type === 'textcoin') {
						$rootScope.$emit('claimTextcoin', objRequest.mnemonic);
					}
					else
						throw Error('unknown url type: ' + objRequest.type);
				});
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
			//double_claim = true;
			return;
		}
		last_handle_file_ts = Date.now();
		var breadcrumbs = require('ocore/breadcrumbs.js');
		console.log("handleFile "+uri);
		root.walletHome();
		$rootScope.$emit('process_status_change', 'claiming', true);
		var cb = function(err, data) {
			breadcrumbs.add("callback from handlePrivatePaymentFile");
			if (err) {
				$rootScope.$emit('process_status_change', 'claiming', false);
				return $rootScope.$emit('Local/ShowErrorAlert', err);
			}
			$rootScope.$emit('claimTextcoin', data.mnemonic);
		}
		if (uri.indexOf("content:") !== -1) {
			window.plugins.intent.readFileFromContentUrl(uri.replace(/#/g,'%23'), function (content) {
				breadcrumbs.add("handleFile - content url");
				require('ocore/wallet.js').handlePrivatePaymentFile(null, content, cb);
			}, function (err) {throw err});
			return checkDoubleClaim();
		}
		if (uri.indexOf("." + configService.privateTextcoinExt) != -1) {
			breadcrumbs.add("handleFile - file path url");
			require('ocore/wallet.js').handlePrivatePaymentFile(uri, null, cb);
			return checkDoubleClaim();
		}
		$rootScope.$emit('process_status_change', 'claiming', false);
	}
	
	function extractObyteArgFromCommandLine(commandLine){
		var conf = require('ocore/conf.js');
		var bb_url = new RegExp('^'+conf.program+':', 'i');
		var ob_url = new RegExp('^'+conf.program.replace(/byteball/i, 'obyte')+':', 'i');
		var file = new RegExp("\\."+configService.privateTextcoinExt+'$', 'i');
		var tokenize = function(str) {
			var tokens = [];
			var start = -1; // opening quote index
			var lastSpace = -1;
			for (var i = 0; i < str.length; i++) {
				if (str[i] == '"' || str[i] == '\'')
					if (start != -1) {
						tokens.push(str.substring(start+1, i));
						start = -1;
					}
					else if (str[i - 1] === ' ')
						start = i;
				if (str[i] == ' ' && start == -1) {
					if (str.substring(lastSpace+1, i).length)
						tokens.push(str.substring(lastSpace+1, i));
					lastSpace = i;
				}
			}
			if (lastSpace != -1 && str.substring(lastSpace+1, i).length) {
				tokens.push(str.substring(lastSpace+1, i));
			}
			return (tokens.length > 0) ? tokens : [str];
		}
		var arrParts = tokenize(commandLine); // on windows commandLine includes exe and all args, on mac just our arg
		for (var i=0; i<arrParts.length; i++){
			var part = arrParts[i].trim().replace(/"/g, '');
			if (part.match(bb_url) || part.match(ob_url) || part.match(file))
				return part;
		}
		return null;
	}

	function createLinuxDesktopFile(){
		var path = require('path'+'');
		if (process.env.APPIMAGE){
			console.log("run from appimage " + process.env.APPIMAGE);
			var execPath = process.env.APPIMAGE;
			var iconDir = process.env.HOME + "/.local/share/icons";
			var iconPath = iconDir + "/obyte-logo-circle-256.png";
			fileSystemService.recursiveMkdir(iconDir, parseInt('700', 8), function(err){
				console.log('mkdir icons: '+err);
				//we store the app icon outside the appimage filesystem
				fileSystemService.readFile(path.dirname(process.execPath) + "/resources/app/public/img/icons/logo-circle-256.png", function(err, data) {
					console.log("error when reading icon: " + err);
					fileSystemService.nwWriteFile(iconPath, data, function(err){
						console.log("error when writing icon: " + err);
					});
				});
			})
		} else {
			var execPath = process.execPath;
			var iconPath = path.dirname(execPath)+"/public/img/icons/logo-circle-256.png";
		}
		console.log("will write .desktop file");
		var fs = require('fs'+'');
		var child_process = require('child_process'+'');
		var package_json = require('../package.json'+''); // relative to html root
		var conf = require('ocore/conf.js');
		var applicationsDir = process.env.HOME + '/.local/share/applications';
		var mimeDir = process.env.HOME + '/.local/share/mime';
		fileSystemService.recursiveMkdir(applicationsDir, parseInt('700', 8), function(err){
			console.log('mkdir applications: '+err);
			fs.writeFile(applicationsDir + '/' +conf.program+'.desktop', "[Desktop Entry]\n\
Type=Application\n\
Version=1.0\n\
Name="+conf.program[0].toUpperCase() + conf.program.slice(1)+"\n\
Comment="+package_json.description+"\n\
Exec="+execPath.replace(/ /g, '\\ ')+" %u\n\
Icon="+ iconPath +"\n\
Terminal=false\n\
Categories=Office;Finance;\n\
MimeType=x-scheme-handler/"+conf.program+";application/x-"+conf.program+";x-scheme-handler/"+conf.program+";application/x-"+conf.program+";\n\
X-Ubuntu-Touch=true\n\
X-Ubuntu-StageHint=SideStage\n", {mode: parseInt('755', 8)}, function(err){
				if (err)
					throw Error("failed to write desktop file: "+err);
				child_process.exec('update-desktop-database '+applicationsDir, function(err){
					if (err)
						throw Error("failed to exec update-desktop-database: "+err);
					var writeXml = function() {
						fs.writeFile(mimeDir + '/packages/' + conf.program+'.xml', "<?xml version=\"1.0\"?>\n\
	 <mime-info xmlns='http://www.freedesktop.org/standards/shared-mime-info'>\n\
	   <mime-type type=\"application/x-"+conf.program+"\">\n\
	   <comment>Obyte Private Coin</comment>\n\
	   <glob pattern=\"*."+configService.privateTextcoinExt+"\"/>\n\
	  </mime-type>\n\
	 </mime-info>\n", {mode: parseInt('755', 8)}, function(err) {
	 						if (err)
								throw Error("failed to write MIME config file: "+err);
							child_process.exec('update-mime-database '+mimeDir, function(err){
								if (err)
									throw Error("failed to exec update-mime-database: "+err);
								child_process.exec('xdg-icon-resource install --context mimetypes --size 64 '+path.dirname(execPath)+'/public/img/icons/logo-circle-64.png application-x-'+conf.program, function(err){});
							});
	 						console.log(".desktop done");
	 					});
					};
					if (!fs.existsSync(mimeDir + '/packages')) {
						fileSystemService.recursiveMkdir(mimeDir + '/packages', parseInt('755', 8), function(err){
							writeXml();
						});
					}
					else
						writeXml();
				});
			});
		});

	}
	
	if (electron) {
		var removeListenerForOnopen = $rootScope.$on('Local/BalanceUpdatedAndWalletUnlocked', function(){
			removeListenerForOnopen();
			electron.ipcRenderer.on('open', (event, message) => {
				console.log("Open url: " + message);
				if (message){
					var file = extractObyteArgFromCommandLine(message);
					if (!file)
						return console.log("no protocol for this app instance / network was found in url");
					handleUri(file);
				}
			});
			electron.ipcRenderer.send('done-loading');
		});
		if (process.platform === 'linux'){
			// wait till the wallet fully loads
			var removeRegListener = $rootScope.$on('Local/BalanceUpdated', function(){
				setTimeout(function(){
					createLinuxDesktopFile();
				}, 200);
				removeRegListener();
			});
		}
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
	setTimeout(function(){
		console.log("saving open url "+url);
		window.open_url = url;
	},0);
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