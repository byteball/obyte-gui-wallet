'use strict';

angular
	.module('copayApp.services')
	.factory('attestorAddressListService', function () {
		var root = {};
		root.currentKey = null;
		return root;
	});
