'use strict';

var constants = require('byteballcore/constants.js');
var eventBus = require('byteballcore/event_bus.js');
var breadcrumbs = require('byteballcore/breadcrumbs.js');

angular.module('copayApp.controllers').controller('walletHomeController', function($scope, $rootScope, $timeout, $filter, $modal, $log, notification, isCordova, profileService, lodash, configService, storageService, gettext, gettextCatalog, nodeWebkit, addressService, confirmDialog, animationService, addressbookService, correspondentListService, newVersion, autoUpdatingWitnessesList) {

  var self = this;
  var home = this;
  var conf = require('byteballcore/conf.js');
  var chatStorage = require('byteballcore/chat_storage.js');
  this.protocol = conf.program;
  $rootScope.hideMenuBar = false;
  $rootScope.wpInputFocused = false;
  var config = configService.getSync();
  var configWallet = config.wallet;
  var indexScope = $scope.index;
  $scope.currentSpendUnconfirmed = configWallet.spendUnconfirmed;
    
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
  this.isMobile = isMobile.any();
  this.addr = {};
  this.isTestnet = constants.version.match(/t$/);
  this.testnetName = (constants.alt === '2') ? '[NEW TESTNET]' : '[TESTNET]';
  $scope.index.tab = 'walletHome'; // for some reason, current tab state is tracked in index and survives re-instatiations of walletHome.js

  var disablePaymentRequestListener = $rootScope.$on('paymentRequest', function(event, address, amount, asset, recipient_device_address) {
    console.log('paymentRequest event '+address+', '+amount);
    $rootScope.$emit('Local/SetTab', 'send');
    self.setForm(address, amount, null, asset, recipient_device_address);

    var form = $scope.sendForm;
    if (form.address.$invalid && !self.blockUx) {
        console.log("invalid address, resetting form");
        self.resetForm();
        self.error = gettext('Could not recognize a valid Byteball QR Code');
    }
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
      console.log("tab changed "+tab);
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
	
	function onNewWalletAddress(new_address){
        console.log("==== NEW ADDRESSS "+new_address);
        self.addr = {};
        self.setAddress();
    }
    
    eventBus.on("new_wallet_address", onNewWalletAddress);

  $scope.$on('$destroy', function() {
    console.log("walletHome $destroy");
    disableAddrListener();
    disablePaymentRequestListener();
    disablePaymentUriListener();
    disableTabListener();
    disableFocusListener();
    disableResumeListener();
    disableOngoingProcessListener();
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
            data = data.replace(self.protocol+':', '');
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
			breadcrumbs.add('openDestinationAddressModal getAddress err: '+err);
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
	  
	  var walletGeneral = require('byteballcore/wallet_general.js');
	  var walletDefinedByAddresses = require('byteballcore/wallet_defined_by_addresses.js');
	  walletGeneral.readMyAddresses(function(arrMyAddresses){
		  walletDefinedByAddresses.readSharedAddressDefinition(address, function(arrDefinition, creation_ts){
			  $scope.humanReadableDefinition = correspondentListService.getHumanReadableDefinition(arrDefinition, arrMyAddresses, [], true);
			  $scope.creation_ts = creation_ts;
			  $timeout(function(){
				  $scope.$apply();
			  });
		  });
	  });
	
	  // clicked a link in the definition
	  $scope.sendPayment = function(address, amount, asset){
		if (asset && indexScope.arrBalances.filter(function(balance){ return (balance.asset === asset); }).length === 0)
			return console.log("i do not own anything of asset "+asset);
		$modalInstance.dismiss('done');
		$timeout(function(){
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

    self.generatingAddress = true;
    $timeout(function() {
      addressService.getAddress(fc.credentials.walletId, forceNew, function(err, addr) {
        self.generatingAddress = false;

        if (err) {
          self.addrError = err;
        } else {
          if (addr)
            self.addr[fc.credentials.walletId] = addr;
        }

        $timeout(function(){
			$scope.$digest();
		});
      });
    });
  };

  this.copyAddress = function(addr) {
    if (isCordova) {
      window.cordova.plugins.clipboard.copy(addr);
      window.plugins.toast.showShortCenter(gettextCatalog.getString('Copied to clipboard'));
    } else if (nodeWebkit.isDefined()) {
      nodeWebkit.writeToClipboard(addr);
    }
  };

  this.shareAddress = function(addr) {
    if (isCordova) {
      if (isMobile.Android() || isMobile.Windows()) {
        window.ignoreMobilePause = true;
      }
      window.plugins.socialsharing.share(self.protocol+':' + addr, null, null, null);
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
		$scope.protocol = conf.program;


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
			var asset = $scope.index.arrBalances[$scope.index.assetIndex].asset;
			if (!asset)
				throw Error("no asset");
			var amountInSmallestUnits = (asset === 'base') 
				? parseInt((amount * $scope.unitValue).toFixed(0)) 
				: (asset === constants.BLACKBYTES_ASSET ? parseInt((amount * $scope.bbUnitValue).toFixed(0)) : amount);
			$timeout(function() {
				$scope.customizedAmountUnit = 
					amount + ' ' + ((asset === 'base') ? $scope.unitName : (asset === constants.BLACKBYTES_ASSET ? $scope.bbUnitName : 'of ' + asset));
				$scope.amountInSmallestUnits = amountInSmallestUnits;
				$scope.asset_param = (asset === 'base') ? '' : '&asset='+encodeURIComponent(asset);
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

  // Send 

  var unwatchSpendUnconfirmed = $scope.$watch('currentSpendUnconfirmed', function(newVal, oldVal) {
    if (newVal == oldVal) return;
    $scope.currentSpendUnconfirmed = newVal;
  });

  $scope.$on('$destroy', function() {
    unwatchSpendUnconfirmed();
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
        } catch (e) {};
        angular.element(e).triggerHandler('click');
      }, true);
    });
  }

  this.hideMenuBar = lodash.debounce(function(hide) {
    if (hide) {
      $rootScope.hideMenuBar = true;
      this.bindTouchDown();
    } else {
      $rootScope.hideMenuBar = false;
    }
    $rootScope.$digest();
  }, 100);


  this.formFocus = function(what) {
    if (isCordova && !this.isWindowsPhoneApp) {
      this.hideMenuBar(what);
    }
    if (!this.isWindowsPhoneApp) return

    if (!what) {
      this.hideAddress = false;
      this.hideAmount = false;

    } else {
      if (what == 'amount') {
        this.hideAddress = true;
      } else if (what == 'msg') {
        this.hideAddress = true;
        this.hideAmount = true;
      }
    }
    $timeout(function() {
      $rootScope.$digest();
    }, 1);
  };

  this.setSendFormInputs = function() {
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
          if ($scope.sendForm && $scope.sendForm.address.$valid) {
            self.lockAddress = true;
          }
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

    this.error = prefix + ": "+err;
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
      } else {
        window.plugins.spinnerDialog.hide();
      }
    } else {
      self.onGoingProcess = name;
      $timeout(function() {
        $rootScope.$apply();
      });
    };
  };

  this.submitForm = function() {
	if ($scope.index.arrBalances.length === 0)
		return console.log('send payment: no balances yet');
    var fc = profileService.focusedClient;
    var unitValue = this.unitValue;
    var bbUnitValue = this.bbUnitValue;

    if (isCordova && this.isWindowsPhoneApp) {
        this.hideAddress = false;
        this.hideAmount = false;
    }

    var form = $scope.sendForm;
	if (!form)
		return console.log('form is gone');
	if (self.bSendAll)
		form.amount.$setValidity('validAmount', true);
    if (form.$invalid) {
        this.error = gettext('Unable to send transaction proposal');
        return;
    }

    if (fc.isPrivKeyEncrypted()) {
        profileService.unlockFC(null, function(err) {
            if (err)
                return self.setSendError(err.message);
            return self.submitForm();
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

	var asset = $scope.index.arrBalances[$scope.index.assetIndex].asset;
	console.log("asset "+asset);
	var address = form.address.$modelValue;
	var recipient_device_address = assocDeviceAddressesByPaymentAddress[address];
	var amount = form.amount.$modelValue;
	var merkle_proof = '';
	if (form.merkle_proof && form.merkle_proof.$modelValue)
		merkle_proof = form.merkle_proof.$modelValue.trim();
	if (asset === "base")
		amount *= unitValue;
	if (asset === constants.BLACKBYTES_ASSET)
		amount *= bbUnitValue;
	amount = Math.round(amount);

	var current_payment_key = ''+asset+address+amount;
	if (current_payment_key === self.current_payment_key)
		return $rootScope.$emit('Local/ShowErrorAlert', "This payment is already under way");
	self.current_payment_key = current_payment_key;
	  
    indexScope.setOngoingProcess(gettext('sending'), true);
    $timeout(function() {

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
			
			var device = require('byteballcore/device.js');
			if (self.binding){
				if (!recipient_device_address)
					throw Error('recipient device address not known');
				var walletDefinedByAddresses = require('byteballcore/wallet_defined_by_addresses.js');
				var walletDefinedByKeys = require('byteballcore/wallet_defined_by_keys.js');
				var my_address;
				// never reuse addresses as the required output could be already present
				walletDefinedByKeys.issueNextAddress(fc.credentials.walletId, 0, function(addressInfo){
					my_address = addressInfo.address;
					if (self.binding.type === 'reverse_payment'){
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
								['in data feed', [[configService.TIMESTAMPER_ADDRESS], 'timestamp', '>', Date.now() + Math.round(self.binding.timeout*3600*1000)]]
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
					else{
						var arrExplicitEventCondition = 
							['in data feed', [[self.binding.oracle_address], self.binding.feed_name, '=', self.binding.feed_value]];
						var arrMerkleEventCondition = 
							['in merkle', [[self.binding.oracle_address], self.binding.feed_name, self.binding.feed_value]];
						var arrEventCondition;
						if (self.binding.feed_type === 'explicit')
							arrEventCondition = arrExplicitEventCondition;
						else if (self.binding.feed_type === 'merkle')
							arrEventCondition = arrMerkleEventCondition;
						else if (self.binding.feed_type === 'either')
							arrEventCondition = ['or', [arrMerkleEventCondition, arrExplicitEventCondition]];
						else
							throw Error("unknown feed type: "+self.binding.feed_type);
						var arrDefinition = ['or', [
							['and', [
								['address', address],
								arrEventCondition
							]],
							['and', [
								['address', my_address],
								['in data feed', [[configService.TIMESTAMPER_ADDRESS], 'timestamp', '>', Date.now() + Math.round(self.binding.timeout*3600*1000)]]
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
						ifError: function(err){
							delete self.current_payment_key;
							indexScope.setOngoingProcess(gettext('sending'), false);
							self.setSendError(err);
						},
						ifOk: function(shared_address){
							composeAndSend(shared_address);
						}
					});
				});
			}
			else
				composeAndSend(address);
          
            // compose and send
			function composeAndSend(to_address){
				var arrSigningDeviceAddresses = []; // empty list means that all signatures are required (such as 2-of-2)
				if (fc.credentials.m < fc.credentials.n)
					$scope.index.copayers.forEach(function(copayer){
						if (copayer.me || copayer.signs)
							arrSigningDeviceAddresses.push(copayer.device_address);
					});
				else if (indexScope.shared_address)
					arrSigningDeviceAddresses = indexScope.copayers.map(function(copayer){ return copayer.device_address; });
				breadcrumbs.add('sending payment in '+asset);
				profileService.bKeepUnlocked = true;
				var opts = {
					shared_address: indexScope.shared_address,
					merkle_proof: merkle_proof,
					asset: asset,
					to_address: to_address,
					amount: amount,
					send_all: self.bSendAll,
					arrSigningDeviceAddresses: arrSigningDeviceAddresses,
					recipient_device_address: recipient_device_address
				};
				fc.sendMultiPayment(opts, function(err){
					// if multisig, it might take very long before the callback is called
					indexScope.setOngoingProcess(gettext('sending'), false);
					breadcrumbs.add('done payment in '+asset+', err='+err);
					delete self.current_payment_key;
					profileService.bKeepUnlocked = false;
					if (err){
						if (typeof err === 'object'){
							err = JSON.stringify(err);
							eventBus.emit('nonfatal_error', "error object from sendMultiPayment: "+err, new Error());
						}
						else if (err.match(/device address/))
							err = "This is a private asset, please send it only by clicking links from chat";
						else if (err.match(/no funded/))
							err = "Not enough spendable funds, make sure all your funds are confirmed";
						return self.setSendError(err);
					}
					var binding = self.binding;
					self.resetForm();
					$rootScope.$emit("NewOutgoingTx");
					if (recipient_device_address){ // show payment in chat window
						eventBus.emit('sent_payment', recipient_device_address, amount || 'all', asset);
						if (binding && binding.reverseAmount){ // create a request for reverse payment
							if (!my_address)
								throw Error('my address not known');
							var paymentRequestCode = 'byteball:'+my_address+'?amount='+binding.reverseAmount+'&asset='+encodeURIComponent(binding.reverseAsset);
							var paymentRequestText = '[reverse payment]('+paymentRequestCode+')';
							device.sendMessageToDevice(recipient_device_address, 'text', paymentRequestText);
							var body = correspondentListService.formatOutgoingMessage(paymentRequestText);
 							correspondentListService.addMessageEvent(false, recipient_device_address, body);
 							device.readCorrespondent(recipient_device_address, function(correspondent){
 			 					if (correspondent.my_record_pref && correspondent.peer_record_pref) chatStorage.store(correspondent.device_address, body, 0, 'html');
			 				});

							// issue next address to avoid reusing the reverse payment address
							walletDefinedByKeys.issueNextAddress(fc.credentials.walletId, 0, function(){});
						}
					}
					else // redirect to history
						$rootScope.$emit('Local/SetTab', 'history');
				});
				/*
				if (fc.credentials.n > 1){
					$rootScope.$emit('Local/ShowAlert', "Transaction created.\nPlease approve it on the other devices.", 'fi-key', function(){
						go.walletHome();
					});
				}*/
			}
        
        });
    }, 100);
  };


	var assocDeviceAddressesByPaymentAddress = {};
	
	this.canSendExternalPayment = function(){
		if ($scope.index.arrBalances.length === 0) // no balances yet, assume can send
			return true;
		if (!$scope.index.arrBalances[$scope.index.assetIndex].is_private)
			return true;
		var form = $scope.sendForm;
		if (!form || !form.address) // disappeared
			return true;
        var address = form.address.$modelValue;
        var recipient_device_address = assocDeviceAddressesByPaymentAddress[address];
		return !!recipient_device_address;
	};

	this.deviceAddressIsKnown = function(){
	//	return true;
		if ($scope.index.arrBalances.length === 0) // no balances yet
			return false;
		var form = $scope.sendForm;
		if (!form || !form.address) // disappeared
			return false;
        var address = form.address.$modelValue;
        var recipient_device_address = assocDeviceAddressesByPaymentAddress[address];
		return !!recipient_device_address;
	};
	
	
	this.openBindModal = function() {
		$rootScope.modalOpened = true;
		var fc = profileService.focusedClient;
		var form = $scope.sendForm;
		if (!form || !form.address) // disappeared
			return;
		var address = form.address;



		var ModalInstanceCtrl = function($scope, $modalInstance) {
			$scope.color = fc.backgroundColor;
			$scope.arrPublicAssetInfos = indexScope.arrBalances.filter(function(b){ return !b.is_private; }).map(function(b){
				var info = {asset: b.asset};
				if (b.asset === 'base')
					info.displayName = self.unitName;
				else if (b.asset === constants.BLACKBYTES_ASSET)
					info.displayName = self.bbUnitName;
				else
					info.displayName = 'of '+b.asset.substr(0, 4);
				return info;
			});
			$scope.binding = { // defaults
				type: 'reverse_payment',
				timeout: 4,
				reverseAsset: 'base',
				feed_type: 'either'
			};
			if (self.binding){
				$scope.binding.type = self.binding.type;
				$scope.binding.timeout = self.binding.timeout;
				if (self.binding.type === 'reverse_payment'){
					$scope.binding.reverseAsset = self.binding.reverseAsset;
					$scope.binding.reverseAmount = getAmountInDisplayUnits(self.binding.reverseAmount, self.binding.reverseAsset);
				}
				else{
					$scope.binding.oracle_address = self.binding.oracle_address;
					$scope.binding.feed_name = self.binding.feed_name;
					$scope.binding.feed_value = self.binding.feed_value;
					$scope.binding.feed_type = self.binding.feed_type;
				}
			}
			$scope.oracles = configService.oracles;
			
			$scope.cancel = function() {
				$modalInstance.dismiss('cancel');
			};
			
			$scope.bind = function(){
				var binding = {type: $scope.binding.type};
				if (binding.type === 'reverse_payment'){
					binding.reverseAsset = $scope.binding.reverseAsset;
					binding.reverseAmount = getAmountInSmallestUnits($scope.binding.reverseAmount, $scope.binding.reverseAsset);
				}
				else{
					binding.oracle_address = $scope.binding.oracle_address;
					binding.feed_name = $scope.binding.feed_name;
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
	
	function getAmountInSmallestUnits(amount, asset){
		console.log(amount, asset, self.unitValue);
		if (asset === 'base')
			amount *= self.unitValue;
		else if (asset === constants.BLACKBYTES_ASSET)
			amount *= self.bbUnitValue;
		return Math.round(amount);
	}
	
	function getAmountInDisplayUnits(amount, asset){
		if (asset === 'base')
			amount /= self.unitValue;
		else if (asset === constants.BLACKBYTES_ASSET)
			amount /= self.bbUnitValue;
		return amount;
	}

	this.setToAddress = function(to) {
		var form = $scope.sendForm;
		if (!form || !form.address) // disappeared?
			return console.log('form.address has disappeared');
		form.address.$setViewValue(to);
		form.address.$isValid = true;
		form.address.$render();
		this.lockAddress = true;
	}
  
  this.setForm = function(to, amount, comment, asset, recipient_device_address) {
	this.resetError();
	delete this.binding;
    var form = $scope.sendForm;
	if (!form || !form.address) // disappeared?
		return console.log('form.address has disappeared');
    if (to) {
        form.address.$setViewValue(to);
        form.address.$isValid = true;
        form.address.$render();
        this.lockAddress = true;
        if (recipient_device_address) // must be already paired
            assocDeviceAddressesByPaymentAddress[to] = recipient_device_address;
    }

	if (amount) {
		if (asset === 'base')
			amount /= this.unitValue;
		if (asset === constants.BLACKBYTES_ASSET)
			amount /= this.bbUnitValue;
	//	form.amount.$setViewValue("" + amount);
	//	form.amount.$isValid = true;
        this.lockAmount = true;
		$timeout(function(){
			form.amount.$setViewValue("" + amount);
			form.amount.$isValid = true;
			form.amount.$render();
		});
    }
	else{
		this.lockAmount = false;
		form.amount.$pristine = true;
		form.amount.$setViewValue('');
		form.amount.$render();
	}
//	form.amount.$render();

	if (form.merkle_proof){
		form.merkle_proof.$setViewValue('');
		form.merkle_proof.$render();
	}
    if (comment) {
        form.comment.$setViewValue(comment);
        form.comment.$isValid = true;
        form.comment.$render();
    }
      
    if (asset){
        var assetIndex = lodash.findIndex($scope.index.arrBalances, {asset: asset});
        if (assetIndex < 0)
            throw Error("failed to find asset index of asset "+asset);
        $scope.index.assetIndex = assetIndex;
		this.lockAsset = true;
    }
	else
		this.lockAsset = false;
  };



  this.resetForm = function() {
    this.resetError();
	delete this.binding;

	this.lockAsset = false;
    this.lockAddress = false;
    this.lockAmount = false;
    this.hideAdvSend = true;
    $scope.currentSpendUnconfirmed = configService.getSync().wallet.spendUnconfirmed;

    this._amount = this._address = null;
	this.bSendAll = false;

    var form = $scope.sendForm;


    if (form && form.amount) {
      form.amount.$pristine = true;
      form.amount.$setViewValue('');
	  if (form.amount)
		  form.amount.$render();

	  if (form.merkle_proof){
		  form.merkle_proof.$setViewValue('');
		  form.merkle_proof.$render();
	  }
	  if (form.comment){
		  form.comment.$setViewValue('');
		  form.comment.$render();
	  }
      form.$setPristine();

      if (form.address) {
        form.address.$pristine = true;
        form.address.$setViewValue('');
        form.address.$render();
      }
    }
    $timeout(function() {
      $rootScope.$digest();
    }, 1);
  };

	this.setSendAll = function(){
		var form = $scope.sendForm;
		if (!form || !form.amount) // disappeared?
			return console.log('form.amount has disappeared');
		if (indexScope.arrBalances.length === 0)
			return;
		if (indexScope.arrBalances[indexScope.assetIndex].asset === 'base'){
			this._amount = null;
			this.bSendAll = true;
			form.amount.$setViewValue('');
			form.amount.$setValidity('validAmount', true);
			form.amount.$render();
		}
		else{
			var full_amount = indexScope.arrBalances[indexScope.assetIndex].stable;
			if (indexScope.arrBalances[indexScope.assetIndex].asset === constants.BLACKBYTES_ASSET)
				full_amount /= this.bbUnitValue;
			form.amount.$setViewValue(''+full_amount);
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
      require('byteballcore/uri.js').parseUri(uri, {
          ifError: function(err){
          },
          ifOk: function(_objRequest){
              objRequest = _objRequest; // the callback is called synchronously
          }
      });
      
      if (!objRequest) // failed to parse
          return uri;
	  if (objRequest.amount){
		  // setForm() cares about units conversion
		  //var amount = (objRequest.amount / this.unitValue).toFixed(this.unitDecimals);
		  this.setForm(objRequest.address, objRequest.amount);
	  }
      return objRequest.address;
  };

  this.onAddressChange = function(value) {
    this.resetError();
    if (!value) return '';

    if (value.indexOf(self.protocol+':') === 0)
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


  this.openTxModal = function(btx) {
    $rootScope.modalOpened = true;
    var self = this;
    var fc = profileService.focusedClient;
    var ModalInstanceCtrl = function($scope, $modalInstance) {
      $scope.btx = btx;
      var assetIndex = lodash.findIndex(indexScope.arrBalances, {asset: btx.asset});
      $scope.isPrivate = indexScope.arrBalances[assetIndex].is_private;
      $scope.settings = walletSettings;
      $scope.color = fc.backgroundColor;
      $scope.n = fc.credentials.n;

      $scope.getAmount = function(amount) {
        return self.getAmount(amount);
      };

      $scope.getUnitName = function() {
        return self.getUnitName();
      };

	  $scope.openInExplorer = function(){
		var testnet = home.isTestnet ? 'testnet' : '';
		var url = 'https://'+testnet+'explorer.byteball.org/#'+btx.unit;
		if (typeof nw !== 'undefined')
			nw.Shell.openExternal(url);
		else if (isCordova)
			cordova.InAppBrowser.open(url, '_system');
	  };

      $scope.copyAddress = function(addr) {
        if (!addr) return;
        self.copyAddress(addr);
      };
	
      $scope.showCorrespondentList = function() {
        self.showCorrespondentListToReSendPrivPayloads(btx);
      };

		$scope.reSendPrivateMultiSigPayment = function () {
			var indivisible_asset = require('byteballcore/indivisible_asset');
			var wallet_defined_by_keys = require('byteballcore/wallet_defined_by_keys');
			var walletDefinedByAddresses = require('byteballcore/wallet_defined_by_addresses');
			var fc = profileService.focusedClient;

			function success() {
				$timeout(function () {
					notification.success(gettextCatalog.getString('Success'), gettextCatalog.getString('Private payloads sent', {}));
				});
			}

			indivisible_asset.restorePrivateChains(btx.asset, btx.unit, btx.addressTo, function (arrRecipientChains, arrCosignerChains) {
				if(indexScope.shared_address){
					walletDefinedByAddresses.forwardPrivateChainsToOtherMembersOfAddresses(arrCosignerChains, [indexScope.shared_address], null, success);
				}else {
					wallet_defined_by_keys.forwardPrivateChainsToOtherMembersOfWallets(arrCosignerChains, [fc.credentials.walletId], null, success);
				}
			});
		};

      $scope.cancel = function() {
		breadcrumbs.add('dismiss tx details');
		try{
			$modalInstance.dismiss('cancel');
		}
		catch(e){
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
					$scope.$digest();
				});
			};
			
			$scope.sendPrivatePayments = function(correspondent) {
				var indivisible_asset =  require('byteballcore/indivisible_asset');
				var wallet_general = require('byteballcore/wallet_general');
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

  this._doSendAll = function(amount) {
    this.setForm(null, amount, null);
  };

  this.sendAll = function(amount, feeStr) {
    var self = this;
    var msg = gettextCatalog.getString("{{fee}} will be deducted for bitcoin networking fees", {
      fee: feeStr
    });

    confirmDialog.show(msg, function(confirmed) {
      if (confirmed)
        self._doSendAll(amount);
    });
  };

  /* Start setup */

  this.bindTouchDown();
  this.setSendFormInputs();
  if (profileService.focusedClient && profileService.focusedClient.isComplete()) {
    this.setAddress();
  }
});
