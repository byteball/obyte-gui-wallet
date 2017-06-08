'use strict';

angular.module('copayApp.services').factory('animationService', function(isCordova) {
  var root = {};

  var cachedTransitionState, cachedBackPanel;

  // DISABLE ANIMATION ON DESKTOP
  root.modalAnimated = {
    slideUp: isCordova ? 'full animated slideInUp' : 'full',
    slideRight: isCordova ? 'full animated slideInRight' : 'full',
    slideOutDown: isCordova ? 'slideOutDown' : 'hideModal',
    slideOutRight: isCordova ? 'slideOutRight' : 'hideModal',
  };

  var pageWeight = {
    walletHome: 0,
    copayers: -1,
    cordova: -1,
    payment: -1,

    walletPreferences: 11,
    preferences: 11,
    "walletPreferences.color": 12,
    "preferences.backupSeed": 12,
    "walletPreferences.advanced": 12,
    "preferences.about": 12,
    "walletPreferences.advanced.delete": 13,
    "preferences.deviceName": 12,
    "preferences.language": 12,
    "preferences.unit": 12,
    preferencesFee: 12,
    preferencesAltCurrency: 12,
    "walletPreferences.alias": 12,
    "preferences.email": 12,
    "preferences.export": 13,
    "walletPreferences.advanced.paperWallet": 13,
    "preferences.about.logs": 13,
    "walletPreferences.advanced.information": 13,
    "preferences.about.translators": 13,
    "preferences.about.disclaimer": 13,
    add: 11,
    create: 12,
    "preferences.import": 12,
    importLegacy: 13
  };

  function cleanUpLater(e, e2) {
    var cleanedUp = false,
      timeoutID;
    var cleanUp = function() {
      if (cleanedUp) return;
      cleanedUp = true;
	  if (e2.parentNode) // sometimes it is null
		  e2.parentNode.removeChild(e2);
      e2.innerHTML = "";
      e.className = '';
      cachedBackPanel = null;
      cachedTransitionState = '';
      if (timeoutID) {
        timeoutID = null;
        window.clearTimeout(timeoutID);
      }
    };
    e.addEventListener("animationend", cleanUp, true);
    e2.addEventListener("animationend", cleanUp, true);
    e.addEventListener("webkitAnimationEnd", cleanUp, true);
    e2.addEventListener("webkitAnimationEnd", cleanUp, true);
    timeoutID = setTimeout(cleanUp, 500);
  };

  root.transitionAnimated = function(fromState, toState, event) {

    if (isaosp)
      return true;

    // Animation in progress?
    var x = document.getElementById('mainSectionDup');
    if (x && !cachedTransitionState) {
      console.log('Anim in progress');
      return true;
    }

    var fromName = fromState.name;
    var toName = toState.name;
    if (!fromName || !toName)
      return true;

    var fromWeight = pageWeight[fromName];
    var toWeight = pageWeight[toName];


    var entering = null,
      leaving = null;

    // Horizontal Slide Animation?
    if (isCordova && fromWeight && toWeight) {
      if (fromWeight > toWeight) {
        leaving = 'CslideOutRight';
      } else {
        entering = 'CslideInRight';
      }

      // Vertical Slide Animation?
    } else if (isCordova && fromName && fromWeight >= 0 && toWeight >= 0) {
      if (toWeight) {
        entering = 'CslideInUp';

      } else {
        leaving = 'CslideOutDown';
      }

      // no Animation  ?
    } else {
      return true;
    }

    var e = document.getElementById('mainSection');


    var desiredTransitionState = (fromName || '-') + ':' + (toName || '-');

    if (desiredTransitionState == cachedTransitionState) {
      e.className = entering || '';
      cachedBackPanel.className = leaving || '';
      cleanUpLater(e, cachedBackPanel);
      //console.log('USing animation', cachedTransitionState);
      return true;
    } else {
      var sc;
      // Keep prefDiv scroll
      var contentDiv = e.getElementsByClassName('content');
      if (contentDiv && contentDiv[0])
        sc = contentDiv[0].scrollTop;

      cachedBackPanel = e.cloneNode(true);
      cachedBackPanel.id = 'mainSectionDup';
      var c = document.getElementById('sectionContainer');
      c.appendChild(cachedBackPanel);

      if (sc)
        cachedBackPanel.getElementsByClassName('content')[0].scrollTop = sc;

      cachedTransitionState = desiredTransitionState;
      return false;
    }
  }

  return root;
});