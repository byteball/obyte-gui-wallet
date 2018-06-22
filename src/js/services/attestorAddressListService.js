'use strict';

angular
	.module('copayApp.services')
	.factory('attestorAddressListService', function () {
		var root = {};
		root.currentAttestorKey = null;
		return root;
	});
