'use strict';

angular.module('copayApp.services').factory('electron', function electronFactory() {
  var root = {};

  var isElectron = function() {
    var isNode = (typeof process !== "undefined" && typeof require !== "undefined");
    if(isNode) {
      try {
        return (typeof require('electron') !== "undefined");
      } catch(e) {
        return false;
      }
    }
  };
    

  root.isDefined = function() {
    return isElectron();
  };

  root.readFromClipboard = function() {
    if (!isElectron()) return;
    const { clipboard } = require('electron');
    return clipboard.readText();
  };

  root.writeToClipboard = function(text) {
    if (!isElectron()) return;
    const { clipboard } = require('electron');
    return clipboard.writeText(text);
  };

  return root;
});
