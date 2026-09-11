'use strict';

angular.module('copayApp.services').factory('desktopNotificationService', function(electron, configService, $log) {
	const MAX_SEEN_EVENTS = 1000;
	const seenEvents = new Set();

	return {
		show: function(title, body, eventId, target, walletId) {
			if (!electron.isDefined()) return;
			if (eventId) {
				if (seenEvents.has(eventId)) return;
				seenEvents.add(eventId);
				if (seenEvents.size > MAX_SEEN_EVENTS)
					seenEvents.delete(seenEvents.values().next().value);
			}
			try {
				const config = configService.getSync();
				if (config.desktopNotifications && config.desktopNotifications.enabled === false) return;
				electron.emit('show-notification', {title: title, body: body, target: target, walletId: walletId});
			} catch (err) {
				$log.warn('Failed to send desktop notification', err);
			}
		}
	};
});
