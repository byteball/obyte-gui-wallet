'use strict';

angular.module('copayApp.services')
  .factory('localStorageService', function($timeout) {
    var root = {};
    var ls = ((typeof window.localStorage !== "undefined") ? window.localStorage : null);

    if (!ls)
      throw new Error('localstorage not available');

    root.get = function(k, cb) {
        return cb(null, ls.getItem(k));
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
        ls.setItem(k, v);
        return cb();
    };

    root.remove = function(k, cb) {
        ls.removeItem(k);
        return cb();
    };

    return root;
  });
