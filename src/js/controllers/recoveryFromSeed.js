'use strict';

angular.module('copayApp.controllers').controller('recoveryFromSeed',
	function ($rootScope, $scope, $log, $timeout, profileService) {

		var async = require('async');
		var conf = require('byteballcore/conf.js');
		var wallet_defined_by_keys = require('byteballcore/wallet_defined_by_keys.js');
		var objectHash = require('byteballcore/object_hash.js');
		try{
			var ecdsa = require('secp256k1');
		}
		catch(e){
			var ecdsa = require('byteballcore/node_modules/secp256k1' + '');
		}
		var Mnemonic = require('bitcore-mnemonic');
		var Bitcore = require('bitcore-lib');
		var db = require('byteballcore/db.js');
		var network = require('byteballcore/network');
		var myWitnesses = require('byteballcore/my_witnesses');

		var self = this;

		self.error = '';
		self.bLight = conf.bLight;
		self.scanning = false;
		self.inputMnemonic = '';
		self.xPrivKey = '';
		self.assocIndexesToWallets = {};

		function determineIfAddressUsed(address, cb) {
			db.query("SELECT 1 FROM outputs WHERE address = ? LIMIT 1", [address], function(outputsRows) {
				if (outputsRows.length === 1)
					cb(true);
				else {
					db.query("SELECT 1 FROM unit_authors WHERE address = ? LIMIT 1", [address], function(unitAuthorsRows) {
						cb(unitAuthorsRows.length === 1);
					});
				}
			});
		}

		function scanForAddressesAndWallets(mnemonic, cb) {
			self.xPrivKey = new Mnemonic(mnemonic).toHDPrivateKey();
			var xPubKey;
			var lastUsedAddressIndex = -1;
			var lastUsedWalletIndex = -1;
			var currentAddressIndex = 0;
			var currentWalletIndex = 0;
			var assocMaxAddressIndexes = {};

			function checkAndAddCurrentAddress(is_change) {
				var address = objectHash.getChash160(["sig", {"pubkey": wallet_defined_by_keys.derivePubkey(xPubKey, 'm/' + is_change + '/' + currentAddressIndex)}]);
				determineIfAddressUsed(address, function(bUsed) {
					if (bUsed) {
						lastUsedAddressIndex = currentAddressIndex;
						if (!assocMaxAddressIndexes[currentWalletIndex]) assocMaxAddressIndexes[currentWalletIndex] = {main: 0};
						if (is_change) {
							assocMaxAddressIndexes[currentWalletIndex].change = currentAddressIndex;
						} else {
							assocMaxAddressIndexes[currentWalletIndex].main = currentAddressIndex;
						}
						currentAddressIndex++;
						checkAndAddCurrentAddress(is_change);
					} else {
						currentAddressIndex++;
						if (currentAddressIndex - lastUsedAddressIndex >= 20) {
							if (is_change) {
								if (lastUsedAddressIndex !== -1) {
									lastUsedWalletIndex = currentWalletIndex;
								}
								if (currentWalletIndex - lastUsedWalletIndex >= 20) {
									cb(assocMaxAddressIndexes);
								} else {
									currentWalletIndex++;
									setCurrentWallet();
								}
							} else {
								currentAddressIndex = 0;
								checkAndAddCurrentAddress(1);
							}
						} else {
							checkAndAddCurrentAddress(is_change);
						}
					}
				})
			}

			function setCurrentWallet() {
				xPubKey = Bitcore.HDPublicKey(self.xPrivKey.derive("m/44'/0'/" + currentWalletIndex + "'"));
				lastUsedAddressIndex = -1;
				currentAddressIndex = 0;
				checkAndAddCurrentAddress(0);
			}

			setCurrentWallet();
		}

		function removeAddressesAndWallets(cb) {
			var arrQueries = [];
			db.addQuery(arrQueries, "DELETE FROM pending_shared_address_signing_paths");
			db.addQuery(arrQueries, "DELETE FROM shared_address_signing_paths");
			db.addQuery(arrQueries, "DELETE FROM pending_shared_addresses");
			db.addQuery(arrQueries, "DELETE FROM shared_addresses");
			db.addQuery(arrQueries, "DELETE FROM my_addresses");
			db.addQuery(arrQueries, "DELETE FROM wallet_signing_paths");
			db.addQuery(arrQueries, "DELETE FROM extended_pubkeys");
			db.addQuery(arrQueries, "DELETE FROM wallets");
			db.addQuery(arrQueries, "DELETE FROM correspondent_devices");

			async.series(arrQueries, cb);
		}

		function createAddresses(assocMaxAddressIndexes, cb) {
			var accounts = Object.keys(assocMaxAddressIndexes);
			var currentAccount = 0;

			function addAddress(wallet, is_change, index, maxIndex) {
				wallet_defined_by_keys.issueAddress(wallet, is_change, index, function(addressInfo) {
					index++;
					if (index <= maxIndex) {
						addAddress(wallet, is_change, index, maxIndex);
					} else {
						if (is_change) {
							currentAccount++;
							(currentAccount < accounts.length) ? startAddToNewWallet(0) : cb();
						} else {
							startAddToNewWallet(1);
						}
					}
				});
			}

			function startAddToNewWallet(is_change) {
				if (is_change) {
					if (assocMaxAddressIndexes[accounts[currentAccount]].change !== undefined) {
						addAddress(self.assocIndexesToWallets[accounts[currentAccount]], 1, 0, assocMaxAddressIndexes[accounts[currentAccount]].change);
					} else {
						currentAccount++;
						(currentAccount < accounts.length) ? startAddToNewWallet(0) : cb();
					}
				} else {
					addAddress(self.assocIndexesToWallets[accounts[currentAccount]], 0, 0, assocMaxAddressIndexes[accounts[currentAccount]].main + 20);
				}
			}


			startAddToNewWallet(0);
		}

		function createWallets(arrWalletIndexes, cb) {

			function createWallet(n) {
				var account = parseInt(arrWalletIndexes[n]);
				var opts = {};
				opts.m = 1;
				opts.n = 1;
				opts.name = 'Wallet #' + account;
				opts.network = 'livenet';
				opts.cosigners = [];
				opts.extendedPrivateKey = self.xPrivKey;
				opts.mnemonic = self.inputMnemonic;
				opts.account = account;

				profileService.createWallet(opts, function(err, walletId) {
					self.assocIndexesToWallets[account] = walletId;
					n++;
					(n < arrWalletIndexes.length) ? createWallet(n) : cb();
				});
			}

			createWallet(0);
		}

		function scanForAddressesAndWalletsInLightClient(mnemonic, cb) {
			self.xPrivKey = new Mnemonic(mnemonic).toHDPrivateKey();
			var xPubKey;
			var currentWalletIndex = 0;
			var lastUsedWalletIndex = -1;
			var assocMaxAddressIndexes = {};

			function checkAndAddCurrentAddresses(is_change) {
				if (!assocMaxAddressIndexes[currentWalletIndex]) assocMaxAddressIndexes[currentWalletIndex] = {
					main: 0,
					change: 0
				};
				var arrTmpAddresses = [];
				for (var i = 0; i < 20; i++) {
					var index = (is_change ? assocMaxAddressIndexes[currentWalletIndex].change : assocMaxAddressIndexes[currentWalletIndex].main) + i;
					arrTmpAddresses.push(objectHash.getChash160(["sig", {"pubkey": wallet_defined_by_keys.derivePubkey(xPubKey, 'm/' + is_change + '/' + index)}]));
				}
				myWitnesses.readMyWitnesses(function (arrWitnesses) {
					network.requestFromLightVendor('light/get_history', {
						addresses: arrTmpAddresses,
						witnesses: arrWitnesses
					}, function (ws, request, response) {
						if(response && response.error){
							var breadcrumbs = require('byteballcore/breadcrumbs.js');
							breadcrumbs.add('Error scanForAddressesAndWalletsInLightClient: ' + response.error);
							self.error = 'When scanning an error occurred, please try again later.';
							self.scanning = false;
							$timeout(function () {
								$rootScope.$apply();
							});
							return;
						}
						if (Object.keys(response).length) {
							lastUsedWalletIndex = currentWalletIndex;
							if (is_change) {
								assocMaxAddressIndexes[currentWalletIndex].change += 20;
							} else {
								assocMaxAddressIndexes[currentWalletIndex].main += 20;
							}
							checkAndAddCurrentAddresses(is_change);
						} else {
							if (is_change) {
								if(assocMaxAddressIndexes[currentWalletIndex].change === 0 && assocMaxAddressIndexes[currentWalletIndex].main === 0) delete assocMaxAddressIndexes[currentWalletIndex];
								currentWalletIndex++;
								if(currentWalletIndex - lastUsedWalletIndex > 3){
									cb(assocMaxAddressIndexes);
								}else{
									setCurrentWallet();
								}
							} else {
								checkAndAddCurrentAddresses(1);
							}
						}
					});
				});
			}

			function setCurrentWallet() {
				xPubKey = Bitcore.HDPublicKey(self.xPrivKey.derive("m/44'/0'/" + currentWalletIndex + "'"));
				checkAndAddCurrentAddresses(0);
			}

			setCurrentWallet();
		}

		function cleanAndAddWalletsAndAddresses(assocMaxAddressIndexes) {
			var device = require('byteballcore/device');
			var arrWalletIndexes = Object.keys(assocMaxAddressIndexes);
			if (arrWalletIndexes.length) {
				removeAddressesAndWallets(function () {
					var myDeviceAddress = objectHash.getDeviceAddress(ecdsa.publicKeyCreate(self.xPrivKey.derive("m/1'").privateKey.bn.toBuffer({size: 32}), true).toString('base64'));
					profileService.replaceProfile(self.xPrivKey.toString(), self.inputMnemonic, myDeviceAddress, function () {
						device.setDevicePrivateKey(self.xPrivKey.derive("m/1'").privateKey.bn.toBuffer({size: 32}));
						createWallets(arrWalletIndexes, function () {
							createAddresses(assocMaxAddressIndexes, function () {
								self.scanning = false;
								$rootScope.$emit('Local/ShowAlert', arrWalletIndexes.length + " wallets recovered, please restart the application to finish.", 'fi-check', function () {
									if (navigator && navigator.app) // android
										navigator.app.exitApp();
									else if (process.exit) // nwjs
										process.exit();
								});
							});
						});
					});
				});
			} else {
				self.error = 'No active addresses found.';
				self.scanning = false;
				$timeout(function () {
					$rootScope.$apply();
				});
			}
		}

		self.recoveryForm = function() {
			if (self.inputMnemonic) {
				self.error = '';
				self.inputMnemonic = self.inputMnemonic.toLowerCase();
				if ((self.inputMnemonic.split(' ').length % 3 === 0) && Mnemonic.isValid(self.inputMnemonic)) {
					self.scanning = true;
					if (self.bLight) {
						scanForAddressesAndWalletsInLightClient(self.inputMnemonic, cleanAndAddWalletsAndAddresses);
					} else {
						scanForAddressesAndWallets(self.inputMnemonic, cleanAndAddWalletsAndAddresses);
					}
				} else {
					self.error = 'Seed is not valid';
				}
			}
		}

	});
