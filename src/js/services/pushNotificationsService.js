'use strict';
angular.module('copayApp.services')
.factory('pushNotificationsService', function($http, $rootScope, $log, isMobile, storageService, configService, lodash, isCordova) {
	var root = {};
	var defaults = configService.getDefaults();
	var usePushNotifications = isCordova && !isMobile.Windows();
	var projectNumber;
	var _ws;
	
	var eventBus = require('byteballcore/event_bus.js');
	var network = require('byteballcore/network.js');
	var device = require('byteballcore/device.js');
	
	function sendRequestEnableNotification(ws, registrationId) {
		network.sendRequest(ws, 'hub/enable_notification', {
			deviceAddress: device.getMyDeviceAddress(),
			registrationId: registrationId
		}, false, function(ws, request, response) {
			if (!response || (response && response !== 'ok')) return $log.error('Error sending push info');
		});
	}
	
	eventBus.on('receivedPushProjectNumber', function(ws, data) {
		_ws = ws;
		if (data && data.projectNumber !== undefined) {
			storageService.getPushInfo(function(err, pushInfo) {
				projectNumber = data.projectNumber;
				if (pushInfo && projectNumber == 0) {
					root.pushNotificationsUnregister(function() {
						
					});
				}
				else if (pushInfo && pushInfo.projectNumber && pushInfo.projectNumber === projectNumber) {
					if (pushInfo.enabled) {
						sendRequestEnableNotification(ws, pushInfo.registrationId);
					}
					$rootScope.$emit('Local/pushNotificationsReady');
				}
				else if(projectNumber){
					root.pushNotificationsInit(function(registrationId) {
						sendRequestEnableNotification(ws, registrationId);
						$rootScope.$emit('Local/pushNotificationsReady');
					});
				}
			});
		}
	});
	
	root.pushNotificationsInit = function(cb) {
		if (!usePushNotifications) return;
		
		var config = configService.getSync();
		if (!config.pushNotifications.enabled) return;
		
		defaults.pushNotifications.config.android.senderID = projectNumber;
		
		var push = PushNotification.init(defaults.pushNotifications.config);
		
		push.on('registration', function(data) {
			storageService.setPushInfo(projectNumber, data.registrationId, true, function() {
				cb(data.registrationId);
			});
		});
		push.on('notification', function(data) {
			
		});
		
		push.on('error', function(e) {
			alert(JSON.stringify(e));
		});
	};
	
	root.pushNotificationsUnregister = function(cb) {
		if (!usePushNotifications) return;
		
		var config = configService.getSync();
		if (!config.pushNotifications.enabled) return;
		
		defaults.pushNotifications.config.android.senderID = projectNumber;
		
		var push = PushNotification.init(defaults.pushNotifications.config);
		push.unregister(function() {
			cb()
		}, function() {
			cb();
		});
	};
	
	root.enableNotifications = function() {
		if (!usePushNotifications) return;
		
		var config = configService.getSync();
		if (!config.pushNotifications.enabled) return;
		
		storageService.getPushInfo(function(err, pushInfo) {
			storageService.setPushInfo(pushInfo.projectNumber, pushInfo.registrationId, true, function() {
				sendRequestEnableNotification(_ws, pushInfo.registrationId);
			});
		});
	};
	
	root.disableNotifications = function() {
		if (!usePushNotifications) return;
		
		storageService.getPushInfo(function(err, pushInfo) {
			storageService.setPushInfo(pushInfo.projectNumber, pushInfo.registrationId, false, function() {
				network.sendRequest(_ws, 'hub/disable_notification', {
					deviceAddress: device.getMyDeviceAddress(),
					registrationId: pushInfo.registrationId
				}, false, function(ws, request, response) {
					if (!response || (response && response !== 'ok')) return $log.error('Error sending push info');
				});
			});
		});
	};
	
	return root;
	
});
