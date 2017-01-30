'use strict';

var async = require('async');
var conf = require('byteballcore/conf.js');
var wallet_defined_by_keys = require('byteballcore/wallet_defined_by_keys.js');
var objectHash = require('byteballcore/object_hash.js');
var ecdsa = require('secp256k1');
var Mnemonic = require('bitcore-mnemonic');
var Bitcore = require('bitcore-lib');
var db = require('byteballcore/db.js');

angular.module('copayApp.controllers').controller('recoveryFromSeed',
	function($rootScope, $scope, $log, $timeout, profileService) {
		var self = this;
		
		self.error = '';
		self.bLight = conf.bLight === true;
		self.scanning = false;
		self.inputMnemonic = '';
		self.xPrivKey = '';
		self.objIndexesToWallets = {};
		
		function checkUseAddress(address, cb) {
			db.query("SELECT 1 FROM outputs WHERE address = ? LIMIT 0, 1", [address], function(rowOutputs) {
				if (rowOutputs.length === 1) {
					cb(true);
				} else {
					db.query("SELECT 1 FROM unit_authors WHERE address = ? LIMIT 0, 1", [address], function(rowUnitAuthors) {
						if (rowUnitAuthors.length === 1) {
							cb(true);
						} else {
							cb(false);
						}
					});
				}
			});
		}
		
		function getListAddressesAndWallets(mnemonic, cb) {
			self.xPrivKey = new Mnemonic(mnemonic).toHDPrivateKey();
			var xPubKey;
			var lastUsedAddressIndex = -1;
			var lastUsedWalletIndex = -1;
			var currentAddressIndex = 0;
			var currentWalletIndex = 0;
			var assocAddresses = {};
			var assocIndexesWallet = {};
			
			function checkAndAddCurrentAddress(is_change) {
				var address = objectHash.getChash160(["sig", {"pubkey": wallet_defined_by_keys.derivePubkey(xPubKey, 'm/' + (is_change ? 1 : 0) + '/' + currentAddressIndex)}]);
				checkUseAddress(address, function(bUsed) {
					if (bUsed) {
						lastUsedAddressIndex = currentAddressIndex;
						assocAddresses[address] = {
							address: address,
							index: currentAddressIndex,
							is_change: is_change ? 1 : 0,
							walletIndex: currentWalletIndex
						};
						currentAddressIndex++;
						checkAndAddCurrentAddress(is_change);
					} else {
						currentAddressIndex++;
						if (currentAddressIndex - lastUsedAddressIndex >= 20) {
							if (is_change) {
								if (lastUsedAddressIndex !== -1) {
									lastUsedWalletIndex = currentWalletIndex;
									assocIndexesWallet[currentWalletIndex] = true;
								}
								if (currentWalletIndex - lastUsedWalletIndex >= 20) {
									cb(assocAddresses, assocIndexesWallet);
								} else {
									currentWalletIndex++;
									setCurrentWallet();
								}
							} else {
								currentAddressIndex = 0;
								checkAndAddCurrentAddress(true);
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
				checkAndAddCurrentAddress(false);
			}
			
			setCurrentWallet();
		}
		
		function removeAddressesAndWallets(cb) {
			var arrQueries = [];
			db.addQuery(arrQueries, "DELETE FROM my_addresses");
			db.addQuery(arrQueries, "DELETE FROM wallet_signing_paths");
			db.addQuery(arrQueries, "DELETE FROM extended_pubkeys");
			db.addQuery(arrQueries, "DELETE FROM wallets");
			db.addQuery(arrQueries, "DELETE FROM shared_addresses");
			
			async.series(arrQueries, cb);
		}
		
		function createAddressesFromObj(assocAddresses, cb) {
			var keysAssocAddresses = Object.keys(assocAddresses);
			
			function addAddress(n) {
				var objAddress = assocAddresses[keysAssocAddresses[n]];
				wallet_defined_by_keys.issueAddress(self.objIndexesToWallets[objAddress.walletIndex], objAddress.is_change, objAddress.index, function(addressInfo) {
					n++;
					if (n < keysAssocAddresses.length) {
						addAddress(n);
					} else {
						cb();
					}
				});
			}
			
			addAddress(0);
		}
		
		function createWalletsFromObj(assocIndexesWallet, cb) {
			var walletIndexes = Object.keys(assocIndexesWallet);
			
			function createWallet(n) {
				var account = parseInt(walletIndexes[n]);
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
					self.objIndexesToWallets[account] = walletId;
					n++;
					if (n < walletIndexes.length) {
						createWallet(n);
					} else {
						cb();
					}
				});
			}
			
			createWallet(0);
		}
		
		self.recoveryForm = function() {
			if (self.inputMnemonic) {
				if ((self.inputMnemonic.split(' ').length % 3 === 0) && Mnemonic.isValid(self.inputMnemonic)) {
					self.scanning = true;
					getListAddressesAndWallets(self.inputMnemonic, function(assocAddresses, assocIndexesWallet) {
						if (Object.keys(assocAddresses).length) {
							removeAddressesAndWallets(function() {
								var myDeviceAddress = objectHash.getDeviceAddress(ecdsa.publicKeyCreate(self.xPrivKey.derive("m/1'").privateKey.bn.toBuffer({size: 32}), true).toString('base64'));
								profileService.replaceClientInfo(self.xPrivKey.toString(), self.inputMnemonic, myDeviceAddress, function() {
									createWalletsFromObj(assocIndexesWallet, function() {
										createAddressesFromObj(assocAddresses, function() {
											self.scanning = false;
											$rootScope.$emit('Local/ShowAlert', "Restart the application to finish.", 'fi-alert', function() {
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
							self.error = 'Active address is not found.';
							self.scanning = false;
							$timeout(function() {
								$rootScope.$apply();
							});
						}
					});
				} else {
					self.error = 'Seed is not valid';
				}
			}
		}
		
	});
