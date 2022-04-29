'use strict';

angular.module('copayApp.services')
  .factory('rocksdbStorageService', function($timeout, isCordova) {
  	if (isCordova)
  		return console.log('rocksdbStorageService is not available on mobile devices');
  	var desktopApp = require('ocore/desktop_app.js');
    var root = {};
    var walletDataDir = 'walletdata';
    var path = desktopApp.getAppDataDir() + '/' + walletDataDir;
    var level = require('level-rocksdb');
    if (process.platform === 'win32') {
		process.chdir(desktopApp.getAppDataDir()); // workaround non-latin characters in path
		path = walletDataDir;
	}
	var db = level(path, { createIfMissing: true });

    root.get = function(k, cb) {
        return db.get(k, function(err, v) {
        	cb(null, v); // ignoring error
        });
    };

    /**
     * Same as setItem, but fails if an item already exists
     */
    root.create = function(name, value, callback) {
      root.get(name,
        function(err, data) {
          if (data) {
            return callback('EEXISTS');
          } else {
            return root.set(name, value, callback);
          }
        });
    };

    root.set = function(k, v, cb) {
		db.put(k, v, (err) => {
			cb(err);
			db.compactRange('', '~', () => {}); // compact to erase prev key versions from logs (remove unencrypted xPrivKey)
		});
    };

    root.remove = function(k, cb) {
        db.del(k, (err) => {
			cb(err);
			db.compactRange('', '~', () => {}); // compact to erase prev key versions from logs (remove unencrypted xPrivKey)
		});
    };

    return root;
  });
