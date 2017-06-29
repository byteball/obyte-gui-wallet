'use strict';

angular.module('copayApp.controllers').controller('wordsController',
  function($rootScope, $scope, $timeout, profileService, go, gettext, confirmDialog, notification, $log, isCordova) {

    var msg = gettext('Are you sure you want to delete the backup words?');
    var successMsg = gettext('Backup words deleted');
    var self = this;
    self.show = false;
    var fc = profileService.focusedClient;
	
	if (isCordova)
		self.text = "To protect your funds, please use multisig wallets with redundancy, e.g. 1-of-2 wallet with one key on this device and another key on your laptop computer.  Just the wallet seed is not enough.";
	else{
		var desktopApp = require('byteballcore/desktop_app.js'+'');
		var appDataDir = desktopApp.getAppDataDir();
        restoreText1 = gettext("To restore your wallets, you will need a full backup of Byteball data at ");
        restoreText2 = gettext(".  Better yet, use multisig wallets with redundancy, e.g. 1-of-2 wallet with one key on this device and another key on your smartphone.  Just the wallet seed is not enough.");
		self.text = restoreText1 + appDataDir + restoreText2;
	}


    if (fc.isPrivKeyEncrypted()) self.credentialsEncrypted = true;
    else {
      setWords(fc.getMnemonic());
    }
    if (fc.credentials && !fc.credentials.mnemonicEncrypted && !fc.credentials.mnemonic) {
      self.deleted = true;
    }

    self.toggle = function() {
      self.error = "";
      if (!self.credentialsEncrypted) {
        if (!self.show)
          $rootScope.$emit('Local/BackupDone');
        self.show = !self.show;
      }

      if (self.credentialsEncrypted)
        self.passwordRequest();

      $timeout(function() {
        $scope.$apply();
      }, 1);
    };

    self.delete = function() {
      confirmDialog.show(msg, function(ok) {
        if (ok) {
          fc.clearMnemonic();
          profileService.clearMnemonic(function() {
            self.deleted = true;
            notification.success(successMsg);
            go.walletHome();
          });
        }
      });
    };

    $scope.$on('$destroy', function() {
      profileService.lockFC();
    });

    function setWords(words) {
      if (words) {
        self.mnemonicWords = words.split(/[\u3000\s]+/);
        self.mnemonicHasPassphrase = fc.mnemonicHasPassphrase();
        self.useIdeograms = words.indexOf("\u3000") >= 0;
      }
    };

    self.passwordRequest = function() {
      try {
        setWords(fc.getMnemonic());
      } catch (e) {
        if (e.message && e.message.match(/encrypted/) && fc.isPrivKeyEncrypted()) {
          self.credentialsEncrypted = true;

          $timeout(function() {
            $scope.$apply();
          }, 1);

          profileService.unlockFC(null, function(err) {
            if (err) {
              self.error = gettext('Could not decrypt') +': '+ err.message;
              $log.warn('Error decrypting credentials:', self.error); //TODO
              return;
            }
            if (!self.show && self.credentialsEncrypted)
              self.show = !self.show;
            self.credentialsEncrypted = false;
            setWords(fc.getMnemonic());
            $rootScope.$emit('Local/BackupDone');
          });
        }
      }
    }
  });
