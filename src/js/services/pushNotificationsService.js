'use strict';
angular.module('copayApp.services')
.factory('pushNotificationsService', function($http, $rootScope, $log, isMobile, $timeout, storageService, configService, lodash, isCordova) {
	var root = {};
	var defaults = configService.getDefaults();
	var usePushNotifications = isCordova && !isMobile.Windows() && isMobile.Android();
	var projectNumber;
	var _ws;
	
	var eventBus = require('byteballcore/event_bus.js');	
	
	function sendRequestEnableNotification(ws, registrationId) {
		var network = require('byteballcore/network.js');
		network.sendRequest(ws, 'hub/enable_notification', registrationId, false, function(ws, request, response) {
			if (!response || (response && response !== 'ok')) return $log.error('Error sending push info');
		});
	}
	
	window.onNotification = function(data) {
		if (data.event === 'registered') {
			storageService.setPushInfo(projectNumber, data.regid, true, function() {
				sendRequestEnableNotification(_ws, data.regid);
			});
		}
		else {
			return false;
		}
	};
	
	eventBus.on('receivedPushProjectNumber', function(ws, data) {
		if (!usePushNotifications) return;
		_ws = ws;
		if (data && data.projectNumber !== undefined) {
			$timeout(function(){
				storageService.getPushInfo(function(err, pushInfo) {
					var config = configService.getSync();
					projectNumber = data.projectNumber + "";
					if (pushInfo && projectNumber === "0") {
						root.pushNotificationsUnregister(function() {

						});
					}
					else if (projectNumber && config.pushNotifications.enabled) {
						root.pushNotificationsInit();
					}
				});
			});
		}
	});
	
	root.pushNotificationsInit = function() {
		if (!usePushNotifications) return;
		
		window.plugins.pushNotification.register(function(data) {
			},
			function(e) {
				alert('err= ' + e);
			}, {
				"senderID": projectNumber,
				"ecb": "onNotification"
			});
		
		configService.set({pushNotifications: {enabled: true}}, function(err) {
			if (err) $log.debug(err);
		});
	};
	
	function disable_notification() {
		storageService.getPushInfo(function(err, pushInfo) {
			storageService.removePushInfo(function() {
				var network = require('byteballcore/network.js');
				network.sendRequest(_ws, 'hub/disable_notification', pushInfo.registrationId, false, function(ws, request, response) {
					if (!response || (response && response !== 'ok')) return $log.error('Error sending push info');
				});
			});
		});
		configService.set({pushNotifications: {enabled: false}}, function(err) {
			if (err) $log.debug(err);
		});
	}
	
	root.pushNotificationsUnregister = function() {
		if (!usePushNotifications) return;
		window.plugins.pushNotification.unregister(function() {
			disable_notification();
		}, function() {
			disable_notification();
		});
	};
	
	return root;
	
});