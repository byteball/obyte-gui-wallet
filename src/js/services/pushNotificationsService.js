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
	
	eventBus.on('receivedPushProjectNumber', function(ws, data) {
		_ws = ws;
		if (data && data.projectNumber) {
			storageService.getPushInfo(function(err, pushInfo) {
				projectNumber = data.projectNumber;
				if (pushInfo && pushInfo.projectNumber && pushInfo.projectNumber === projectNumber) {
					if (pushInfo.enabled) {
						network.sendRequest(ws, 'enableNotification', {
							deviceAddress: device.getMyDeviceAddress(),
							registrationId: pushInfo.registrationId
						}, false, function(ws, request, response) {
							if (!response || (response && response !== 'ok')) return $log.error('Error sending push info');
						});
					}
					$rootScope.$emit('Local/pushNotificationsReady');
				}
				else {
					root.pushNotificationsInit(function(registrationId) {
						network.sendRequest(ws, 'enableNotification', {
							deviceAddress: device.getMyDeviceAddress(),
							registrationId: registrationId
						}, false, function(ws, request, response) {
							if (!response || (response && response !== 'ok')) return $log.error('Error sending push info');
							$rootScope.$emit('Local/pushNotificationsReady');
						});
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
	
	root.enableNotifications = function() {
		if (!usePushNotifications) return;
		
		var config = configService.getSync();
		if (!config.pushNotifications.enabled) return;
		
		storageService.getPushInfo(function(err, pushInfo) {
			storageService.setPushInfo(pushInfo.projectNumber, pushInfo.registrationId, true, function() {
				network.sendRequest(_ws, 'enableNotification', {
					deviceAddress: device.getMyDeviceAddress(),
					registrationId: pushInfo.registrationId
				}, false, function(ws, request, response) {
					if (!response || (response && response !== 'ok')) return $log.error('Error sending push info');
				});
			});
		});
	};
	
	root.disableNotifications = function() {
		if (!usePushNotifications) return;
		
		storageService.getPushInfo(function(err, pushInfo) {
			storageService.setPushInfo(pushInfo.projectNumber, pushInfo.registrationId, false, function() {
				network.sendRequest(_ws, 'disableNotification', {
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
