'use strict';

angular.module('copayApp.services').factory('txStatus', function($modal, lodash, profileService, $timeout, modalManager) {
  var root = {};

  root.notify = function(txp, cb) {
    var fc = profileService.focusedClient;
    var status = txp.status;
    var type;
    var INMEDIATE_SECS = 10;

    if (status == 'broadcasted') {
      type = 'broadcasted';
    } else {
        throw Error("unsupported status");
        /*
      var n = txp.actions.length;
      var action = lodash.find(txp.actions, {
        copayerId: fc.credentials.copayerId
      });

      if (!action)  {
        type = 'created';
      } else if (action.type == 'accept') {
        // created and accepted at the same time?
        if ( n == 1 && action.createdOn - txp.createdOn < INMEDIATE_SECS ) {
          type = 'created';
        } else {
          type = 'accepted';
        }
      } else if (action.type == 'reject') {
        type = 'rejected';
      } else {
        throw new Error('Unknown type:' + type);
      }
        */
    }

    openModal(type, txp, cb);
  };

  root._templateUrl = function(type, txp) {
    return 'views/modals/tx-status.html';
  };

  var openModal = function(type, txp, cb) {
    let callbackTimer;
    var ModalInstanceCtrl = function($scope, $modalInstance) {
      $scope.type = type;
      $scope.cancel = function() {
        $modalInstance.dismiss('cancel');
      };
      if (cb) callbackTimer = $timeout(cb, 100);
    };
    var modalInstance = $modal.open({
      transient: true,
      templateUrl: root._templateUrl(type, txp),
      windowClass: 'popup-tx-status full',
      controller: ModalInstanceCtrl,
    });

    function finish(reason) {
      if (modalManager.isManagerClose(reason) && callbackTimer)
        $timeout.cancel(callbackTimer);
      modalManager.animateClose(modalInstance, 'hideModal');
    }
    modalInstance.result.then(function() { finish(); }, finish);
  };

  return root;
});
