'use strict';
angular.module('copayApp.services')
.factory('pushNotificationsService', function($http, $rootScope, $log, isMobile, $timeout, storageService, configService, lodash, isCordova) {
	var root = {};
	var defaults = configService.getDefaults();
	var usePushNotifications = isCordova && !isMobile.Windows() && (isMobile.Android() || isMobile.iOS());
	var projectNumber;
	var _ws;
	
	var eventBus = require('ocore/event_bus.js');
	
	function sendRequestEnableNotification(ws, registrationId) {
		var network = require('ocore/network.js');
		network.sendRequest(ws, 'hub/enable_notification', {registrationId: registrationId, platform: isMobile.iOS() ? 'ios' : 'android'}, false, function(ws, request, response) {
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

	window.onNotificationAPN = function(event) {
		if (event.badge)
		{
			//window.plugins.pushNotification.setApplicationIconBadgeNumber(function(){}, function(){}, event.badge);
		}
	}
	
	eventBus.on('receivedPushProjectNumber', function(ws, data) {
		if (!usePushNotifications) return;
		_ws = ws;
		if (data && data.projectNumber !== undefined) {
			$timeout(function(){
				storageService.getPushInfo(function(err, pushInfo) {
					var config = configService.getSync();
					projectNumber = data.projectNumber + "";
					var is_hub_configured = !!((isMobile.Android() && projectNumber !== "0") || (isMobile.iOS() && data.hasKeyId));
					if (pushInfo && !is_hub_configured) {
						root.pushNotificationsUnregister(function() {

						});
					}
					else if (is_hub_configured && config.pushNotifications.enabled) {
						root.pushNotificationsInit();
					}
				});
			});
		}
	});
	
	root.pushNotificationsInit = function() {
		if (!usePushNotifications) return;
		
		var device = require('ocore/device.js');
		device.readCorrespondents(function(devices){
			if (devices.length == 0)
				return;

			var errorHandler = function(e) {
				console.warn("push notification register failed", e);
				usePushNotifications = false;
			}
			if (isMobile.Android()) {
				window.plugins.pushNotification.register(function(data) {}, errorHandler,
					{
						"senderID": projectNumber,
						"ecb": "onNotification"
					}
				);
			} else if (isMobile.iOS()) {
				window.plugins.pushNotification.register(function(token) {
					storageService.setPushInfo(projectNumber, token, true, function() {
						sendRequestEnableNotification(_ws, token);
					});
				}, errorHandler,
					{"badge":"true","sound":"true","alert":"true","ecb":"onNotificationAPN"}
				);
			}
			
			configService.set({pushNotifications: {enabled: true}}, function(err) {
				if (err) $log.debug(err);
			});
		});
	};
	
	function disable_notification() {
		storageService.getPushInfo(function(err, pushInfo) {
			if (err)
				return $log.error('Error getting push info');
			storageService.removePushInfo(function() {
				var network = require('ocore/network.js');
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