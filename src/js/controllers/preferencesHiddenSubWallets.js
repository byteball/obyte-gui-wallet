'use strict';

angular.module('copayApp.controllers')
.controller('preferencesHiddenSubWalletsCtrl', PreferencesHiddenSubWalletsCtrl);

PreferencesHiddenSubWalletsCtrl.$inject = ['$scope', '$timeout', 'configService'];

function PreferencesHiddenSubWalletsCtrl($scope, $timeout, configService) {
  var self = this;
  var configHiddenSubWallets = configService.getSync().hiddenSubWallets;
  var indexScope = $scope.index;
  var walletId = indexScope.walletId;
  var assocHiddenSubWallets = {};
  if (configHiddenSubWallets.hasOwnProperty(walletId)) {
    assocHiddenSubWallets = Object.assign({}, configHiddenSubWallets[walletId]);
  }
  
  self.isChanged = false;
  self.arrSubWalletsData = [];
  
  if (indexScope.arrBalances[0].assocSharedByAddress) {
    Object.keys(indexScope.arrBalances[0].assocSharedByAddress).forEach(function (address) {
      self.arrSubWalletsData.push({
        address: address, value: assocHiddenSubWallets[address] || false
      });
    });
  }
  
  var walletDefinedByAddresses = require('ocore/wallet_defined_by_addresses.js');
  async.eachSeries(self.arrSubWalletsData, function (objSharedWallet, cb) {
    walletDefinedByAddresses.readSharedAddressCosigners(objSharedWallet.address, function (cosigners) {
      objSharedWallet.shared_address_cosigners = cosigners.map(function (cosigner) {
        return cosigner.name;
      }).join(", ");
      objSharedWallet.creation_ts = cosigners[0].creation_ts;
      cb();
    });
  }, function () {
    self.arrSubWalletsData.sort(function (o1, o2) {
      return (o2.creation_ts - o1.creation_ts);
    });
    $timeout(function () {
      $scope.$apply();
    });
  });
  
  self.hanldeSubWalletChangeVisibility = function (subWalletData) {
    if (assocHiddenSubWallets[subWalletData.address] === subWalletData.value) {
      return;
    }
    
    assocHiddenSubWallets[subWalletData.address] = subWalletData.value;
    saveConfig();
    self.isChanged = true;
  }
  
  $scope.$on("$destroy", function () {
    if(self.isChanged)
      indexScope.updateBalance();
  });
  
  function saveConfig() {
    var data = {};
    data[walletId] = assocHiddenSubWallets;
    Object.keys(configHiddenSubWallets).forEach(function (wId) {
      if (wId === walletId) {
        return;
      }
      data[wId] = configHiddenSubWallets[wId];
    });
    
    configService.set({
      hiddenSubWallets: data
    }, function (err) {
      if (err) return $scope.$emit('Local/DeviceError', err);
    });
  }
}
