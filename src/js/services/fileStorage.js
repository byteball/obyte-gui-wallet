'use strict';

angular.module('copayApp.services')
  .factory('fileStorageService', function() {
    var fileStorage = require('./fileStorage.js');
    var root = {};
    
    root.get = function(k, cb) {
		fileStorage.get(k, cb);
    };
    
    root.set = function(k, v, cb) {
		fileStorage.set(k, v, cb);  
    };
      

    root.remove = function(k, cb) {
      fileStorage.init(function(err, fs, dir) {
        if (err) return cb(err);
        dir.getFile(k, {
          create: false
        }, function(fileEntry) {
          // Create a FileWriter object for our FileEntry (log.txt).
          fileEntry.remove(function() {
            console.log('File removed.');
            return cb();
          }, cb);
        }, cb);
      });
    };

    /**
     * Same as setItem, but fails if an item already exists
     */
    root.create = function(name, value, callback) {
      fileStorage.get(name,
        function(err, data) {
          if (data) {
            return callback('EEXISTS');
          } else {
            return fileStorage.set(name, value, callback);
          }
        });
    };

    return root;
  });
