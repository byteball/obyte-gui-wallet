'use strict';
'use strict';
angular.module('copayApp.services')
  .factory('addressService', function(profileService, $log, $timeout) {
    var root = {};


    root.expireAddress = function(walletId,cb) {
        $log.debug('Cleaning Address ' + walletId );
        cb();
    };


    root._createAddress = function(walletId, cb) {
      var client = profileService.getClient(walletId);

      $log.debug('Creating address for wallet:', walletId);
        

      client.createAddress(0, function(err, addr) {
        if (err)
            throw "impossible err creating address";
        return cb(null, addr.address);
      });
    };

    
    root.getAddress = function(walletId, forceNew, cb) {
        if (forceNew) {
            root._createAddress(walletId, function(err, addr) {
				$timeout(function(){
					if (err)
						return cb(err);
					cb(null, addr);
				});
            });
        }
        else {
            var client = profileService.getClient(walletId);
            client.getAddresses({reverse: true, limit: 1, is_change: 0}, function(err, addr) {
				$timeout(function(){
					if (err)
						return cb(err);
					if (addr.length > 0)
						return cb(null, addr[0].address);
					else // issue new address
						root.getAddress(walletId, true, cb);
				});
            });
        }
    };

    return root;
  });
