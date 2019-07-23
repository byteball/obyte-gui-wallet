'use strict';

var constants = require('ocore/constants.js');
var eventBus = require('ocore/event_bus.js');
var breadcrumbs = require('ocore/breadcrumbs.js');
var ValidationUtils = require('ocore/validation_utils.js');

angular.module('copayApp.controllers')
	.controller('walletHomeController', function($scope, $rootScope, $timeout, $filter, $modal, $log, notification, isCordova, profileService, lodash, configService, storageService, gettext, gettextCatalog, nodeWebkit, addressService, confirmDialog, animationService, addressbookService, correspondentListService, newVersion, autoUpdatingWitnessesList, go, aliasValidationService) {

		var self = this;
		var home = this;
		$scope.Math = window.Math;
		var conf = require('ocore/conf.js');
		var chatStorage = require('ocore/chat_storage.js');
		this.bb_protocol = conf.program;
		this.protocol = conf.program.replace(/byteball/i, 'obyte');
		$rootScope.hideMenuBar = false;
		$rootScope.wpInputFocused = false;
		var config = configService.getSync();
		var configWallet = config.wallet;
		var indexScope = $scope.index;
		var network = require('ocore/network.js');

		// INIT
		var walletSettings = configWallet.settings;
		this.unitValue = walletSettings.unitValue;
		this.bbUnitValue = walletSettings.bbUnitValue;
		this.unitName = walletSettings.unitName;
		this.bbUnitName = walletSettings.bbUnitName;
		this.unitDecimals = walletSettings.unitDecimals;
		this.isCordova = isCordova;
		this.addresses = [];
		this.isMobile = isMobile.any();
		this.isWindowsPhoneApp = isMobile.Windows() && isCordova;
		this.blockUx = false;
		this.showScanner = false;
		this.addr = {};
		this.isTestnet = constants.version.match(/t$/);
		this.testnetName = (constants.alt === '2') ? '[NEW TESTNET]' : '[TESTNET]';
		this.exchangeRates = network.exchangeRates;
		$scope.index.tab = 'walletHome'; // for some reason, current tab state is tracked in index and survives re-instatiations of walletHome.js

		var disablePaymentRequestListener = $rootScope.$on('paymentRequest', function(event, address, amount, asset, recipient_device_address) {
			console.log('paymentRequest event ' + address + ', ' + amount);
			$rootScope.$emit('Local/SetTab', 'send');
			self.setForm(address, amount, null, asset, recipient_device_address);

			/*var form = $scope.sendPaymentForm;
			if (form.address && form.address.$invalid && !self.blockUx) {
				console.log("invalid address, resetting form");
				self.resetForm();
				self.error = gettext('Could not recognize a valid Obyte QR Code');
			}*/
		});

		var disableDataPromptListener = $rootScope.$on('dataPrompt', function(event, dataPrompt) {
			console.log('dataPrompt event ', dataPrompt);
			$rootScope.$emit('Local/SetTab', 'send');
			self.setDataForm(dataPrompt);
		});

		var disablePaymentUriListener = $rootScope.$on('paymentUri', function(event, uri) {
			$timeout(function() {
				$rootScope.$emit('Local/SetTab', 'send');
				self.setForm(uri);
			}, 100);
		});

		var disableAddrListener = $rootScope.$on('Local/NeedNewAddress', function() {
			self.setAddress(true);
		});

		var disableFocusListener = $rootScope.$on('Local/NewFocusedWallet', function() {
			self.addr = {};
			self.resetForm();
		});

		var disableResumeListener = $rootScope.$on('Local/Resume', function() {
			// This is needed then the apps go to sleep
			// looks like it already works ok without rebinding touch events after every resume
			//self.bindTouchDown();
		});

		var disableTabListener = $rootScope.$on('Local/TabChanged', function(e, tab) {
			// This will slow down switch, do not add things here!
			console.log("tab changed " + tab);
			switch (tab) {
				case 'receive':
					// just to be sure we have an address
					self.setAddress();
					break;
				case 'history':
					$rootScope.$emit('Local/NeedFreshHistory');
					break;
				case 'send':
					self.resetError();
			};
		});

		var disableOngoingProcessListener = $rootScope.$on('Addon/OngoingProcess', function(e, name) {
			self.setOngoingProcess(name);
		});

		function onNewWalletAddress(new_address) {
			console.log("==== NEW ADDRESSS " + new_address);
			self.addr = {};
			self.setAddress();
		}

		eventBus.on("new_wallet_address", onNewWalletAddress);

		$scope.$on('$destroy', function() {
			console.log("walletHome $destroy");
			disableAddrListener();
			disablePaymentRequestListener();
			disableDataPromptListener();
			disablePaymentUriListener();
			disableTabListener();
			disableFocusListener();
			disableResumeListener();
			disableOngoingProcessListener();
			disableClaimTextcoinListener();
			$rootScope.hideMenuBar = false;
			eventBus.removeListener("new_wallet_address", onNewWalletAddress);
		});

		//$rootScope.$digest();

		var accept_msg = gettextCatalog.getString('Accept');
		var cancel_msg = gettextCatalog.getString('Cancel');
		var confirm_msg = gettextCatalog.getString('Confirm');

		$scope.openDestinationAddressModal = function(wallets, address) {
			$rootScope.modalOpened = true;
			var fc = profileService.focusedClient;
			//self.resetForm();

			var ModalInstanceCtrl = function($scope, $modalInstance) {
				$scope.wallets = wallets;
				$scope.editAddressbook = false;
				$scope.addAddressbookEntry = false;
				$scope.selectedAddressbook = {};
				$scope.newAddress = address;
				$scope.addressbook = {
					'address': ($scope.newAddress || ''),
					'label': ''
				};
				$scope.color = fc.backgroundColor;
				$scope.bAllowAddressbook = self.canSendExternalPayment();

				$scope.beforeQrCodeScann = function() {
					$scope.error = null;
					$scope.addAddressbookEntry = true;
					$scope.editAddressbook = false;
				};

				$scope.onQrCodeScanned = function(data, addressbookForm) {
					$timeout(function() {
						var form = addressbookForm;
						if (data && form) {
							data = data.replace(self.protocol + ':', '');
							data = data.replace(self.bb_protocol + ':', '');
							form.address.$setViewValue(data);
							form.address.$isValid = true;
							form.address.$render();
						}
						
						$scope.$digest();
					}, 100);
				};

				$scope.selectAddressbook = function(addr) {
					$modalInstance.close(addr);
				};

				$scope.toggleEditAddressbook = function() {
					$scope.editAddressbook = !$scope.editAddressbook;
					$scope.selectedAddressbook = {};
					$scope.addAddressbookEntry = false;
				};

				$scope.toggleSelectAddressbook = function(addr) {
					$scope.selectedAddressbook[addr] = $scope.selectedAddressbook[addr] ? false : true;
				};

				$scope.toggleAddAddressbookEntry = function() {
					$scope.error = null;
					$scope.addressbook = {
						'address': ($scope.newAddress || ''),
						'label': ''
					};
					$scope.addAddressbookEntry = !$scope.addAddressbookEntry;
				};

				$scope.listEntries = function() {
					$scope.error = null;
					addressbookService.list(function(err, ab) {
						if (err) {
							$scope.error = err;
							return;
						}
						$scope.list = ab;
						$timeout(function() {
							$scope.$digest();
						});
					});
				};

				$scope.add = function(addressbook) {
					$scope.error = null;
					$timeout(function() {
						addressbookService.add(addressbook, function(err, ab) {
							if (err) {
								$scope.error = err;
								return;
							}
							$rootScope.$emit('Local/AddressbookUpdated', ab);
							$scope.list = ab;
							$scope.editAddressbook = true;
							$scope.toggleEditAddressbook();
							$scope.$digest();
						});
					}, 100);
				};

				$scope.remove = function(addr) {
					$scope.error = null;
					$timeout(function() {
						addressbookService.remove(addr, function(err, ab) {
							if (err) {
								$scope.error = err;
								return;
							}
							$rootScope.$emit('Local/AddressbookUpdated', ab);
							$scope.list = ab;
							$scope.$digest();
						});
					}, 100);
				};

				$scope.cancel = function() {
					breadcrumbs.add('openDestinationAddressModal cancel');
					$modalInstance.dismiss('cancel');
				};

				$scope.selectWallet = function(walletId, walletName) {
					//$scope.gettingAddress = true; // this caused a weird hang under cordova if used after pulling "..." drop-up menu in chat
					$scope.selectedWalletName = walletName;
					//$timeout(function() { // seems useless
					//  $scope.$apply();
					//});
					addressService.getAddress(walletId, false, function onGotAddress(err, addr) {
						$scope.gettingAddress = false;

						if (err) {
							self.error = err;
							breadcrumbs.add('openDestinationAddressModal getAddress err: ' + err);
							$modalInstance.dismiss('cancel');
							return;
						}

						$modalInstance.close(addr);
					});
				};
			};

			var modalInstance = $modal.open({
				templateUrl: 'views/modals/destination-address.html',
				windowClass: animationService.modalAnimated.slideUp,
				controller: ModalInstanceCtrl,
			});

			var disableCloseModal = $rootScope.$on('closeModal', function() {
				breadcrumbs.add('openDestinationAddressModal on closeModal');
				modalInstance.dismiss('cancel');
			});

			modalInstance.result.finally(function() {
				$rootScope.modalOpened = false;
				disableCloseModal();
				var m = angular.element(document.getElementsByClassName('reveal-modal'));
				m.addClass(animationService.modalAnimated.slideOutDown);
			});

			modalInstance.result.then(function onDestModalDone(addr) {
				if (addr) {
					self.setToAddress(addr);
				}
			});
		};

		$scope.openSharedAddressDefinitionModal = function(address) {
			$rootScope.modalOpened = true;
			var fc = profileService.focusedClient;

			var ModalInstanceCtrl = function($scope, $modalInstance) {
				$scope.color = fc.backgroundColor;
				$scope.address = address;
				$scope.shared_address_cosigners = indexScope.shared_address_cosigners;

				var walletGeneral = require('ocore/wallet_general.js');
				var walletDefinedByAddresses = require('ocore/wallet_defined_by_addresses.js');
				walletGeneral.readMyAddresses(function(arrMyAddresses) {
					walletDefinedByAddresses.readSharedAddressDefinition(address, function(arrDefinition, creation_ts) {
						walletDefinedByAddresses.readSharedAddressPeers(address, function(assocPeerNamesByAddress) {
							$scope.humanReadableDefinition = correspondentListService.getHumanReadableDefinition(arrDefinition, arrMyAddresses, [], assocPeerNamesByAddress, true);
							$scope.creation_ts = creation_ts;
							$timeout(function() {
								$scope.$apply();
							});
						});
					});
				});

				// clicked a link in the definition
				$scope.sendPayment = function(address, amount, asset) {
					if (asset && indexScope.arrBalances.filter(function(balance) {
							return (balance.asset === asset);
						})
						.length === 0)
						return console.log("i do not own anything of asset " + asset);
					$modalInstance.dismiss('done');
					$timeout(function() {
						indexScope.shared_address = null;
						indexScope.updateAll();
						indexScope.updateTxHistory();
						$rootScope.$emit('paymentRequest', address, amount, asset);
					});
				};

				$scope.cancel = function() {
					breadcrumbs.add('openSharedAddressDefinitionModal cancel');
					$modalInstance.dismiss('cancel');
				};

			};

			var modalInstance = $modal.open({
				templateUrl: 'views/modals/address-definition.html',
				windowClass: animationService.modalAnimated.slideUp,
				controller: ModalInstanceCtrl,
			});

			var disableCloseModal = $rootScope.$on('closeModal', function() {
				breadcrumbs.add('openSharedAddressDefinitionModal on closeModal');
				modalInstance.dismiss('cancel');
			});

			modalInstance.result.finally(function() {
				$rootScope.modalOpened = false;
				disableCloseModal();
				var m = angular.element(document.getElementsByClassName('reveal-modal'));
				m.addClass(animationService.modalAnimated.slideOutDown);
			});

		};

		this.openTxpModal = function(tx, copayers) {
			// deleted, maybe restore from copay sometime later
			// actually, nothing to display here that was not already shown
		};

		this.setAddress = function(forceNew) {
			self.addrError = null;
			var fc = profileService.focusedClient;
			if (!fc)
				return;

			// Address already set?
			if (!forceNew && self.addr[fc.credentials.walletId])
				return;

			if (indexScope.shared_address && forceNew)
				throw Error('attempt to generate for shared address');

			if (fc.isSingleAddress && forceNew)
				throw Error('attempt to generate for single address wallets');

			self.generatingAddress = true;
			$timeout(function() {
				addressService.getAddress(fc.credentials.walletId, forceNew, function(err, addr) {
					self.generatingAddress = false;

					if (err) {
						self.addrError = err;
					}
					else {
						if (addr)
							self.addr[fc.credentials.walletId] = addr;
					}

					$timeout(function() {
						$scope.$digest();
					});
				});
			});
		};

		this.copyAddress = function(addr) {
			if (isCordova) {
				window.cordova.plugins.clipboard.copy(addr);
				window.plugins.toast.showShortCenter(gettextCatalog.getString('Copied to clipboard'));
			}
			else if (nodeWebkit.isDefined()) {
				nodeWebkit.writeToClipboard(addr);
			}
		};

		this.shareAddress = function(addr) {
			if (isCordova) {
				if (isMobile.Android() || isMobile.Windows()) {
					window.ignoreMobilePause = true;
				}
				window.plugins.socialsharing.shareWithOptions({message: "My Obyte address " + self.protocol +  ':' + addr, subject: "My Obyte address"/*, url: self.protocol +  ':' + addr*/}, function(){}, function(){});
			}
		};

		this.openCustomizedAmountModal = function(addr) {
			$rootScope.modalOpened = true;
			var self = this;
			var fc = profileService.focusedClient;
			var ModalInstanceCtrl = function($scope, $modalInstance) {
				$scope.addr = addr;
				$scope.color = fc.backgroundColor;
				$scope.unitName = self.unitName;
				$scope.unitValue = self.unitValue;
				$scope.unitDecimals = self.unitDecimals;
				$scope.bbUnitValue = walletSettings.bbUnitValue;
				$scope.bbUnitName = walletSettings.bbUnitName;
				$scope.isCordova = isCordova;
				$scope.buttonLabel = gettextCatalog.getString('Generate QR Code');
				$scope.protocol = conf.program.replace(/byteball/i, 'obyte');

				Object.defineProperty($scope, "_customAmount", {
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
						return console.log('openCustomizedAmountModal: no balances yet');
					var amount = form.amount.$modelValue;
					var assetInfo = $scope.index.arrBalances[$scope.index.assetIndex];
					var asset = assetInfo.asset;
					if (!asset)
						throw Error("no asset");
					var amountInSmallestUnits = profileService.getAmountInSmallestUnits(amount, asset);
					$timeout(function() {
						$scope.customizedAmountUnit =
							amount + ' ' + ((asset === 'base') ? $scope.unitName : (asset === constants.BLACKBYTES_ASSET ? $scope.bbUnitName : (assetInfo.name || 'of ' + asset)));
						$scope.amountInSmallestUnits = amountInSmallestUnits;
						$scope.asset_param = (asset === 'base') ? '' : '&asset=' + encodeURIComponent(asset);
					}, 1);
				};

				$scope.shareAddress = function(uri) {
					if (isCordova) {
						if (isMobile.Android() || isMobile.Windows())
							window.ignoreMobilePause = true;
						window.plugins.socialsharing.share(uri, null, null, null);
					}
				};

				$scope.cancel = function() {
					breadcrumbs.add('openCustomizedAmountModal: cancel');
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
				breadcrumbs.add('openCustomizedAmountModal: on closeModal');
				modalInstance.dismiss('cancel');
			});

			modalInstance.result.finally(function() {
				$rootScope.modalOpened = false;
				disableCloseModal();
				var m = angular.element(document.getElementsByClassName('reveal-modal'));
				m.addClass(animationService.modalAnimated.slideOutDown);
			});
		};

		this.openClaimTextcoinModal = function(addr) {
			$rootScope.modalOpened = true;
			var fc = profileService.focusedClient;
			var ModalInstanceCtrl = function($scope, $modalInstance) {
				$scope.color = fc.backgroundColor;
				$scope.buttonLabel = gettextCatalog.getString('Claim funds');

				$scope.submitForm = function(form) {
					$modalInstance.close(form.mnemonic.$modelValue);
				};

				$scope.cancel = function() {
					breadcrumbs.add('openCustomizedAmountModal: cancel');
					$modalInstance.dismiss('cancel');
				};
			};

			var modalInstance = $modal.open({
				templateUrl: 'views/modals/claim-textcoin.html',
				windowClass: animationService.modalAnimated.slideUp,
				controller: ModalInstanceCtrl,
				scope: $scope
			});

			var disableCloseModal = $rootScope.$on('closeModal', function() {
				breadcrumbs.add('openClaimTextcoinModal: on closeModal');
				modalInstance.dismiss('cancel');
			});

			modalInstance.result.finally(function(val) {
				$rootScope.modalOpened = false;
				disableCloseModal();
				var m = angular.element(document.getElementsByClassName('reveal-modal'));
				m.addClass(animationService.modalAnimated.slideOutDown);
			});

			modalInstance.result.then(function(mnemonic) {
				if (mnemonic) {
					claimTextCoin(mnemonic, addr);
				}
			});
		};

		function claimTextCoin(mnemonic, addr) {
			var wallet = require('ocore/wallet.js');
			$rootScope.$emit('process_status_change', 'claiming', true);
			wallet.receiveTextCoin(mnemonic, addr, function(err, unit, asset) {
				$timeout(function() {
					$rootScope.$emit('closeModal');
					if (err) {
						if (err.indexOf("not confirmed") !== -1) {
							store_mnemonic_back();
						}
						$rootScope.$emit('process_status_change', 'claiming', false);
						return $rootScope.$emit('Local/ShowErrorAlert', err);
					}
					if (asset) {
						var disableBalanceListener = $rootScope.$on('Local/BalanceUpdated', function(assocBalances) {
							var assetIndex = lodash.findIndex(indexScope.arrBalances, {
								asset: asset
							});
							indexScope.assetIndex = assetIndex;
							indexScope.updateTxHistory();
							$rootScope.$emit('Local/SetTab', 'history', null, true);
							disableBalanceListener();
						});
						indexScope.updateAll();
					} else {
						indexScope.assetIndex = 0;
						indexScope.updateAll({triggerTxUpdate: true});
						$rootScope.$emit('Local/SetTab', 'history', null, true);
					}
					$scope.$digest();
					$rootScope.$emit('process_status_change', 'claiming', false);
				});
			});
		}
	
		var disableClaimTextcoinListener = $rootScope.$on('claimTextcoin', function(event, mnemonic) {
			breadcrumbs.add("received claimTextcoin event with mnemonic: " + mnemonic.substr(0, 10) + "...");
			var addr = self.addr[profileService.focusedClient.credentials.walletId];
			if (addr) {
				claimTextCoin(mnemonic, addr);
			} else {
				addressService.getAddress(profileService.focusedClient.credentials.walletId, false, function(err, addr) {
					if (addr) {
						self.addr[profileService.focusedClient.credentials.walletId] = addr;
						claimTextCoin(mnemonic, addr);
					}

					$timeout(function() {
						$scope.$digest();
					});
				});
			}
		});

		// Send 

		$scope.$on('$destroy', function() {
		//	unwatchSpendUnconfirmed();
		});

		this.resetError = function() {
			this.error = this.success = null;
		};

		this.bindTouchDown = function(tries) {
			var self = this;
			tries = tries || 0;
			if (tries > 5) return;
			var e = document.getElementById('menu-walletHome');
			if (!e) return $timeout(function() {
				self.bindTouchDown(++tries);
			}, 500);

			// on touchdown elements
			$log.debug('Binding touchstart elements...');
			['hamburger', 'menu-walletHome', 'menu-send', 'menu-receive', 'menu-history'].forEach(function(id) {
				var e = document.getElementById(id);
				if (e) e.addEventListener('touchstart', function() {
					try {
						event.preventDefault();
					}
					catch (e) {};
					$timeout(function(){
						try {
							angular.element(e).triggerHandler('click');
						} catch (e) {};
					});
				}, true);
			});
		}

		this.hideMenuBar = lodash.debounce(function(hide) {
			if (hide) {
				$rootScope.hideMenuBar = true;
				this.bindTouchDown();
			}
			else {
				$rootScope.hideMenuBar = false;
			}
			$timeout(function(){
				$rootScope.$digest();
			});
		}, 100);

		this.formFocus = function(what) {
			if (isCordova && !this.isWindowsPhoneApp) {
				this.hideMenuBar(what);
			}
			if (!this.isWindowsPhoneApp) return

			if (!what) {
				this.hideAddress = false;
				this.hideAmount = false;

			}
			else {
				if (what == 'amount') {
					this.hideAddress = true;
				}
				else if (what == 'msg') {
					this.hideAddress = true;
					this.hideAmount = true;
				}
			}
			$timeout(function() {
				$rootScope.$digest();
			}, 1);
		};

		this.setSendPaymentFormInputs = function() {
			/**
			 * Setting the two related amounts as properties prevents an infinite
			 * recursion for watches while preserving the original angular updates
			 *
			 */
			Object.defineProperty($scope,
				"_amount", {
					get: function() {
						return $scope.__amount;
					},
					set: function(newValue) {
						$scope.__amount = newValue;
						self.resetError();
					},
					enumerable: true,
					configurable: true
				});

			Object.defineProperty($scope,
				"_address", {
					get: function() {
						return $scope.__address;
					},
					set: function(newValue) {
						$scope.__address = self.onAddressChange(newValue);
					},
					enumerable: true,
					configurable: true
				});

			var fc = profileService.focusedClient;
			// ToDo: use a credential's (or fc's) function for this
			this.hideNote = true;
		};

		this.setSendError = function(err) {
			var fc = profileService.focusedClient;
			var prefix =
				fc.credentials.m > 1 ? gettextCatalog.getString('Could not create payment proposal') : gettextCatalog.getString('Could not send payment');

			this.error = prefix + ": " + err;
			console.log(this.error);

			$timeout(function() {
				$scope.$digest();
			}, 1);
		};

		this.setOngoingProcess = function(name) {
			var self = this;
			self.blockUx = !!name;

			if (isCordova) {
				if (name) {
					window.plugins.spinnerDialog.hide();
					window.plugins.spinnerDialog.show(null, name + '...', true);
				}
				else {
					window.plugins.spinnerDialog.hide();
				}
			}
			else {
				self.onGoingProcess = name;
				$timeout(function() {
					$rootScope.$apply();
				});
			};
		};

		function getShareMessage(amount, mnemonic, asset) {
			var usd_amount_str = "";
			var is_private = (asset == constants.BLACKBYTES_ASSET);
			if (!asset || asset == "base" || asset == constants.BLACKBYTES_ASSET) {
				var pair = asset == constants.BLACKBYTES_ASSET ? "GBB_USD" : "GBYTE_USD";
				if (network.exchangeRates[pair]) {
					usd_amount_str = " (≈" + ((amount/1e9)*network.exchangeRates[pair]).toLocaleString([], {maximumFractionDigits: 2}) + " USD)";
				}
				amount = (amount/1e9).toLocaleString([], {maximumFractionDigits: 9});
				asset = asset == constants.BLACKBYTES_ASSET ? "GBB" : "GB";
			} else {
				//indexScope.arrBalances[$scope.index.assetIndex]
				var assetInfo = lodash.find(indexScope.arrBalances, function(balance){return balance.asset == asset});
				if (assetInfo) {
					is_private = assetInfo.is_private;
					var pair = asset + "_USD";
					if (network.exchangeRates[pair]) {
						usd_amount_str = " (≈" + (amount / Math.pow(10, assetInfo.decimals || 0) * network.exchangeRates[pair]).toLocaleString([], {maximumFractionDigits: 2}) + " USD)";
					}
					if (assetInfo.decimals) {
						amount /= Math.pow(10, assetInfo.decimals);
					}
					asset = assetInfo.name ? assetInfo.name : asset;
				}
			}
			return {
				message: "Here is your " + (is_private ? "file" : "link") + " to receive " + amount + " " + asset + usd_amount_str + (is_private ? ".  If you don't have a Obyte wallet yet, install it from https://obyte.org." : (": https://obyte.org/#textcoin?" + mnemonic)),
				subject: "Obyte user beamed you money"
			}
		}

		this.openShareTextcoinModal = function(addr, mnemonic, amount, asset, isResend, filePath) {
			if (!addr && isCordova) {
				if (isMobile.Android() || isMobile.Windows()) {
					window.ignoreMobilePause = true;
				}
				var removeFile = function() {};
				window.plugins.socialsharing.shareWithOptions(lodash.assign(getShareMessage(amount, mnemonic, asset), {files: filePath ? [filePath] : []}), removeFile, removeFile);
				return;
			}
			if (filePath)
				return;
			var msg = getShareMessage(amount, mnemonic, asset);
			var text = msg.message;
			var subject = msg.subject;
			$rootScope.modalOpened = true;
			var fc = profileService.focusedClient;
			var ModalInstanceCtrl = function($scope, $modalInstance) {
				$scope.color = fc.backgroundColor;
				$scope.buttonLabel = gettextCatalog.getString((isResend ? 're' : '' ) + 'send email');
				$scope.isCordova = isCordova;
				$scope.address = addr;
				$scope.mnemonic = mnemonic;
				$scope.text = text;
				$scope.subject = subject;
				$scope.isResend = isResend;
				$scope.filePath = filePath;

				$scope.shareToEmail = function() {
					window.plugins.socialsharing.shareViaEmail(text, subject, [addr]);
					$modalInstance.close();
				};

				$scope.cancel = function() {
					breadcrumbs.add('openShareTextcoinModal: cancel');
					$modalInstance.dismiss('cancel');
				};
			};

			var modalInstance = $modal.open({
				templateUrl: 'views/modals/share.html',
				windowClass: animationService.modalAnimated.slideUp,
				controller: ModalInstanceCtrl,
				scope: $scope
			});

			var disableCloseModal = $rootScope.$on('closeModal', function() {
				breadcrumbs.add('openShareTextcoinModal: on closeModal');
				modalInstance.dismiss('cancel');
			});

			modalInstance.result.finally(function(val) {
				$rootScope.modalOpened = false;
				disableCloseModal();
				var m = angular.element(document.getElementsByClassName('reveal-modal'));
				m.addClass(animationService.modalAnimated.slideOutDown);
			});
		};

		this.submitPayment = function() {
			if ($scope.index.arrBalances.length === 0)
				return console.log('send payment: no balances yet');
			var fc = profileService.focusedClient;
			var unitValue = this.unitValue;
			var bbUnitValue = this.bbUnitValue;

			if (isCordova && this.isWindowsPhoneApp) {
				this.hideAddress = false;
				this.hideAmount = false;
			}

			var form = $scope.sendPaymentForm;
			var isMultipleSend = !!form.addresses;
			if (!form)
				return console.log('form is gone');
			if (self.bSendAll)
				form.amount.$setValidity('validAmount', true);

			var resetAddressValidation = function(){};
			if ($scope.mtab == 2 && !isMultipleSend && !form.address.$modelValue) { // clicked 'share via message' button
				resetAddressValidation = function() {
					if (form && form.address)
						form.address.$setValidity('validAddressOrAccount', false);
				}
				form.address.$setValidity('validAddressOrAccount', true);
			}

			if (form.$invalid) {
				this.error = gettext('Unable to send transaction proposal');
				return;
			}

			var data_payload = {};
			var errored = false;
			$scope.home.feedvaluespairs.forEach(function(pair) {
				if (data_payload[pair.name]) {
					self.setSendError("All keys must be unique");
					errored = true;
					return;
				}
				data_payload[pair.name] = pair.value;
			});
			if (errored)
				return;
			var objDataMessage;
			if (Object.keys(data_payload).length > 0) {
				var objectHash = require('ocore/object_hash.js');
				var storage = require('ocore/storage.js');
				objDataMessage = {
					app: 'data',
					payload_location: "inline",
					payload_hash: objectHash.getBase64Hash(data_payload, storage.getMinRetrievableMci() >= constants.timestampUpgradeMci),
					payload: data_payload
				};
			}

			if (fc.isPrivKeyEncrypted()) {
				profileService.unlockFC(null, function(err) {
					if (err)
						return self.setSendError(err.message);
					return self.submitPayment();
				});
				return;
			}

			var comment = form.comment.$modelValue;

			// ToDo: use a credential's (or fc's) function for this
			if (comment) {
				var msg = 'Could not add message to imported wallet without shared encrypting key';
				$log.warn(msg);
				return self.setSendError(gettext(msg));
			}

			var wallet = require('ocore/wallet.js');
			var assetInfo = $scope.index.arrBalances[$scope.index.assetIndex];
			var asset = assetInfo.asset;
			console.log("asset " + asset);

			if (conf.bLight && indexScope.copayers.length > 1 && indexScope.onGoingProcess['Syncing']) //wait for sync before sending
					return self.setSendError(gettext("wait for sync to complete before sending payments"));

			if (isMultipleSend) {
				if (assetInfo.is_private)
					return self.setSendError("private assets can not be sent to multiple addresses");
				var outputs = [];
				form.addresses.$modelValue.split('\n').forEach(function(line){
					var tokens = line.trim().split(/[\s,;]/);
					var address = tokens[0];
					var amount = tokens.pop();
					if (asset === "base")
						amount *= unitValue;
					else if (assetInfo.decimals)
						amount *= Math.pow(10, assetInfo.decimals);
					amount = Math.round(amount);
					outputs.push({address: address, amount: +amount});
				});
				var current_payment_key = form.addresses.$modelValue.replace(/[^a-zA-Z0-9]/g, '');
			} else {
				var address = form.address.$modelValue;
				var recipient_device_address = assocDeviceAddressesByPaymentAddress[address];
				var amount = form.amount.$modelValue;
				// address can be [bytreball_addr, email, account, empty => social sharing]
				var accountValidationResult = aliasValidationService.validate(address);
				var isEmail = ValidationUtils.isValidEmail(address);
				var isTextcoin = (isEmail || !address);

				var original_address;  // might be sent to email if the email address is attested
				if (isTextcoin)
					address = "textcoin:" + (address ? address : (Date.now() + "-" + amount));
				if (asset === "base")
					amount *= unitValue;
				else if (asset === constants.BLACKBYTES_ASSET)
					amount *= bbUnitValue;
				else if (assetInfo.decimals)
					amount *= Math.pow(10, assetInfo.decimals);
				amount = Math.round(amount);

				var current_payment_key = '' + asset + address + amount;
			}
			var merkle_proof = '';
			if (form.merkle_proof && form.merkle_proof.$modelValue)
				merkle_proof = form.merkle_proof.$modelValue.trim();

			if (current_payment_key === self.current_payment_key)
				return $rootScope.$emit('Local/ShowErrorAlert', "This payment is already under way");
			self.current_payment_key = current_payment_key;

			indexScope.setOngoingProcess(gettext('sending'), true);
			$timeout(function() {

				if (!isMultipleSend && accountValidationResult.isValid) { // try to replace validation result with attested BB address
					var attestorKey = accountValidationResult.attestorKey;
					var account = accountValidationResult.account;
					var bb_address = aliasValidationService.getBbAddress(
						attestorKey,
						account
					);
					console.log('attestorKey='+attestorKey+' : account='+account+' : bb_address='+bb_address);

					if (!bb_address) {
						return aliasValidationService.resolveValueToBbAddress(
							attestorKey,
							account,
							function () {
								// assocBbAddresses in aliasValidationService is now filled
								delete self.current_payment_key;
								self.submitPayment();
							}
						);
					}

					if (!isEmail) {

						if (bb_address === 'unknown' || bb_address === 'none') {
							if (bb_address === 'unknown') {
								aliasValidationService.deleteAssocBbAddress(
									attestorKey,
									account
								);
							}

							delete self.current_payment_key;
							indexScope.setOngoingProcess(gettext('sending'), false);
							return self.setSendError('Attested account not found');
						} else if (ValidationUtils.isValidAddress(bb_address)) {
							original_address = address;
							address = bb_address;
							isEmail = false;
							isTextcoin = false;
						} else {
							throw Error("unrecognized bb_address: "+bb_address);
						}

					} else {

						if (bb_address === 'unknown') {
							aliasValidationService.deleteAssocBbAddress(
								attestorKey,
								account
							); // send textcoin now but retry next time
						} else if (bb_address === 'none') {
							// go on to send textcoin
						} else if (ValidationUtils.isValidAddress(bb_address)) {
							original_address = account;
							address = bb_address;
							isEmail = false;
							isTextcoin = false;
						} else {
							throw Error("unrecognized bb_address: "+bb_address);
						}

					}
				}

				profileService.requestTouchid(function(err) {
					if (err) {
						profileService.lockFC();
						indexScope.setOngoingProcess(gettext('sending'), false);
						self.error = err;
						$timeout(function() {
							delete self.current_payment_key;
							$scope.$digest();
						}, 1);
						return;
					}
					
					var device = require('ocore/device.js');
					if (self.binding) {
						if (isTextcoin) {
							delete self.current_payment_key;
							indexScope.setOngoingProcess(gettext('sending'), false);
							return self.setSendError("you can send bound payments to Obyte adresses only");
						}
						if (!recipient_device_address)
							throw Error('recipient device address not known');
						var walletDefinedByAddresses = require('ocore/wallet_defined_by_addresses.js');
						var walletDefinedByKeys = require('ocore/wallet_defined_by_keys.js');
						var my_address;
						// never reuse addresses as the required output could be already present
						useOrIssueNextAddress(fc.credentials.walletId, 0, function(addressInfo) {
							my_address = addressInfo.address;
							if (self.binding.type === 'reverse_payment') {
								var arrSeenCondition = ['seen', {
									what: 'output',
									address: my_address,
									asset: self.binding.reverseAsset,
									amount: self.binding.reverseAmount
								}];
								var arrDefinition = ['or', [
									['and', [
										['address', address],
										arrSeenCondition
									]],
									['and', [
										['address', my_address],
										['not', arrSeenCondition],
										['in data feed', [
											[configService.TIMESTAMPER_ADDRESS], 'timestamp', '>', Date.now() + Math.round(self.binding.timeout * 3600 * 1000)
										]]
									]]
								]];
								var assocSignersByPath = {
									'r.0.0': {
										address: address,
										member_signing_path: 'r',
										device_address: recipient_device_address
									},
									'r.1.0': {
										address: my_address,
										member_signing_path: 'r',
										device_address: device.getMyDeviceAddress()
									}
								};
							}
							else {
								if (self.binding.relation !== '=')
									self.binding.feed_type = 'explicit';
								if (self.binding.oracle_address === configService.TIMESTAMPER_ADDRESS)
									self.binding.feed_value = parseInt(self.binding.feed_value);
								var arrExplicitEventCondition =
									['in data feed', [
										[self.binding.oracle_address], self.binding.feed_name, self.binding.relation, self.binding.feed_value
									]];
								var arrMerkleEventCondition =
									['in merkle', [
										[self.binding.oracle_address], self.binding.feed_name, self.binding.feed_value
									]];
								var arrEventCondition;
								if (self.binding.feed_type === 'explicit')
									arrEventCondition = arrExplicitEventCondition;
								else if (self.binding.feed_type === 'merkle')
									arrEventCondition = arrMerkleEventCondition;
								else if (self.binding.feed_type === 'either')
									arrEventCondition = ['or', [arrMerkleEventCondition, arrExplicitEventCondition]];
								else
									throw Error("unknown feed type: " + self.binding.feed_type);
								var arrDefinition = ['or', [
									['and', [
										['address', address],
										arrEventCondition
									]],
									['and', [
										['address', my_address],
										['in data feed', [
											[configService.TIMESTAMPER_ADDRESS], 'timestamp', '>', Date.now() + Math.round(self.binding.timeout * 3600 * 1000)
										]]
									]]
								]];
								var assocSignersByPath = {
									'r.0.0': {
										address: address,
										member_signing_path: 'r',
										device_address: recipient_device_address
									},
									'r.1.0': {
										address: my_address,
										member_signing_path: 'r',
										device_address: device.getMyDeviceAddress()
									}
								};
								if (self.binding.feed_type === 'merkle' || self.binding.feed_type === 'either')
									assocSignersByPath[(self.binding.feed_type === 'merkle') ? 'r.0.1' : 'r.0.1.0'] = {
										address: '',
										member_signing_path: 'r',
										device_address: recipient_device_address
									};
							}
							walletDefinedByAddresses.createNewSharedAddress(arrDefinition, assocSignersByPath, {
								ifError: function(err) {
									delete self.current_payment_key;
									indexScope.setOngoingProcess(gettext('sending'), false);
									self.setSendError(err);
								},
								ifOk: function(shared_address) {
									composeAndSend(shared_address);
								}
							});
						});
					}
					else
						composeAndSend(address);

					// compose and send
					function composeAndSend(to_address) {
						var arrSigningDeviceAddresses = []; // empty list means that all signatures are required (such as 2-of-2)
						if (fc.credentials.m < fc.credentials.n)
							$scope.index.copayers.forEach(function(copayer) {
								if (copayer.me || copayer.signs)
									arrSigningDeviceAddresses.push(copayer.device_address);
							});
						else if (indexScope.shared_address)
							arrSigningDeviceAddresses = indexScope.copayers.map(function(copayer) {
								return copayer.device_address;
							});
						breadcrumbs.add('sending payment in ' + asset);
						profileService.bKeepUnlocked = true;
						var opts = {
							shared_address: indexScope.shared_address,
							merkle_proof: merkle_proof,
							asset: asset,
							do_not_email: true,
							send_all: self.bSendAll,
							spend_unconfirmed: configWallet.spendUnconfirmed ? 'all' : 'own',
							arrSigningDeviceAddresses: arrSigningDeviceAddresses,
							recipient_device_address: recipient_device_address
						};
						if (!isMultipleSend) {
							opts.to_address = to_address;
							opts.amount = amount;
						} else {
							if (asset !== "base")
								opts.asset_outputs = outputs;
							else
								opts.base_outputs = outputs;
						}
						var filePath;
						if (assetInfo.is_private) {
							opts.getPrivateAssetPayloadSavePath = function(cb) {
								self.getPrivatePayloadSavePath(function(fullPath, cordovaPathObj){
									filePath = fullPath ? fullPath : (cordovaPathObj ? cordovaPathObj.root + cordovaPathObj.path + '/' + cordovaPathObj.fileName : null);
									cb(fullPath, cordovaPathObj);
								});
							};
						}
						if (objDataMessage)
							opts.messages = [objDataMessage];
						fc.sendMultiPayment(opts, function(err, unit, mnemonics) {
							// if multisig, it might take very long before the callback is called
							indexScope.setOngoingProcess(gettext('sending'), false);
							breadcrumbs.add('done payment in ' + asset + ', err=' + err);
							delete self.current_payment_key;
							resetAddressValidation();
							profileService.bKeepUnlocked = false;
							if (err) {
								if (typeof err === 'object') {
									err = JSON.stringify(err);
									eventBus.emit('nonfatal_error', "error object from sendMultiPayment: " + err, new Error());
								}
								else if (err.match(/device address/))
									err = "This is a private asset, please send it only by clicking links from chat";
								else if (err.match(/no funded/))
									err = "Not enough spendable funds, make sure all your funds are confirmed";
								else if (err.match(/authentifier verification failed/))
									err = "Check that smart contract conditions are satisfied and signatures are correct";
								else if (err.match(/precommit/))
									err = err.replace('precommit callback failed: ', '');
								return self.setSendError(err);
							}
							var binding = self.binding;
							self.resetForm();
						//	$rootScope.$emit("NewOutgoingTx"); // we are already updating UI in response to new_my_transactions event which is triggered by broadcast
							if (original_address){
								var db = require('ocore/db.js');
								db.query("INSERT INTO original_addresses (unit, address, original_address) VALUES(?,?,?)", 
									[unit, to_address, original_address]);
							}
							if (recipient_device_address) { // show payment in chat window
								eventBus.emit('sent_payment', recipient_device_address, amount || 'all', asset, !!binding);
								if (binding && binding.reverseAmount) { // create a request for reverse payment
									if (!my_address)
										throw Error('my address not known');
									var paymentRequestCode = 'byteball:' + my_address + '?amount=' + binding.reverseAmount + '&asset=' + encodeURIComponent(binding.reverseAsset);
									var paymentRequestText = '[reverse payment](' + paymentRequestCode + ')';
									device.sendMessageToDevice(recipient_device_address, 'text', paymentRequestText);
									var body = correspondentListService.formatOutgoingMessage(paymentRequestText);
									correspondentListService.addMessageEvent(false, recipient_device_address, body);
									device.readCorrespondent(recipient_device_address, function(correspondent) {
										if (correspondent.my_record_pref && correspondent.peer_record_pref) chatStorage.store(correspondent.device_address, body, 0, 'html');
									});

									// issue next address to avoid reusing the reverse payment address
									if (!fc.isSingleAddress) walletDefinedByKeys.issueNextAddress(fc.credentials.walletId, 0, function() {});
								}
							}
							else if (Object.keys(mnemonics).length) {
								var mnemonic = mnemonics[to_address];
								if (opts.send_all && asset === "base")
									amount = assetInfo.stable;

								self.openShareTextcoinModal(isEmail ? address.slice("textcoin:".length) : null, mnemonic, amount, asset, false, filePath);
								$rootScope.$emit('Local/SetTab', 'history');
							}
							else // redirect to history
								$rootScope.$emit('Local/SetTab', 'history');
						});

					}

					function useOrIssueNextAddress(wallet, is_change, handleAddress) {
						if (fc.isSingleAddress) {
							addressService.getAddress(fc.credentials.walletId, false, function(err, addr) {
								handleAddress({
									address: addr
								});
							});
						}
						else walletDefinedByKeys.issueNextAddress(wallet, is_change, handleAddress);
					}

				});
			}, 100);
		};

		$scope.$watch('index.assetIndex', function(newVal, oldVal) {
			$scope.assetIndexSelectorValue = newVal;
			self.switchForms();
		});
		this.switchForms = function() {
			 this.bSendAll = false;
			 if (this.send_multiple && $scope.index.arrBalances[$scope.index.assetIndex] && $scope.index.arrBalances[$scope.index.assetIndex].is_private)
			 	this.lockAmount = this.send_multiple = false;
			if ($scope.assetIndexSelectorValue < 0) {
				this.shownForm = 'data';
				if (!this.feedvaluespairs || this.feedvaluespairs.length === 0)
					this.feedvaluespairs = [{}];
			}
			else {
				$scope.index.assetIndex = $scope.assetIndexSelectorValue;
				this.shownForm = 'payment';
				if (!this.feedvaluespairs || this.feedvaluespairs.length > 0 && (!this.feedvaluespairs[0].name || !this.feedvaluespairs[0].value))
					this.feedvaluespairs = [];
			}
			$scope.mtab = $scope.index.arrBalances[$scope.index.assetIndex] && $scope.index.arrBalances[$scope.index.assetIndex].is_private && !this.lockAddress ? 2 : 1;
		}

		this.submitData = function() {
			var objectHash = require('ocore/object_hash.js');
			var storage = require('ocore/storage.js');
			var fc = profileService.focusedClient;
			var value = {};
			var app;
			switch ($scope.assetIndexSelectorValue) {
				case -1:
					app = "data_feed";
					break;
				case -2:
					app = "attestation";
					break;
				case -3:
					app = "profile";
					break;
				case -4:
					app = "data";
					break;
				case -5:
					app = "poll";
					break;
				default:
					throw new Error("invalid asset selected");
					break;
			}
			var errored = false;
			$scope.home.feedvaluespairs.forEach(function(pair) {
				if (value[pair.name]) {
					self.setSendError("All keys must be unique");
					errored = true;
					return;
				}
				value[pair.name] = pair.value;
			});
			if (errored) return;
			if (Object.keys(value)
				.length === 0) {
				self.setSendError("Provide at least one value");
				return;
			}

			if (fc.isPrivKeyEncrypted()) {
				profileService.unlockFC(null, function(err) {
					if (err)
						return self.setSendError(err.message);
					return self.submitData();
				});
				return;
			}

			profileService.requestTouchid(function(err) {
				if (err) {
					profileService.lockFC();
					indexScope.setOngoingProcess(gettext('sending'), false);
					self.error = err;
					$timeout(function() {
						$scope.$digest();
					}, 1);
					return;
				}

				if (app == "attestation") {
					value = {
						address: $scope.home.attested_address,
						profile: value
					};
				}
				if (app == "poll") {
					value = {
						question: $scope.home.poll_question,
						choices: Object.keys(value)
					};
				}
				var objMessage = {
					app: app,
					payload_location: "inline",
					payload_hash: objectHash.getBase64Hash(value, storage.getMinRetrievableMci() >= constants.timestampUpgradeMci),
					payload: value
				};
				var arrSigningDeviceAddresses = []; // empty list means that all signatures are required (such as 2-of-2)
				if (fc.credentials.m < fc.credentials.n)
					indexScope.copayers.forEach(function(copayer) {
						if (copayer.me || copayer.signs)
							arrSigningDeviceAddresses.push(copayer.device_address);
					});
				else if (indexScope.shared_address)
					arrSigningDeviceAddresses = indexScope.copayers.map(function(copayer) {
						return copayer.device_address;
					});

				indexScope.setOngoingProcess(gettext('sending'), true);

				fc.sendMultiPayment({
					spend_unconfirmed: configWallet.spendUnconfirmed ? 'all' : 'own',
					arrSigningDeviceAddresses: arrSigningDeviceAddresses,
					shared_address: indexScope.shared_address,
					messages: [objMessage]
				}, function(err) { // can take long if multisig
					indexScope.setOngoingProcess(gettext('sending'), false);
					if (err) {
						self.setSendError(err);
						return;
					}
					breadcrumbs.add('done submitting data into feeds ' + Object.keys(value)
						.join(','));
					self.resetDataForm();
					$rootScope.$emit('Local/SetTab', 'history');
				});
			});
		}

		this.resetDataForm = function() {
			this.resetError();
			$scope.home.feedvaluespairs = [{}];
			$timeout(function() {
				$rootScope.$digest();
			}, 1);
		};

		var assocDeviceAddressesByPaymentAddress = {};

		this.canSendExternalPayment = function() {
			if ($scope.index.arrBalances.length === 0 || $scope.index.assetIndex < 0) // no balances yet, assume can send
				return true;
			if (!$scope.index.arrBalances[$scope.index.assetIndex]) // no balances yet, assume can send
			 	return true;
			if (!$scope.index.arrBalances[$scope.index.assetIndex].is_private)
			 	return true;
			var form = $scope.sendPaymentForm;
			if (!form || !form.address) // disappeared
				return true;
			var address = form.address.$modelValue;
			var recipient_device_address = assocDeviceAddressesByPaymentAddress[address];
			return !!recipient_device_address;
		};

		this.deviceAddressIsKnown = function() {
			//	return true;
			if ($scope.index.arrBalances.length === 0) // no balances yet
				return false;
			var form = $scope.sendPaymentForm;
			if (!form || !form.address) // disappeared
				return false;
			var address = form.address.$modelValue;
			var recipient_device_address = assocDeviceAddressesByPaymentAddress[address];
			return !!recipient_device_address;
		};

		this.openBindModal = function() {
			$rootScope.modalOpened = true;
			var fc = profileService.focusedClient;
			var form = $scope.sendPaymentForm;
			if (!form || !form.address) // disappeared
				return;
			var address = form.address;

			var ModalInstanceCtrl = function($scope, $modalInstance) {
				$scope.color = fc.backgroundColor;
				$scope.arrRelations = ["=", ">", "<", ">=", "<=", "!="];
				$scope.arrPublicAssetInfos = indexScope.arrBalances.filter(function(b) {
						return !b.is_private;
					})
					.map(function(b) {
						var info = {
							asset: b.asset
						};
						if (b.asset === 'base')
							info.displayName = self.unitName;
						else if (b.asset === constants.BLACKBYTES_ASSET)
							info.displayName = self.bbUnitName;
						else if (profileService.assetMetadata[b.asset])
							info.displayName = profileService.assetMetadata[b.asset].name;
						else
							info.displayName = 'of ' + b.asset.substr(0, 4);
						return info;
					});
				$scope.binding = { // defaults
					type: fc.isSingleAddress ? 'data' : 'reverse_payment',
					timeout: 4,
					relation: '=',
					reverseAsset: 'base',
					feed_type: 'either'
				};
				if (self.binding) {
					$scope.binding.type = self.binding.type;
					$scope.binding.timeout = self.binding.timeout;
					if (self.binding.type === 'reverse_payment') {
						$scope.binding.reverseAsset = self.binding.reverseAsset;
						$scope.binding.reverseAmount = profileService.getAmountInDisplayUnits(self.binding.reverseAmount, self.binding.reverseAsset);
					}
					else {
						$scope.binding.oracle_address = self.binding.oracle_address;
						$scope.binding.feed_name = self.binding.feed_name;
						$scope.binding.relation = self.binding.relation;
						$scope.binding.feed_value = self.binding.feed_value;
						$scope.binding.feed_type = self.binding.feed_type;
					}
				}
				$scope.oracles = configService.oracles;
				$scope.isSingleAddress = fc.isSingleAddress;
				$scope.index = indexScope;

				$scope.cancel = function() {
					$modalInstance.dismiss('cancel');
				};

				$scope.bind = function() {
					var binding = {
						type: $scope.binding.type
					};
					if (binding.type === 'reverse_payment') {
						binding.reverseAsset = $scope.binding.reverseAsset;
						binding.reverseAmount = profileService.getAmountInSmallestUnits($scope.binding.reverseAmount, $scope.binding.reverseAsset);
					}
					else {
						binding.oracle_address = $scope.binding.oracle_address;
						binding.feed_name = $scope.binding.feed_name;
						binding.relation = $scope.binding.relation;
						binding.feed_value = $scope.binding.feed_value;
						binding.feed_type = $scope.binding.feed_type;
					}
					binding.timeout = $scope.binding.timeout;
					self.binding = binding;
					$modalInstance.dismiss('done');
				};

			};

			var modalInstance = $modal.open({
				templateUrl: 'views/modals/bind.html',
				windowClass: animationService.modalAnimated.slideUp,
				controller: ModalInstanceCtrl,
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

		this.setToAddress = function(to) {
			var form = $scope.sendPaymentForm;
			if (!form || !form.address) // disappeared?
				return console.log('form.address has disappeared');
			form.address.$setViewValue(to);
			form.address.$isValid = true;
			form.address.$render();
		}

		this.setForm = function(to, amount, comment, asset, recipient_device_address) {
			this.resetError();
			$timeout((function() {
				delete this.binding;
				var form = $scope.sendPaymentForm;
				if (!form || !form.address) // disappeared?
					return console.log('form.address has disappeared');
				if (form.merkle_proof) {
					form.merkle_proof.$setViewValue('');
					form.merkle_proof.$render();
				}
				if (comment) {
					form.comment.$setViewValue(comment);
					form.comment.$isValid = true;
					form.comment.$render();
				}

				if (asset) {
					var assetIndex = lodash.findIndex($scope.index.arrBalances, {
						asset: asset
					});
					if (assetIndex < 0) {
						notification.error("failed to find asset index of asset " + asset);
						return self.resetForm();
					}
					$scope.index.assetIndex = assetIndex;
					$scope.assetIndexSelectorValue = assetIndex;
					this.lockAsset = true;
				}
				else
					this.lockAsset = false;

				if (to) {
					form.address.$setViewValue(to);
					form.address.$isValid = true;
					form.address.$render();
					this.lockAddress = true;
					$scope.mtab = 1;
					if (recipient_device_address) // must be already paired
						assocDeviceAddressesByPaymentAddress[to] = recipient_device_address;
					if ($scope.assetIndexSelectorValue < 0 && !asset) // a data form was selected
						$scope.assetIndexSelectorValue = 0;
				}
				
				this.switchForms();

				$timeout((function () {
					if (amount) {
						//	form.amount.$setViewValue("" + amount);
						//	form.amount.$isValid = true;
						this.lockAmount = true;
						form.amount.$setViewValue("" + profileService.getAmountInDisplayUnits(amount, asset));
						form.amount.$isValid = true;
						form.amount.$render();
					}
					else  {
						this.lockAmount = false;
						form.amount.$setViewValue("");
						form.amount.$pristine = true;
						form.amount.$render();
					}
				}).bind(this));
				
			}).bind(this), 1);
		};

		this.setDataForm = function (dataPrompt) {
			var app = dataPrompt.app;
			delete dataPrompt.app;
			this.resetError();
			$timeout((function() {
				switch (app) {
					case 'data_feed':
						$scope.assetIndexSelectorValue = -1;
						break;
					case 'attestation':
						$scope.assetIndexSelectorValue = -2;
						$scope.home.attested_address = dataPrompt.address;
						delete dataPrompt.address;
						break;
					case 'profile':
						$scope.assetIndexSelectorValue = -3;
						break;
					case 'data':
						$scope.assetIndexSelectorValue = -4;
						break;
					case 'poll':
						$scope.assetIndexSelectorValue = -5;
						$scope.home.poll_question = dataPrompt.question;
						delete dataPrompt.question;
						break;
					case 'vote':
						notification.error('voting not yet supported via uri');
						return self.resetForm();
				}
				$scope.home.feedvaluespairs = [];
				for (var key in dataPrompt) {
					var value = dataPrompt[key];
					$scope.home.feedvaluespairs.push(app === 'poll' ? {name: value, value: 'anything'} : {name: key, value: value});
				}
				this.switchForms();
			//	$timeout(function () {
			//		$rootScope.$digest();
			//	})
			}).bind(this), 1);
		};

		this.resetForm = function() {
			this.resetError();
			delete this.binding;

			this.lockAsset = false;
			this.lockAddress = false;
			this.lockAmount = false;
			this.hideAdvSend = true;
			this.send_multiple = false;

			this._amount = this._address = null;
			this.bSendAll = false;
			this.feedvaluespairs = [];

			var form = $scope.sendPaymentForm;
			var self = this;

			$timeout(function() {
				if (form && form.amount) {
					if (!$scope.$root) $scope.$root = {};
					form.amount.$pristine = true;
					if (form.amount) {
						form.amount.$setViewValue('');
						form.amount.$render();
					}

					if (form.merkle_proof) {
						form.merkle_proof.$setViewValue('');
						form.merkle_proof.$render();
					}
					if (form.comment) {
						form.comment.$setViewValue('');
						form.comment.$render();
					}
					form.$setPristine();

					if (form.address) {
						form.address.$setPristine();
						form.address.$setViewValue('');
						form.address.$render();
					}
				}
				self.switchForms();
				$timeout(function() {
					$rootScope.$digest();
				}, 1);
			});
		};

		this.setSendAll = function() {
			var form = $scope.sendPaymentForm;
			if (!form || !form.amount) // disappeared?
				return console.log('form.amount has disappeared');
			if (indexScope.arrBalances.length === 0)
				return;
			var assetInfo = indexScope.arrBalances[indexScope.assetIndex];
			if (assetInfo.asset === 'base') {
				this._amount = null;
				this.bSendAll = true;
				form.amount.$setViewValue('');
				form.amount.$setValidity('validAmount', true);
				form.amount.$render();
			}
			else {
				var full_amount = assetInfo.stable;
				if (assetInfo.asset === constants.BLACKBYTES_ASSET)
					full_amount /= this.bbUnitValue;
				else if (assetInfo.decimals)
					full_amount /= Math.pow(10, assetInfo.decimals);
				form.amount.$setViewValue('' + full_amount);
				form.amount.$render();
			}
			//console.log('done setsendall')
			/*$timeout(function() {
				$rootScope.$digest();
				console.log('-- amount invalid? '+form.amount.$invalid);
				console.log('-- form invalid? '+form.$invalid);
			}, 1);*/
		};

		this.setFromUri = function(uri) {
			var objRequest;
			require('ocore/uri.js')
				.parseUri(uri, {
					ifError: function(err) {},
					ifOk: function(_objRequest) {
						objRequest = _objRequest; // the callback is called synchronously
					}
				});

			if (!objRequest) // failed to parse
				return uri;
			if (objRequest.amount) {
				// setForm() cares about units conversion
				//var amount = (objRequest.amount / this.unitValue).toFixed(this.unitDecimals);
				this.setForm(objRequest.address, objRequest.amount);
			}
			return objRequest.address;
		};

		this.onAddressChange = function(value) {
			this.resetError();
			if (!value) return '';

			if (value.indexOf(self.protocol + ':') === 0 || value.indexOf(self.bb_protocol + ':') === 0)
				return this.setFromUri(value);
			else
				return value;
		};

		// History 

		function strip(number) {
			return (parseFloat(number.toPrecision(12)));
		}

		this.getUnitName = function() {
			return this.unitName;
		};

		this.getPrivatePayloadSavePath = function(cb) {
			var fileName = 'ObytePayment-' + $filter('date')(Date.now(), 'yyyy-MM-dd-HH-mm-ss') + '.' + configService.privateTextcoinExt;
			if (!isCordova) {
				var inputFile = document.createElement("input"); 
				inputFile.type = "file";
				inputFile.setAttribute("nwsaveas", fileName);
				inputFile.click();
				var wasCalled = false;
				inputFile.onchange = function() {
					if (wasCalled) return;
					wasCalled = true;
					$timeout(function() {
						cb(inputFile.value ? inputFile.value : null);
						window.removeEventListener('focus', inputFile.onchange, true);
					}, 1000);
				};
				window.addEventListener('focus', inputFile.onchange, true);
			}
			else {
				var root = window.cordova.file.cacheDirectory;//isMobile.iOS() ? window.cordova.file.documentsDirectory : window.cordova.file.externalRootDirectory;
				var path = 'Obyte';
				cb(null, {root: root, path: path, fileName: fileName});
			}
		};

		this.openInExplorer = function(unit) {
			var testnet = home.isTestnet ? 'testnet' : '';
			var url = 'https://' + testnet + 'explorer.obyte.org/#' + unit;
			if (typeof nw !== 'undefined')
				nw.Shell.openExternal(url);
			else if (isCordova)
				cordova.InAppBrowser.open(url, '_system');
		};

		this.openTxModal = function(btx) {
			$rootScope.modalOpened = true;
			var self = this;
			var fc = profileService.focusedClient;
			var ModalInstanceCtrl = function($scope, $modalInstance) {
				$scope.btx = btx;
				var assetIndex = lodash.findIndex(indexScope.arrBalances, {
					asset: btx.asset
				});
				$scope.isPrivate = indexScope.arrBalances[assetIndex].is_private;
				$scope.Math = window.Math;
				$scope.assetDecimals = indexScope.arrBalances[assetIndex].decimals;
				$scope.settings = walletSettings;
				$scope.color = fc.backgroundColor;
				$scope.n = fc.credentials.n;
				$scope.exchangeRates = network.exchangeRates;
				$scope.BLACKBYTES_ASSET = constants.BLACKBYTES_ASSET;

				$scope.shareAgain = function() {
					if ($scope.isPrivate) {
						var indivisible_asset = require('ocore/indivisible_asset');
						var wallet = require('ocore/wallet.js');
						indivisible_asset.restorePrivateChains(btx.asset, btx.unit, btx.addressTo, function(arrRecipientChains, arrCosignerChains){
							self.getPrivatePayloadSavePath(function(fullPath, cordovaPathObj){
								if (!fullPath && !cordovaPathObj)
									return;
								var filePath = fullPath ? fullPath : (cordovaPathObj.root + cordovaPathObj.path + '/' + cordovaPathObj.fileName);
								wallet.storePrivateAssetPayload(fullPath, cordovaPathObj, btx.mnemonic, arrRecipientChains, function(err) {
									if (err)
										throw Error(err);
									self.openShareTextcoinModal(btx.textAddress, btx.mnemonic, btx.amount, btx.asset, true, filePath);
								});
							});
						});
					} else
						self.openShareTextcoinModal(btx.textAddress, btx.mnemonic, btx.amount, btx.asset, true);
				}

				$scope.eraseTextcoin = function() {
					(function(){
						var wallet = require('ocore/wallet.js');
						var ModalInstanceCtrl = function($scope, $modalInstance, $sce) {
							$scope.title = $sce.trustAsHtml(gettextCatalog.getString('Deleting the textcoin will remove the ability to claim it back or resend'));
							$scope.cancel_button_class = 'light-gray outline';
							$scope.loading = false;
							$scope.confirm_label = gettextCatalog.getString('Confirm');

							$scope.ok = function() {
								$scope.loading = true;
								$modalInstance.close(gettextCatalog.getString('Confirm'));
								
								wallet.eraseTextcoin(btx.unit, btx.addressTo);
								
								indexScope.updateTxHistory();
								$rootScope.$emit('Local/SetTab', 'history');
							};
							$scope.cancel = function() {
								$modalInstance.dismiss(gettextCatalog.getString('No'));
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
					})();
				}


				$scope.getAmount = function(amount) {
					return self.getAmount(amount);
				};

				$scope.getUnitName = function() {
					return self.getUnitName();
				};

				$scope.openInExplorer = function() {
					return self.openInExplorer(btx.unit);
				};

				$scope.copyAddress = function(addr) {
					if (!addr) return;
					self.copyAddress(addr);
				};

				$scope.getToAddressLabel = function(value) {
					return indexScope.getToAddressLabel(value);
				};
				$scope.getAddressValue = function(value) {
					return indexScope.getAddressValue(value);
				};

				$scope.showCorrespondentList = function() {
					self.showCorrespondentListToReSendPrivPayloads(btx);
				};

				$scope.reSendPrivateMultiSigPayment = function() {
					var indivisible_asset = require('ocore/indivisible_asset');
					var wallet_defined_by_keys = require('ocore/wallet_defined_by_keys');
					var walletDefinedByAddresses = require('ocore/wallet_defined_by_addresses');
					var fc = profileService.focusedClient;

					function success() {
						$timeout(function() {
							notification.success(gettextCatalog.getString('Success'), gettextCatalog.getString('Private payloads sent', {}));
						});
					}

					indivisible_asset.restorePrivateChains(btx.asset, btx.unit, btx.addressTo, function(arrRecipientChains, arrCosignerChains) {
						if (indexScope.shared_address) {
							walletDefinedByAddresses.forwardPrivateChainsToOtherMembersOfAddresses(arrCosignerChains, [indexScope.shared_address], null, success);
						}
						else {
							wallet_defined_by_keys.forwardPrivateChainsToOtherMembersOfWallets(arrCosignerChains, [fc.credentials.walletId], null, success);
						}
					});
				};

				$scope.cancel = function() {
					breadcrumbs.add('dismiss tx details');
					try {
						$modalInstance.dismiss('cancel');
					}
					catch (e) {
						//	indexScope.sendBugReport('simulated in dismiss tx details', e);
					}
				};

			};

			var modalInstance = $modal.open({
				templateUrl: 'views/modals/tx-details.html',
				windowClass: animationService.modalAnimated.slideRight,
				controller: ModalInstanceCtrl,
			});

			var disableCloseModal = $rootScope.$on('closeModal', function() {
				breadcrumbs.add('on closeModal tx details');
				modalInstance.dismiss('cancel');
			});

			modalInstance.result.finally(function() {
				$rootScope.modalOpened = false;
				disableCloseModal();
				var m = angular.element(document.getElementsByClassName('reveal-modal'));
				m.addClass(animationService.modalAnimated.slideOutRight);
			});
		};

		this.showCorrespondentListToReSendPrivPayloads = function(btx) {
			$rootScope.modalOpened = true;
			var self = this;
			var fc = profileService.focusedClient;
			var ModalInstanceCtrl = function($scope, $modalInstance, $timeout, go, notification) {
				$scope.btx = btx;
				$scope.settings = walletSettings;
				$scope.color = fc.backgroundColor;

				$scope.readList = function() {
					$scope.error = null;
					correspondentListService.list(function(err, ab) {
						if (err) {
							$scope.error = err;
							return;
						}
						$scope.list = ab;
						$timeout(function(){
							$scope.$digest();
						});
					});
				};

				$scope.sendPrivatePayments = function(correspondent) {
					var indivisible_asset = require('ocore/indivisible_asset');
					var wallet_general = require('ocore/wallet_general');
					indivisible_asset.restorePrivateChains(btx.asset, btx.unit, btx.addressTo, function(arrRecipientChains, arrCosignerChains) {
						wallet_general.sendPrivatePayments(correspondent.device_address, arrRecipientChains, true, null, function() {
							modalInstance.dismiss('cancel');
							go.history();
							$timeout(function() {
								notification.success(gettextCatalog.getString('Success'), gettextCatalog.getString('Private payloads sent', {}));
							});
						});
					});

				};

				$scope.back = function() {
					self.openTxModal(btx);
				};

			};

			var modalInstance = $modal.open({
				templateUrl: 'views/modals/correspondentListToReSendPrivPayloads.html',
				windowClass: animationService.modalAnimated.slideRight,
				controller: ModalInstanceCtrl,
			});

			var disableCloseModal = $rootScope.$on('closeModal', function() {
				modalInstance.dismiss('cancel');
			});

			modalInstance.result.finally(function() {
				$rootScope.modalOpened = false;
				disableCloseModal();
				var m = angular.element(document.getElementsByClassName('reveal-modal'));
				m.addClass(animationService.modalAnimated.slideOutRight);
			});
		};

		this.hasAction = function(actions, action) {
			return actions.hasOwnProperty('create');
		};


		/* Start setup */

		this.bindTouchDown();
		this.setSendPaymentFormInputs();
		if (profileService.focusedClient && profileService.focusedClient.isComplete()) {
			this.setAddress();
		}

		var store_mnemonic_back = function(){};
		if (isCordova){
			window.plugins.appPreferences.fetch(function(referrer){
				if (referrer) {
					console.log('==== referrer: '+referrer);
					window.plugins.appPreferences.remove(function(){}, function(){}, 'referrer');
					store_mnemonic_back = function() {
						window.plugins.appPreferences.store(function(){}, function(){}, 'referrer', referrer);
					};
					if (referrer.split('-').length % 3 === 0)
						$rootScope.$emit("claimTextcoin", referrer);
				}
			}, function(){}, "referrer");
		}
	});