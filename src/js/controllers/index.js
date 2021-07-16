'use strict';

var async = require('async');
var constants = require('ocore/constants.js');
var mutex = require('ocore/mutex.js');
var eventBus = require('ocore/event_bus.js');
var objectHash = require('ocore/object_hash.js');
var ecdsaSig = require('ocore/signature.js');
var breadcrumbs = require('ocore/breadcrumbs.js');
var Bitcore = require('bitcore-lib');
var EventEmitter = require('events').EventEmitter;

angular.module('copayApp.controllers').controller('indexController', function($rootScope, $scope, $log, $filter, $timeout, lodash, go, profileService, configService, isCordova, storageService, addressService, gettext, gettextCatalog, amMoment, nodeWebkit, addonManager, txFormatService, uxLanguage, $state, isMobile, addressbookService, notification, animationService, $modal, bwcService, backButton, pushNotificationsService, aliasValidationService, bottomBarService) {
  breadcrumbs.add('index.js');
  var self = this;
  self.BLACKBYTES_ASSET = constants.BLACKBYTES_ASSET;
  self.isCordova = isCordova;
  self.isSafari = isMobile.Safari();
  self.isMobile = isMobile;
  self.onGoingProcess = {};
  self.historyShowLimit = 10;
  self.updatingTxHistory = {};
  self.bSwipeSuspended = false;
  self.assetsSet = {};
  self.arrBalances = [];
  self.assetIndex = 0;
  self.$state = $state;
  self.usePushNotifications = isCordova && !isMobile.Windows();
  
  self.totalUSDBalance = 0;
  self.isBackupReminderShown = false;

  self.calculateTotalUsdBalance = function () {
	var exchangeRates = require('ocore/network.js').exchangeRates;
	var totalUSDBalance = 0;
	
	for (var i = 0; i < self.arrBalances.length; i++){
	  var balance = self.arrBalances[i];
	  var completeBalance = (balance.total + (balance.shared || 0))
	  if (!balance.pending && balance.asset === 'base' && exchangeRates.GBYTE_USD && balance.total) {
		totalUSDBalance += completeBalance / 1e9 * exchangeRates.GBYTE_USD;
	  } else if (!balance.pending && balance.asset === self.BLACKBYTES_ASSET && exchangeRates.GBB_USD && balance.total) {
		totalUSDBalance += completeBalance / 1e9 * exchangeRates.GBB_USD;
	  } else if (!balance.pending && exchangeRates[balance.asset + '_USD'] && balance.total) {
		totalUSDBalance += completeBalance / Math.pow(10, balance.decimals || 0) * exchangeRates[balance.asset + '_USD'];
	  }
	}

	self.totalUSDBalance = totalUSDBalance;
  }

  $timeout(function () {
	self.backupExceedingAmountUSD = configService.backupExceedingAmountUSD;
	self.isBackupReminderShown = !configService.getSync().isBackupReminderShutUp;
  }, 60 * 1000);

  self.changeWalletAssetIndex = function (assetIndex) {
	self.assetIndex = assetIndex;
	self.updateHistory();
  }

  self.dismissBackupReminder = function () {
	self.isBackupReminderShown = false;
	$timeout(function () {
	  self.isBackupReminderShown = true;
	}, 86400 * 1000)
  }

  self.shutupBackupReminder = function () {
	self.isBackupReminderShown = false;
	configService.set({ isBackupReminderShutUp: true }, function(err) {
	  if (err) {
		$log.debug(err);
	  }
	});
  }

	/*
	console.log("process", process.env);
	var os = require('os');
	console.log("os", os);
	//console.log("os homedir="+os.homedir());
	console.log("release="+os.release());
	console.log("hostname="+os.hostname());
	//console.log(os.userInfo());
	*/

	
	function updatePublicKeyRing(walletClient, onDone){
		var walletDefinedByKeys = require('ocore/wallet_defined_by_keys.js');
		walletDefinedByKeys.readCosigners(walletClient.credentials.walletId, function(arrCosigners){
			var arrApprovedDevices = arrCosigners.
				filter(function(cosigner){ return cosigner.approval_date; }).
				map(function(cosigner){ return cosigner.device_address; });
			console.log("approved devices: "+arrApprovedDevices.join(", "));
			walletClient.credentials.addPublicKeyRing(arrApprovedDevices);
			
			// save it to profile
			var credentialsIndex = lodash.findIndex(profileService.profile.credentials, {walletId: walletClient.credentials.walletId});
			if (credentialsIndex < 0)
				throw Error("failed to find our credentials in profile");
			profileService.profile.credentials[credentialsIndex] = JSON.parse(walletClient.export());
			storageService.storeProfile(profileService.profile, function(){
				if (onDone)
					onDone();
			});
		});
	}
	
	function sendBugReport(error_message, error_object){
		var conf = require('ocore/conf.js');
		var network = require('ocore/network.js');
		var bug_sink_url = conf.WS_PROTOCOL + (conf.bug_sink_url || configService.getSync().hub);
		network.findOutboundPeerOrConnect(bug_sink_url, function(err, ws){
			if (err)
				return;
			breadcrumbs.add('bugreport');
			var description = error_object.stack || JSON.stringify(error_object, null, '\t');
			if (error_object.bIgnore)
				description += "\n(ignored)";
			description += "\n\nBreadcrumbs:\n"+breadcrumbs.get().join("\n")+"\n\n";
			description += "UA: "+navigator.userAgent+"\n";
			description += "Language: "+(navigator.userLanguage || navigator.language)+"\n";
			description += "Program: "+conf.program+' '+conf.program_version+' '+(conf.bLight ? 'light' : 'full')+" #"+window.commitHash+"\n";
			network.sendJustsaying(ws, 'bugreport', {message: error_message, exception: description});
		});
	}
	
	self.sendBugReport = sendBugReport;
	
	if (isCordova && constants.version === '1.0'){
		var db = require('ocore/db.js');
		db.query("SELECT 1 FROM units WHERE version!=? LIMIT 1", [constants.version], function(rows){
			if (rows.length > 0){
				self.showErrorPopup("Looks like you have testnet data.  Please remove the app and reinstall.", function() {
					if (navigator && navigator.app) // android
						navigator.app.exitApp();
					// ios doesn't exit
				});
			}
		});
	}

	if (isCordova && isMobile.iOS() && (typeof Keyboard !== "undefined")) {
		Keyboard.hideFormAccessoryBar(false);
	}
	
	eventBus.on('nonfatal_error', function(error_message, error_object) {
		console.log('nonfatal error stack', error_object.stack);
		error_object.bIgnore = true;
		sendBugReport(error_message, error_object);
	});
	
	eventBus.on('uncaught_error', function(error_message, error_object) {
		if (error_message.indexOf('ECONNREFUSED') >= 0 || error_message.indexOf('host is unreachable') >= 0){
			$rootScope.$emit('Local/ShowAlert', "Error connecting to TOR", 'fi-alert', function() {
				go.path('preferencesGlobal.preferencesTor');
			});
			return;
		}
		if (error_message.indexOf('ttl expired') >= 0 || error_message.indexOf('general SOCKS server failure') >= 0) // TOR error after wakeup from sleep
			return;
		console.log('stack', error_object.stack);
		sendBugReport(error_message, error_object);
		if (error_object && error_object.bIgnore)
			return;
		self.showErrorPopup(error_message, function() {
			var db = require('ocore/db.js');
			db.close();
			if (self.isCordova && navigator && navigator.app) // android
				navigator.app.exitApp();
			else if (process.exit) // nwjs
				process.exit();
			// ios doesn't exit
		});
		if(isCordova) wallet.showCompleteClient();
	});

	eventBus.on('alert_error', function(msg){
		$rootScope.$emit("Local/ShowErrorAlert", msg);
	});
	
  function readLastTimestamp(cb) {
	var db = require('ocore/db.js');
	var data_feeds = require('ocore/data_feeds.js');
	db.query("SELECT timestamp FROM units WHERE is_free=1 AND is_on_main_chain=1 ORDER BY timestamp DESC LIMIT 1", function (rows) {
	  if (rows.length === 0)
		return cb(0);
	  var timestamp = rows[0].timestamp;
	  if (timestamp)
		return cb(timestamp*1000);
	  data_feeds.readDataFeedValue([configService.TIMESTAMPER_ADDRESS], 'timestamp', null, 0, 1e15, false, 'last', function (objResult) {
		cb(objResult.value ? parseInt(objResult.value) : 0);
	  });
	});
  }

	function readLastDateString(cb){
		var conf = require('ocore/conf.js');
		if (conf.storage !== 'sqlite')
			return cb();
		readLastTimestamp(function(ts){
	  if (!ts)
		return cb();
	  cb('at '+$filter('date')(ts, 'short'));
		});
	}
	
	function readSyncPercent(cb){
		var db = require('ocore/db.js');
		db.query("SELECT COUNT(1) AS count_left FROM catchup_chain_balls", function(rows){
			var count_left = rows[0].count_left;
			if (count_left === 0)
				return cb("0%");
			if (catchup_balls_at_start === -1)
				catchup_balls_at_start = count_left;
			var percent = ((catchup_balls_at_start - count_left) / catchup_balls_at_start * 100).toFixed(3);
			cb(percent+'%');
		});
	}
	
	function readSyncProgress(cb){
		readLastDateString(function(strProgress){
			strProgress ? cb(strProgress) : readSyncPercent(cb);
		});
	}
	
	function setSyncProgress(){
		readSyncProgress(function(strProgress){
			self.syncProgress = strProgress;
			$timeout(function() {
				$rootScope.$apply();
			});
		});
	}

	eventBus.on('rates_updated', function(){
	self.calculateTotalUsdBalance();
		$timeout(function() {
			$rootScope.$apply();
		});
	});
	eventBus.on('started_db_upgrade', function(bLongUpgrade){
		$timeout(function() {
			if (self.bUpgradingDb === undefined)
				self.bUpgradingDb = true;
	  self.bLongUpgrade = bLongUpgrade;
	  $rootScope.$apply();
		}, 100);
	});
	eventBus.on('finished_db_upgrade', function(){
		$timeout(function() {
			self.bUpgradingDb = false;
			$rootScope.$apply();
		});
	});
	
	var catchup_balls_at_start = -1;
	eventBus.on('catching_up_started', function(){
		self.setOngoingProcess('Syncing', true);
		setSyncProgress();
	});
	eventBus.on('catchup_next_hash_tree', function(){
		setSyncProgress();
	});
	eventBus.on('catching_up_done', function(){
		catchup_balls_at_start = -1;
		self.setOngoingProcess('Syncing', false);
		self.syncProgress = "";
	});
	eventBus.on('unhandled_private_payments_left', function(count_left){ // light only
		var bChanged = (self.count_unhandled_private_payments !== count_left);
		self.count_unhandled_private_payments = count_left;
		if (bChanged)
			self.setOngoingProcess('handling_private', count_left>0);
	});
	eventBus.on('refresh_light_started', function(){
		console.log('refresh_light_started');
		self.setOngoingProcess('Syncing', true);
	});
	eventBus.on('refresh_light_done', function(){
		console.log('refresh_light_done');
		self.setOngoingProcess('Syncing', false);
	});
	
	eventBus.on("confirm_on_other_devices", function(){
		$rootScope.$emit('Local/ShowAlert', gettextCatalog.getString("Transaction created.\nPlease approve it on the other devices."), 'fi-key', function(){
			go.walletHome();
		});
	});
	eventBus.on("confirm_contract_deposit", function(){
		$rootScope.$emit('Local/ShowAlert', gettextCatalog.getString("Please approve contract fees deposit on the other devices."), 'fi-key', function(){
			go.walletHome();
		});
	});
	eventBus.on("confirm_contract_sign", function(){
		$rootScope.$emit('Local/ShowAlert', gettextCatalog.getString("Please approve contract signing on the other devices."), 'fi-key', function(){
			go.walletHome();
		});
	});
	eventBus.on("confirm_contract_claim", function(){
		$rootScope.$emit('Local/ShowAlert', gettextCatalog.getString("Please approve claiming from the contract on the other devices."), 'fi-key', function(){
			go.walletHome();
		});
	});

	eventBus.on("refused_to_sign", function(device_address){
		var device = require('ocore/device.js');
		device.readCorrespondent(device_address, function(correspondent){
			notification.success(gettextCatalog.getString('Refused'), correspondent.name + " refused to sign the transaction");
		});
	});

	/*
	eventBus.on("transaction_sent", function(){
		self.updateAll();
		self.updateTxHistory();
	});*/

	eventBus.on("new_my_transactions", function(){
		breadcrumbs.add('new_my_transactions');
		self.updateAll();
		self.updateTxHistory();
	});

	eventBus.on("my_transactions_became_stable", function(){
		breadcrumbs.add('my_transactions_became_stable');
		self.updateAll();
		self.updateTxHistory();
	});

	eventBus.on("maybe_new_transactions", function(){
		breadcrumbs.add('maybe_new_transactions');
		self.updateAll();
		self.updateTxHistory();
	});

	eventBus.on("wallet_approved", function(walletId, device_address){
		console.log("wallet_approved "+walletId+" by "+device_address);
		var client = profileService.walletClients[walletId];
		if (!client) // already deleted (maybe declined by another device) or not present yet
			return;
		var walletName = client.credentials.walletName;
		updatePublicKeyRing(client);
		var device = require('ocore/device.js');
		device.readCorrespondent(device_address, function(correspondent){
			notification.success(gettextCatalog.getString('Success'), "Account "+walletName+" approved by "+correspondent.name);
		});
	});

	eventBus.on("wallet_declined", function(walletId, device_address){
		var client = profileService.walletClients[walletId];
		if (!client) // already deleted (maybe declined by another device)
			return;
		var walletName = client.credentials.walletName;
		var device = require('ocore/device.js');
		device.readCorrespondent(device_address, function(correspondent){
			notification.info(gettextCatalog.getString('Declined'), "Account "+walletName+" declined by "+(correspondent ? correspondent.name : 'peer'));
		});
		profileService.deleteWallet({client: client}, function(err) {
			if (err)
				console.log(err);
		});
	});

	eventBus.on("wallet_completed", function(walletId){
		console.log("wallet_completed "+walletId);
		var client = profileService.walletClients[walletId];
		if (!client) // impossible
			return;
		var walletName = client.credentials.walletName;
		updatePublicKeyRing(client, function(){
			if (!client.isComplete())
				throw Error("not complete");
			notification.success(gettextCatalog.getString('Success'), "Account "+walletName+" is ready");
			$rootScope.$emit('Local/WalletCompleted');
		});
	});

	$rootScope.$on('process_status_change', function(event, process_name, isEnabled){
		self.setOngoingProcess(process_name, isEnabled);
	});
	
	// in arrOtherCosigners, 'other' is relative to the initiator
	eventBus.on("create_new_wallet", function(walletId, arrWalletDefinitionTemplate, arrDeviceAddresses, walletName, arrOtherCosigners, isSingleAddress){
		var device = require('ocore/device.js');
		var walletDefinedByKeys = require('ocore/wallet_defined_by_keys.js');
		device.readCorrespondentsByDeviceAddresses(arrDeviceAddresses, function(arrCorrespondentInfos){
			// my own address is not included in arrCorrespondentInfos because I'm not my correspondent
			var arrNames = arrCorrespondentInfos.map(function(correspondent){ return correspondent.name; });
			var name_list = arrNames.join(", ");
			var question = gettextCatalog.getString('Create new account') + ' ' + walletName + ' ' + gettextCatalog.getString('together with') + ' ' + name_list + ' ?';
			requestApproval(question, {
				ifYes: function(){
					console.log("===== YES CLICKED")
					var createNewWallet = function(){
						walletDefinedByKeys.readNextAccount(function(account){
							var walletClient = bwcService.getClient();
							if (!profileService.focusedClient.credentials.xPrivKey)
								throw Error("no profileService.focusedClient.credentials.xPrivKeyin createNewWallet");
							walletClient.seedFromExtendedPrivateKey(profileService.focusedClient.credentials.xPrivKey, account);
							//walletClient.seedFromMnemonic(profileService.profile.mnemonic, {account: account});
							walletDefinedByKeys.approveWallet(
								walletId, walletClient.credentials.xPubKey, account, arrWalletDefinitionTemplate, arrOtherCosigners, 
								function(){
									walletClient.credentials.walletId = walletId;
									walletClient.credentials.network = 'livenet';
									var n = arrDeviceAddresses.length;
									var m = arrWalletDefinitionTemplate[1].required || n;
									walletClient.credentials.addWalletInfo(walletName, m, n);
									updatePublicKeyRing(walletClient);
									profileService._addWalletClient(walletClient, {}, function(){
										if (isSingleAddress) {
											profileService.setSingleAddressFlag(true);
										}
										console.log("switched to newly approved account "+walletId);
									});
								}
							);
						});
					};
					if (profileService.focusedClient.credentials.xPrivKey)
						createNewWallet();
					else
						profileService.insistUnlockFC(null, createNewWallet);
				},
				ifNo: function(){
					console.log("===== NO CLICKED")
					walletDefinedByKeys.cancelWallet(walletId, arrDeviceAddresses, arrOtherCosigners);
				}
			});
		});
	});
	
	// units that were already approved or rejected by user.
	// if there are more than one addresses to sign from, we won't pop up confirmation dialog for each address, instead we'll use the already obtained approval
	var assocChoicesByUnit = {};

	// objAddress is local wallet address, top_address is the address that requested the signature, 
	// it may be different from objAddress if it is a shared address
	eventBus.on("signing_request", function(objAddress, top_address, objUnit, assocPrivatePayloads, from_address, signing_path){		
		var bbWallet = require('ocore/wallet.js');
		var walletDefinedByKeys = require('ocore/wallet_defined_by_keys.js');
		var unit = objUnit.unit;
		var credentials = lodash.find(profileService.profile.credentials, {walletId: objAddress.wallet});

		mutex.lock(["signing_request-"+unit], function(unlock){
			function createAndSendSignature(){
				var coin = "0";
				var path = "m/44'/" + coin + "'/" + objAddress.account + "'/"+objAddress.is_change+"/"+objAddress.address_index;
				console.log("path "+path);
				// focused client might be different from the wallet this signature is for, but it doesn't matter as we have a single key for all wallets
				if (profileService.focusedClient.isPrivKeyEncrypted()){
					console.log("priv key is encrypted, will be back after password request");
					return profileService.insistUnlockFC(null, function(){
						createAndSendSignature();
					});
				}
				var xPrivKey = new Bitcore.HDPrivateKey.fromString(profileService.focusedClient.credentials.xPrivKey);
				var privateKey = xPrivKey.derive(path).privateKey;
				console.log("priv key:", privateKey);
				//var privKeyBuf = privateKey.toBuffer();
				var privKeyBuf = privateKey.bn.toBuffer({size:32}); // https://github.com/bitpay/bitcore-lib/issues/47
				console.log("priv key buf:", privKeyBuf);
				var buf_to_sign = objectHash.getUnitHashToSign(objUnit);
				var signature = ecdsaSig.sign(buf_to_sign, privKeyBuf);
				bbWallet.sendSignature(from_address, buf_to_sign.toString("base64"), signature, signing_path, top_address);
				console.log("sent signature "+signature);
				unlock();
			}
			
			function refuseSignature(){
				var buf_to_sign = objectHash.getUnitHashToSign(objUnit);
				bbWallet.sendSignature(from_address, buf_to_sign.toString("base64"), "[refused]", signing_path, top_address);
				console.log("refused signature");
				unlock();
			}
			
			// apply the previously obtained decision. 
			// Unless the priv key is encrypted in which case the password request would have appeared from nowhere
			if (assocChoicesByUnit[unit]){
				if (assocChoicesByUnit[unit] === "approve")
					createAndSendSignature();
				else if (assocChoicesByUnit[unit] === "refuse")
					refuseSignature();
				return;
			}
			
			if (objUnit.signed_message){
				var question = gettextCatalog.getString('Sign message') + ' ' + objUnit.signed_message + ' ' + gettextCatalog.getString('by address') + ' ' + objAddress.address+'?';
				requestApproval(question, {
					ifYes: function(){
						createAndSendSignature();
					},
					ifNo: function(){
						// do nothing
						console.log("===== NO CLICKED");
						refuseSignature();
					}
				});
				return;
			}
			
			walletDefinedByKeys.readChangeAddresses(objAddress.wallet, function(arrChangeAddressInfos){
				var arrAuthorAddresses = objUnit.authors.map(function(author){ return author.address; });
				var arrChangeAddresses = arrChangeAddressInfos.map(function(info){ return info.address; });
				arrChangeAddresses = arrChangeAddresses.concat(arrAuthorAddresses);
				arrChangeAddresses.push(top_address);
				var arrPaymentMessages = objUnit.messages.filter(function(objMessage){ return (objMessage.app === "payment"); });
				if (arrPaymentMessages.length === 0)
					throw Error("no payment message found");
				var assocAmountByAssetAndAddress = {};
				// exclude outputs paying to my change addresses
				async.eachSeries(
					arrPaymentMessages,
					function(objMessage, cb){
						var payload = objMessage.payload;
						if (!payload)
							payload = assocPrivatePayloads[objMessage.payload_hash];
						if (!payload)
							throw Error("no inline payload and no private payload either, message="+JSON.stringify(objMessage));
						var asset = payload.asset || "base";
						if (!payload.outputs)
							throw Error("no outputs");
						if (!assocAmountByAssetAndAddress[asset])
							assocAmountByAssetAndAddress[asset] = {};
						payload.outputs.forEach(function(output){
							if (arrChangeAddresses.indexOf(output.address) === -1){
								if (!assocAmountByAssetAndAddress[asset][output.address])
									assocAmountByAssetAndAddress[asset][output.address] = 0;
								assocAmountByAssetAndAddress[asset][output.address] += output.amount;
							}
						});
						cb();
					},
					function(){
						var config = configService.getSync().wallet.settings;
						
						var arrDestinations = [];
						for (var asset in assocAmountByAssetAndAddress){
							var formatted_asset = asset.substr(0, 8) + '...';
							var currency = "of asset "+formatted_asset;
							var assetInfo = profileService.assetMetadata[asset];
							if (asset === 'base')
								currency = config.unitName;
							else if(asset === constants.BLACKBYTES_ASSET)
								currency = config.bbUnitName;
							else if (assetInfo && assetInfo.name)
								currency = assetInfo.name;
							for (var address in assocAmountByAssetAndAddress[asset]){
								var formatted_amount = profileService.formatAmount(assocAmountByAssetAndAddress[asset][address], asset);
								arrDestinations.push(formatted_amount + " " + currency + " to " + address);
							}
						}
						function getQuestion(){
							if (arrDestinations.length === 0){
								var arrDataMessages = objUnit.messages.filter(function(objMessage){ return (objMessage.app === "profile" || objMessage.app === "attestation" || objMessage.app === "data" || objMessage.app === 'data_feed'); });
								if (arrDataMessages.length > 0){
									var message = arrDataMessages[0]; // can be only one
									var payload = message.payload;
									var obj = (message.app === 'attestation') ? payload.profile : payload;
									var arrPairs = [];
									for (var field in obj)
										arrPairs.push(field+": "+obj[field]);
									var nl = "\n";
									var list = arrPairs.join(nl)+nl;
									if (message.app === 'profile' || message.app === 'data' || message.app === 'data_feed')
										return 'Sign '+message.app.replace('_', ' ')+' '+nl+list+'from account '+credentials.walletName+'?';
									if (message.app === 'attestation')
										return 'Sign transaction attesting '+payload.address+' as '+nl+list+'from account '+credentials.walletName+'?';
								}
							}
							var dest = (arrDestinations.length > 0) ? arrDestinations.join(", ") : "to myself";
							return 'Sign transaction spending '+dest+' from account '+credentials.walletName+'?';
						}
						var question = getQuestion();
						var ask = function() {
							requestApproval(question, {
								ifYes: function(){
									assocChoicesByUnit[unit] = "approve";
									createAndSendSignature();
								},
								ifNo: function(){
									// do nothing
									assocChoicesByUnit[unit] = "refuse";
									console.log("===== NO CLICKED");
									refuseSignature();
								}
							});
						}
						// prosaic/arbiter contracts related requests
						var db = require('ocore/db.js');
						var prosaic_contract = require('ocore/prosaic_contract.js');
						var arbiter_contract = require('ocore/arbiter_contract.js');
						function isContractSignRequest(cb) {
							var arrDataMessages = objUnit.messages.filter(function(objMessage){ return (objMessage.app === "data");});
							if (arrDataMessages.length > 0 && arrDataMessages[0].payload["contract_text_hash"]){
								var contract_hash = arrDataMessages[0].payload["contract_text_hash"];
								var contract;
								async.series([function(cb){
									prosaic_contract.getByHash(contract_hash, function(objContract) {
										if (!objContract)
											return cb();
										contract = objContract;
										var arrDataMessages = objUnit.messages.filter(function(objMessage){ return objMessage.app === "data"});
										if (!objContract || objContract.status !== "accepted" || objContract.unit || arrDataMessages.length !== 1 || arrPaymentMessages.length !== 1 || arrPaymentMessages[0].payload.outputs.length !== 1 || Object.keys(arrDataMessages[0].payload).length > 1)
											return cb();
										var shared_address;
										async.series([function(cb){
											var shared_author = lodash.find(objUnit.authors, function(author){
												try {
													return author.definition[0] === "and" && author.definition[1][0][0] === "address" && author.definition[1][1][0] === "address";
												} catch (e) {
													return false;
												}
											});
											if (shared_author)
												shared_address = shared_author.address;
											cb();
										}, function(cb){
											if (shared_address)
												return cb();
											db.query("SELECT definition FROM shared_addresses WHERE shared_address=?", [arrPaymentMessages[0].payload.outputs[0].address], function(rows){
												if (!rows || !rows.length)
													return cb();
												var definition = JSON.parse(rows[0].definition);
												try {
													if (definition[0] === "and" && definition[1][0][0] === "address" && definition[1][1][0] === "address")
														shared_address = arrPaymentMessages[0].payload.outputs[0].address;
													cb();
												} catch (e) {
													cb();
												}
											});
										}], function() {
											if (!shared_address || shared_address !== arrPaymentMessages[0].payload.outputs[0].address || !lodash.includes(arrAuthorAddresses, shared_address))
												return cb();
											return cb('prosaic', contract);
										});
									});
								}, function(cb) {
									arbiter_contract.getByHash(contract_hash, function(objContract) {
										if (!objContract)
											return cb();
										contract = objContract;
										var arrDataMessages = objUnit.messages.filter(function(objMessage){ return objMessage.app === "data"});
										if (!objContract || objContract.status !== "accepted" || objContract.unit || arrDataMessages.length !== 1 || arrPaymentMessages.length !== 1 || arrPaymentMessages[0].payload.outputs.length !== 2 || Object.keys(arrDataMessages[0].payload).length > 2)
											return cb();
										var shared_address;
										async.series([function(cb){
											var shared_author = lodash.find(objUnit.authors, function(author){
												try {
													return author.definition[1][0][0] === "and" && author.definition[1][0][1][0][0] === "address" && author.definition[1][0][1][1][0] === "address";
												} catch (e) {
													return false;
												}
											});
											if (shared_author)
												shared_address = shared_author.address;
											cb();
										}, function(cb){
											if (shared_address)
												return cb();
											db.query("SELECT definition FROM shared_addresses WHERE shared_address=?", [arrPaymentMessages[0].payload.outputs[0].address], function(rows){
												if (!rows || !rows.length)
													return cb();
												var definition = JSON.parse(rows[0].definition);
												try {
													if (definition[1][0][0] === "and" && definition[1][0][1][0][0] === "address" && definition[1][0][1][1][0] === "address")
														shared_address = arrPaymentMessages[0].payload.outputs[0].address;
													cb();
												} catch (e) {
													cb();
												}
											});
										}], function() {
											var possible_contract_output = lodash.find(arrPaymentMessages[0].payload.outputs, function(o){return o.amount==arbiter_contract.CHARGE_AMOUNT});
											if (!possible_contract_output) 
												return cb();
											if (!shared_address || shared_address !== possible_contract_output.address || !lodash.includes(arrAuthorAddresses, shared_address))
												return cb();
											return cb('arbiter', contract);
										});
									});
								}], function(type, results) {
									if (!type)
										return cb(false);
									for (var i = 0; i < results.length; i++)
										if (results[i])
											return cb(true, type, contract);
								});
							} else {
								return cb(false);
							}
						}
						function isContractFeeDepositRequest(cb) {
							var payment_msg = lodash.find(objUnit.messages, function(m){return m.app=="payment"});
							if (!payment_msg)
								return cb(false);
							var possible_contract_output = lodash.find(payment_msg.payload.outputs, function(o){return o.amount==prosaic_contract.CHARGE_AMOUNT || o.amount==arbiter_contract.CHARGE_AMOUNT});
							if (!possible_contract_output) 
								return cb(false);
							db.query("SELECT hash FROM prosaic_contracts WHERE prosaic_contracts.shared_address=? AND prosaic_contracts.status='accepted'\n\
								UNION SELECT hash FROM wallet_arbiter_contracts WHERE wallet_arbiter_contracts.shared_address=? AND wallet_arbiter_contracts.status='accepted'", [possible_contract_output.address, possible_contract_output.address], function(rows) {
								if (rows.length === 1) {
									async.series([function(cb2) {
										prosaic_contract.getByHash(rows[0].hash, function(objContract) {
											if (!objContract)
												return cb2();
											cb2(true, objContract);
										});
									}, function(cb2) {
										arbiter_contract.getByHash(rows[0].hash, function(objContract) {
											if (!objContract)
												return cb2();
											cb2(true, objContract);
										});
									}], cb);
								} else
									cb(false);
							});
						}
						function isContractDepositRequest(cb) {
							async.each(objUnit.messages, 
								function(message, cb) {
									if (message.app !== "payment")
										return cb();
									var payload = message.payload;
									if (!payload)
										payload = assocPrivatePayloads[message.payload_hash];
									async.each(payload.outputs, function(o, cb){
										db.query("SELECT hash FROM wallet_arbiter_contracts WHERE shared_address=? AND status='signed'", [o.address], function(rows) {
												if (!rows.length)
													return cb();
												arbiter_contract.getByHash(rows[0].hash, function(objContract) {
													var asset = objContract.asset || 'base';
													if (assocAmountByAssetAndAddress[asset] && objContract.amount == assocAmountByAssetAndAddress[asset][objContract.shared_address])
														return cb(objContract);
													cb();
												});
											});
									}, cb);
								}, function(objContract) {
									if (objContract)
										return cb(true, objContract)
									cb(false);
								}
							);
						}
						function isContractClaimOrReleaseRequest(cb) {
							async.each(objUnit.messages, 
								function(message, cb) {
									if (message.app!="payment")
										return cb();
									var payload = message.payload;
									if (!payload)
										payload = assocPrivatePayloads[message.payload_hash];
									if (!payload)
										return cb();
									arbiter_contract.getBySharedAddress(objUnit.authors[0].address, function(objContract) {
										if (!objContract)
											return cb();
										var asset = objContract.asset || 'base';
										if (assocAmountByAssetAndAddress[asset] && objContract.amount == assocAmountByAssetAndAddress[asset][objContract.my_address])
											cb({objContract: objContract, isClaim: true});
										else if (assocAmountByAssetAndAddress[asset] && objContract.amount == assocAmountByAssetAndAddress[asset][objContract.peer_address])
											cb({objContract: objContract, isClaim: false});
										else {
											cb();
										}
									});
								},
								function(result) {
									if (result) {
										return cb(true, result.objContract, result.isClaim);
									}
									cb(false);
								}
							);
						}
						isContractSignRequest(function(isContract, type, objContract){
							if (isContract) {
								if (type === 'prosaic') {
									question = "Sign prosaic contract ";
								} else {
									question = "Sign contract with arbitration ";
								}
								question += '"' + objContract.title + '" from account '+credentials.walletName+'?';
								return ask();
							}
							isContractFeeDepositRequest(function(isContract, objContract){
								if (isContract) {
									question = 'Approve contract '+(objContract ? '"' + objContract.title + '" ' : '')+'fee deposit from account '+credentials.walletName+'?';
									return ask();
								}
								isContractDepositRequest(function(isContract, objContract){
									if (isContract) {
										question = 'Approve contract '+(objContract ? '"' + objContract.title + '" ' : '')+'deposit from account '+credentials.walletName+'?';
										return ask();
									}
									isContractClaimOrReleaseRequest(function(isContract, objContract, isClaim){
										if (isContract) {
											question = 'Approve funds ' + (isClaim ? 'claim' : 'release') + ' from the contract '+(objContract ? '"' + objContract.title + '" ' : '')+'?';
											return ask();
										}
										ask();
									});
								});
							});
						});
					}
				); // eachSeries
			});
		});
	});
	
	var accept_msg = gettextCatalog.getString('Yes');
	var cancel_msg = gettextCatalog.getString('No');
	var confirm_msg = gettextCatalog.getString('Confirm');

	var _modalRequestApproval = function(question, callbacks) {
	  var ModalInstanceCtrl = function($scope, $modalInstance, $sce, gettext) {
		$scope.title = question;
		$scope.yes_icon = 'fi-check';
		$scope.yes_button_class = 'primary';
		$scope.cancel_button_class = 'warning';
		$scope.cancel_label = 'No';
		$scope.loading = false;

		$scope.ok = function() {
		  $scope.loading = true;
		  $modalInstance.close(accept_msg);
		};
		$scope.cancel = function() {
		  $modalInstance.dismiss(cancel_msg);
		};
	  };

	  var modalInstance = $modal.open({
		templateUrl: 'views/modals/confirmation.html',
		windowClass: animationService.modalAnimated.slideUp,
		controller: ModalInstanceCtrl
	  });

	  modalInstance.result.finally(function() {
		var m = angular.element(document.getElementsByClassName('reveal-modal'));
		m.addClass(animationService.modalAnimated.slideOutDown);
	  });

	  modalInstance.result.then(callbacks.ifYes, callbacks.ifNo);
	};

	var requestApproval = function(question, callbacks) {
	  if (isCordova) {
		navigator.notification.confirm(
		  question,
		  function(buttonIndex) {
			if (buttonIndex == 1)
				callbacks.ifYes();
			else
				callbacks.ifNo();
		  },
		  confirm_msg, [accept_msg, cancel_msg]
		);
	  } else {
		_modalRequestApproval(question, callbacks);
	  }
	};
	self.requestApproval = requestApproval;
	

	
  self.openSubwalletModal = function() {
	$rootScope.modalOpened = true;
	var fc = profileService.focusedClient;

	var ModalInstanceCtrl = function($scope, $modalInstance) {
	var hiddenSubWallets = self.getCurrentWalletHiddenSubWallets();
		$scope.color = fc.backgroundColor;
		$scope.indexCtl = self;
		var arrSharedWallets = [];
		$scope.mainWalletBalanceInfo = self.arrMainWalletBalances[self.assetIndex];
		$scope.asset = $scope.mainWalletBalanceInfo.asset;
		var asset = $scope.asset;
		var assetInfo = self.arrBalances[self.assetIndex];
		var assocSharedByAddress = assetInfo.assocSharedByAddress;
		for (var sa in assocSharedByAddress) {
		  if(hiddenSubWallets[sa]) continue;
		  
			var objSharedWallet = {};
			objSharedWallet.shared_address = sa;
			objSharedWallet.total = assocSharedByAddress[sa];
			if (asset === 'base' || asset === constants.BLACKBYTES_ASSET || $scope.mainWalletBalanceInfo.name)
				objSharedWallet.totalStr = profileService.formatAmountWithUnit(assocSharedByAddress[sa], asset);
			arrSharedWallets.push(objSharedWallet);
		}
		$scope.arrSharedWallets = arrSharedWallets;
		var walletDefinedByAddresses = require('ocore/wallet_defined_by_addresses.js');
		async.eachSeries(
			arrSharedWallets,
			function(objSharedWallet, cb){
				walletDefinedByAddresses.readSharedAddressCosigners(objSharedWallet.shared_address, function(cosigners){
					objSharedWallet.shared_address_cosigners = cosigners.map(function(cosigner){ return cosigner.name; }).join(", ");
					objSharedWallet.creation_ts = cosigners[0].creation_ts;
					cb();
				});
			},
			function(){
				arrSharedWallets.sort(function(o1, o2){ return (o2.creation_ts - o1.creation_ts); });
				$timeout(function(){
					$scope.$apply();
				});
			}
		);

		$scope.cancel = function() {
			breadcrumbs.add('openSubwalletModal cancel');
			$modalInstance.dismiss('cancel');
	};
	
	$scope.getSubwalletBadge = function(shared_address) {
	  var totalCounts = 0;
	  if (shared_address) {
		for(var unit in $rootScope.newPaymentsDetails) {
		  if ($rootScope.newPaymentsDetails[unit].receivedAddress === shared_address) {
			totalCounts += $rootScope.newPaymentsCount[unit] || 0;
		  }
		}
	  } else {
		for (var unit in $rootScope.newPaymentsDetails) {
		  var details = $rootScope.newPaymentsDetails[unit];
		  if (details.walletId === self.walletId && details.walletAddress === details.receivedAddress) {
			totalCounts += $rootScope.newPaymentsCount[unit] || 0;
		  }
		}
	  }
		return totalCounts;
	}

		$scope.selectSubwallet = function(shared_address) {
			self.shared_address = shared_address;
			if (shared_address){
				walletDefinedByAddresses.determineIfHasMerkle(shared_address, function(bHasMerkle){
					self.bHasMerkle = bHasMerkle;
					walletDefinedByAddresses.readSharedAddressCosigners(shared_address, function(cosigners){
						self.shared_address_cosigners = cosigners.map(function(cosigner){ return cosigner.name; }).join(", ");
						$timeout(function(){
							$rootScope.$apply();
						});
					});
				});
			}
			else
				self.bHasMerkle = false;
			self.updateAll();
			self.updateTxHistory();
			$modalInstance.close();
		};
	};

	var modalInstance = $modal.open({
		templateUrl: 'views/modals/select-subwallet.html',
		windowClass: animationService.modalAnimated.slideUp,
		controller: ModalInstanceCtrl,
	});

	var disableCloseModal = $rootScope.$on('closeModal', function() {
		breadcrumbs.add('openSubwalletModal on closeModal');
		modalInstance.dismiss('cancel');
	});

	modalInstance.result.finally(function() {
		$rootScope.modalOpened = false;
		disableCloseModal();
		var m = angular.element(document.getElementsByClassName('reveal-modal'));
		m.addClass(animationService.modalAnimated.slideOutDown);
	});

  };
	
  self.getSigningDeviceAddresses = function(fc, exclude_self){
	var arrSigningDeviceAddresses = []; // empty list means that all signatures are required (such as 2-of-2)
	if (fc.credentials.m < fc.credentials.n)
	  self.copayers.forEach(function(copayer){
		if ((copayer.me && !exclude_self) || copayer.signs)
		  arrSigningDeviceAddresses.push(copayer.device_address);
	  });
	else if (self.shared_address)
	  arrSigningDeviceAddresses = self.copayers.map(function(copayer){ return copayer.device_address; });
	return arrSigningDeviceAddresses;
  }

  self.determineQRcodeVersionFromString = function( inputtext ) {
      // maximum characters per QR code version using ECC level m
      // source: http://www.qrcode.com/en/about/version.html
      var maxCharsforQRVersion = [0,14,26,42,62,84,106,122,152,180,213];
      var qrversion = 5;
      // find lowest version number that has enough space for our text
      for (var i = (maxCharsforQRVersion.length-1); i > 0 ; i--) {
          if ( maxCharsforQRVersion[i] >= inputtext.length)
          {
              qrversion = i;
          }
      }

      return qrversion;
  }

  self.goHome = function() {
	go.walletHome();
  };

  self.menu = [{
	'title': gettext('Home'),
	'icon': 'icon-home',
	'link': 'walletHome'
  }, {
	'title': gettext('Receive'),
	'icon': 'icon-receive2',
	'link': 'receive'
  }, {
	'title': gettext('Send'),
	'icon': 'icon-paperplane',
	'link': 'send'
  }, {
	'title': gettext('History'),
	'icon': 'icon-history',
	'link': 'history'
  }, {
	'title': gettext('Chat'),
	'icon': 'icon-bubble',
	'new_state': 'correspondentDevices',
	'link': 'chat'
  }];

  self.addonViews = addonManager.addonViews();
  self.menu = self.menu.concat(addonManager.addonMenuItems());
  self.menuItemSize = self.menu.length > 5 ? 2 : 3;
  self.txTemplateUrl = addonManager.txTemplateUrl() || 'views/includes/transaction.html';

  self.tab = 'walletHome';


  self.setOngoingProcess = function(processName, isOn) {
    $log.debug('onGoingProcess', processName, isOn);
    self[processName] = isOn;
    self.onGoingProcess[processName] = isOn;

    var name;
    self.anyOnGoingProcess = lodash.some(self.onGoingProcess, function(isOn, processName) {
      if (isOn)
        name = name || processName;
      return isOn;
    });
    // The first one
    self.onGoingProcessName = name;
    $timeout(function() {
      $rootScope.$apply();
    });
  };

  self.setFocusedWallet = function() {
	var fc = profileService.focusedClient;
	if (!fc) return;
	  
	breadcrumbs.add('setFocusedWallet '+fc.credentials.walletId);

	// Clean status
	self.totalBalanceBytes = null;
	self.lockedBalanceBytes = null;
	self.availableBalanceBytes = null;
	self.pendingAmount = null;

	self.totalBalanceStr = null;
	self.availableBalanceStr = null;
	self.lockedBalanceStr = null;

	self.assetsSet = {};
	self.arrBalances = [];
	self.assetIndex = 0;
	self.shared_address = null;
	self.bHasMerkle = false;

	self.txHistory = [];
	self.completeHistory = [];
	self.txProgress = 0;
	self.historyShowShowAll = false;
	self.balanceByAddress = null;
	self.pendingTxProposalsCountForUs = null;

	$timeout(function() {
		//$rootScope.$apply();
		self.hasProfile = true;
		self.noFocusedWallet = false;
		self.onGoingProcess = {};

		// Credentials Shortcuts
		self.m = fc.credentials.m;
		self.n = fc.credentials.n;
		self.network = fc.credentials.network;
		self.requiresMultipleSignatures = fc.credentials.m > 1;
		//self.isShared = fc.credentials.n > 1;
		self.walletName = fc.credentials.walletName;
		self.walletId = fc.credentials.walletId;
		self.isComplete = fc.isComplete();
		self.canSign = fc.canSign();
		self.isPrivKeyExternal = fc.isPrivKeyExternal();
		self.isPrivKeyEncrypted = fc.isPrivKeyEncrypted();
		self.externalSource = fc.getPrivKeyExternalSourceName();
		self.account = fc.credentials.account;

		self.txps = [];
		self.copayers = [];
		self.updateColor();
		self.updateAlias();
		self.updateSingleAddressFlag();
		self.setAddressbook();

		console.log("reading cosigners");
		var walletDefinedByKeys = require('ocore/wallet_defined_by_keys.js');
		walletDefinedByKeys.readCosigners(self.walletId, function(arrCosignerInfos){
			self.copayers = arrCosignerInfos;
			$timeout(function(){
				$rootScope.$digest();
			});
		});

		self.needsBackup = false;
		self.singleAddressWallet = false;
		self.openWallet();
		/*if (fc.isPrivKeyExternal()) {
			self.needsBackup = false;
			self.openWallet();
		} else {
			storageService.getBackupFlag('all', function(err, val) {
			  self.needsBackup = self.network == 'testnet' ? false : !val;
			  self.openWallet();
			});
		}*/
	});
  };


  self.setTab = function(tab, reset, tries, switchState) {
	console.log("setTab", tab, reset, tries, switchState);
	tries = tries || 0;

	var changeTab = function(tab) {
	  if (document.querySelector('.tab-in.tab-view')) {
		var el = angular.element(document.querySelector('.tab-in.tab-view'));
		el.removeClass('tab-in').addClass('tab-out');
		var old = document.getElementById('menu-' + self.tab);
		if (old) {
		  old.className = '';
		}
	  }

	  if (document.getElementById(tab)) {
		var el = angular.element(document.getElementById(tab));
		el.removeClass('tab-out').addClass('tab-in');
		var newe = document.getElementById('menu-' + tab);
		if (newe) {
		  newe.className = 'active';
		}
	  }

	  $rootScope.tab = self.tab = tab;
	  $rootScope.$emit('Local/TabChanged', tab);
	};

	// check if the whole menu item passed
	if (typeof tab == 'object') {
		if(!tab.new_state) backButton.clearHistory();
	  if (tab.open) {
		if (tab.link) {
		  $rootScope.tab = self.tab = tab.link;
		}
		tab.open();
		return;
	  } else if (tab.new_state) {
		changeTab(tab.link);
		$rootScope.tab = self.tab = tab.link;
		go.path(tab.new_state);
		return;
	  } else {
		return self.setTab(tab.link, reset, tries, switchState);
	  }
	}
	console.log("current tab "+self.tab+", requested to set tab "+tab+", reset="+reset);
	if (self.tab === tab && !reset)
	  return;

	if (!document.getElementById('menu-' + tab) && ++tries < 5) {
		console.log("will retry setTab later:", tab, reset, tries, switchState);
		return $timeout(function() {
			self.setTab(tab, reset, tries, switchState);
		}, (tries === 1) ? 10 : 300);
	}

	if (!self.tab || !$state.is('walletHome'))
	  $rootScope.tab = self.tab = 'walletHome';

	if (switchState && !$state.is('walletHome')) {
	  go.path('walletHome', function() {
		changeTab(tab);
	  });
	  return;
	}

	changeTab(tab);
  };






  self.updateAll = function(opts) {
	opts = opts || {};

	var fc = profileService.focusedClient;
	if (!fc) 
		return breadcrumbs.add('updateAll no fc');

	if (!fc.isComplete())
		return breadcrumbs.add('updateAll not complete yet');
	  
	// reconnect if lost connection
	var device = require('ocore/device.js');
	device.loginToHub();

	$timeout(function() {

		if (!opts.quiet)
			self.setOngoingProcess('updatingStatus', true);

		$log.debug('Updating Status:', fc.credentials.walletName);
		if (!opts.quiet)
			self.setOngoingProcess('updatingStatus', false);


		fc.getBalance(self.shared_address, function(err, assocBalances, assocSharedBalances) {
			if (err)
				throw "impossible getBal";
			$log.debug('updateAll Wallet Balance:', assocBalances, assocSharedBalances);
			self.setBalance(assocBalances, assocSharedBalances);
			// Notify external addons or plugins
			$rootScope.$emit('Local/BalanceUpdated', assocBalances);
			if (!self.isPrivKeyEncrypted)
				$rootScope.$emit('Local/BalanceUpdatedAndWalletUnlocked');
		});
		
		self.otherWallets = lodash.filter(profileService.getWallets(self.network), function(w) {
			return (w.id != self.walletId || self.shared_address);
		});


		//$rootScope.$apply();

		if (opts.triggerTxUpdate) {
			$timeout(function() {
				breadcrumbs.add('triggerTxUpdate');
				self.updateTxHistory();
			}, 1);
		}
	});
  };


  self.updateBalance = function() {
	var fc = profileService.focusedClient;
	$timeout(function() {
	  self.setOngoingProcess('updatingBalance', true);
	  $log.debug('Updating Balance');
	  fc.getBalance(self.shared_address, function(err, assocBalances, assocSharedBalances) {
		self.setOngoingProcess('updatingBalance', false);
		if (err)
			throw "impossible error from getBalance";
		$log.debug('updateBalance Wallet Balance:', assocBalances, assocSharedBalances);
		self.setBalance(assocBalances, assocSharedBalances);
	  });
	});
  };


	
  self.openWallet = function() {
	console.log("index.openWallet called");
	var fc = profileService.focusedClient;
	breadcrumbs.add('openWallet '+fc.credentials.walletId);
	$timeout(function() {
	  //$rootScope.$apply();
	  self.setOngoingProcess('openingWallet', true);
	  self.updateError = false;
	  fc.openWallet(function onOpenedWallet(err, walletStatus) {
		self.setOngoingProcess('openingWallet', false);
		if (err)
			throw "impossible error from openWallet";
		$log.debug('Wallet Opened');
		self.updateAll(lodash.isObject(walletStatus) ? {
		  walletStatus: walletStatus
		} : null);
		//$rootScope.$apply();
	  });
	});
  };



  self.processNewTxs = function(txs) {
	var config = configService.getSync().wallet.settings;
	var now = Math.floor(Date.now() / 1000);
	var ret = [];

	lodash.each(txs, function(tx) {
		tx = txFormatService.processTx(tx);

		// no future transactions...
		if (tx.time > now)
			tx.time = now;
		ret.push(tx);
	});

	return ret;
  };

  self.updateAlias = function() {
	var config = configService.getSync();
	config.aliasFor = config.aliasFor || {};
	self.alias = config.aliasFor[self.walletId];
	var fc = profileService.focusedClient;
	fc.alias = self.alias;
  };

  self.updateColor = function() {
	var config = configService.getSync();
	config.colorFor = config.colorFor || {};
	self.backgroundColor = config.colorFor[self.walletId] || '#4A90E2';
	var fc = profileService.focusedClient;
	fc.backgroundColor = self.backgroundColor;
  };

  self.updateSingleAddressFlag = function() {
	var config = configService.getSync();
	config.isSingleAddress = config.isSingleAddress || {};
	self.isSingleAddress = config.isSingleAddress[self.walletId];
	var fc = profileService.focusedClient;
	fc.isSingleAddress = self.isSingleAddress;
  };

  self.getCurrentWalletHiddenAssets = function () {
	var hiddenAssets = configService.getSync().hiddenAssets;
	var fc = profileService.focusedClient;
	var walletId = fc.credentials.walletId;
	if (hiddenAssets.hasOwnProperty(walletId)) {
	  return hiddenAssets[walletId];
	} else {
	  return {};
	}
  };
  
  self.getCurrentWalletHiddenSubWallets = function(){
	var configHiddenSubWallets = configService.getSync().hiddenSubWallets;
	var fc = profileService.focusedClient;
	var walletId = fc.credentials.walletId;
	if (configHiddenSubWallets.hasOwnProperty(walletId)) {
	  return configHiddenSubWallets[walletId];
	} else {
	  return {};
	}
  };

  self.isAssetHidden = function (asset, assetsSet) {
	if (!assetsSet) {
	  assetsSet = self.getCurrentWalletHiddenAssets();
	}
	return assetsSet[asset];
  };
	
  self.setBalance = function(assocBalances, assocSharedBalances) {
    if (!assocBalances) return;
    var config = configService.getSync().wallet.settings;
    var fc = profileService.focusedClient;
    var hiddenAssets = self.getCurrentWalletHiddenAssets();
    var hiddenSubWallets = self.getCurrentWalletHiddenSubWallets();
    console.log('setBalance hiddenAssets:', hiddenAssets);
    var exchangeRates = require('ocore/network.js').exchangeRates;

    // Selected unit
    self.unitValue = config.unitValue;
    self.unitName = config.unitName;
    self.bbUnitName = config.bbUnitName;
  
	var currentAsset = self.arrBalances.length > 0 ? self.arrBalances[self.assetIndex || 0].asset : null;
	console.log('current asset', currentAsset);

	self.assetsSet = {};
	self.arrBalances = [];
	for (var asset in assocBalances){
		var balanceInfo = assocBalances[asset];
		balanceInfo.asset = asset;
		balanceInfo.total = balanceInfo.stable + balanceInfo.pending;
		if (assocSharedBalances[asset]){
			balanceInfo.shared = 0;
			balanceInfo.assocSharedByAddress = {};
			for (var sa in assocSharedBalances[asset]){
		var total_on_shared_address = 0;
			  if(!hiddenSubWallets[sa]) {
		  total_on_shared_address = (assocSharedBalances[asset][sa].stable || 0) + (assocSharedBalances[asset][sa].pending || 0);
		}
				balanceInfo.shared += total_on_shared_address;
				balanceInfo.assocSharedByAddress[sa] = total_on_shared_address;
			}
		}
		if (balanceInfo.name)
			profileService.assetMetadata[asset] = {decimals: balanceInfo.decimals, name: balanceInfo.name};
        if (asset === "base" || asset == self.BLACKBYTES_ASSET || balanceInfo.name){
          balanceInfo.totalStr = profileService.formatAmountWithUnit(balanceInfo.total, asset);
          balanceInfo.totalStrWithoutUnit = profileService.formatAmount(balanceInfo.total, asset);
          balanceInfo.stableStr = profileService.formatAmountWithUnit(balanceInfo.stable, asset);
          balanceInfo.pendingStr = profileService.formatAmountWithUnitIfShort(balanceInfo.pending, asset);
          if (typeof balanceInfo.shared === 'number')
            balanceInfo.sharedStr = profileService.formatAmountWithUnitIfShort(balanceInfo.shared, asset);
          if (!balanceInfo.name){
            if (!Math.log10) // android 4.4
              Math.log10 = function(x) { return Math.log(x) * Math.LOG10E; };
            if (asset === "base"){
              balanceInfo.name = self.unitName;
              balanceInfo.decimals = Math.round(Math.log10(config.unitValue));
            }
            else if (asset === self.BLACKBYTES_ASSET){
              balanceInfo.name = self.bbUnitName;
              balanceInfo.decimals = Math.round(Math.log10(config.bbUnitValue));
            }
          }
		}
		var completeBalance = balanceInfo.total + (balanceInfo.shared || 0);
		if (asset === 'base' && exchangeRates.GBYTE_USD)
			balanceInfo.usdValue = completeBalance / 1e9 * exchangeRates.GBYTE_USD;
		else if (asset === self.BLACKBYTES_ASSET && exchangeRates.GBB_USD)
			balanceInfo.usdValue = completeBalance / 1e9 * exchangeRates.GBB_USD;
		else if (exchangeRates[asset + '_USD'])
			balanceInfo.usdValue = completeBalance / Math.pow(10, balanceInfo.decimals || 0) * exchangeRates[asset + '_USD'];
		else
			balanceInfo.usdValue = 0;
        self.assetsSet[asset] = balanceInfo;
        if (self.isAssetHidden(asset, hiddenAssets)) {
          continue;
        }
        self.arrBalances.push(balanceInfo);
	}
	self.arrBalances.sort((b1, b2) => {
		if (b1.asset === 'base')
			return -1;
		if (b2.asset === 'base')
			return 1;
		var usdDiff = b1.usdValue - b2.usdValue;
		if (usdDiff !== 0)
			return -usdDiff;
		var balDiff = b1.total / Math.pow(10, b1.decimals || 0) - b2.total / Math.pow(10, b2.decimals || 0);
		if (balDiff !== 0)
			return -balDiff;
		var name1 = b1.name || '';
		var name2 = b2.name || '';
		if (name1 < name2)
			return -1;
		if (name1 > name2)
			return 1;
		return 0;
	});
    self.assetIndex = self.assetIndex || 0;
	if (currentAsset) {
		var assetIndex = lodash.findIndex(self.arrBalances, { asset: currentAsset });
		console.log('asset index was ' + self.assetIndex + ', became ' + assetIndex);
		if (assetIndex >= 0 && assetIndex !== self.assetIndex)
			self.assetIndex = assetIndex;
	}
	if (!self.arrBalances[self.assetIndex]) // if no such index in the subwallet, reset to bytes
		self.assetIndex = 0;
	if (!self.shared_address)
		self.arrMainWalletBalances = self.arrBalances;
	if(isCordova) wallet.showCompleteClient();
	console.log('========= setBalance done, balances: '+JSON.stringify(self.arrBalances));
	breadcrumbs.add('setBalance done, balances: '+JSON.stringify(self.arrBalances));

	  /*
	// SAT
	if (configService.getSync().wallet.spendUnconfirmed) {
	  self.totalBalanceBytes = balance.totalAmount;
	  self.lockedBalanceBytes = balance.lockedAmount || 0;
	  self.availableBalanceBytes = balance.availableAmount || 0;
	  self.pendingAmount = null;
	} else {
	  self.totalBalanceBytes = balance.totalConfirmedAmount;
	  self.lockedBalanceBytes = balance.lockedConfirmedAmount || 0;
	  self.availableBalanceBytes = balance.availableConfirmedAmount || 0;
	  self.pendingAmount = balance.totalAmount - balance.totalConfirmedAmount;
	}

	//STR
	self.totalBalanceStr = profileService.formatAmount(self.totalBalanceBytes) + ' ' + self.unitName;
	self.lockedBalanceStr = profileService.formatAmount(self.lockedBalanceBytes) + ' ' + self.unitName;
	self.availableBalanceStr = profileService.formatAmount(self.availableBalanceBytes) + ' ' + self.unitName;

	if (self.pendingAmount) {
	  self.pendingAmountStr = profileService.formatAmount(self.pendingAmount) + ' ' + self.unitName;
	} else {
	  self.pendingAmountStr = null;
	}
	  */

	self.calculateTotalUsdBalance();

	$timeout(function() {
	  $rootScope.$apply();
	});
  };

	
	
  this.csvHistory = function() {

function saveFile(name, data, filename) {
	  var chooser = document.querySelector(name);
	  chooser.setAttribute("nwsaveas", filename);
	  var fileSaveChange = function(evt) {
		var fs = require('fs');
		fs.writeFile(evt.target.value, data, function(err) {
		  if (err) {
			$log.debug(err);
		  }
		  evt.target.removeEventListener("change", fileSaveChange, false);
		  evt.target.value = null;
		});
	  };
	  chooser.addEventListener("change", fileSaveChange, false);
	  chooser.click();
	}

	function formatDate(date) {
	  var dateObj = new Date(date);
	  if (!dateObj) {
		$log.debug('Error formating a date');
		return 'DateError'
	  }
	  if (!dateObj.toJSON()) {
		return '';
	  }

	  return dateObj.toJSON();
	}

	function formatString(str) {
	  if (!str) return '';

	  if (str.indexOf('"') !== -1) {
		//replace all
		str = str.replace(new RegExp('"', 'g'), '\'');
	  }

	  //escaping commas
	  str = '\"' + str + '\"';

	  return str;
	}

	if (isCordova) {
	  $log.info('CSV generation not available in mobile');
	  return;
	}
	var isNode = nodeWebkit.isDefined();
	var fc = profileService.focusedClient;
	var c = fc.credentials;
	if (!fc.isComplete()) return;
	var self = this;
	var allTxs = [];

	$log.debug('Generating CSV from History');
	self.setOngoingProcess('generatingCSV', true);

	$timeout(function() {
	  fc.getTxHistory(self.arrBalances[self.assetIndex].asset, self.shared_address, function(txs) {
		  self.setOngoingProcess('generatingCSV', false);
		  $log.debug('Wallet Transaction History:', txs);

		  var data = txs;
		  var filename = 'Obyte-' + (self.alias || self.walletName) + '-' + (new Date()).getTime() + '.csv';
		  var csvContent = '';

		  if (!isNode) csvContent = 'data:text/csv;charset=utf-8,';
		  csvContent += 'Date,Destination,Note,Amount,Currency,Spot Value,Total Value,Tax Type,Category\n';

		  var _amount, _note;
		  var dataString;
		  data.forEach(function(it, index) {
			var amount = it.amount;

			if (it.action == 'moved')
			  amount = 0;

			_asset = !it.asset || it.asset == 'base' ? 'byte' : it.asset;
			_amount = (it.action == 'sent' ? '-' : '') + amount;
			_note = formatString((it.message ? it.message : '') + ' unit: ' + it.unit);

			if (it.action == 'moved')
			  _note += ' Moved:' + it.amount

			dataString = formatDate(it.time * 1000) + ',' + formatString(it.addressTo) + ',' + _note + ',' + _amount + ',' + _asset + ',,,,';
			csvContent += dataString + "\n";

		  });

		  if (isNode) {
			saveFile('#export_file', csvContent, filename);
		  } else {
			var encodedUri = encodeURI(csvContent);
			var link = document.createElement("a");
			link.setAttribute("href", encodedUri);
			link.setAttribute("download", filename);
			link.click();
		  }
		  $timeout(function(){
			$rootScope.$apply();
		  });
	  });
	});
  };



  self.updateLocalTxHistory = function(client, cb) {
	var walletId = client.credentials.walletId;
	if (self.arrBalances.length === 0)
		return console.log('updateLocalTxHistory: no balances yet');
	breadcrumbs.add('index: '+self.assetIndex+'; balances: '+JSON.stringify(self.arrBalances));
	if (!client.isComplete())
		return console.log('fc incomplete yet');
	client.getTxHistory(self.arrBalances[self.assetIndex].asset, self.shared_address, function onGotTxHistory(txs) {
		$timeout(function(){
			var newHistory = self.processNewTxs(txs);
			$log.debug('Tx History synced. Total Txs: ' + newHistory.length);

			if (walletId ==  profileService.focusedClient.credentials.walletId) {
				self.completeHistory = newHistory;
				self.txHistory = newHistory.slice(0, self.historyShowLimit);
				self.historyShowShowAll = newHistory.length >= self.historyShowLimit;
			}

			return cb();
		});
	});
  }
  
  self.showAllHistory = function() {
	self.historyShowShowAll = false;
	self.historyRendering = true;
	$timeout(function() {
	  $rootScope.$apply();
	  $timeout(function() {
		self.historyRendering = false;
		self.txHistory = self.completeHistory;
	  }, 100);
	}, 100);
  };

  self.updateHistory = function() {
	var fc = profileService.focusedClient;
	var walletId = fc.credentials.walletId;

	if (!fc.isComplete() || self.arrBalances.length === 0) return;

	$log.debug('Updating Transaction History');
	self.txHistoryError = false;

	mutex.lock(['update-history-'+walletId], function(unlock){
		self.updatingTxHistory[walletId] = true;
		$timeout(function onUpdateHistoryTimeout() {
		  self.updateLocalTxHistory(fc, function(err) {
			self.updatingTxHistory[walletId] = false;
			unlock();
			if (err)
				self.txHistoryError = true;
			$timeout(function() {
				$rootScope.$apply();
			});
		  });
		});
	});
  };

  self.updateTxHistory = lodash.debounce(function() {
	self.updateHistory();
  }, 1000);

//  self.throttledUpdateHistory = lodash.throttle(function() {
//    self.updateHistory();
//  }, 5000);
	
//    self.onMouseDown = function(){
//        console.log('== mousedown');
//        self.oldAssetIndex = self.assetIndex;
//    };
	
	self.onClick = function(){
		console.log('== click');
		self.oldAssetIndex = self.assetIndex;
	};
	
	// for light clients only
	self.updateHistoryFromNetwork = lodash.throttle(function(){
		setTimeout(function(){
			if (self.assetIndex !== self.oldAssetIndex) // it was a swipe
				return console.log("== swipe");
			console.log('== updateHistoryFromNetwork');
			var lightWallet = require('ocore/light_wallet.js');
			lightWallet.refreshLightClientHistory();
		}, 500);
	}, 5000);

  self.showPopup = function(msg, msg_icon, cb) {
	$log.warn('Showing '+msg_icon+' popup:' + msg);
	self.showAlert = {
	  msg: msg.toString(),
	  msg_icon: msg_icon,
	  close: function(err) {
		self.showAlert = null;
		if (cb) return cb(err);
	  },
	};
	$timeout(function() {
	  $rootScope.$apply();
	});
  };

  self.showErrorPopup = function(msg, cb) {
	$log.warn('Showing err popup:' + msg);
	self.showPopup(msg, 'fi-alert', cb);
  };

  /*
  self.recreate = function(cb) {
	var fc = profileService.focusedClient;
	self.setOngoingProcess('recreating', true);
	fc.recreateWallet(function(err) {
	  self.setOngoingProcess('recreating', false);

	  if (err)
		  throw "impossible err from recreateWallet";

	  profileService.setWalletClients();
	  $timeout(function() {
		$rootScope.$emit('Local/WalletImported', self.walletId);
	  }, 100);
	});
  };*/

  self.openMenu = function() {
	backButton.menuOpened = true;
	go.swipe(true);
  };

  self.closeMenu = function() {
	backButton.menuOpened = false;
	go.swipe();
  };
	
	self.swipeRight = function(){
		if (!self.bSwipeSuspended)
			self.openMenu();
		else
			console.log('ignoring swipe');
	};
	
	self.suspendSwipe = function(){
		if (self.arrBalances.length <= 1)
			return;
		self.bSwipeSuspended = true;
		console.log('suspending swipe');
		$timeout(function(){
			self.bSwipeSuspended = false;
			console.log('resuming swipe');
		}, 100);
	};

  self.retryScan = function() {
	var self = this;
	self.startScan(self.walletId);
  }

  self.startScan = function(walletId) {
	$log.debug('Scanning wallet ' + walletId);
	var c = profileService.walletClients[walletId];
	if (!c.isComplete()) return;
	  /*
	if (self.walletId == walletId)
	  self.setOngoingProcess('scanning', true);

	c.startScan({
	  includeCopayerBranches: true,
	}, function(err) {
	  if (err && self.walletId == walletId) {
		self.setOngoingProcess('scanning', false);
		self.handleError(err);
		$rootScope.$apply();
	  }
	});
	  */
  };

  self.setUxLanguage = function() {
	var userLang = uxLanguage.update();
	self.defaultLanguageIsoCode = userLang;
	self.defaultLanguageName = uxLanguage.getName(userLang);
  };



  self.setAddressbook = function(ab) {
	if (ab) {
	  self.addressbook = ab;
	  return;
	}

	addressbookService.list(function(err, ab) {
	  if (err) {
		$log.error('Error getting the addressbook');
		return;
	  }
	  self.addressbook = ab;
	});
  };   
	

	function getNumberOfSelectedSigners(){
		var count = 1; // self
		self.copayers.forEach(function(copayer){
			if (copayer.signs)
				count++;
		});
		return count;
	}
	
	self.isEnoughSignersSelected = function(){
		if (self.m === self.n)
			return true;
		return (getNumberOfSelectedSigners() >= self.m);
	};
	
	self.getWallets = function(){
		return profileService.getWallets('livenet');
	};
	
  self.getToAddressLabel = function(value) {
	var validationResult = aliasValidationService.validate(value);

	if (validationResult.isValid) {
	  var aliasObj = aliasValidationService.getAliasObj(validationResult.attestorKey);
	  return gettextCatalog.getString('To') + " " + gettextCatalog.getString(aliasObj.title);
	}

	return gettextCatalog.getString('To email');
  };
  self.getAddressValue = function(value) {
	var validationResult = aliasValidationService.validate(value);

	if (validationResult.isValid) {
	  return validationResult.account;
	}

	return value;
  };

  $rootScope.$on('Local/ClearHistory', function(event) {
	$log.debug('The wallet transaction history has been deleted');
	self.txHistory = self.completeHistory = [];
	self.updateHistory();
  });

  $rootScope.$on('Local/AddressbookUpdated', function(event, ab) {
	self.setAddressbook(ab);
  });

  // UX event handlers
  $rootScope.$on('Local/ColorUpdated', function(event) {
	self.updateColor();
	$timeout(function() {
	  $rootScope.$apply();
	});
  });

  $rootScope.$on('Local/AliasUpdated', function(event) {
	self.updateAlias();
	$timeout(function() {
	  $rootScope.$apply();
	});
  });

  $rootScope.$on('Local/SingleAddressFlagUpdated', function(event) {
	self.updateSingleAddressFlag();
	$timeout(function() {
	  $rootScope.$apply();
	});
  });

  $rootScope.$on('Local/ProfileBound', function() {
  });

  $rootScope.$on('Local/NewFocusedWallet', function() {
	self.setUxLanguage();
  });

  $rootScope.$on('Local/LanguageSettingUpdated', function() {
	self.setUxLanguage();
  });

  $rootScope.$on('Local/UnitSettingUpdated', function(event) {
	breadcrumbs.add('UnitSettingUpdated');
	self.updateAll();
	self.updateTxHistory();
  });

  $rootScope.$on('Local/NeedFreshHistory', function(event) {
	breadcrumbs.add('NeedFreshHistory');
	self.updateHistory();
  });


  $rootScope.$on('Local/WalletCompleted', function(event) {
	self.setFocusedWallet();
	go.walletHome();
  });

//  self.debouncedUpdate = lodash.throttle(function() {
//    self.updateAll({
//      quiet: true
//    });
//    self.updateTxHistory();
//  }, 4000, {
//    leading: false,
//    trailing: true
//  });

  $rootScope.$on('Local/Resume', function(event) {
	$log.debug('### Resume event');
	var lightWallet = require('ocore/light_wallet.js');
	lightWallet.refreshLightClientHistory();
	//self.debouncedUpdate();
  });

  $rootScope.$on('Local/BackupDone', function(event) {
	self.needsBackup = false;
	$log.debug('Backup done');
	storageService.setBackupFlag('all', function(err) {
		if (err)
			return $log.warn("setBackupFlag failed: "+JSON.stringify(err));
	  $log.debug('Backup done stored');
	});
  });

  $rootScope.$on('Local/DeviceError', function(event, err) {
	self.showErrorPopup(err, function() {
	  if (self.isCordova && navigator && navigator.app) {
		navigator.app.exitApp();
	  }
	});
  });


  $rootScope.$on('Local/WalletImported', function(event, walletId) {
	self.needsBackup = false;
	storageService.setBackupFlag(walletId, function() {
	  $log.debug('Backup done stored');
	  addressService.expireAddress(walletId, function(err) {
		$timeout(function() {
		  self.txHistory = self.completeHistory = [];
			self.startScan(walletId);
		}, 500);
	  });
	});
  });

  $rootScope.$on('NewIncomingTx', function() {
	self.updateAll({
	  walletStatus: null,
	  untilItChanges: true,
	  triggerTxUpdate: true,
	});
  });



  $rootScope.$on('NewOutgoingTx', function() {
	breadcrumbs.add('NewOutgoingTx');
	self.updateAll({
	  walletStatus: null,
	  untilItChanges: true,
	  triggerTxUpdate: true,
	});
  });

  lodash.each(['NewTxProposal', 'TxProposalFinallyRejected', 'TxProposalRemoved', 'NewOutgoingTxByThirdParty',
	'Local/NewTxProposal', 'Local/TxProposalAction'
  ], function(eventName) {
	$rootScope.$on(eventName, function(event, untilItChanges) {
	  self.updateAll({
		walletStatus: null,
		untilItChanges: untilItChanges,
		triggerTxUpdate: true,
	  });
	});
  });

  $rootScope.$on('ScanFinished', function() {
	$log.debug('Scan Finished. Updating history');
	  self.updateAll({
		walletStatus: null,
		triggerTxUpdate: true,
	  });
  });


  $rootScope.$on('Local/NoWallets', function(event) {
	$timeout(function() {
	  self.hasProfile = true;
	  self.noFocusedWallet = true;
	  self.isComplete = null;
	  self.walletName = null;
	  go.path('preferencesGlobal.import');
	});
  });

  $rootScope.$on('Local/NewFocusedWallet', function() {
	  console.log('on Local/NewFocusedWallet');
	self.setFocusedWallet();
	//self.updateTxHistory();
	go.walletHome();
  });

  $rootScope.$on('Local/SetTab', function(event, tab, reset, swtichToHome) {
	console.log("SetTab "+tab+", reset "+reset);
	self.setTab(tab, reset, null, swtichToHome);
  });

  $rootScope.$on('Local/RequestTouchid', function(event, cb) {
	window.plugins.touchid.verifyFingerprint(
	  gettextCatalog.getString('Scan your fingerprint please'),
	  function(msg) {
		// OK
		return cb();
	  },
	  function(msg) {
		// ERROR
		return cb(gettext('Invalid Touch ID'));
	  }
	);
  });

  $rootScope.$on('Local/ShowAlert', function(event, msg, msg_icon, cb) {
	  self.showPopup(msg, msg_icon, cb);
  });

  $rootScope.$on('Local/ShowErrorAlert', function(event, msg, cb) {
	  self.showErrorPopup(msg, cb);
  });

  $rootScope.$on('Local/NeedsPassword', function(event, isSetup, messageObj, cb) {
	console.log('NeedsPassword');
	if (!messageObj)
		messageObj = {message: null, type: null};
	self.askPassword = {
		isSetup: isSetup,
		message: messageObj.message,
		type: messageObj.type,
		callback: function(err, pass) {
			self.askPassword = null;
			return cb(err, pass);
		},
	};
	$timeout(function() {
	  $rootScope.$apply();
	});
  });

  lodash.each(['NewCopayer', 'CopayerUpdated'], function(eventName) {
	$rootScope.$on(eventName, function() {
	  // Re try to open wallet (will triggers)
	  self.setFocusedWallet();
	});
  });

  $rootScope.$on('Local/NewEncryptionSetting', function() {
	var fc = profileService.focusedClient;
	self.isPrivKeyEncrypted = fc.isPrivKeyEncrypted();
	$timeout(function() {
	  $rootScope.$apply();
	});
  });
  
  $rootScope.$on('Local/pushNotificationsReady', function() {
	self.usePushNotifications = true;
	$timeout(function() {
	  $rootScope.$apply();
	});
  });

  (function() {
		"drag dragover dragstart dragenter".split(" ").forEach(function(e){
			window.addEventListener(e, function(e){
				e.preventDefault();
				e.stopPropagation();
				e.dataTransfer.dropEffect = "copy";
			}, false);
		});
		document.addEventListener('drop', function(e){
			e.preventDefault();
			e.stopPropagation();
			for (var i = 0; i < e.dataTransfer.files.length; ++i) {
				go.handleUri(e.dataTransfer.files[i].path);
			}
		}, false);
  })();

});
