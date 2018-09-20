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

  ctrl.toggle = function (asset) {
    hiddenAssetsSet[asset] = !isAssetHidden(asset);
    updateAssetData(asset);
    saveConfig();
    ctrl.isChanged = true;
  };

  $scope.$on("$destroy", function() {
    if (ctrl.isChanged) {
      indexScope.updateBalance();
    }
  });

  function updateAssetData(asset) {
    for (var i = 0, len = ctrl.arrAssetsData.length; i < len; i++) {
      var assetData = ctrl.arrAssetsData[i];
      if (assetData.key !== asset) {
        continue;
      }

      assetData.value = isAssetHidden(asset);
      break;
    }
  }

  function isAssetHidden(asset) {
    return indexScope.isAssetHidden(hiddenAssetsSet, asset);
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
