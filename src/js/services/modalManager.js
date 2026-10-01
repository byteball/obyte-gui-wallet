'use strict';

angular.module('copayApp.services')
.factory('modalManager', function($injector, $document, $log) {
	const modals = new Map();
	const cancelledOpens = new WeakSet();
	const overlays = new Set();
	const closeReason = 'modal-manager-close';
	const root = {};

	root.isManagerClose = function(reason) {
		return reason === closeReason;
	};

	root.track = function(instance, record) {
		modals.set(instance, record);
		function remove() {
			modals.delete(instance);
		}
		instance.result.then(remove, remove);
	};

	root.cancelPendingOpen = function(instance, modal) {
		const record = modals.get(instance);
		if (record)
			record.pending = false;
		if (!cancelledOpens.has(instance))
			return false;
		cancelledOpens.delete(instance);
		modal.scope.$destroy();
		modal.deferred.reject(closeReason);
		return true;
	};

	root.register = function(overlay) {
		if (overlay.transient !== true)
			return angular.noop;
		overlays.add(overlay);
		return function() { overlays.delete(overlay); };
	};

	root.hasOpenModals = function() {
		return !!$injector.get('$modalStack').getTop() ||
			Array.from(modals.values()).some(function(record) { return !record.cancelled; });
	};

	root.animateClose = function(instance, className) {
		if (!instance.modalManagerClass)
			return;
		const element = $document[0].querySelector('.' + instance.modalManagerClass);
		if (element)
			angular.element(element).addClass(className);
	};

	root.closeTransient = function() {
		const pending = Array.from(modals.entries()).filter(function(entry) { return !entry[1].cancelled; });
		const shownOverlays = Array.from(overlays).filter(function(overlay) { return overlay.isOpen(); });
		pending.forEach(function(entry) {
			const instance = entry[0], record = entry[1];
			record.cancelled = true;
			if (record.pending) {
				cancelledOpens.add(instance);
				record.cancelOpen(closeReason);
			}
		});
		pending.forEach(function(entry) { entry[0].dismiss(closeReason); });
		shownOverlays.forEach(function(overlay) {
			try {
				overlay.dismiss(closeReason);
			}
			catch (err) {
				$log.error(err);
			}
		});
		return pending.length + shownOverlays.length;
	};

	return root;
})
.config(function($provide) {
	$provide.decorator('$modal', function($delegate, $controller, $q, modalManager) {
		const open = $delegate.open;
		let nextId = 0;
		$delegate.open = function(options) {
			if (options.transient !== true)
				return open.apply($delegate, arguments);
			const result = $q.defer();
			const record = {cancelled: false, pending: true, cancelOpen: result.reject};
			const className = 'modal-manager-' + (++nextId);
			const managedOptions = angular.extend({}, options, {
				windowClass: ((options.windowClass || '') + ' ' + className).trim()
			});
			if (options.controller) {
				const names = ['$scope', '$modalInstance'].concat(Object.keys(options.resolve || {}));
				managedOptions.controller = names.concat(function() {
					if (record.cancelled)
						return;
					const locals = {};
					for (let i = 0; i < names.length; i++)
						locals[names[i]] = arguments[i];
					return $controller(options.controller, locals);
				});
			}
			const instance = open.call($delegate, managedOptions);
			// Foundation cannot dismiss an instance before its template/resolve finishes.
			instance.result.then(result.resolve, result.reject);
			instance.result = result.promise;
			instance.modalManagerClass = className;
			modalManager.track(instance, record);
			return instance;
		};
		return $delegate;
	});
	$provide.decorator('$modalStack', function($delegate, modalManager) {
		const open = $delegate.open;
		$delegate.open = function(instance, modal) {
			if (!modalManager.cancelPendingOpen(instance, modal))
				return open.apply($delegate, arguments);
		};
		return $delegate;
	});
});
