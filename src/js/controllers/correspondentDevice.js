/*jslint node: true */
'use strict';


var constants = require('byteballcore/constants.js');

angular.module('copayApp.controllers').controller('correspondentDeviceController',
  function($scope, $rootScope, $timeout, $sce, $modal, configService, profileService, animationService, isCordova, go, correspondentListService, addressService, lodash, $deepStateRedirect, $state, backButton, gettext) {
	
	var async = require('async');
	var chatStorage = require('byteballcore/chat_storage.js');
	var self = this;
	console.log("correspondentDeviceController");
	var privateProfile = require('byteballcore/private_profile.js');
	var objectHash = require('byteballcore/object_hash.js');
	var db = require('byteballcore/db.js');
	var network = require('byteballcore/network.js');
	var device = require('byteballcore/device.js');
	var eventBus = require('byteballcore/event_bus.js');
	var conf = require('byteballcore/conf.js');
	var storage = require('byteballcore/storage.js');
	var breadcrumbs = require('byteballcore/breadcrumbs.js');
	
	var fc = profileService.focusedClient;
	var chatScope = $scope;
	var indexScope = $scope.index;
	$rootScope.tab = $scope.index.tab = 'chat';
	var correspondent = correspondentListService.currentCorrespondent;
	$scope.correspondent = correspondent;
//	var myPaymentAddress = indexScope.shared_address;
	if (document.chatForm && document.chatForm.message)
		document.chatForm.message.focus();
	
	if (!correspondentListService.messageEventsByCorrespondent[correspondent.device_address])
		correspondentListService.messageEventsByCorrespondent[correspondent.device_address] = [];
	$scope.messageEvents = correspondentListService.messageEventsByCorrespondent[correspondent.device_address];

	$scope.$watch("correspondent.my_record_pref", function(pref, old_pref) {
		if (pref == old_pref) return;
		var device = require('byteballcore/device.js');
		device.sendMessageToDevice(correspondent.device_address, "chat_recording_pref", pref, {
			ifOk: function(){
				device.updateCorrespondentProps(correspondent);
				var oldState = (correspondent.peer_record_pref && !correspondent.my_record_pref);
				var newState = (correspondent.peer_record_pref && correspondent.my_record_pref);
				if (newState != oldState) {
					var message = {
						type: 'system',
						message: JSON.stringify({state: newState}),
						timestamp: Math.floor(Date.now() / 1000),
						chat_recording_status: true
					};
					$scope.autoScrollEnabled = true;
					$scope.messageEvents.push(correspondentListService.parseMessage(message));
					$timeout(function(){
						$scope.$digest();
					});
					chatStorage.store(correspondent.device_address, JSON.stringify({state: newState}), 0, 'system');
				}
				/*if (!pref) {
					chatStorage.purge(correspondent.device_address);
				}*/
			},
			ifError: function(){
				// ignore
			}
		});
	});

	var removeNewMessagesDelim = function() {
		for (var i in $scope.messageEvents) {
        	if ($scope.messageEvents[i].new_message_delim) {
        		$scope.messageEvents.splice(i, 1);
        	}
        }
	};

	$scope.$watch("newMessagesCount['" + correspondent.device_address +"']", function(counter) {
		if (!$scope.newMsgCounterEnabled && $state.is('correspondentDevices.correspondentDevice')) {
			$scope.newMessagesCount[$scope.correspondent.device_address] = 0;			
		}
	});

	$scope.$on('$stateChangeStart', function(evt, toState, toParams, fromState) {
	    if (toState.name === 'correspondentDevices.correspondentDevice') {
	        $rootScope.tab = $scope.index.tab = 'chat';
	        $scope.newMessagesCount[correspondentListService.currentCorrespondent.device_address] = 0;
	    } else
	    	removeNewMessagesDelim();
	});

	$scope.send = function() {
		$scope.error = null;
		if (!$scope.message)
			return;
		setOngoingProcess("sending");
		var message = lodash.clone($scope.message); // save in var as $scope.message may disappear while we are sending the message over the network
		device.sendMessageToDevice(correspondent.device_address, "text", message, {
			ifOk: function(){
				setOngoingProcess();
				//$scope.messageEvents.push({bIncoming: false, message: $sce.trustAsHtml($scope.message)});
				$scope.autoScrollEnabled = true;
				var msg_obj = {
					bIncoming: false, 
					message: correspondentListService.formatOutgoingMessage(message), 
					timestamp: Math.floor(Date.now() / 1000)
				};
				correspondentListService.checkAndInsertDate($scope.messageEvents, msg_obj);
				$scope.messageEvents.push(msg_obj);
				$scope.message = "";
				$timeout(function(){
					$scope.$apply();
				});
				if (correspondent.my_record_pref && correspondent.peer_record_pref) chatStorage.store(correspondent.device_address, message, 0);
			},
			ifError: function(error){
				setOngoingProcess();
				setError(error);
			}
		});
	};
	
	$scope.insertMyAddress = function(){
		if (!profileService.focusedClient.credentials.isComplete())
			return $rootScope.$emit('Local/ShowErrorAlert', "The wallet is not approved yet");
		readMyPaymentAddress(appendMyPaymentAddress);
	//	issueNextAddressIfNecessary(appendMyPaymentAddress);
	};
	
	$scope.requestPayment = function(){
		if (!profileService.focusedClient.credentials.isComplete())
			return $rootScope.$emit('Local/ShowErrorAlert', "The wallet is not approved yet");
		readMyPaymentAddress(showRequestPaymentModal);
	//	issueNextAddressIfNecessary(showRequestPaymentModal);
	};
	
	$scope.sendPayment = function(address, amount, asset, device_address, single_address){
		console.log("will send payment to "+address);
		if (asset && $scope.index.arrBalances.filter(function(balance){ return (balance.asset === asset); }).length === 0){
			console.log("i do not own anything of asset "+asset);
			return;
		}
		readMyPaymentAddress(function(my_address){
			if (single_address){
				var bSpecificSingleAddress = (single_address.length === 32);
				var displayed_single_address = bSpecificSingleAddress ? ' '+single_address : '';
				var fc = profileService.focusedClient;
				if (!fc.isSingleAddress || bSpecificSingleAddress && single_address !== my_address)
					return $rootScope.$emit('Local/ShowErrorAlert', gettext("This payment must be paid only from single-address wallet")+displayed_single_address+".  "+gettext("Please switch to a single-address wallet and you probably need to insert your address again."));
			}
			backButton.dontDeletePath = true;
			go.send(function(){
				//$rootScope.$emit('Local/SetTab', 'send', true);
				$rootScope.$emit('paymentRequest', address, amount, asset, correspondent.device_address);
			});
		});
	};

	$scope.showPayment = function(asset){
		console.log("will show payment in asset "+asset);
		if (!asset)
			throw Error("no asset in showPayment");
		if (asset && $scope.index.arrBalances.filter(function(balance){ return (balance.asset === asset); }).length === 0){
			console.log("i do not own anything of asset "+asset);
			return;
		}
		var assetIndex = lodash.findIndex($scope.index.arrBalances, {asset: asset});
		if (assetIndex < 0)
			throw Error("failed to find asset index of asset "+asset);
		$scope.index.assetIndex = assetIndex;
		go.history();
	};
	

	
	
	$scope.offerContract = function(address){
		var walletDefinedByAddresses = require('byteballcore/wallet_defined_by_addresses.js');
		$rootScope.modalOpened = true;
		var fc = profileService.focusedClient;
		$scope.oracles = configService.oracles;
		
		var ModalInstanceCtrl = function($scope, $modalInstance) {
			var config = configService.getSync();
			var configWallet = config.wallet;
			var walletSettings = configWallet.settings;
			$scope.unitValue = walletSettings.unitValue;
			$scope.unitName = walletSettings.unitName;
			$scope.color = fc.backgroundColor;
			$scope.bWorking = false;
			$scope.arrRelations = ["=", ">", "<", ">=", "<=", "!="];
			$scope.arrParties = [{value: 'me', display_value: "I"}, {value: 'peer', display_value: "the peer"}];
			$scope.arrPeerPaysTos = [{value: 'me', display_value: "to me"}, {value: 'contract', display_value: "to this contract"}];
			$scope.arrAssetInfos = indexScope.arrBalances.map(function(b){
				var info = {asset: b.asset, is_private: b.is_private};
				if (b.asset === 'base')
					info.displayName = walletSettings.unitName;
				else if (b.asset === constants.BLACKBYTES_ASSET)
					info.displayName = walletSettings.bbUnitName;
				else if (profileService.assetMetadata[b.asset])
					info.displayName = profileService.assetMetadata[b.asset].name;
				else
					info.displayName = 'of '+b.asset.substr(0, 4);
				return info;
			});
			$scope.arrPublicAssetInfos = $scope.arrAssetInfos.filter(function(b){ return !b.is_private; });
			var contract = {
				timeout: 4,
				myAsset: 'base',
				peerAsset: 'base',
				peer_pays_to: 'contract',
				relation: '>',
				expiry: 7,
				data_party: 'me',
				expiry_party: 'peer'
			};
			$scope.contract = contract;

			
			$scope.onDataPartyUpdated = function(){
				console.log('onDataPartyUpdated');
				contract.expiry_party = (contract.data_party === 'me') ? 'peer' : 'me';
			};
			
			$scope.onExpiryPartyUpdated = function(){
				console.log('onExpiryPartyUpdated');
				contract.data_party = (contract.expiry_party === 'me') ? 'peer' : 'me';
			};
			
			
			$scope.payAndOffer = function() {
				console.log('payAndOffer');
				$scope.error = '';
				
				if (fc.isPrivKeyEncrypted()) {
					profileService.unlockFC(null, function(err) {
						if (err){
							$scope.error = err.message;
							$timeout(function(){
								$scope.$apply();
							});
							return;
						}
						$scope.payAndOffer();
					});
					return;
				}
				
				profileService.requestTouchid(function(err) {
					if (err) {
						profileService.lockFC();
						$scope.error = err;
						$timeout(function() {
							$scope.$digest();
						}, 1);
						return;
					}
					
					if ($scope.bWorking)
						return console.log('already working');
					
					var my_amount = contract.myAmount;
					if (contract.myAsset === "base")
						my_amount *= walletSettings.unitValue;
					if (contract.myAsset === constants.BLACKBYTES_ASSET)
						my_amount *= walletSettings.bbUnitValue;
					if (profileService.assetMetadata[contract.myAsset])
						my_amount *= Math.pow(10, profileService.assetMetadata[contract.myAsset].decimals || 0);
					my_amount = Math.round(my_amount);
					
					var peer_amount = contract.peerAmount;
					if (contract.peerAsset === "base")
						peer_amount *= walletSettings.unitValue;
					if (contract.peerAsset === constants.BLACKBYTES_ASSET)
						throw Error("peer asset cannot be blackbytes");
					if (profileService.assetMetadata[contract.peerAsset])
						peer_amount *= Math.pow(10, profileService.assetMetadata[contract.peerAsset].decimals || 0);
					peer_amount = Math.round(peer_amount);
					
					if (my_amount === peer_amount && contract.myAsset === contract.peerAsset && contract.peer_pays_to === 'contract'){
						$scope.error = "The amounts are equal, you cannot require the peer to pay to the contract.  Please either change the amounts slightly or fund the entire contract yourself and require the peer to pay his half to you.";
						$timeout(function() {
							$scope.$digest();
						}, 1);
						return;
					}
					
					var fnReadMyAddress = (contract.peer_pays_to === 'contract') ? readMyPaymentAddress : issueNextAddress;
					fnReadMyAddress(function(my_address){
						var arrSeenCondition = ['seen', {
							what: 'output', 
							address: (contract.peer_pays_to === 'contract') ? 'this address' : my_address, 
							asset: contract.peerAsset, 
							amount: peer_amount
						}];
						readLastMainChainIndex(function(err, last_mci){
							if (err){
								$scope.error = err;
								$timeout(function() {
									$scope.$digest();
								}, 1);
								return;
							}
							var arrExplicitEventCondition = 
								['in data feed', [[contract.oracle_address], contract.feed_name, contract.relation, contract.feed_value+'', last_mci]];
							var arrEventCondition = arrExplicitEventCondition;
							var data_address = (contract.data_party === 'me') ? my_address : address;
							var expiry_address = (contract.expiry_party === 'me') ? my_address : address;
							var data_device_address = (contract.data_party === 'me') ? device.getMyDeviceAddress() : correspondent.device_address;
							var expiry_device_address = (contract.expiry_party === 'me') ? device.getMyDeviceAddress() : correspondent.device_address;
							var arrDefinition = ['or', [
								['and', [
									arrSeenCondition,
									['or', [
										['and', [
											['address', data_address],
											arrEventCondition
										]],
										['and', [
											['address', expiry_address],
											['in data feed', [[configService.TIMESTAMPER_ADDRESS], 'timestamp', '>', Date.now() + Math.round(contract.expiry*24*3600*1000)]]
										]]
									]]
								]],
								['and', [
									['address', my_address],
									['not', arrSeenCondition],
									['in data feed', [[configService.TIMESTAMPER_ADDRESS], 'timestamp', '>', Date.now() + Math.round(contract.timeout*3600*1000)]]
								]]
							]];
							var assocSignersByPath = {
								'r.0.1.0.0': {
									address: data_address,
									member_signing_path: 'r',
									device_address: data_device_address
								},
								'r.0.1.1.0': {
									address: expiry_address,
									member_signing_path: 'r',
									device_address: expiry_device_address
								},
								'r.1.0': {
									address: my_address,
									member_signing_path: 'r',
									device_address: device.getMyDeviceAddress()
								}
							};
							walletDefinedByAddresses.createNewSharedAddress(arrDefinition, assocSignersByPath, {
								ifError: function(err){
									$scope.bWorking = false;
									$scope.error = err;
									$timeout(function(){
										$scope.$digest();
									});
								},
								ifOk: function(shared_address){
									composeAndSend(shared_address, arrDefinition, assocSignersByPath, my_address);
								}
							});
						});
					});
					
					// compose and send
					function composeAndSend(shared_address, arrDefinition, assocSignersByPath, my_address){
						var arrSigningDeviceAddresses = []; // empty list means that all signatures are required (such as 2-of-2)
						if (fc.credentials.m < fc.credentials.n)
							indexScope.copayers.forEach(function(copayer){
								if (copayer.me || copayer.signs)
									arrSigningDeviceAddresses.push(copayer.device_address);
							});
						else if (indexScope.shared_address)
							arrSigningDeviceAddresses = indexScope.copayers.map(function(copayer){ return copayer.device_address; });
						profileService.bKeepUnlocked = true;
						var opts = {
							shared_address: indexScope.shared_address,
							asset: contract.myAsset,
							to_address: shared_address,
							amount: my_amount,
							arrSigningDeviceAddresses: arrSigningDeviceAddresses,
							recipient_device_address: correspondent.device_address
						};
						fc.sendMultiPayment(opts, function(err){
							// if multisig, it might take very long before the callback is called
							//self.setOngoingProcess();
							$scope.bWorking = false;
							profileService.bKeepUnlocked = false;
							if (err){
								if (err.match(/device address/))
									err = "This is a private asset, please send it only by clicking links from chat";
								if (err.match(/no funded/))
									err = "Not enough spendable funds, make sure all your funds are confirmed";
								if ($scope)
									$scope.error = err;
								return;
							}
							$rootScope.$emit("NewOutgoingTx");
							eventBus.emit('sent_payment', correspondent.device_address, my_amount, contract.myAsset, true);
							var paymentRequestCode;
							if (contract.peer_pays_to === 'contract'){
								var arrPayments = [{address: shared_address, amount: peer_amount, asset: contract.peerAsset}];
								var assocDefinitions = {};
								assocDefinitions[shared_address] = {
									definition: arrDefinition,
									signers: assocSignersByPath
								};
								var objPaymentRequest = {payments: arrPayments, definitions: assocDefinitions};
								var paymentJson = JSON.stringify(objPaymentRequest);
								var paymentJsonBase64 = Buffer(paymentJson).toString('base64');
								paymentRequestCode = 'payment:'+paymentJsonBase64;
							}
							else
								paymentRequestCode = 'byteball:'+my_address+'?amount='+peer_amount+'&asset='+encodeURIComponent(contract.peerAsset);
							var paymentRequestText = '[your share of payment to the contract]('+paymentRequestCode+')';
							device.sendMessageToDevice(correspondent.device_address, 'text', paymentRequestText);
							var body = correspondentListService.formatOutgoingMessage(paymentRequestText);
							correspondentListService.addMessageEvent(false, correspondent.device_address, body);
							if (correspondent.my_record_pref && correspondent.peer_record_pref) chatStorage.store(correspondent.device_address, body, 0, 'html');
							if (contract.peer_pays_to === 'me')
								issueNextAddress(); // make sure the address is not reused
						});
						$modalInstance.dismiss('cancel');
					}
					
				});
			}; // payAndOffer
			

			$scope.cancel = function() {
				$modalInstance.dismiss('cancel');
			};
		};
		
		
		var modalInstance = $modal.open({
			templateUrl: 'views/modals/offer-contract.html',
			windowClass: animationService.modalAnimated.slideUp,
			controller: ModalInstanceCtrl,
			scope: $scope
		});

		var disableCloseModal = $rootScope.$on('closeModal', function() {
			modalInstance.dismiss('cancel');
		});

		modalInstance.result.finally(function() {
			$rootScope.modalOpened = false;
			disableCloseModal();
			var m = angular.element(document.getElementsByClassName('reveal-modal'));
			m.addClass(animationService.modalAnimated.slideOutDown);
		});
	};
	
	
	

	$scope.sendMultiPayment = function(paymentJsonBase64){
		var walletDefinedByAddresses = require('byteballcore/wallet_defined_by_addresses.js');
		var paymentJson = Buffer(paymentJsonBase64, 'base64').toString('utf8');
		console.log("multi "+paymentJson);
		var objMultiPaymentRequest = JSON.parse(paymentJson);
		$rootScope.modalOpened = true;
		var self = this;
		var fc = profileService.focusedClient;
		var ModalInstanceCtrl = function($scope, $modalInstance) {
			var config = configService.getSync();
			var configWallet = config.wallet;
			var walletSettings = configWallet.settings;
			$scope.unitValue = walletSettings.unitValue;
			$scope.unitName = walletSettings.unitName;
			$scope.color = fc.backgroundColor;
			$scope.bDisabled = true;
			var assocSharedDestinationAddresses = {};
			var createMovementLines = function(){
				$scope.arrMovements = objMultiPaymentRequest.payments.map(function(objPayment){
					var text = correspondentListService.getAmountText(objPayment.amount, objPayment.asset || 'base') + ' to ' + objPayment.address;
					if (assocSharedDestinationAddresses[objPayment.address])
						text += ' (smart address, see below)';
					return text;
				});
			};
			if (objMultiPaymentRequest.definitions){
				var arrAllMemberAddresses = [];
				var arrFuncs = [];
				var assocMemberAddressesByDestAddress = {};
				for (var destinationAddress in objMultiPaymentRequest.definitions){
					var arrDefinition = objMultiPaymentRequest.definitions[destinationAddress].definition;
					var arrMemberAddresses = extractAddressesFromDefinition(arrDefinition);
					assocMemberAddressesByDestAddress[destinationAddress] = arrMemberAddresses;
					arrAllMemberAddresses = arrAllMemberAddresses.concat(arrMemberAddresses);
					arrFuncs.push(function(cb){
						walletDefinedByAddresses.validateAddressDefinition(arrDefinition, cb);
					});
				}
				arrAllMemberAddresses = lodash.uniq(arrAllMemberAddresses);
				if (arrAllMemberAddresses.length === 0)
					throw Error("no member addresses in "+paymentJson);
				var findMyAddresses = function(cb){
					db.query(
						"SELECT address FROM my_addresses WHERE address IN(?) \n\
						UNION \n\
						SELECT shared_address AS address FROM shared_addresses WHERE shared_address IN(?)",
						[arrAllMemberAddresses, arrAllMemberAddresses],
						function(rows){
							var arrMyAddresses = rows.map(function(row){ return row.address; });
							for (var destinationAddress in assocMemberAddressesByDestAddress){
								var arrMemberAddresses = assocMemberAddressesByDestAddress[destinationAddress];
								if (lodash.intersection(arrMemberAddresses, arrMyAddresses).length > 0)
									assocSharedDestinationAddresses[destinationAddress] = true;
							}
							createMovementLines();
							$scope.arrHumanReadableDefinitions = [];
							for (var destinationAddress in objMultiPaymentRequest.definitions){
								var arrDefinition = objMultiPaymentRequest.definitions[destinationAddress].definition;
								var assocSignersByPath = objMultiPaymentRequest.definitions[destinationAddress].signers;
								var arrPeerAddresses = walletDefinedByAddresses.getPeerAddressesFromSigners(assocSignersByPath);
								if (lodash.difference(arrPeerAddresses, arrAllMemberAddresses).length !== 0)
									throw Error("inconsistent peer addresses");
								$scope.arrHumanReadableDefinitions.push({
									destinationAddress: destinationAddress,
									humanReadableDefinition: correspondentListService.getHumanReadableDefinition(arrDefinition, arrMyAddresses, [], arrPeerAddresses)
								});
							}
							cb();
						}
					);
				};
				var checkDuplicatePayment = function(cb){
					var objFirstPayment = objMultiPaymentRequest.payments[0];
					db.query(
						"SELECT 1 FROM outputs JOIN unit_authors USING(unit) JOIN my_addresses ON unit_authors.address=my_addresses.address \n\
						WHERE outputs.address=? AND amount=? LIMIT 1",
						[objFirstPayment.address, objFirstPayment.amount],
						function(rows){
							$scope.bAlreadyPaid = (rows.length > 0);
							cb();
						}
					);
				};
				arrFuncs.push(findMyAddresses);
				arrFuncs.push(checkDuplicatePayment);
				async.series(arrFuncs, function(err){
					if (err)
						$scope.error = err;
					else
						$scope.bDisabled = false;
					$timeout(function(){
						$scope.$apply();
					});
				});
			}
			else
				$scope.bDisabled = false;
			
			function insertSharedAddress(shared_address, arrDefinition, signers, cb){
				db.query("SELECT 1 FROM shared_addresses WHERE shared_address=?", [shared_address], function(rows){
					if (rows.length > 0){
						console.log('shared address '+shared_address+' already known');
						return cb();
					}
					walletDefinedByAddresses.handleNewSharedAddress({address: shared_address, definition: arrDefinition, signers: signers}, {
						ifOk: cb,
						ifError: function(err){
							throw Error('failed to create shared address '+shared_address+': '+err);
						}
					});
				});
			}

			
			$scope.pay = function() {
				console.log('pay');
				
				if (fc.isPrivKeyEncrypted()) {
					profileService.unlockFC(null, function(err) {
						if (err){
							$scope.error = err.message;
							$timeout(function(){
								$scope.$apply();
							});
							return;
						}
						$scope.pay();
					});
					return;
				}
				
				profileService.requestTouchid(function(err) {
					if (err) {
						profileService.lockFC();
						$scope.error = err;
						$timeout(function() {
							$scope.$digest();
						}, 1);
						return;
					}
					
					// create shared addresses
					var arrFuncs = [];
					for (var destinationAddress in assocSharedDestinationAddresses){
						(function(){ // use self-invoking function to isolate scope of da and make it different in different iterations
							var da = destinationAddress;
							arrFuncs.push(function(cb){
								var objDefinitionAndSigners = objMultiPaymentRequest.definitions[da];
								insertSharedAddress(da, objDefinitionAndSigners.definition, objDefinitionAndSigners.signers, cb);
							});
						})();
					}
					async.series(arrFuncs, function(){
						// shared addresses inserted, now pay
						var assocOutputsByAsset = {};
						objMultiPaymentRequest.payments.forEach(function(objPayment){
							var asset = objPayment.asset || 'base';
							if (!assocOutputsByAsset[asset])
								assocOutputsByAsset[asset] = [];
							assocOutputsByAsset[asset].push({address: objPayment.address, amount: objPayment.amount});
						});
						var arrNonBaseAssets = Object.keys(assocOutputsByAsset).filter(function(asset){ return (asset !== 'base'); });
						if (arrNonBaseAssets.length > 1){
							$scope.error = 'more than 1 non-base asset not supported';
							$timeout(function(){
								$scope.$apply();
							});
							return;
						}
						var asset = (arrNonBaseAssets.length > 0) ? arrNonBaseAssets[0] : null;
						var arrBaseOutputs = assocOutputsByAsset['base'] || [];
						var arrAssetOutputs = asset ? assocOutputsByAsset[asset] : null;
						var arrSigningDeviceAddresses = []; // empty list means that all signatures are required (such as 2-of-2)
						if (fc.credentials.m < fc.credentials.n)
							indexScope.copayers.forEach(function(copayer){
								if (copayer.me || copayer.signs)
									arrSigningDeviceAddresses.push(copayer.device_address);
							});
						else if (indexScope.shared_address)
							arrSigningDeviceAddresses = indexScope.copayers.map(function(copayer){ return copayer.device_address; });
						var current_multi_payment_key = require('crypto').createHash("sha256").update(paymentJson).digest('base64');
						if (current_multi_payment_key === indexScope.current_multi_payment_key){
							$rootScope.$emit('Local/ShowErrorAlert', "This payment is already under way");
							$modalInstance.dismiss('cancel');
							return;
						}
						indexScope.current_multi_payment_key = current_multi_payment_key;
						var recipient_device_address = lodash.clone(correspondent.device_address);
						fc.sendMultiPayment({
							asset: asset,
							arrSigningDeviceAddresses: arrSigningDeviceAddresses,
							recipient_device_address: recipient_device_address,
							base_outputs: arrBaseOutputs,
							asset_outputs: arrAssetOutputs
						}, function(err){ // can take long if multisig
							delete indexScope.current_multi_payment_key;
							if (err){
								if (chatScope){
									setError(err);
									$timeout(function() {
										chatScope.$apply();
									});
								}
								return;
							}
							$rootScope.$emit("NewOutgoingTx");
							var assocPaymentsByAsset = correspondentListService.getPaymentsByAsset(objMultiPaymentRequest);
							var bToSharedAddress = objMultiPaymentRequest.payments.some(function(objPayment){
								return assocSharedDestinationAddresses[objPayment.address];
							});
							for (var asset in assocPaymentsByAsset)
								eventBus.emit('sent_payment', recipient_device_address, assocPaymentsByAsset[asset], asset, bToSharedAddress);
						});
						$modalInstance.dismiss('cancel');
					});
				});
			}; // pay
			

			$scope.cancel = function() {
				$modalInstance.dismiss('cancel');
			};
		};
		
		function extractAddressesFromDefinition(arrDefinition){
			var assocAddresses = {};
			function parse(arrSubdefinition){
				var op = arrSubdefinition[0];
				switch(op){
					case 'address':
					case 'cosigned by':
						assocAddresses[arrSubdefinition[1]] = true;
						break;
					case 'or':
					case 'and':
						arrSubdefinition[1].forEach(parse);
						break;
					case 'r of set':
						arrSubdefinition[1].set.forEach(parse);
						break;
					case 'weighted and':
						arrSubdefinition[1].set.forEach(function(arg){
							parse(arg.value);
						});
						break;
				}
			}
			parse(arrDefinition);
			return Object.keys(assocAddresses);
		}
		
		var modalInstance = $modal.open({
			templateUrl: 'views/modals/multi-payment.html',
			windowClass: animationService.modalAnimated.slideUp,
			controller: ModalInstanceCtrl,
			scope: $scope
		});

		var disableCloseModal = $rootScope.$on('closeModal', function() {
			modalInstance.dismiss('cancel');
		});

		modalInstance.result.finally(function() {
			$rootScope.modalOpened = false;
			disableCloseModal();
			var m = angular.element(document.getElementsByClassName('reveal-modal'));
			m.addClass(animationService.modalAnimated.slideOutDown);
		});
	};
	

	
	$scope.sendVote = function(voteJsonBase64){
		var voteJson = Buffer(voteJsonBase64, 'base64').toString('utf8');
		console.log("vote "+voteJson);
		var objVote = JSON.parse(voteJson);
		$rootScope.modalOpened = true;
		var self = this;
		var fc = profileService.focusedClient;
		
		var ModalInstanceCtrl = function($scope, $modalInstance) {
			$scope.choice = objVote.choice;
			$scope.color = fc.backgroundColor;
			$scope.bDisabled = true;
			setPollQuestion(true);
			
			function setPollQuestion(bFirstAttempt){
				db.query("SELECT question FROM polls WHERE unit=?", [objVote.poll_unit], function(rows){
					if (rows.length > 1)
						throw Error("more than 1 poll?");
					if (rows.length === 0){
						if (conf.bLight && bFirstAttempt){
							$scope.question = '[Fetching the question...]';
							network.requestProofsOfJointsIfNewOrUnstable([objVote.poll_unit], function(err){
								if (err){
									$scope.error = err;
									return scopeApply();
								}
								setPollQuestion();
							});
						}
						else
							$scope.question = '[No such poll: '+objVote.poll_unit+']';
					}
					else{
						$scope.question = rows[0].question;
						$scope.bDisabled = false;
					}
					scopeApply();
				});
			}
			
			function scopeApply(){
				$timeout(function(){
					$scope.$apply();
				});
			}

			function readVotingAddresses(handleAddresses){
				if (indexScope.shared_address)
					return handleAddresses([indexScope.shared_address]);
				db.query(
					"SELECT address, SUM(amount) AS total FROM my_addresses JOIN outputs USING(address) \n\
					WHERE wallet=? AND is_spent=0 AND asset IS NULL GROUP BY address ORDER BY total DESC LIMIT 16", 
					[fc.credentials.walletId], 
					function(rows){
						var arrAddresses = rows.map(function(row){ return row.address; });
						handleAddresses(arrAddresses);
					}
				);
			}
			
			$scope.vote = function() {
				console.log('vote');
				
				if (fc.isPrivKeyEncrypted()) {
					profileService.unlockFC(null, function(err) {
						if (err){
							$scope.error = err.message;
							return scopeApply();
						}
						$scope.vote();
					});
					return;
				}
				
				profileService.requestTouchid(function(err) {
					if (err) {
						profileService.lockFC();
						$scope.error = err;
						return scopeApply();
					}
					
					readVotingAddresses(function(arrAddresses){
						if (arrAddresses.length === 0){
							$scope.error = "Cannot vote, no funded addresses.";
							return scopeApply();
						}
						var payload = {unit: objVote.poll_unit, choice: objVote.choice};
						var objMessage = {
							app: 'vote',
							payload_location: "inline",
							payload_hash: objectHash.getBase64Hash(payload),
							payload: payload
						};

						var arrSigningDeviceAddresses = []; // empty list means that all signatures are required (such as 2-of-2)
						if (fc.credentials.m < fc.credentials.n)
							indexScope.copayers.forEach(function(copayer){
								if (copayer.me || copayer.signs)
									arrSigningDeviceAddresses.push(copayer.device_address);
							});
						else if (indexScope.shared_address)
							arrSigningDeviceAddresses = indexScope.copayers.map(function(copayer){ return copayer.device_address; });
						var current_vote_key = require('crypto').createHash("sha256").update(voteJson).digest('base64');
						if (current_vote_key === indexScope.current_vote_key){
							$rootScope.$emit('Local/ShowErrorAlert', "This vote is already under way");
							$modalInstance.dismiss('cancel');
							return;
						}
						var recipient_device_address = lodash.clone(correspondent.device_address);
						indexScope.current_vote_key = current_vote_key;
						fc.sendMultiPayment({
							arrSigningDeviceAddresses: arrSigningDeviceAddresses,
							paying_addresses: arrAddresses,
							signing_addresses: arrAddresses,
							shared_address: indexScope.shared_address,
							change_address: arrAddresses[0],
							messages: [objMessage]
						}, function(err){ // can take long if multisig
							delete indexScope.current_vote_key;
							if (err){
								if (chatScope){
									setError(err);
									$timeout(function() {
										chatScope.$apply();
									});
								}
								return;
							}
							var body = 'voted:'+objVote.choice;
							device.sendMessageToDevice(recipient_device_address, 'text', body);
							correspondentListService.addMessageEvent(false, recipient_device_address, body);
							$rootScope.$emit("NewOutgoingTx");
						});
						$modalInstance.dismiss('cancel');
					});
					
				});
			}; // vote
			

			$scope.cancel = function() {
				$modalInstance.dismiss('cancel');
			};
		};
		
		
		var modalInstance = $modal.open({
			templateUrl: 'views/modals/vote.html',
			windowClass: animationService.modalAnimated.slideUp,
			controller: ModalInstanceCtrl,
			scope: $scope
		});

		var disableCloseModal = $rootScope.$on('closeModal', function() {
			modalInstance.dismiss('cancel');
		});

		modalInstance.result.finally(function() {
			$rootScope.modalOpened = false;
			disableCloseModal();
			var m = angular.element(document.getElementsByClassName('reveal-modal'));
			m.addClass(animationService.modalAnimated.slideOutDown);
		});
		
	}; // sendVote
	
	
	
	
	// send a command to the bot
	$scope.sendCommand = function(command, description){
		console.log("will send command "+command);
		$scope.message = command;
		$scope.send();
	};
	
	$scope.openExternalLink = function(url){
		if (typeof nw !== 'undefined')
			nw.Shell.openExternal(url);
		else if (isCordova)
			cordova.InAppBrowser.open(url, '_system');
	};

	$scope.editCorrespondent = function() {
		go.path('correspondentDevices.correspondentDevice.editCorrespondentDevice');
	};

	$scope.loadMoreHistory = function(cb) {
		correspondentListService.loadMoreHistory(correspondent, cb);
	}

	$scope.autoScrollEnabled = true;
	$scope.loadMoreHistory(function(){
		for (var i in $scope.messageEvents) {
			var message = $scope.messageEvents[i];
			if (message.chat_recording_status) {
				return;
			}
		}
		breadcrumbs.add("correspondent with empty chat opened: " + correspondent.device_address);
		var message = {
			type: 'system',
			bIncoming: false,
			message: JSON.stringify({state: (correspondent.peer_record_pref && correspondent.my_record_pref ? true : false)}),
			timestamp: Math.floor(+ new Date() / 1000),
			chat_recording_status: true
		};
		chatStorage.store(correspondent.device_address, message.message, 0, 'system');
		$scope.messageEvents.push(correspondentListService.parseMessage(message));
	});

	function setError(error){
		console.log("send error:", error);
		$scope.error = error;
	}
	
	function readLastMainChainIndex(cb){
		if (conf.bLight){
			network.requestFromLightVendor('get_last_mci', null, function(ws, request, response){
				response.error ? cb(response.error) : cb(null, response);
			});
		}
		else
			storage.readLastMainChainIndex(function(last_mci){
				cb(null, last_mci);
			})
	}
	
	function readMyPaymentAddress(cb){
	//	if (indexScope.shared_address)
	//		return cb(indexScope.shared_address);
		addressService.getAddress(profileService.focusedClient.credentials.walletId, false, function(err, address) {
			cb(address);
		});
	}
	
	function issueNextAddress(cb){
		var walletDefinedByKeys = require('byteballcore/wallet_defined_by_keys.js');
		walletDefinedByKeys.issueNextAddress(profileService.focusedClient.credentials.walletId, 0, function(addressInfo){
			if (cb)
				cb(addressInfo.address);
		});
	}
	
	/*
	function issueNextAddressIfNecessary(onDone){
		if (myPaymentAddress) // do not issue new address
			return onDone();
		var walletDefinedByKeys = require('byteballcore/wallet_defined_by_keys.js');
		walletDefinedByKeys.issueOrSelectNextAddress(fc.credentials.walletId, 0, function(addressInfo){
			myPaymentAddress = addressInfo.address; // cache it in case we need to insert again
			onDone();
			$scope.$apply();
		});
	}*/
	
	function appendText(text){
		if (!$scope.message)
			$scope.message = '';
		if ($scope.message && $scope.message.charAt($scope.message.length - 1) !== ' ')
			$scope.message += ' ';
		$scope.message += text;
		$scope.message += ' ';
		if (!document.chatForm || !document.chatForm.message) // already gone
			return;
		var msgField = document.chatForm.message;
		$timeout(function(){$rootScope.$digest()});
		msgField.selectionStart = msgField.selectionEnd = msgField.value.length;
	}
	
	function appendMyPaymentAddress(myPaymentAddress){
		appendText(myPaymentAddress);
	}
	
	function showRequestPaymentModal(myPaymentAddress){
		$rootScope.modalOpened = true;
		var self = this;
		var fc = profileService.focusedClient;
		var ModalInstanceCtrl = function($scope, $modalInstance) {
			var config = configService.getSync();
			var configWallet = config.wallet;
			var walletSettings = configWallet.settings;
			$scope.unitValue = walletSettings.unitValue;
			$scope.unitName = walletSettings.unitName;
			$scope.bbUnitValue = walletSettings.bbUnitValue;
			$scope.bbUnitName = walletSettings.bbUnitName;
			$scope.color = fc.backgroundColor;
			$scope.isCordova = isCordova;
			$scope.buttonLabel = 'Request payment';
			//$scope.selectedAsset = $scope.index.arrBalances[$scope.index.assetIndex];
			//console.log($scope.index.arrBalances.length+" assets, current: "+$scope.asset);

			Object.defineProperty($scope,
				"_customAmount", {
				get: function() {
					return $scope.customAmount;
				},
				set: function(newValue) {
					$scope.customAmount = newValue;
				},
				enumerable: true,
				configurable: true
			});

			$scope.submitForm = function(form) {
				if ($scope.index.arrBalances.length === 0)
					return console.log('showRequestPaymentModal: no balances yet');
				var amount = form.amount.$modelValue;
				//var asset = form.asset.$modelValue;
				var asset = $scope.index.arrBalances[$scope.index.assetIndex].asset;
				if (!asset)
					throw Error("no asset");
				var amountInSmallestUnits = profileService.getAmountInSmallestUnits(amount, asset);
				var params = 'amount='+amountInSmallestUnits;
				if (asset !== 'base')
					params += '&asset='+encodeURIComponent(asset);
				var units = profileService.getUnitName(asset);
				appendText('['+amount+' '+units+'](byteball:'+myPaymentAddress+'?'+params+')');
				$modalInstance.dismiss('cancel');
			};

			$scope.cancel = function() {
				$modalInstance.dismiss('cancel');
			};
		};

		var modalInstance = $modal.open({
			templateUrl: 'views/modals/customized-amount.html',
			windowClass: animationService.modalAnimated.slideUp,
			controller: ModalInstanceCtrl,
			scope: $scope
		});

		var disableCloseModal = $rootScope.$on('closeModal', function() {
			modalInstance.dismiss('cancel');
		});

		modalInstance.result.finally(function() {
			$rootScope.modalOpened = false;
			disableCloseModal();
			var m = angular.element(document.getElementsByClassName('reveal-modal'));
			m.addClass(animationService.modalAnimated.slideOutDown);
		});
	}
	

	function checkIfPrivateProfileExists(objPrivateProfile, handleResult){
		db.query("SELECT 1 FROM private_profiles WHERE unit=? AND payload_hash=?", [objPrivateProfile.unit, objPrivateProfile.payload_hash], function(rows){
			handleResult(rows.length > 0);
		});
	}
	
	function getDisplayField(field){
		switch (field){
			case 'first_name': return gettext('First name');
			case 'last_name': return gettext('Last name');
			case 'dob': return gettext('Date of birth');
			case 'country': return gettext('Country');
			case 'us_state': return gettext('US state');
			case 'id_number': return gettext('ID number');
			case 'id_type': return gettext('ID type');
			case 'id_subtype': return gettext('ID subtype');
			default: return field;
		}
	}
	
	$scope.acceptPrivateProfile = function(privateProfileJsonBase64){
		$rootScope.modalOpened = true;
		var objPrivateProfile = privateProfile.getPrivateProfileFromJsonBase64(privateProfileJsonBase64);
		if (!objPrivateProfile)
			throw Error('failed to parse the already validated base64 private profile '+privateProfileJsonBase64);
		var fc = profileService.focusedClient;
		var ModalInstanceCtrl = function($scope, $modalInstance) {
			$scope.color = fc.backgroundColor;
			var openProfile = {};
			for (var field in objPrivateProfile.src_profile)
				if (Array.isArray(objPrivateProfile.src_profile[field]))
					openProfile[field] = objPrivateProfile.src_profile[field][0];
			$scope.openProfile = openProfile;
			$scope.bDisabled = true;
			$scope.buttonLabel = gettext('Verifying the profile...');
			privateProfile.parseAndValidatePrivateProfile(objPrivateProfile, function(error, address, attestor_address, bMyAddress){
				if (!$scope)
					return;
				if (error){
					$scope.error = error;
					$scope.buttonLabel = gettext('Bad profile');
					$timeout(function() {
						$rootScope.$apply();
					});
					return;
				}
				$scope.address = address;
				$scope.attestor_address = attestor_address;
				$scope.bMyAddress = bMyAddress;
				if (!bMyAddress)
					return $timeout(function() {
						$rootScope.$apply();
					});
				checkIfPrivateProfileExists(objPrivateProfile, function(bExists){
					if (bExists)
						$scope.buttonLabel = gettext('Already saved');
					else{
						$scope.buttonLabel = gettext('Store');
						$scope.bDisabled = false;
					}
					$timeout(function() {
						$rootScope.$apply();
					});
				});
			});
			
			$scope.getDisplayField = getDisplayField;

			$scope.store = function() {
				if (!$scope.bMyAddress)
					throw Error("not my address");
				privateProfile.savePrivateProfile(objPrivateProfile, $scope.address, $scope.attestor_address, function(){
					$timeout(function(){
						$modalInstance.dismiss('cancel');
					});
				});
			};

			$scope.cancel = function() {
				$modalInstance.dismiss('cancel');
			};
		};

		var modalInstance = $modal.open({
			templateUrl: 'views/modals/accept-profile.html',
			windowClass: animationService.modalAnimated.slideUp,
			controller: ModalInstanceCtrl,
			scope: $scope
		});

		var disableCloseModal = $rootScope.$on('closeModal', function() {
			modalInstance.dismiss('cancel');
		});

		modalInstance.result.finally(function() {
			$rootScope.modalOpened = false;
			disableCloseModal();
			var m = angular.element(document.getElementsByClassName('reveal-modal'));
			m.addClass(animationService.modalAnimated.slideOutDown);
		});
	};
	
	
	
	$scope.choosePrivateProfile = function(fields_list){
		$rootScope.modalOpened = true;
		var arrFields = fields_list ? fields_list.split(',') : [];
		var fc = profileService.focusedClient;
		var ModalInstanceCtrl = function($scope, $modalInstance) {
			$scope.color = fc.backgroundColor;
			$scope.requested = !!fields_list;
			$scope.bDisabled = true;
			var sql = fields_list
				? "SELECT private_profiles.*, COUNT(*) AS c FROM private_profile_fields JOIN private_profiles USING(private_profile_id) \n\
					WHERE field IN(?) GROUP BY private_profile_id HAVING c=?"
				: "SELECT * FROM private_profiles";
			var params = fields_list ? [arrFields, arrFields.length] : [];
			readMyPaymentAddress(function(current_address){
				db.query(sql, params, function(rows){
					var arrProfiles = [];
					async.eachSeries(
						rows,
						function(row, cb){
							var profile = row;
							db.query(
								"SELECT field, value, blinding FROM private_profile_fields WHERE private_profile_id=? ORDER BY rowid", 
								[profile.private_profile_id], 
								function(vrows){
									profile.entries = vrows;
									var assocValuesByField = {};
									profile.entries.forEach(function(entry){
										entry.editable = !fields_list;
										if (arrFields.indexOf(entry.field) >= 0)
											entry.provided = true;
										assocValuesByField[entry.field] = entry.value;
									});
									if (fields_list){
										profile._label = assocValuesByField[arrFields[0]];
										if (arrFields[1])
											profile._label += ' ' + assocValuesByField[arrFields[1]];
									}
									else{
										profile._label = profile.entries[0].value;
										if (profile.entries[1])
											profile._label += ' ' + profile.entries[1].value;
									}
									profile.bCurrentAddress = (profile.address === current_address);
									arrProfiles.push(profile);
									cb();
								}
							);
						},
						function(){
							// add date if duplicate labels
							var assocLabels = {};
							var assocDuplicateLabels = {};
							arrProfiles.forEach(function(profile){
								if (assocLabels[profile._label])
									assocDuplicateLabels[profile._label] = true;
								assocLabels[profile._label] = true;
							});
							arrProfiles.forEach(function(profile){
								if (assocDuplicateLabels[profile._label])
									profile._label += ' ' + profile.creation_date;
							});
							// sort profiles: current address first
							arrProfiles.sort(function(p1, p2){
								if (p1.bCurrentAddress && !p2.bCurrentAddress)
									return -1;
								if (!p1.bCurrentAddress && p2.bCurrentAddress)
									return 1;
								return (p1.creation_date > p2.creation_date) ? -1 : 1; // newest first
							});
							$scope.arrProfiles = arrProfiles;
							$scope.vars = {selected_profile: arrProfiles[0]};
							$scope.bDisabled = false;
							if (arrProfiles.length === 0){
								if (!fields_list)
									$scope.noProfiles = true;
								else
									db.query("SELECT 1 FROM private_profiles LIMIT 1", function(rows2){
										if (rows2.length > 0)
											return;
										$scope.noProfiles = true;
										$timeout(function() {
											$rootScope.$apply();
										});
									});
							}
							$timeout(function() {
								$rootScope.$apply();
							});
						}
					);
				});
			});
			
			$scope.getDisplayField = getDisplayField;
			
			$scope.noFieldsProvided = function(){
				var entries = $scope.vars.selected_profile.entries;
				for (var i=0; i<entries.length; i++)
					if (entries[i].provided)
						return false;
				return true;
			};
			
			$scope.send = function() {
				var profile = $scope.vars.selected_profile;
				if (!profile)
					throw Error("no selected profile");
				console.log('selected profile', profile);
				var objPrivateProfile = {
					unit: profile.unit,
					payload_hash: profile.payload_hash,
					src_profile: {}
				};
				profile.entries.forEach(function(entry){
					var value = [entry.value, entry.blinding];
					objPrivateProfile.src_profile[entry.field] = entry.provided ? value : objectHash.getBase64Hash(value);
				});
				console.log('will send '+JSON.stringify(objPrivateProfile));
				var privateProfileJsonBase64 = Buffer.from(JSON.stringify(objPrivateProfile)).toString('base64');
				appendText('[Private profile](profile:'+privateProfileJsonBase64+')');
				$modalInstance.dismiss('cancel');
			};

			$scope.cancel = function() {
				$modalInstance.dismiss('cancel');
			};
		};

		var modalInstance = $modal.open({
			templateUrl: 'views/modals/choose-profile.html',
			windowClass: animationService.modalAnimated.slideUp,
			controller: ModalInstanceCtrl,
			scope: $scope
		});

		var disableCloseModal = $rootScope.$on('closeModal', function() {
			modalInstance.dismiss('cancel');
		});

		modalInstance.result.finally(function() {
			$rootScope.modalOpened = false;
			disableCloseModal();
			var m = angular.element(document.getElementsByClassName('reveal-modal'));
			m.addClass(animationService.modalAnimated.slideOutDown);
		});
	};
	
	

	function setOngoingProcess(name) {
		if (isCordova) {
			if (name) {
				window.plugins.spinnerDialog.hide();
				window.plugins.spinnerDialog.show(null, name + '...', true);
			} else {
				window.plugins.spinnerDialog.hide();
			}
		} else {
			$scope.onGoingProcess = name;
			$timeout(function() {
				$rootScope.$apply();
			});
		}
	};

	$scope.goToCorrespondentDevices = function() {
		$deepStateRedirect.reset('correspondentDevices');
		go.path('correspondentDevices');
	}
}).directive('sendPayment', function($compile){
	console.log("sendPayment directive");
	return {
		replace: true,
		//scope: {address: '@'},
		//template: '<a ng-click="sendPayment(address)">{{address}}</a>',
		//template: '<a ng-click="console.log(789)">{{address}} 88</a>',
		link: function($scope, element, attrs){
			console.log("link called", attrs, element);
			//element.attr('ng-click', "console.log(777)");
			//element.removeAttr('send-payment');
			//$compile(element)($scope);
			//$compile(element.contents())($scope);
			//element.replaceWith($compile('<a ng-click="sendPayment(\''+attrs.address+'\')">'+attrs.address+'</a>')(scope));
			//element.append($compile('<a ng-click="console.log(123456)">'+attrs.address+' 99</a>')($scope));
			element.bind('click', function(){
				console.log('clicked', attrs);
				$scope.sendPayment(attrs.address);
			});
		}
	};
}).directive('dynamic', function ($compile) {
	return {
		restrict: 'A',
		replace: true,
		link: function (scope, ele, attrs) {
			scope.$watch(attrs.dynamic, function(html) {
				ele.html(html);
				$compile(ele.contents())(scope);
			});
		}
	};
}).directive('scrollBottom', function ($timeout) { // based on http://plnkr.co/edit/H6tFjw1590jHT28Uihcx?p=preview
	return {
		link: function (scope, element) {
			scope.$watchCollection('messageEvents', function (newCollection) {
				if (newCollection)
					$timeout(function(){
						if (scope.autoScrollEnabled)
							element[0].scrollTop = element[0].scrollHeight;
					}, 100);
			});
		}
	}
}).directive('bindToHeight', function ($window) {
	return {
		restrict: 'A',
		link: function (scope, elem, attrs) {
			var attributes = scope.$eval(attrs['bindToHeight']);
			var targetElem = angular.element(document.querySelector(attributes[1]));

			// Watch for changes
			scope.$watch(function () {
				return targetElem[0].clientHeight;
			},
			function (newValue, oldValue) {
				if (newValue != oldValue && newValue != 0) {
					elem.css(attributes[0], newValue + 'px');
					//elem[0].scrollTop = elem[0].scrollHeight;
				}
			});
		}
	};
}).directive('ngEnter', function() {
    return function(scope, element, attrs) {
        element.bind("keydown", function onNgEnterKeydown(e) {
            if(e.which === 13 && !e.shiftKey) {
                scope.$apply(function(){
                    scope.$eval(attrs.ngEnter, {'e': e});
                });
                e.preventDefault();
            }
        });
    };
}).directive('whenScrolled', ['$timeout', function($timeout) {
	function ScrollPosition(node) {
	    this.node = node;
	    this.previousScrollHeightMinusTop = 0;
	    this.readyFor = 'up';
	}

	ScrollPosition.prototype.restore = function () {
	    if (this.readyFor === 'up') {
	        this.node.scrollTop = this.node.scrollHeight
	            - this.previousScrollHeightMinusTop;
	    }
	}

	ScrollPosition.prototype.prepareFor = function (direction) {
	    this.readyFor = direction || 'up';
	    this.previousScrollHeightMinusTop = this.node.scrollHeight
	        - this.node.scrollTop;
	}

    return function(scope, elm, attr) {
        var raw = elm[0];

        var chatScrollPosition = new ScrollPosition(raw);
        
        $timeout(function() {
            raw.scrollTop = raw.scrollHeight;
        });
        
        elm.bind('scroll', function() {
        	if (raw.scrollTop + raw.offsetHeight != raw.scrollHeight) 
        		scope.autoScrollEnabled = false;
        	else 
        		scope.autoScrollEnabled = true;
            if (raw.scrollTop <= 20 && !scope.loadingHistory) { // load more items before you hit the top
                scope.loadingHistory = true;
                chatScrollPosition.prepareFor('up');
            	scope[attr.whenScrolled](function(){
            		scope.$digest();
                	chatScrollPosition.restore();
                	scope.loadingHistory = false;
                });
            }
        });
    };
}]);
