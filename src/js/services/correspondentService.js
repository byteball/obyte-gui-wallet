"use strict";

var constants = require("ocore/constants.js");
var eventBus = require("ocore/event_bus.js");
var ValidationUtils = require("ocore/validation_utils.js");
var objectHash = require("ocore/object_hash.js");

angular.module("copayApp.services").factory("correspondentService", function($rootScope, $modal, $timeout, go, animationService, configService, profileService, lodash, txFormatService, correspondentListService) {
	var root = {};
	var device = require("ocore/device.js");
	var chatStorage = require("ocore/chat_storage.js");

	function populateScopeWithAttestedFields(scope, my_address, peer_address, cb) {
		var privateProfile = require("ocore/private_profile.js");
		scope.my_name = "NAME UNKNOWN";
		scope.my_attestor = {};
		scope.peer_name = "NAME UNKNOWN";
		scope.peer_attestor = {};
		async.series([function(cb2) {
			privateProfile.getFieldsForAddress(peer_address, ["first_name", "last_name"], lodash.map(configService.getSync().realNameAttestorAddresses, function(a){return a.address;}), function(profile) {
				if (profile.first_name && profile.last_name) {
					scope.peer_name = profile.first_name +" "+ profile.last_name;
					scope.peer_attestor = {address: profile.attestor_address, attestation_unit: profile.attestation_unit, trusted: !!lodash.find(configService.getSync().realNameAttestorAddresses, function(attestor){return attestor.address === profile.attestor_address;})};
				}
				cb2();
			});
		}, function(cb2) {
			privateProfile.getFieldsForAddress(my_address, ["first_name", "last_name"], lodash.map(configService.getSync().realNameAttestorAddresses, function(a){return a.address;}), function(profile) {
				if (profile.first_name && profile.last_name) {
					scope.my_name = profile.first_name +" "+ profile.last_name;
					scope.my_attestor = {address: profile.attestor_address, attestation_unit: profile.attestation_unit, trusted: !!lodash.find(configService.getSync().realNameAttestorAddresses, function(attestor){return attestor.address === profile.attestor_address;})};
				}
				cb2();
			});
		}, function(cb2) {
			if (Object.keys(scope.peer_attestor).length) {
				return cb2();
			}
			privateProfile.getFieldsForAddress(peer_address, ["name"], lodash.map(configService.getSync().realNameAttestorAddresses, function(a){return a.address;}), function(profile) {
				if (profile.name) {
					scope.peer_name = profile.name;
					scope.peer_attestor = {address: profile.attestor_address, attestation_unit: profile.attestation_unit, trusted: !!lodash.find(configService.getSync().realNameAttestorAddresses, function(attestor){return attestor.address === profile.attestor_address;})};
				}
				cb2();
			});
		}, function(cb2) {
			if (Object.keys(scope.my_attestor).length) {
				return cb2();
			}
			privateProfile.getFieldsForAddress(my_address, ["name"], lodash.map(configService.getSync().realNameAttestorAddresses, function(a){return a.address;}), function(profile) {
				if (profile.name) {
					scope.my_name = profile.name;
					scope.my_attestor = {address: profile.attestor_address, attestation_unit: profile.attestation_unit, trusted: !!lodash.find(configService.getSync().realNameAttestorAddresses, function(attestor){return attestor.address === profile.attestor_address;})};
				}
				cb2();
			});
		}], function(){
			cb();
		});
	}

	function listenForProsaicContractResponse(contracts) {
		var prosaic_contract = require("ocore/prosaic_contract.js");
		var storage = require("ocore/storage.js");

		var showError = function(msg) {
			$rootScope.$emit("Local/ShowErrorAlert", msg);
		};

		var start_listening = function(contracts) {
			contracts.forEach(function(contract){
				console.log("listening for prosaic contract response " + contract.hash);

				var sendUnit = function(accepted, authors){
					if (!accepted) {
						return;
					}

					if (profileService.focusedClient.isPrivKeyEncrypted()) {
						profileService.unlockFC(null, function(err) {
							if (err){
								showError(err);
								return;
							}
							sendUnit(accepted, authors);
						});
						return;
					}
					
					root.readLastMainChainIndex(function(err, last_mci){
						if (err){
							showError(err);
							return;
						}
						var arrDefinition = 
							["and", [
								["address", contract.my_address],
								["address", contract.peer_address]
							]];
						var assocSignersByPath = {
							"r.0": {
								address: contract.my_address,
								member_signing_path: "r",
								device_address: device.getMyDeviceAddress()
							},
							"r.1": {
								address: contract.peer_address,
								member_signing_path: "r",
								device_address: contract.peer_device_address
							}
						};
						require("ocore/wallet_defined_by_addresses.js").createNewSharedAddress(arrDefinition, assocSignersByPath, {
							ifError: function(err){
								showError(err);
							},
							ifOk: function(shared_address){
								composeAndSend(shared_address);
							}
						});
					});
					
					// create shared address and deposit some bytes to cover fees
					function composeAndSend(shared_address){
						prosaic_contract.setField(contract.hash, "shared_address", shared_address);
						device.sendMessageToDevice(contract.peer_device_address, "prosaic_contract_update", {
							hash: contract.hash,
							field: "shared_address",
							value: shared_address
						});
						contract.cosigners.forEach(function(cosigner){
							if (cosigner !== device.getMyDeviceAddress())
								prosaic_contract.share(contract.hash, cosigner);
						});

						profileService.bKeepUnlocked = true;
						var opts = {
							asset: "base",
							to_address: shared_address,
							amount: prosaic_contract.CHARGE_AMOUNT,
							arrSigningDeviceAddresses: contract.cosigners
						};
						profileService.focusedClient.sendMultiPayment(opts, function(err, unit){
							// if multisig, it might take very long before the callback is called
							//self.setOngoingProcess();
							profileService.bKeepUnlocked = false;
							$rootScope.sentUnit = unit;
							if (err){
								if (err.match(/device address/))
									err = "This is a private asset, please send it only by clicking links from chat";
								if (err.match(/no funded/))
									err = "Not enough spendable funds, make sure all your funds are confirmed";
								showError(err);
								return;
							}
							$rootScope.$emit("NewOutgoingTx");

							// post a unit with contract text hash and send it for signing to correspondent
							var value = {"contract_text_hash": contract.hash};
							var objMessage = {
								app: "data",
								payload_location: "inline",
								payload_hash: objectHash.getBase64Hash(value, storage.getMinRetrievableMci() >= constants.timestampUpgradeMci),
								payload: value
							};

							profileService.focusedClient.sendMultiPayment({
								arrSigningDeviceAddresses: contract.cosigners.length ? contract.cosigners.concat([contract.peer_device_address]) : [],
								shared_address: shared_address,
								messages: [objMessage]
							}, function(err, unit) { // can take long if multisig
								$rootScope.sentUnit = unit;
								if (err) {
									showError(err);
									return;
								}
								prosaic_contract.setField(contract.hash, "unit", unit);
								device.sendMessageToDevice(contract.peer_device_address, "prosaic_contract_update", {
									hash: contract.hash,
									field: "unit",
									value: unit
								});
								var testnet = constants.version.match(/t$/) ? "testnet" : "";
								var url = "https://" + testnet + "explorer.obyte.org/#" + unit;
								var text = "unit with contract hash for \""+ contract.title +"\" was posted into DAG " + url;
								correspondentListService.addMessageEvent(false, contract.peer_device_address, correspondentListService.formatOutgoingMessage(text));
								device.sendMessageToDevice(contract.peer_device_address, "text", text);
							});
						});
					}
				};
				eventBus.once("prosaic_contract_response_received" + contract.hash, sendUnit);
			});
		};

		if (contracts) {
			return start_listening(contracts);
		}
		prosaic_contract.getAllByStatus("pending", function(contracts){
			start_listening(contracts);
		});
	}

	function listenForArbiterContractResponse(contracts) {
		var arbiter_contract = require("ocore/arbiter_contract.js");
		var storage = require("ocore/storage.js");

		var showError = function(msg) {
			$rootScope.$emit("Local/ShowErrorAlert", msg);
		}

		var start_listening = function(contracts) {
			contracts.forEach(function(contract){
				console.log("listening for arbiter contract response " + contract.hash);

				// sendUnit can be called multiple times, as we now allow "accepting" the same contract multiple times in case previous tries fail
				var sendUnit = function(accepted, authors){
					if (!accepted) {
						return;
					}

					if (profileService.focusedClient.isPrivKeyEncrypted()) {
						profileService.unlockFC(null, function(err) {
							if (err){
								showError(err);
								return;
							}
							sendUnit(accepted, authors);
						});
						return;
					}
					
					root.readLastMainChainIndex(function(err, last_mci){
						if (err){
							showError(err);
							return;
						}
						var arrDefinition =
						["or", [
							["and", [
								["address", contract.my_address],
								["address", contract.peer_address]
							]],
							["and", [
						        ["address", contract.my_address],
						        ["has", {
						            what: "output",
						            asset: contract.asset || "base", 
						            amount: contract.amount, 
						            address: contract.peer_address
						        }]
						    ]],
						    ["and", [
						        ["address", contract.peer_address],
						        ["has", {
						            what: "output",
						            asset: contract.asset || "base", 
						            amount: contract.amount, 
						            address: contract.my_address
						        }]
						    ]],
							["and", [
						        ["address", contract.my_address],
						        ["in data feed", [[contract.arbiter_address], "CONTRACT_" + contract.hash, "=", contract.my_address]]
						    ]],
						    ["and", [
						        ["address", contract.peer_address],
						        ["in data feed", [[contract.arbiter_address], "CONTRACT_" + contract.hash, "=", contract.peer_address]]
						    ]]
						]];
						var assocSignersByPath = {
							"r.0.0": {
								address: contract.my_address,
								member_signing_path: "r",
								device_address: device.getMyDeviceAddress()
							},
							"r.0.1": {
								address: contract.peer_address,
								member_signing_path: "r",
								device_address: contract.peer_device_address
							},
							"r.1.0": {
								address: contract.my_address,
								member_signing_path: "r",
								device_address: device.getMyDeviceAddress()
							},
							"r.2.0": {
								address: contract.peer_address,
								member_signing_path: "r",
								device_address: contract.peer_device_address
							},
							"r.3.0": {
								address: contract.my_address,
								member_signing_path: "r",
								device_address: device.getMyDeviceAddress()
							},
							"r.4.0": {
								address: contract.peer_address,
								member_signing_path: "r",
								device_address: contract.peer_device_address
							},
						};
						require("ocore/wallet_defined_by_addresses.js").createNewSharedAddress(arrDefinition, assocSignersByPath, {
							ifError: function(err){
								showError(err);
							},
							ifOk: function(shared_address){
								composeAndSend(shared_address);
							}
						});
					});
					
					// create shared address and deposit some bytes to cover fees
					function composeAndSend(shared_address){
						
						arbiter_contract.setField(contract.hash, "shared_address", shared_address);

						var allCosigners = [];
						require('ocore/wallet_defined_by_keys.js').readCosigners(profileService.focusedClient.credentials.walletId, function(arrCosignerInfos){
							allCosigners = arrCosignerInfos;
							allCosigners.forEach(function(cosigner){
								if (cosigner.device_address != device.getMyDeviceAddress())
									arbiter_contract.share(contract.hash, cosigner.device_address);
							});
						});

						profileService.bKeepUnlocked = true;
						/*var opts = {
							asset: "base",
							to_address: shared_address,
							amount: arbiter_contract.CHARGE_AMOUNT,
							arrSigningDeviceAddresses: contract.cosigners
						};
						profileService.focusedClient.sendMultiPayment(opts, function(err, unit){
							// if multisig, it might take very long before the callback is called
							//self.setOngoingProcess();
							profileService.bKeepUnlocked = false;
							$rootScope.sentUnit = unit;
							if (err){
								if (err.match(/device address/))
									err = "This is a private asset, please send it only by clicking links from chat";
								if (err.match(/no funded/))
									err = "Not enough spendable funds, make sure all your funds are confirmed";
								showError(err);
								return;
							}
							$rootScope.$emit("NewOutgoingTx");*/

							// post a unit with contract text hash and send it for signing to correspondent
							var value = {"contract_text_hash": contract.hash, "arbiter": contract.arbiter_address};
							var objContractMessage = {
								app: "data",
								payload_location: "inline",
								payload_hash: objectHash.getBase64Hash(value, storage.getMinRetrievableMci() >= constants.timestampUpgradeMci),
								payload: value
							};

							profileService.focusedClient.sendMultiPayment({
								asset: "base",
								to_address: shared_address,
								amount: arbiter_contract.CHARGE_AMOUNT,
								arrSigningDeviceAddresses: contract.cosigners.length ? contract.cosigners.concat([contract.peer_device_address]) : [],
								signing_addresses: [shared_address],
								messages: [objContractMessage]
							}, function(err, unit) { // can take long if multisig
								$rootScope.sentUnit = unit;
								if (err) {
									showError(err);
									return;
								}
								// shared address
								//arbiter_contract.setField(contract.hash, "shared_address", shared_address);
								device.sendMessageToDevice(contract.peer_device_address, "arbiter_contract_update", {
									hash: contract.hash,
									field: "shared_address",
									value: shared_address
								});
								// unit
								arbiter_contract.setField(contract.hash, "unit", unit);
								device.sendMessageToDevice(contract.peer_device_address, "arbiter_contract_update", {
									hash: contract.hash,
									field: "unit",
									value: unit
								});
								var testnet = constants.version.match(/t$/) ? "testnet" : "";
								var url = "https://" + testnet + "explorer.obyte.org/#" + unit;
								var text = "unit with contract hash for \""+ contract.title +"\" was posted into DAG " + url;

								device.sendMessageToDevice(contract.peer_device_address, "text", text);

								if (contract.me_is_payer) {
									text += "\n\nNow you can pay to the contract for seller services.";
								}
								correspondentListService.addMessageEvent(false, contract.peer_device_address, correspondentListService.formatOutgoingMessage(text));
								device.readCorrespondent(contract.peer_device_address, function(correspondent) {
									if (correspondent.my_record_pref && correspondent.peer_record_pref) chatStorage.store(correspondent.device_address, text, 0);
								});

								allCosigners.forEach(function(cosigner){
									if (cosigner.device_address != device.getMyDeviceAddress()) {
										device.sendMessageToDevice(cosigner.device_address, "arbiter_contract_update", {
											hash: contract.hash,
											field: "unit",
											value: unit
										});
									}
								});
							});
						/*});*/
					}
				};
				eventBus.on("arbiter_contract_response_received" + contract.hash, sendUnit);
			});
		}

		if (contracts)
			return start_listening(contracts);
		arbiter_contract.getAllByStatus("pending", function(contracts){
			start_listening(contracts);
		});
		arbiter_contract.getAllByStatus("accepted", function(contracts){ // this is for accepted contracts which were not signed (multisig wait failed)
			start_listening(lodash.filter(contracts, function(c) {return !c.unit}));
		});
	}

	function listenForArbiterResponse(contracts) {
		var arbiter_contract = require("ocore/arbiter_contract.js");
		var network = require("ocore/network.js");
		var storage = require("ocore/storage.js");
		
		var showError = function(msg) {
			$rootScope.$emit("Local/ShowErrorAlert", msg);
		};

		var start_listening = function(contracts) {
			contracts.forEach(function(contract){
				var setResolved = function(winner, unit) {
					arbiter_contract.setField(contract.hash, "status", "dispute_resolved");
					arbiter_contract.setField(contract.hash, "resolution_unit", unit);

					var testnet = constants.version.match(/t$/) ? "testnet" : "";
					var url = "https://" + testnet + "explorer.obyte.org/#" + unit;
					var text = "Arbiter resolved contract dispute " + (winner == contract.my_address ? "in your favor." : "in favor of your peer."); 
					text += " Unit with the resolution for \""+ contract.title +"\" was posted into DAG " + url + "\n. Please wait for this unit to be confirmed.";
					correspondentListService.addMessageEvent(false, contract.peer_device_address, correspondentListService.formatOutgoingMessage(text));
					device.readCorrespondent(contract.peer_device_address, function(correspondent) {
						if (correspondent.my_record_pref && correspondent.peer_record_pref) chatStorage.store(correspondent.device_address, text, 0);
					});
				};
				db.query("SELECT DISTINCT unit FROM unit_authors WHERE address=?", [contract.arbiter_address], function(rows){
					rows.forEach(function(row){
						storage.readUnit(row.unit, function(objUnit) {
							var winner = parseWinnerFromUnit(contract, objUnit);
							if (!winner) {
								return;
							}
							setResolved(winner, objUnit.unit);
						});	
					});
				});
				network.requestHistoryAfterMCI([], [contract.arbiter_address], contract.dispute_mci, function(){});
				eventBus.on("saved_unit", function(objJoint) {
					var winner = parseWinnerFromUnit(contract, objJoint.unit);
					if (!winner) {
						return;
					}
					setResolved(winner, objJoint.unit.unit);
				});
			});
		};

		if (contracts)
			return start_listening(contracts);
		arbiter_contract.getAllByStatus("in_dispute", function(contracts){
			start_listening(contracts);
		});
		eventBus.on("arbiter_contract_update", function(objContract, field, value) {
			if (field === "dispute_mci")
				start_listening([objContract]);
		});
	}

	function parseWinnerFromUnit(contract, objUnit) {
		if (objUnit.authors[0].address !== contract.arbiter_address) {
			return;
		}
		var key = "CONTRACT_" + contract.hash;
		var winner;
		objUnit.messages.forEach(function(message){
			if (message.app !== "data_feed" || !message.payload || !message.payload[key]) {
				return;
			}
			winner = message.payload[key];
		});
		if (!winner || (winner !== contract.my_address && winner !== contract.peer_address)) {
			return;
		}
		return winner;
	}

	// check if its an arbiter_contract deposit
	var db = require("ocore/db.js");
	var arbiter_contract = require("ocore/arbiter_contract.js");
	eventBus.on("new_my_transactions", function(arrNewUnits) {
		// arb contract payment
		db.query("SELECT hash, outputs.unit FROM wallet_arbiter_contracts\n\
			JOIN outputs ON outputs.address=wallet_arbiter_contracts.shared_address\n\
			WHERE outputs.unit IN (?) AND outputs.asset IS wallet_arbiter_contracts.asset AND wallet_arbiter_contracts.status='accepted'\n\
			GROUP BY outputs.address\n\
			HAVING SUM(outputs.amount) >= wallet_arbiter_contracts.amount", [arrNewUnits], function(rows) {
				rows.forEach(function(row) {
					arbiter_contract.getByHash(row.hash, function(contract){
						arbiter_contract.setField(contract.hash, "status", "paid");
						var text = "Contract " + contract.title + " was paid. Unit: https://explorer.obyte.org/#" + row.unit + ".\n\nThe seller can start fulfilling his contract obligations now.";
						correspondentListService.addMessageEvent(true, contract.peer_device_address, correspondentListService.formatOutgoingMessage(text));
						device.readCorrespondent(contract.peer_device_address, function(correspondent) {
							if (correspondent.my_record_pref && correspondent.peer_record_pref) chatStorage.store(correspondent.device_address, text, 0);
						});
					});
				});
		});
		// arb contract completion
		db.query("SELECT hash, outputs.unit FROM wallet_arbiter_contracts\n\
			JOIN outputs ON outputs.address=wallet_arbiter_contracts.my_address\n\
			WHERE outputs.unit IN (?) AND outputs.asset IS wallet_arbiter_contracts.asset AND wallet_arbiter_contracts.status='paid'\n\
			GROUP BY wallet_arbiter_contracts.hash\n\
			HAVING SUM(outputs.amount) = wallet_arbiter_contracts.amount", [arrNewUnits], function(rows) {
				rows.forEach(function(row) {
					arbiter_contract.getByHash(row.hash, function(contract){
						var status = contract.me_is_payer ? "cancelled" : "completed";
						arbiter_contract.setField(contract.hash, "status", status);
						var text = "Contract " + contract.title + " was "+ status +". Unit: https://explorer.obyte.org/#" + row.unit;
						correspondentListService.addMessageEvent(true, contract.peer_device_address, correspondentListService.formatOutgoingMessage(text));
						device.readCorrespondent(contract.peer_device_address, function(correspondent) {
							if (correspondent.my_record_pref && correspondent.peer_record_pref) chatStorage.store(correspondent.device_address, text, 0);
						});
					});
				});
		});
	});

	function readLastMainChainIndex(cb){
		if (require("ocore/conf.js").bLight){
			require("ocore/network.js").requestFromLightVendor("get_last_mci", null, function(ws, request, response){
				response.error ? cb(response.error) : cb(null, response);
			});
		}
		else
			require("ocore/storage.js").readLastMainChainIndex(function(last_mci){
				cb(null, last_mci);
			})
	}

	function showProsaicContractOfferModal($scope, hash, isIncoming, getSigningDeviceAddresses){
		$rootScope.modalOpened = true;
		var prosaic_contract = require("ocore/prosaic_contract.js");
		prosaic_contract.getByHash(hash, function(objContract){
			if (!objContract)
				throw Error("no contract found in database for already received offer message");
			var showModal = function() {
				var ModalInstanceCtrl = function($scope, $modalInstance) {
					$scope.isIncoming = !!isIncoming;
					$scope.text = objContract.text;
					$scope.title = objContract.title;
					$scope.isMobile = isMobile.any();
					$scope.unit = objContract.unit;
					$scope.status = objContract.status;
					$scope.creation_date = objContract.creation_date;
					$scope.hash = objContract.hash;
					$scope.calculated_hash = prosaic_contract.getHash(objContract);
					$scope.calculated_hash_V1 = prosaic_contract.getHashV1(objContract);
					$scope.my_address = objContract.my_address;
					$scope.peer_address = objContract.peer_address;
					$scope.peer_device_address = objContract.peer_device_address;
					if (objContract.unit) {
						db.query("SELECT payload FROM messages WHERE app='data' AND unit=?", [objContract.unit], function(rows) {
							if (!rows.length)
								return;
							var payload = rows[0].payload;
							try {
								$scope.hash_inside_unit = JSON.parse(payload).contract_text_hash;
								$timeout(function() {
									$rootScope.$apply();
								});
							} catch (e) {}
						})
					}
					var objDateCopy = new Date(objContract.creation_date_obj);
					$scope.valid_till = objDateCopy.setHours(objDateCopy.getHours() + objContract.ttl);
					if ($scope.status === "pending" && $scope.valid_till < Date.now())
						$scope.status = "expired";

					populateScopeWithAttestedFields($scope, objContract.my_address, objContract.peer_address, function() {
						$timeout(function() {
							$rootScope.$apply();
						});
					});

					$timeout(function() {
						$rootScope.tab = $scope.index.tab = "chat";
						$rootScope.$apply();
					});

					var setError = function(err) {
						$scope.error = err;
						$timeout(function() {
							$rootScope.$apply();
						});
					}

					var respond = function(status, signedMessageBase64) {
						// read again, as we might already updated contract status by network in background
						prosaic_contract.getByHash(objContract.hash, function(objContract){
							if (objContract.status !== "pending")
								return setError("contract status was changed, reopen it");
							prosaic_contract.setField(objContract.hash, "status", status);
							prosaic_contract.respond(objContract, status, signedMessageBase64, require("ocore/wallet.js").getSigner());
							objContract.status = status;
							var chat_message = "(prosaic-contract:" + Buffer.from(JSON.stringify(objContract), "utf8").toString("base64") + ")";
							var body = correspondentListService.formatOutgoingMessage(chat_message);
							correspondentListService.addMessageEvent(false, correspondentListService.currentCorrespondent.device_address, body);
							if (correspondentListService.currentCorrespondent.my_record_pref && correspondentListService.currentCorrespondent.peer_record_pref) chatStorage.store(correspondentListService.currentCorrespondent.device_address, chat_message, 0, "text");
							// share accepted contract to previously saced cosigners
							if (status == "accepted") {
								cosigners.forEach(function(cosigner){
									prosaic_contract.share(objContract.hash, cosigner);
								});
							}
							if (status != "accepted") {
								$timeout(function() {
									$modalInstance.dismiss(status);
								});
							}
						});
					};
					$scope.accept = function() {
						// save cosigners here as respond() can be called
						cosigners = getSigningDeviceAddresses(profileService.focusedClient, true);
						if (!cosigners.length && profileService.focusedClient.credentials.m > 1) {
							$scope.index.copayers.forEach(function(copayer) {
								if (!copayer.me && copayer.signs)
									cosigners.push(copayer.device_address);
							});
						}

						$modalInstance.dismiss();

						correspondentListService.signMessageFromAddress(objContract.title, objContract.my_address, getSigningDeviceAddresses(profileService.focusedClient), false, function (err, signedMessageBase64) {
							if (err)
								return setError(err);
							respond("accepted", signedMessageBase64);
						});
					};

					$scope.revoke = function() {
						prosaic_contract.getByHash(objContract.hash, function(objContract){
							if (objContract.status !== "pending")
								return setError("contract status was changed, reopen it");

							objContract.status = "revoked";
							prosaic_contract.setField(objContract.hash, "status", objContract.status);
							device.sendMessageToDevice(correspondentListService.currentCorrespondent.device_address, "prosaic_contract_update", {
								hash: objContract.hash,
								field: "status",
								value: objContract.status
							});

							var chat_message = "(prosaic-contract:" + Buffer.from(JSON.stringify(objContract), "utf8").toString("base64") + ")";
							var body = correspondentListService.formatOutgoingMessage(chat_message);
							correspondentListService.addMessageEvent(false, correspondentListService.currentCorrespondent.device_address, body);
							if (correspondentListService.currentCorrespondent.my_record_pref && correspondentListService.currentCorrespondent.peer_record_pref) chatStorage.store(correspondentListService.currentCorrespondent.device_address, chat_message, 0, "text");

							// swap addresses for peer chat message
							objContract.peer_address = [objContract.my_address, objContract.my_address = objContract.peer_address][0];
							delete objContract.peer_device_address;
							chat_message = "(prosaic-contract:" + Buffer.from(JSON.stringify(objContract), "utf8").toString("base64") + ")";
							device.sendMessageToDevice(correspondentListService.currentCorrespondent.device_address, "text", chat_message);

							$timeout(function() {
								$modalInstance.dismiss("revoke");
							});
						});
					};

					$scope.decline = function() {
						respond("declined");
					};

					$scope.close = function() {
						$modalInstance.dismiss("cancel");
					};

					$scope.openInExplorer = correspondentListService.openInExplorer;

					$scope.expandProofBlock = function() {
						$scope.proofBlockExpanded = !$scope.proofBlockExpanded;
					};

					$scope.checkValidity = function() {
						$timeout(function() {
							$scope.validity_checked = true;
						}, 500);
					}

					$scope.copyToClipboard = function() {
						var sourcetext = document.getElementById("sourcetext");
						var text = sourcetext.value;
						sourcetext.selectionStart = 0;
						sourcetext.selectionEnd = text.length;
						notification.success(gettext("Copied to clipboard"));
						if (isCordova) {
							cordova.plugins.clipboard.copy(text);
						} else if (nodeWebkit.isDefined()) {
							nodeWebkit.writeToClipboard(text);
						}
					}
				};

				var modalInstance = $modal.open({
					templateUrl: "views/modals/view-prosaic-contract.html",
					windowClass: animationService.modalAnimated.slideUp,
					controller: ModalInstanceCtrl,
					scope: $scope
				});

				var disableCloseModal = $rootScope.$on("closeModal", function() {
					modalInstance.dismiss("cancel");
				});

				modalInstance.result.finally(function() {
					$rootScope.modalOpened = false;
					disableCloseModal();
					var m = angular.element(document.getElementsByClassName("reveal-modal"));
					m.addClass(animationService.modalAnimated.slideOutDown);
					if (oldWalletId) {
						profileService._setFocus(oldWalletId, function(){});
						correspondentListService.currentCorrespondent = oldCorrespondent;
						go.path("correspondentDevices.correspondentDevice");
						$timeout(function(){
							$rootScope.tab = $scope.index.tab = "chat";
						});
					}
				});
			};

			var oldWalletId;
			var oldCorrespondent;
			var cosigners;
			if (isIncoming) { // switch to the wallet containing the address which the contract is offered to
				db.query(
					"SELECT wallet FROM my_addresses \n\
					LEFT JOIN shared_address_signing_paths ON \n\
							shared_address_signing_paths.address=my_addresses.address AND shared_address_signing_paths.device_address=? \n\
						WHERE my_addresses.address=? OR shared_address_signing_paths.shared_address=?",
					[device.getMyDeviceAddress(), objContract.my_address, objContract.my_address],
					function(rows) {
						if (rows.length === 0)
							return notification.error("not my prosaic contract");
						if (profileService.focusedClient.credentials.walletId === rows[0].wallet)
							return showModal();
						oldWalletId = profileService.focusedClient.credentials.walletId;
						oldCorrespondent = correspondentListService.currentCorrespondent;
						profileService._setFocus(rows[0].wallet, function(){
							showModal();
						});
					}	
				);
			} else {
				showModal();
			}
		});
	};

	function showArbiterContractOfferModal($scope, hash, isIncoming, getSigningDeviceAddresses){
		$rootScope.modalOpened = true;
		var arbiter_contract = require("ocore/arbiter_contract.js");
		arbiter_contract.getByHash(hash, function(objContract){
			if (!objContract)
				throw Error("no contract found in database");
			var showModal = function() {
				var ModalInstanceCtrl = function($scope, $modalInstance) {
					$scope.isIncoming = !!isIncoming;
					$scope.text = objContract.text;
					$scope.title = objContract.title;
					$scope.arbiter_address = objContract.arbiter_address;
					$scope.isMobile = isMobile.any();
					$scope.form = {};
					$scope.unit = objContract.unit;
					$scope.status = objContract.status;
					$scope.creation_date = objContract.creation_date;
					$scope.hash = objContract.hash;
					$scope.calculated_hash = arbiter_contract.getHash(objContract);
					$scope.my_address = objContract.my_address;
					$scope.peer_address = objContract.peer_address;
					$scope.peer_device_address = objContract.peer_device_address;
					$scope.me_is_payer = objContract.me_is_payer;
					$scope.amount = objContract.amount;
					$scope.asset = objContract.asset;
					$scope.amountStr = txFormatService.formatAmountStr(objContract.amount, objContract.asset ? objContract.asset : "base");
					$scope.my_contact_info = objContract.my_contact_info;
					$scope.peer_contact_info = objContract.peer_contact_info;

					if (objContract.unit) {
						db.query("SELECT payload FROM messages WHERE app='data' AND unit=?", [objContract.unit], function(rows) {
							if (!rows.length)
								return;
							var payload = rows[0].payload;
							try {
								$scope.hash_inside_unit = JSON.parse(payload).contract_text_hash;
								$timeout(function() {
									$rootScope.$apply();
								});
							} catch (e) {}
						})
					}
					if (objContract.resolution_unit) {
						require("ocore/storage.js").readUnit(objContract.resolution_unit, function(objUnit) {
							$scope.me_is_winner = parseWinnerFromUnit(objContract, objUnit) === objContract.my_address;
							$timeout(function() {
								$rootScope.$apply();
							});
						});
					}
					var objDateCopy = new Date(objContract.creation_date_obj);
					$scope.valid_till = objDateCopy.setHours(objDateCopy.getHours() + objContract.ttl);
					if ($scope.status === "pending" && $scope.valid_till < Date.now())
						$scope.status = "expired";

					populateScopeWithAttestedFields($scope, objContract.my_address, objContract.peer_address, function() {
						require("ocore/arbiters.js").getInfo(objContract.arbiter_address, function(info){
							if (info)
								$scope.arbiter_name = info.real_name;
							$timeout(function() {
								$rootScope.$apply();
							});
						});
					});

					$timeout(function() {
						$rootScope.tab = $scope.index.tab = "chat";
						$rootScope.$apply();
					});

					var setError = function(err) {
						$scope.error = err;
						stop_loading();
						$timeout(function() {
							$rootScope.$apply();
						});
					};
					var start_loading = function() {
						$scope.error = null;
						$scope.loading = true;
					};
					var stop_loading = function() {
						$scope.loading = false;	
					};

					var respond = function(status, signedMessageBase64) {
						// read again, as we might already updated contract status by network in background
						if (objContract.status !== "pending" && (objContract.status !== "accepted" && !objContract.unit))
							return setError("contract status was changed, reopen it");
						arbiter_contract.setField(objContract.hash, "status", status);
						device.getOrGeneratePermanentPairingInfo(function(pairingInfo){
							var pairing_code = pairingInfo.device_pubkey + "@" + pairingInfo.hub + "#" + pairingInfo.pairing_secret;
							arbiter_contract.respond(objContract, status, signedMessageBase64, pairing_code, objContract.my_contact_info, require("ocore/wallet.js").getSigner());
						});
						objContract.status = status;
						var chat_message = "contract \"" + objContract.title + "\" " + status;
						var body = correspondentListService.formatOutgoingMessage(chat_message);
						correspondentListService.addMessageEvent(false, correspondentListService.currentCorrespondent.device_address, body);
						if (correspondentListService.currentCorrespondent.my_record_pref && correspondentListService.currentCorrespondent.peer_record_pref) chatStorage.store(correspondentListService.currentCorrespondent.device_address, chat_message, 0, "text");
						// share accepted contract to previously selected cosigners
						if (status === "accepted") {
							cosigners.forEach(function(cosigner){
								arbiter_contract.share(objContract.hash, cosigner);
							});
						}
						if (status !== "accepted") {
							$timeout(function() {
								$modalInstance.dismiss(status);
							});
						}
					};

					$scope.accept = function() {
						// save cosigners here as respond() can be called
						cosigners = getSigningDeviceAddresses(profileService.focusedClient, true);
						if (!cosigners.length && profileService.focusedClient.credentials.m > 1) {
							$scope.index.copayers.forEach(function(copayer) {
								if (!copayer.me && copayer.signs)
									cosigners.push(copayer.device_address);
							});
						}

						if ($scope.form.my_contact_info) {
							objContract.my_contact_info = $scope.form.my_contact_info;
							arbiter_contract.setField(objContract.hash, "my_contact_info", $scope.form.my_contact_info);
						}

						$modalInstance.dismiss();

						correspondentListService.signMessageFromAddress(objContract.title, objContract.my_address, getSigningDeviceAddresses(profileService.focusedClient), false, function (err, signedMessageBase64) {
							if (err)
								return setError(err);
							respond("accepted", signedMessageBase64);
						});
					};

					$scope.revoke = function() {
						if (objContract.status !== "pending")
							return setError("contract status was changed, reopen it");

						objContract.status = "revoked";
						arbiter_contract.setField(objContract.hash, "status", objContract.status);
						device.sendMessageToDevice(correspondentListService.currentCorrespondent.device_address, "arbiter_contract_update", {
							hash: objContract.hash,
							field: "status",
							value: objContract.status
						});

						var chat_message = "(arbiter-contract:" + Buffer.from(JSON.stringify(objContract), "utf8").toString("base64") + ")";
						var body = correspondentListService.formatOutgoingMessage(chat_message);
						correspondentListService.addMessageEvent(false, correspondentListService.currentCorrespondent.device_address, body);
						if (correspondentListService.currentCorrespondent.my_record_pref && correspondentListService.currentCorrespondent.peer_record_pref) chatStorage.store(correspondentListService.currentCorrespondent.device_address, chat_message, 0, "text");

						// swap addresses for peer chat message
						objContract.peer_address = [objContract.my_address, objContract.my_address = objContract.peer_address][0];
						delete objContract.peer_device_address;
						chat_message = "(arbiter-contract:" + Buffer.from(JSON.stringify(objContract), "utf8").toString("base64") + ")";
						device.sendMessageToDevice(correspondentListService.currentCorrespondent.device_address, "text", chat_message);

						$timeout(function() {
							$modalInstance.dismiss("revoke");
						});
					};

					$scope.pay = function() {
						if (!objContract.shared_address || objContract.status !== "accepted")
							return setError("contract can't be paid");
						if (profileService.focusedClient.isPrivKeyEncrypted()) {
							profileService.unlockFC(null, function(err) {
								if (err){
									setError(err);
									return;
								}
								$scope.pay();
							});
							return;
						}
						profileService.bKeepUnlocked = true;

						cosigners = getSigningDeviceAddresses(profileService.focusedClient, true);
						if (!cosigners.length && profileService.focusedClient.credentials.m > 1) {
							$scope.index.copayers.forEach(function(copayer) {
								if (!copayer.me && copayer.signs)
									cosigners.push(copayer.device_address);
							});
						}

						var opts = {
							asset: objContract.asset,
							to_address: objContract.shared_address,
							amount: objContract.amount,
							arrSigningDeviceAddresses: cosigners
						};
						profileService.focusedClient.sendMultiPayment(opts, function(err, unit){
							// if multisig, it might take very long before the callback is called
							//self.setOngoingProcess();
							profileService.bKeepUnlocked = false;
							$rootScope.sentUnit = unit;
							if (err){
								if (err.match(/device address/))
									err = "This is a private asset, please send it only by clicking links from chat";
								if (err.match(/no funded/))
									err = "Not enough spendable funds, make sure all your funds are confirmed";
								return setError(err);
							}
							$rootScope.$emit("NewOutgoingTx");

							arbiter_contract.setField(objContract.hash, "status", "paid");
							
							var testnet = constants.version.match(/t$/) ? "testnet" : "";
							var url = "https://" + testnet + "explorer.obyte.org/#" + unit;
							var text = "\"" + objContract.title +"\" contract was paid, unit: " + url;
							correspondentListService.addMessageEvent(false, objContract.peer_device_address, correspondentListService.formatOutgoingMessage(text));
							device.readCorrespondent(objContract.peer_device_address, function(correspondent) {
								if (correspondent.my_record_pref && correspondent.peer_record_pref) chatStorage.store(correspondent.device_address, text, 0);
							});
							// peer will handle payment on his side by his own, checking incoming transactions
							$modalInstance.dismiss();
						});
					};

					$scope.complete = function() {
						if (objContract.status !== "paid")
							return setError("contract can't be completed");
						if (profileService.focusedClient.isPrivKeyEncrypted()) {
							profileService.unlockFC(null, function(err) {
								if (err){
									setError(err);
									return;
								}
								$scope.complete();
							});
							return;
						}
						profileService.bKeepUnlocked = true;

						var opts = {
							shared_address: objContract.shared_address,
							asset: objContract.asset,
							to_address: objContract.peer_address,
							amount: objContract.amount,
							arrSigningDeviceAddresses: objContract.cosigners.length ? objContract.cosigners : [device.getMyDeviceAddress()]
						};
						profileService.focusedClient.sendMultiPayment(opts, function(err, unit){
							// if multisig, it might take very long before the callback is called
							//self.setOngoingProcess();
							profileService.bKeepUnlocked = false;
							$rootScope.sentUnit = unit;
							if (err){
								if (err.match(/device address/))
									err = "This is a private asset, please send it only by clicking links from chat";
								if (err.match(/no funded/))
									err = "Not enough spendable funds, make sure all your funds are confirmed";
								return setError(err);
							}
							$rootScope.$emit("NewOutgoingTx");

							var status = objContract.me_is_payer ? "completed" : "cancelled";
							arbiter_contract.setField(objContract.hash, "status", status);
							
							var testnet = constants.version.match(/t$/) ? "testnet" : "";
							var url = "https://" + testnet + "explorer.obyte.org/#" + unit;
							var text = "\"" + objContract.title +"\" contract is " + status + ", unit: " + url;
							correspondentListService.addMessageEvent(false, objContract.peer_device_address, correspondentListService.formatOutgoingMessage(text));
							device.readCorrespondent(objContract.peer_device_address, function(correspondent) {
								if (correspondent.my_record_pref && correspondent.peer_record_pref) chatStorage.store(correspondent.device_address, text, 0);
							});
							// peer will handle completion on his side by his own, checking incoming transactions
							$modalInstance.dismiss();
						});
					};

					$scope.dispute = function() {
						if ($scope.loading)
							return;
						start_loading();

						if (objContract.status !== "paid") {
							return setError("contract can't be disputed");
						}
						if (profileService.focusedClient.isPrivKeyEncrypted()) {
							profileService.unlockFC(null, function(err) {
								if (err){
									setError(err);
									return;
								}
								$scope.complete();
							});
							return;
						}
						profileService.bKeepUnlocked = true;

						arbiter_contract.openDispute(objContract.hash, function(err, res) {
							if (err) {
								setError(err);
								return;
							}
							root.readLastMainChainIndex(function(err, last_mci){
								if (err) {
									setError(err);
									return;
								}
								objContract.dispute_mci = last_mci;
								arbiter_contract.setField(objContract.hash, "dispute_mci", last_mci);
								require("ocore/arbiters").getInfo(objContract.arbiter_address, function(objArbiter) {
									var text = "\"" + objContract.title +"\" contract is in disput now. Arbiter " + objArbiter.real_name + " is notified. Wait for him to get online and pair with both contract parties.";
									correspondentListService.addMessageEvent(false, objContract.peer_device_address, correspondentListService.formatOutgoingMessage(text));
									device.readCorrespondent(objContract.peer_device_address, function(correspondent) {
										if (correspondent.my_record_pref && correspondent.peer_record_pref) chatStorage.store(correspondent.device_address, text, 0);
									});
									device.sendMessageToDevice(objContract.peer_device_address, "text", text);
									device.sendMessageToDevice(objContract.peer_device_address, "arbiter_contract_update", {
										hash: objContract.hash,
										field: "status",
										value: "in_dispute"
									});
									device.sendMessageToDevice(objContract.peer_device_address, "arbiter_contract_update", {
										hash: objContract.hash,
										field: "dispute_mci",
										value: last_mci
									});

									listenForArbiterResponse([objContract]);

									stop_loading();
									$modalInstance.dismiss();
								});	
							});
						});
					}

					$scope.claim = function() {
						var claim = function() {
							profileService.bKeepUnlocked = true;
							var cosigners = [];
							$scope.index.copayers.forEach(function(copayer) {
								if (profileService.focusedClient.credentials.n > profileService.focusedClient.credentials.m) { // only selected
									if (copayer.signs) cosigners.push(copayer.device_address);
								} else {
									cosigners.push(copayer.device_address); // all my cosigners (2-of-2)
								}
							});
							var opts = {
								shared_address: objContract.shared_address,
								asset: objContract.asset,
								to_address: objContract.my_address,
								amount: objContract.amount,
								arrSigningDeviceAddresses: cosigners
							};
							profileService.focusedClient.sendMultiPayment(opts, function(err, unit){
								profileService.bKeepUnlocked = false;
								//$rootScope.sentUnit = unit;
								if (err){
									if (err.match(/device address/))
										err = "This is a private asset, please send it only by clicking links from chat";
									if (err.match(/no funded/))
										err = "Not enough spendable funds, make sure all your funds are confirmed";
									return setError(err);
								}
								$rootScope.$emit("NewOutgoingTx");
								
								$modalInstance.dismiss();
							});
						}
						if (profileService.focusedClient.isPrivKeyEncrypted()) {
							profileService.unlockFC(null, function(err) {
								if (err){
									setError(err);
									return;
								}
								claim();
							});
							return;
						} else claim();
					}

					$scope.appeal = function() {
						if (objContract.status !== "dispute_resolved") {
							return setError("contract can't be appealed");
						}

						arbiter_contract.appeal(objContract.hash, function(err, res) {
							if (err) {
								setError(err);
								return;
							}
							if (err) {
								setError(err);
								return;
							}
							require("ocore/arbiters").getInfo(objContract.arbiter_address, function(objArbiter) {
								var text = "\"" + objContract.title +"\" contract is in appeal now. Moderator is notified. Wait for him to get online and pair with both contract parties.";
								correspondentListService.addMessageEvent(false, objContract.peer_device_address, correspondentListService.formatOutgoingMessage(text));
								device.readCorrespondent(objContract.peer_device_address, function(correspondent) {
									if (correspondent.my_record_pref && correspondent.peer_record_pref) chatStorage.store(correspondent.device_address, text, 0);
								});
								device.sendMessageToDevice(objContract.peer_device_address, "text", text);
								device.sendMessageToDevice(objContract.peer_device_address, "arbiter_contract_update", {
									hash: objContract.hash,
									field: "status",
									value: "in_appeal"
								});

								$modalInstance.dismiss();
							});	
						});
					}

					$scope.decline = function() {
						respond("declined");
					};

					$scope.close = function() {
						$modalInstance.dismiss("cancel");
					};

					$scope.openInExplorer = correspondentListService.openInExplorer;

					$scope.expandProofBlock = function() {
						$scope.proofBlockExpanded = !$scope.proofBlockExpanded;
					};

					$scope.checkValidity = function() {
						$timeout(function() {
							$scope.validity_checked = true;
						}, 500);
					}

					$scope.copyToClipboard = function() {
						var sourcetext = document.getElementById("sourcetext");
						var text = sourcetext.value;
						sourcetext.selectionStart = 0;
						sourcetext.selectionEnd = text.length;
						notification.success(gettext("Copied to clipboard"));
						if (isCordova) {
							cordova.plugins.clipboard.copy(text);
						} else if (nodeWebkit.isDefined()) {
							nodeWebkit.writeToClipboard(text);
						}
					}
				};

				var modalInstance = $modal.open({
					templateUrl: "views/modals/view-arbiter-contract.html",
					windowClass: animationService.modalAnimated.slideUp,
					controller: ModalInstanceCtrl,
					scope: $scope
				});

				var disableCloseModal = $rootScope.$on("closeModal", function() {
					modalInstance.dismiss("cancel");
				});

				modalInstance.result.finally(function() {
					$rootScope.modalOpened = false;
					disableCloseModal();
					var m = angular.element(document.getElementsByClassName("reveal-modal"));
					m.addClass(animationService.modalAnimated.slideOutDown);
					if (oldWalletId) {
						profileService._setFocus(oldWalletId, function(){});
						correspondentListService.currentCorrespondent = oldCorrespondent;
						go.path("correspondentDevices.correspondentDevice");
						$timeout(function(){
							$rootScope.tab = $scope.index.tab = "chat";
						});
					}
				});
			};

			var oldWalletId;
			var oldCorrespondent;
			var cosigners;
			// switch to the wallet containing the address which the contract is offered to
			db.query(
				"SELECT wallet FROM my_addresses \n\
				LEFT JOIN shared_address_signing_paths ON \n\
						shared_address_signing_paths.address=my_addresses.address AND shared_address_signing_paths.device_address=? \n\
					WHERE my_addresses.address=? OR shared_address_signing_paths.shared_address=?",
				[device.getMyDeviceAddress(), objContract.my_address, objContract.my_address],
				function(rows) {
					if (rows.length === 0)
						return notification.error("not my arbiter contract");
					if (profileService.focusedClient.credentials.walletId === rows[0].wallet)
						return showModal();
					oldWalletId = profileService.focusedClient.credentials.walletId;
					oldCorrespondent = correspondentListService.currentCorrespondent;
					profileService._setFocus(rows[0].wallet, function(){
						showModal();
					});
				}	
			);
		});
	};

	function showDisputeRequestModal($scope, disputeJsonBase64){
		$rootScope.modalOpened = true;
		var arbiter_contract = require("ocore/arbiter_contract.js");
		var strJSON = Buffer.from(disputeJsonBase64, "base64").toString("utf8");
		var objDispute = JSON.parse(strJSON);
		var ModalInstanceCtrl = function($scope, $modalInstance) {
			$scope.plaintiff_address = objDispute.my_address;
			$scope.peer_address = objDispute.peer_address;
			$scope.plaintiff_pairing_code = objDispute.my_pairing_code;
			$scope.peer_pairing_code = objDispute.peer_pairing_code;
			$scope.text = objDispute.contract_content.text;
			$scope.title = objDispute.contract_content.title;
			$scope.creation_date = objDispute.contract_content.creation_date;
			$scope.arbiter_address = objDispute.arbiter_address;
			$scope.contract_hash = objDispute.contract_hash;
			$scope.payer = objDispute.me_is_payer ? "plaintiff" : "peer";
			$scope.unit = objDispute.unit;
			$scope.isMobile = isMobile.any();
			$scope.amount = objDispute.amount;
			$scope.asset = objDispute.asset;
			$scope.calculated_hash = arbiter_contract.getHash($scope);
			$scope.amountStr = txFormatService.formatAmountStr(objDispute.amount, objDispute.asset ? objDispute.asset : "base");
			$scope.plaintiff_contact_info = objDispute.my_contact_info;
			$scope.peer_contact_info = objDispute.peer_contact_info;

			if (objDispute.unit) {
				db.query("SELECT payload FROM messages WHERE app='data' AND unit=?", [objDispute.unit], function(rows) {
					if (!rows.length)
						return;
					var payload = rows[0].payload;
					try {
						$scope.hash_inside_unit = JSON.parse(payload).contract_text_hash;
						$timeout(function() {
							$rootScope.$apply();
						});
					} catch (e) {}
				})
			}

			$timeout(function() {
				$rootScope.tab = $scope.index.tab = "chat";
				$rootScope.$apply();
			});

			var setError = function(err) {
				$scope.error = err;
				$timeout(function() {
					$rootScope.$apply();
				});
			}

			$scope.pair = function(code) {
				var matches = code.match(/^([\w\/+]+)@([\w.:\/-]+)#(.+)$/);
				if (!matches)
					return setError("Invalid pairing code");
				var pubkey = matches[1];
				var hub = matches[2];
				var pairing_secret = matches[3];
				if (pubkey.length !== 44)
					return setError("Invalid pubkey length");
				correspondentListService.acceptInvitation(hub, pubkey, pairing_secret, function(err){
					if (err)
						return setError(err);
					$scope.close();
				});
			}

			$scope.close = function() {
				$modalInstance.dismiss("cancel");
			};

			$scope.openInExplorer = correspondentListService.openInExplorer;

			$scope.expandProofBlock = function() {
				$scope.proofBlockExpanded = !$scope.proofBlockExpanded;
			};

			$scope.checkValidity = function() {
				$timeout(function() {
					$scope.validity_checked = true;
				}, 500);
			};

			$scope.resolve = function(address) {
				if (profileService.focusedClient.isPrivKeyEncrypted()) {
					profileService.unlockFC(null, function(err) {
						if (err){
							setError(err);
							return;
						}
						$scope.complete();
					});
					return;
				}
				profileService.bKeepUnlocked = true;

				var data_payload = {};
				data_payload["CONTRACT_" + objDispute.contract_hash] = address;
				var opts = {
					paying_addresses: [objDispute.arbiter_address],
					signing_addresses: [objDispute.arbiter_address],
					change_address: objDispute.arbiter_address,
					messages: [
						{
							app: "data_feed",
							payload_location: "inline",
							payload_hash: objectHash.getBase64Hash(data_payload, require("ocore/storage.js").getMinRetrievableMci() >= constants.timestampUpgradeMci),
							payload: data_payload
						}
					]
				};
				profileService.focusedClient.sendMultiPayment(opts, function(err, unit){
					// if multisig, it might take very long before the callback is called
					//self.setOngoingProcess();
					profileService.bKeepUnlocked = false;
					$rootScope.sentUnit = unit;
					if (err){
						if (err.match(/no funded/))
							err = "Not enough spendable funds, make sure all your funds are confirmed";
						return setError(err);
					}
					$rootScope.$emit("NewOutgoingTx");
					
					var testnet = constants.version.match(/t$/) ? "testnet" : "";
					var url = "https://" + testnet + "explorer.obyte.org/#" + unit;
					var text = "\"" + objDispute.contract_content.title +"\" contract dispute is resolved in favor of " + (address == objDispute.my_address ? "plaintiff" : "peer") + " ["+address+"], unit: " + url;
					correspondentListService.addMessageEvent(false, correspondentListService.currentCorrespondent.device_address, correspondentListService.formatOutgoingMessage(text));
					device.readCorrespondent(correspondentListService.currentCorrespondent.device_address, function(correspondent) {
						if (correspondent.my_record_pref && correspondent.peer_record_pref) chatStorage.store(correspondent.device_address, text, 0);
					});
					// peer will handle completion on his side by his own, checking incoming transactions
					$modalInstance.dismiss();
				});
			};
		};

		var modalInstance = $modal.open({
			templateUrl: "views/modals/view-dispute-request.html",
			windowClass: animationService.modalAnimated.slideUp,
			controller: ModalInstanceCtrl,
			scope: $scope
		});

		var disableCloseModal = $rootScope.$on("closeModal", function() {
			modalInstance.dismiss("cancel");
		});

		modalInstance.result.finally(function() {
			$rootScope.modalOpened = false;
			disableCloseModal();
			var m = angular.element(document.getElementsByClassName("reveal-modal"));
			m.addClass(animationService.modalAnimated.slideOutDown);
		});
	};

	root.populateScopeWithAttestedFields = populateScopeWithAttestedFields;
	root.listenForProsaicContractResponse = listenForProsaicContractResponse;
	root.listenForArbiterContractResponse = listenForArbiterContractResponse;
	root.listenForArbiterResponse = listenForArbiterResponse;
	root.readLastMainChainIndex = readLastMainChainIndex;
	root.showProsaicContractOfferModal = showProsaicContractOfferModal;
	root.showArbiterContractOfferModal = showArbiterContractOfferModal;
	root.showDisputeRequestModal = showDisputeRequestModal;

	root.listenForProsaicContractResponse();
	root.listenForArbiterContractResponse();
	root.listenForArbiterResponse();

	return root;
});