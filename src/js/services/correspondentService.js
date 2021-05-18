"use strict";

var constants = require("ocore/constants.js");
var eventBus = require("ocore/event_bus.js");
var ValidationUtils = require("ocore/validation_utils.js");
var objectHash = require("ocore/object_hash.js");

angular.module("copayApp.services").factory("correspondentService", function($rootScope, $modal, $timeout, go, animationService, configService, profileService, lodash, txFormatService, correspondentListService) {
	var root = {};
	var device = require("ocore/device.js");
	var chatStorage = require("ocore/chat_storage.js");
	var wallet_general = require('ocore/wallet_general.js');
	var arbiter_contract = require("ocore/arbiter_contract.js");
	var storage = require("ocore/storage.js");

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
								showError(err.message);
								return;
							}
							sendUnit(accepted, authors);
						});
						return;
					}
					profileService.requestTouchid(function(err) {
						if (err) {
							profileService.lockFC();
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
									var text = "Unit with contract hash for \""+ contract.title +"\" was posted into DAG " + url;
									correspondentListService.addMessageEvent(false, contract.peer_device_address, correspondentListService.formatOutgoingMessage(text));
									device.sendMessageToDevice(contract.peer_device_address, "text", text);
								});
							});
						}
					});
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

	// arbiter contract response received - accepted or declined
	eventBus.on("arbiter_contract_response_received", function(contract, skipChatMessage) {
		if (!skipChatMessage)
			addContractEventIntoChat(contract, "event", true);

		if (contract.status != 'accepted') {
			return;
		}

		var showError = function(msg) {
			$rootScope.$emit("Local/ShowErrorAlert", msg);
		};

		if (profileService.focusedClient.isPrivKeyEncrypted()) {
			profileService.unlockFC({message: "Peer accepted your contract offer: \""+contract.title+"\". Unlock your wallet to sign this contract.", type: 'info'}, function(err) {
				if (err){
					showError(err.message);
					return;
				}
				eventBus.emit("arbiter_contract_response_received", contract, true);
			});
			return;
		}
		profileService.requestTouchid(function(err) {
			if (err) {
				profileService.lockFC();
				showError(err);
				return;
			}
			
			profileService.bKeepUnlocked = true;
			arbiter_contract.createSharedAddressAndPostUnit(contract.hash, profileService.focusedClient, function(err, contract) {
				profileService.bKeepUnlocked = false;
				if (err)
					return showError(err);
				$rootScope.sentUnit = contract.unit;
				var text = 'Unit with contract hash was posted into DAG\nhttps://explorer.obyte.org/#' + contract.unit;
				var payer_guidance_text = '\n\nNow you can pay to the contract for seller\'s services by opening the contract window.';
				var payee_guidance_text = '\n\nNow wait for buyer to pay to the contract.';
				addContractEventIntoChat(contract, "event", false, text + (contract.me_is_payer ? payer_guidance_text : payee_guidance_text));
			});
		});
	});

	eventBus.on("arbiter_contract_offer", function(hash) {
		arbiter_contract.getByHash(hash, function(objContract) {
			addContractEventIntoChat(objContract, 'offer', true);
		})
	});

	eventBus.on("arbiter_contract_update", function(objContract, field, value, unit, winner, isPrivate) {
		if (field === "unit") {
			var text = 'Unit with contract hash was posted into DAG\nhttps://explorer.obyte.org/#' + value;
			var payer_guidance_text = '\n\nNow you can pay to the contract for seller services by opening the contract window.';
			var payee_guidance_text = '\n\nNow wait for buyer to pay to the contract.';
			addContractEventIntoChat(objContract, "event", true, text + (objContract.me_is_payer ? payer_guidance_text : payee_guidance_text));
		}
		if (field === 'status') {
			if (value === 'revoked') {
				addContractEventIntoChat(objContract, "event", true);	
			}
			if (value === 'in_dispute') {
				addContractEventIntoChat(objContract, 'event', true, 'Contract is in dispute now. Arbiter is notified. Wait for them to get online and pair with both contract parties.');
			}
			if (value === 'in_appeal') {
				addContractEventIntoChat(objContract, "event", true, "Moderator is notified. Wait for them to get online and pair with both contract parties.");	
			}
			if (value === 'appeal_approved' || value === 'appeal_declined') {
				addContractEventIntoChat(objContract, "event", true, "Moderator has " + (value === 'appeal_approved' ? 'approved' : 'declined')+ " your appeal. You will receive a compensation for wrong arbiter decision.");	
			}
			if (value === 'paid') {
				addContractEventIntoChat(objContract, 'event', true, 'Contract was paid, unit: ' + 'https://explorer.obyte.org/#' + unit + '.\n\nYou can start fulfilling your contract obligations.');
			}
			if (value === 'cancelled' || value === 'completed') {
				if (!isPrivate)
					addContractEventIntoChat(objContract, 'event', true, 'Contract was '+objContract.status+', unit: ' + 'https://explorer.obyte.org/#' + unit + '.\n\nFunds locked on contract were sent to you.');
				else
					addContractEventIntoChat(objContract, 'event', true, 'Contract was '+objContract.status+', unit: ' + 'https://explorer.obyte.org/#' + unit + '.\n\nYou can now claim your funds from the contract.');
			}
			if (value === 'dispute_resolved') {
				var text = "Arbiter resolved the contract dispute " + (winner == objContract.my_address ? "in your favor." : "in favor of your peer."); 
				text += " Unit with the resolution was posted into DAG: https://explorer.obyte.org/#" + unit + "\n\n" + 
					(winner === objContract.my_address ? "Please wait for this unit to be confirmed and claim your funds from the contract." :
						"You can appeal to arbiter's decision from the contract view.");
				addContractEventIntoChat(objContract, "event", true, text, winner);
			}
		}
		if (field === 'resolution_unit_stabilized') {
			addContractEventIntoChat(objContract, "event", true, "You can now claim your funds from the contract", winner);
		}
	});

	var db = require("ocore/db.js");
	
	function readLastMainChainIndex(cb){
		if (require("ocore/conf.js").bLight){
			require("ocore/network.js").requestFromLightVendor("get_last_mci", null, function(ws, request, response){
				response.error ? cb(response.error) : cb(null, response);
			});
		}
		else
			storage.readLastMainChainIndex(function(last_mci){
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
					$scope.valid_till = objDateCopy.setHours(objDateCopy.getHours(), objDateCopy.getMinutes(), (objDateCopy.getSeconds() + objContract.ttl * 60 * 60)|0);
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
								return setError("contract status has changed, reopen it");
							prosaic_contract.setField(objContract.hash, "status", status);
							prosaic_contract.respond(objContract, status, signedMessageBase64, require("ocore/wallet.js").getSigner());
							objContract.status = status;
							var chat_message = "(prosaic-contract:" + Buffer.from(JSON.stringify(objContract), "utf8").toString("base64") + ")";
							var body = correspondentListService.formatOutgoingMessage(chat_message);
							correspondentListService.addMessageEvent(false, correspondentListService.currentCorrespondent.device_address, body);
							if (correspondentListService.currentCorrespondent.my_record_pref && correspondentListService.currentCorrespondent.peer_record_pref) chatStorage.store(correspondentListService.currentCorrespondent.device_address, chat_message, 0, "text");
							// share accepted contract to previously saved cosigners
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
								if (!copayer.me)
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

	function showArbiterContractOfferModal($scope, hash, getSigningDeviceAddresses){
		$rootScope.modalOpened = true;
		arbiter_contract.getByHash(hash, function(objContract){
			if (!objContract)
				throw Error("no contract found in database");
			var showModal = function() {
				var ModalInstanceCtrl = function($scope, $modalInstance) {
					$scope.isIncoming = objContract.is_incoming;
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
					$scope.form.my_contact_info = configService.getSync().my_contact_info;

					if ($scope.asset) {
						require("ocore/wallet.js").readAssetMetadata([$scope.asset], function(assetMetadata) {
							if (assetMetadata || $scope.asset == constants.BLACKBYTES_ASSET) {
								$scope.assetMetadata = assetMetadata[$scope.asset] || {};
							}
							db.query("SELECT 1 FROM assets WHERE unit IN(?) AND is_private=1 LIMIT 1", [objContract.asset], function(rows){
								if (rows.length > 0) {
									$scope.isPrivate = true;
								}
								$timeout(function() {
									$rootScope.$apply();
								});
							});
						});
					}

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
						storage.readUnit(objContract.resolution_unit, function(objUnit) {
							$scope.me_is_winner = arbiter_contract.parseWinnerFromUnit(objContract, objUnit) === objContract.my_address;
							// appeal fee request
							if (objContract.status === 'dispute_resolved' && !$scope.me_is_winner) {
								arbiter_contract.getAppealFee(objContract.hash, function(err, feeParams) {
									if (err) {
										$scope.appealFeeCost = $scope.appealFeeCompensation = "#UNKNOWN#";
										return;
									}
									$scope.appealFeeCost = txFormatService.formatAmountStr(feeParams.amount, feeParams.asset ? feeParams.asset : "base");
									$scope.appealFeeCompensation = txFormatService.formatAmountStr(3*feeParams.amount, feeParams.asset ? feeParams.asset : "base");
									$timeout(function() {
										$rootScope.$apply();
									});
								});
							}
						});
					}
					// hide "claim funds" button if not enough balance on the contract (already claimed)
					require("ocore/wallet.js").readBalance(objContract.shared_address, function(balances) {
						var asset = objContract.asset || 'base';
						if (!balances[asset] || balances[asset].total < objContract.amount)
							$scope.funds_claimed = true;
						$timeout(function() {
							$rootScope.$apply();
						});
					});
					var objDateCopy = new Date(objContract.creation_date_obj);
					$scope.valid_till = objDateCopy.setHours(objDateCopy.getHours(), objDateCopy.getMinutes(), (objDateCopy.getSeconds() + objContract.ttl * 60 * 60)|0);
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
						device.requestFromHub("hub/get_arbstore_url", objContract.arbiter_address, function(err, url){
							if (url)
								$scope.arbstore_url = url;
							$timeout(function() {
								$rootScope.$apply();
							});
						});
					});

					device.readCorrespondent(objContract.peer_device_address, function(corr) {
						$scope.peer_device_name = corr.name;
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
						arbiter_contract.respond(objContract.hash, status, signedMessageBase64, require("ocore/wallet.js").getSigner(), function(err, objContract) {
							if (err)
								return setError(err);
							addContractEventIntoChat(objContract, 'event', false);
							$timeout(function() {
								$modalInstance.dismiss(status);
							});
						});
					};

					$scope.accept = function() {
						if ($scope.form.my_contact_info) {
							objContract.my_contact_info = $scope.form.my_contact_info;
							arbiter_contract.setField(objContract.hash, "my_contact_info", $scope.form.my_contact_info);
							configService.set({my_contact_info: objContract.my_contact_info}, function(){});
						}

						correspondentListService.signMessageFromAddress(objContract.title, objContract.my_address, getSigningDeviceAddresses(profileService.focusedClient), false, function (err, signedMessageBase64) {
							if (err)
								return setError(err);
							respond("accepted", signedMessageBase64);
						});
					};

					$scope.revoke = function() {
						arbiter_contract.revoke(objContract.hash, function(err, objContract) {
							if (err)
								return setError(err);
							addContractEventIntoChat(objContract, 'event', false);
							$timeout(function() {
								$modalInstance.dismiss("revoke");
							});
						});
					};

					$scope.pay = function() {
						if (profileService.focusedClient.isPrivKeyEncrypted()) {
							profileService.unlockFC(null, function(err) {
								if (err){
									setError(err.message);
									return;
								}
								$scope.pay();
							});
							return;
						}
						profileService.bKeepUnlocked = true;

						profileService.requestTouchid(function(err) {
							if (err) {
								profileService.lockFC();
								setError(err);
								return;
							}
							arbiter_contract.pay(objContract.hash, profileService.focusedClient, getSigningDeviceAddresses(profileService.focusedClient), 
								function(err, objContract, unit) {
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
									addContractEventIntoChat(objContract, 'event', false, 'Contract was paid, unit: ' + 'https://explorer.obyte.org/#' + unit + '.\n\nThe seller can now start fulfilling their contract obligations.');
									$modalInstance.dismiss();
							});
						});
					};

					$scope.confirmcomplete = function(val) {
						$timeout(function(){
							$scope.confirm_complete = val;
						}, 50);
					}

					$scope.complete = function() {
						if (profileService.focusedClient.isPrivKeyEncrypted()) {
							profileService.unlockFC(null, function(err) {
								if (err){
									setError(err.message);
									return;
								}
								$scope.complete();
							});
							return;
						}
						profileService.bKeepUnlocked = true;

						profileService.requestTouchid(function(err) {
							if (err) {
								profileService.lockFC();
								setError(err);
								return;
							}
							
							arbiter_contract.complete(hash, profileService.focusedClient, getExplicitSigningDeviceAddresses(getSigningDeviceAddresses, $scope), 
								function(err, objContract, unit) {
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
									addContractEventIntoChat(objContract, 'event', false, 'Contract has been '+objContract.status+', unit: ' + 'https://explorer.obyte.org/#' + unit + '.\n\nFunds were sent to the peer.');
									$modalInstance.dismiss();
							});
						});
					};

					$scope.claimAfterComplete = function() {
						if (!(objContract.status === "completed" || objContract.status === "in_dispute" || objContract.status === "cancelled"))
							return setError("contract can't be claimed");
						if (profileService.focusedClient.isPrivKeyEncrypted()) {
							profileService.unlockFC(null, function(err) {
								if (err){
									setError(err.message);
									return;
								}
								$scope.claimAfterComplete();
							});
							return;
						}
						profileService.bKeepUnlocked = true;

						profileService.requestTouchid(function(err) {
							if (err) {
								profileService.lockFC();
								setError(err);
								return;
							}

							profileService.focusedClient.sendMultiPayment({
									shared_address: objContract.shared_address,
									asset: objContract.asset,
									to_address: objContract.my_address,
									amount: objContract.amount,
									arrSigningDeviceAddresses: getExplicitSigningDeviceAddresses(getSigningDeviceAddresses, $scope)
								}, function(err, unit){
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

								addContractEventIntoChat(objContract, 'event', false, 'Funds were claimed, unit: ' + 'https://explorer.obyte.org/#' + unit + '.');
								
								// peer will handle completion on his side by his own, checking incoming transactions
								$modalInstance.dismiss();
							});
						});
					};

					$scope.dispute = function() {
						if ($scope.loading)
							return;

						start_loading();

						arbiter_contract.openDispute(objContract.hash, function(err, resp, objContract) {
							profileService.bKeepUnlocked = false;
							if (err)
								return setError(err);
							
							require("ocore/arbiters").getInfo(objContract.arbiter_address, function(objArbiter) {
								addContractEventIntoChat(objContract, 'event', false, 'Contract is in dispute now. Arbiter ' + objArbiter.real_name + ' is notified. Wait for them to get online and pair with both contract parties.');

								stop_loading();
								$modalInstance.dismiss();
							});	
						});
					}

					$scope.claim = function() {
						var claim = function() {
							profileService.bKeepUnlocked = true;

							profileService.requestTouchid(function(err) {
								if (err) {
									profileService.lockFC();
									setError(err);
									return;
								}

								var opts = {
									shared_address: objContract.shared_address,
									asset: objContract.asset,
									to_address: objContract.my_address,
									amount: objContract.amount,
									arrSigningDeviceAddresses: getExplicitSigningDeviceAddresses(getSigningDeviceAddresses, $scope)
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

									addContractEventIntoChat(objContract, "event", false, "Funds from the contract were sent to your address: " + objContract.my_address, objContract.my_address);
									
									$modalInstance.dismiss();
								});
							});
						}
						if (profileService.focusedClient.isPrivKeyEncrypted()) {
							profileService.unlockFC(null, function(err) {
								if (err){
									setError(err.message);
									return;
								}
								claim();
							});
							return;
						} else claim();
					}

					$scope.appeal = function() {
						arbiter_contract.appeal(objContract.hash, function(err, res, objContract) {
							if (err)
								return setError(err);
							addContractEventIntoChat(objContract, "event", false, "Moderator is notified. Wait for them to get online and pair with both contract parties.");
							$modalInstance.dismiss();
						});
					}

					$scope.decline = function() {
						respond("declined");
					};

					$scope.close = function() {
						$modalInstance.dismiss("cancel");
					};

					$scope.openInExplorer = correspondentListService.openInExplorer;
					$scope.openLink = go.openExternalLink;
					$scope.getContractStatusEmoji = correspondentListService.getContractStatusEmoji;

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
						return notification.error("not my contract");
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

	function addContractEventIntoChat(objContract, type, isIncoming, description, winner) {
		device.readCorrespondent(objContract.peer_device_address, function(correspondent) {
			if (!correspondent || objContract.me_is_cosigner) // we are a cosigner
				return;
			var chat_message = "(arbiter-contract-"+type+":" + Buffer.from(JSON.stringify({hash: objContract.hash, title: objContract.title, status: objContract.status, me_is_winner: (objContract.my_address === winner)}), 'utf8').toString('base64') + ")" + (description ? "\n\n" + description : "");
			correspondentListService.addMessageEvent(isIncoming, objContract.peer_device_address, correspondentListService.formatOutgoingMessage(chat_message), null, false, type == 'event' ? 'event' : 'text');
			if (correspondent.my_record_pref && correspondent.peer_record_pref) chatStorage.store(correspondent.device_address, chat_message, isIncoming, type == 'event' ? 'event' : 'text');
		});
	}

	function getExplicitSigningDeviceAddresses(getSigningDeviceAddresses, $scope) {
		var cosigners = [device.getMyDeviceAddress()];
		if (profileService.focusedClient.credentials.m > 1) {
			// we should name all our cosigners, ptherwise we will ask sign requests from contract peer
			if (profileService.focusedClient.credentials.n == profileService.focusedClient.credentials.m) {
				$scope.index.copayers.forEach(function(copayer) {
					if (!copayer.me)
						cosigners.push(copayer.device_address);
				});
			} else {
				cosigners = getSigningDeviceAddresses(profileService.focusedClient);	
			}
		}
		return cosigners;
	}

	function showDisputeRequestModal($scope, contract_hash){
		$rootScope.modalOpened = true;
		arbiter_contract.getDisputeByContractHash(contract_hash, function(objDispute){
			if (!objDispute)
				throw Error("no dispute found in database");
			var ModalInstanceCtrl = function($scope, $modalInstance) {
				$scope.plaintiff_address = objDispute.plaintiff_address;
				$scope.respondent_address = objDispute.respondent_address;
				$scope.plaintiff_pairing_code = objDispute.plaintiff_pairing_code;
				$scope.respondent_pairing_code = objDispute.respondent_pairing_code;
				$scope.text = objDispute.contract_content.text;
				$scope.title = objDispute.contract_content.title;
				$scope.creation_date = objDispute.contract_content.creation_date;
				$scope.arbiter_address = objDispute.arbiter_address;
				$scope.contract_hash = objDispute.contract_hash;
				$scope.plaintiff_is_payer = objDispute.plaintiff_is_payer;
				$scope.unit = objDispute.contract_unit;
				$scope.isMobile = isMobile.any();
				$scope.amount = objDispute.amount;
				$scope.asset = objDispute.asset;
				$scope.status = objDispute.status;
				$scope.calculated_hash = arbiter_contract.getHash($scope);
				$scope.amountStr = objDispute.amount ? txFormatService.formatAmountStr(objDispute.amount, objDispute.asset ? objDispute.asset : "base") : 'private asset';
				$scope.plaintiff_contact_info = objDispute.plaintiff_contact_info;
				$scope.respondent_contact_info = objDispute.respondent_contact_info;

				if ($scope.asset) {
					require("ocore/wallet.js").readAssetMetadata([$scope.asset], function(assetMetadata) {
						if (assetMetadata || $scope.asset == constants.BLACKBYTES_ASSET) {
							$scope.assetMetadata = assetMetadata[$scope.asset] || {};
						}
					});
				}

				if (objDispute.contract_unit) {
					db.query("SELECT payload FROM messages WHERE app='data' AND unit=?", [objDispute.contract_unit], function(rows) {
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
								setError(err.message);
								return;
							}
							$scope.resolve(address);
						});
						return;
					}
					profileService.bKeepUnlocked = true;

					profileService.requestTouchid(function(err) {
						if (err) {
							profileService.lockFC();
							setError(err);
							return;
						}
						$scope.index.requestApproval('Do you want to resolve this dispute with '+address+' as a winner?', {
							ifYes: function(){
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
											payload_hash: objectHash.getBase64Hash(data_payload, storage.getMinRetrievableMci() >= constants.timestampUpgradeMci),
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

									db.query("UPDATE arbiter_disputes SET status='resolved' WHERE contract_hash=?", [objDispute.contract_hash], function(){});
									
									var testnet = constants.version.match(/t$/) ? "testnet" : "";
									var url = "https://" + testnet + "explorer.obyte.org/#" + unit;
									var text = "\"" + objDispute.contract_content.title +"\" contract dispute is resolved in favor of " + (address == objDispute.plaintiff_address ? "plaintiff" : "respondent") + " ["+address+"], unit: " + url;
									correspondentListService.addMessageEvent(false, correspondentListService.currentCorrespondent.device_address, correspondentListService.formatOutgoingMessage(text));
									device.readCorrespondent(correspondentListService.currentCorrespondent.device_address, function(correspondent) {
										if (correspondent.my_record_pref && correspondent.peer_record_pref) chatStorage.store(correspondent.device_address, text, 0);
									});
									// peer will handle completion on his side by his own, checking incoming transactions
									
									$scope.arbiterDisputes.forEach(function(dispute) {
										if (dispute.contract_hash == objDispute.contract_hash) {
											dispute.status = "resolved";
										}
									});

									$modalInstance.dismiss();
								});
							},
							ifNo: function(){}
						});
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
		});
	};

	root.populateScopeWithAttestedFields = populateScopeWithAttestedFields;
	root.listenForProsaicContractResponse = listenForProsaicContractResponse;
	root.readLastMainChainIndex = readLastMainChainIndex;
	root.showProsaicContractOfferModal = showProsaicContractOfferModal;
	root.showArbiterContractOfferModal = showArbiterContractOfferModal;
	root.showDisputeRequestModal = showDisputeRequestModal;
	root.addContractEventIntoChat = addContractEventIntoChat;

	root.listenForProsaicContractResponse();

	return root;
});