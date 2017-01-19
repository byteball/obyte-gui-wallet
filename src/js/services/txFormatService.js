'use strict';

var constants = require('byteballcore/constants.js');

angular.module('copayApp.services').factory('txFormatService', function(profileService, configService, lodash) {
  var root = {};

  var formatAmountStr = function(amount, asset) {
    if (!amount) return;
      if (asset !== "base" && asset !==  constants.BLACKBYTES_ASSET)
          return amount;
    var config = configService.getSync().wallet.settings;
    var assetName = asset !== "base" ? 'blackbytes' : 'base';
	  var unitName = asset !== "base" ? config.bbUnitName : config.unitName;
		return profileService.formatAmount(amount, assetName) + ' ' + unitName;
  };

  var formatFeeStr = function(fee, asset) {
    if (!fee) return;
    var config = configService.getSync().wallet.settings;
	  var assetName = asset !== "base" ? 'blackbytes' : 'base';
	  var unitName = asset !== "base" ? config.bbUnitName : config.unitName;
	  return profileService.formatAmount(fee, assetName) + ' ' + unitName;
  };

  root.processTx = function(tx) {
    if (!tx) return; 

    var outputs = tx.outputs ? tx.outputs.length : 0;
    if (outputs > 1 && tx.action != 'received') {
      tx.hasMultiplesOutputs = true;
      tx.recipientCount = outputs;
      tx.amount = lodash.reduce(tx.outputs, function(total, o) {
        o.amountStr = formatAmountStr(o.amount, tx.asset);
        return total + o.amount;
      }, 0);
    }

    tx.amountStr = formatAmountStr(tx.amount, tx.asset);
    tx.feeStr = formatFeeStr(tx.fee || tx.fees, tx.asset);

    return tx;
  };

  return root;
});
