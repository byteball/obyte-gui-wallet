'use strict';

angular.module('copayApp.controllers')
  .controller('preferencesHiddenAssetsCtrl', PreferencesHiddenAssetsCtrl);

PreferencesHiddenAssetsCtrl.$inject = ['$scope','configService'];
function PreferencesHiddenAssetsCtrl($scope, configService) {
  var ctrl = this;
  var configHiddenAssets = configService.getSync().hiddenAssets;
  var indexScope = $scope.index;
  var walletId = indexScope.walletId;
  var hiddenAssetsSet = {};
  if (configHiddenAssets.hasOwnProperty(walletId)) {
    hiddenAssetsSet = Object.assign({}, configHiddenAssets[walletId]);
  }
  
  var assetsSet = indexScope.assetsSet;
  var resAssetsData = [];

  Object.keys(assetsSet).forEach(function (asset) {
    var balanceInfo = assetsSet[asset];
    resAssetsData.push({
      key: asset,
      name: balanceInfo.name || asset,
      value: isAssetHidden(asset),
    });
  });

  ctrl.arrAssetsData = resAssetsData;
  ctrl.isChanged = false;
  ctrl.isOneAssetLeft = false;

  checkOneAssetLeft();

  ctrl.hanldeAssetChangeVisibility = function (assetData) {
    var prevValue = hiddenAssetsSet[assetData.key];
    if (prevValue === assetData.value) {
      return;
    }

    hiddenAssetsSet[assetData.key] = assetData.value;
    checkOneAssetLeft();
    saveConfig();
    ctrl.isChanged = true;
  };

  ctrl.isSwitchAssetDisabled = function (assetData) {
    return !assetData.value && ctrl.isOneAssetLeft;
  };

  $scope.$on("$destroy", function() {
    if (ctrl.isChanged) {
      indexScope.updateBalance();
    }
  });

  function checkOneAssetLeft() {
    var countAssetLeft = 0;
    ctrl.arrAssetsData.forEach(function (assetData) {
      if (!assetData.value) {
        countAssetLeft++;
      }
    });
    ctrl.isOneAssetLeft = countAssetLeft <= 1;
  }

  function isAssetHidden(asset) {
    return indexScope.isAssetHidden(asset, hiddenAssetsSet);
  }

  function saveConfig() {
    var data = {};
    data[walletId] = hiddenAssetsSet;
    Object.keys(configHiddenAssets).forEach(function (wId) {
      if (wId === walletId) {
        return;
      }
      data[wId] = configHiddenAssets[wId];
    });
    
    configService.set(
      {
        hiddenAssets: data
      },
      function (err) {
        if (err)
          return $scope.$emit('Local/DeviceError', err);
      }
		);
  }
}
