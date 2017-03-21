'use strict';

angular.module('copayApp.controllers').controller('walletTypeController', function() {
  var conf = require('byteballcore/conf.js');
  this.type = (conf.bLight ? 'light wallet' : 'full wallet');
});
