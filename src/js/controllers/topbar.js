'use strict';

angular.module('copayApp.controllers').controller('topbarController', function($scope, $rootScope, go) {
    const walletSettings = ['Preferences', 'Wallet Alias', 'Color', 'Hidden assets', 'Hidden subwallets', 'Advanced', 'Wallet Information', 'Sweep paper wallet', 'Delete Wallet'];


    this.showableWalletAvatar = function() {
        return $rootScope.showableWalletAvatar;
    }

    this.onQrCodeScanned = function(data) {
        go.handleUri(data);
        //$rootScope.$emit('dataScanned', data);
    };

    this.openSendScreen = function() {
        go.send();
    };

    this.onBeforeScan = function() {
    };

    this.goHome = function() {
        go.walletHome();
    };

});
