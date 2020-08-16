'use strict';

angular.module('copayApp.controllers').controller('sidebarController',
  function($scope, $rootScope, $timeout, lodash, profileService, configService, go, isMobile, isCordova, backButton) {
    var self = this;
    self.isWindowsPhoneApp = isMobile.Windows() && isCordova;
    self.walletSelection = false;

    // wallet list change
    $rootScope.$on('Local/WalletListUpdated', function(event) {
      self.walletSelection = false;
      self.setWallets();
    });

    $rootScope.$on('Local/ColorUpdated', function(event) {
      self.setWallets();
    });

    $rootScope.$on('Local/AliasUpdated', function(event) {
      self.setWallets();
    });

    $rootScope.$on('Local/BadgeUpdated', function(event) {
      self.setWallets();
    });


    self.signout = function() {
      profileService.signout();
    };

    self.getBadgeCount = function(selectedWallet) {
      var totalCounts = 0;
      if (Object.keys($rootScope.newPaymentsDetails).length === 0) {
        return 0;
      }
      for(var index in $rootScope.newPaymentsDetails) {
        if ($rootScope.newPaymentsDetails[index] && $rootScope.newPaymentsDetails[index].walletId === selectedWallet.id) {
          if ($rootScope.newPaymentsCount[index]) {
            totalCounts += $rootScope.newPaymentsCount[index];
          }
        }
      }
    	return totalCounts;
    };

    self.switchWallet = function(selectedWalletId, currentWalletId) {
    	backButton.menuOpened = false;
      if (selectedWalletId == currentWalletId) return;
      self.walletSelection = false;
      profileService.setAndStoreFocus(selectedWalletId, function() {
      });
    };

    self.toggleWalletSelection = function() {
      self.walletSelection = !self.walletSelection;
      if (!self.walletSelection) return;
      self.setWallets();
    };

    self.setWallets = function() {
      if (!profileService.profile) return;
      var config = configService.getSync();
      config.colorFor = config.colorFor || {};
      config.aliasFor = config.aliasFor || {};
      var ret = lodash.map(profileService.profile.credentials, function(c) {
        return {
          m: c.m,
          n: c.n,
          name: config.aliasFor[c.walletId] || c.walletName,
          id: c.walletId,
          color: config.colorFor[c.walletId] || '#4A90E2',
        };
      });
      self.wallets = lodash.sortBy(ret, 'name');
    };

    self.setWallets();

  });
