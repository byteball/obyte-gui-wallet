'use strict';

angular.module('copayApp.controllers').controller('copayersController',
  function($scope, $rootScope, $timeout, $log, $modal, profileService, go, notification, isCordova, gettext, gettextCatalog, animationService) {
    var self = this;

    var delete_msg = gettextCatalog.getString('Are you sure you want to delete this wallet?');
    var accept_msg = gettextCatalog.getString('Accept');
    var cancel_msg = gettextCatalog.getString('Cancel');
    var confirm_msg = gettextCatalog.getString('Confirm');
    
    self.init = function() {
      var fc = profileService.focusedClient;
      if (fc.isComplete()) {
        $log.debug('Wallet Complete...redirecting')
        go.walletHome();
        return;
      }
      self.loading = false;
      self.isCordova = isCordova;
	  $rootScope.$emit('Local/BalanceUpdated', {});
	  if(self.isCordova && !wallet.clientCompleteLoaded()) wallet.showCompleteClient();
    };

    var _modalDeleteWallet = function() {
      var ModalInstanceCtrl = function($scope, $modalInstance, $sce, gettext) {
        $scope.title = $sce.trustAsHtml(delete_msg);;
          $scope.yes_icon = 'fi-trash';
          $scope.yes_button_class = 'warning';
          $scope.cancel_button_class = 'light-gray outline';
        $scope.loading = false;

        $scope.ok = function() {
          $scope.loading = true;
          $modalInstance.close(accept_msg);
        };
        $scope.cancel = function() {
          $modalInstance.dismiss(cancel_msg);
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

      modalInstance.result.then(function(ok) {
        if (ok) {
          _deleteWallet();
        }
      });
    };

    var _deleteWallet = function() {
      var fc = profileService.focusedClient;
      $timeout(function() {
        var fc = profileService.focusedClient;
        var walletName = fc.credentials.walletName;

        profileService.deleteWallet({}, function(err) {
          if (err) {
            this.error = err.message || err;
            console.log(err);
            $timeout(function() {
              $scope.$digest();
            });
          } else {
            go.walletHome();
            $timeout(function() {
              notification.success(gettextCatalog.getString('Success'), gettextCatalog.getString('The wallet "{{walletName}}" was deleted', {walletName: walletName}));
            });
          }
        });
      }, 100);
    };

    self.deleteWallet = function() {
      var fc = profileService.focusedClient;
      if (isCordova) {
        navigator.notification.confirm(
          delete_msg,
          function(buttonIndex) {
            if (buttonIndex == 1) {
              _deleteWallet();
            }
          },
          confirm_msg, [accept_msg, cancel_msg]
        );
      } else {
        _modalDeleteWallet();
      }
    };
 

  });
