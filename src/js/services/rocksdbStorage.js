'use strict';

angular.module('copayApp.services')
  .factory('rocksdbStorageService', function($timeout, isCordova) {
    if (isCordova) {
      console.log('rocksdbStorageService is not available on mobile devices');
      return {};
    }
  	var desktopApp = require('ocore/desktop_app.js');
    var root = {};
    var walletDataDir = 'walletdata';
    var path = desktopApp.getAppDataDir() + '/' + walletDataDir;
    var RocksDatabase = require('@harperfast/rocksdb-js').RocksDatabase;
    if (process.platform === 'win32') {
		process.chdir(desktopApp.getAppDataDir()); // workaround non-latin characters in path
		path = walletDataDir;
	}
	// raw utf8 keys and values, byte-compatible with the data written by level-rocksdb
	var db = RocksDatabase.open(path, { keyEncoding: 'binary', encoding: 'binary' });

    root.get = function(k, cb) {
        var v;
        try {
            v = db.getSync(k);
        } catch (e) {} // ignoring error
        cb(null, Buffer.isBuffer(v) ? v.toString('utf8') : undefined);
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

    // compact to erase prev key versions from logs (remove unencrypted xPrivKey)
    function compact() {
        db.compact({ bottommost: true }).catch(function(err) {
            console.log('compact failed', err);
        });
    }

    root.set = function(k, v, cb) {
        // level-rocksdb stringified non-string values
        db.put(k, Buffer.isBuffer(v) ? v : String(v)).then(function() {
            cb();
            compact();
        }, cb);
    };

    root.remove = function(k, cb) {
        db.remove(k).then(function() {
            cb();
            compact();
        }, cb);
    };

    return root;
  });
