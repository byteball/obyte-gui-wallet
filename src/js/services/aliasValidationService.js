'use strict';

var ValidationUtils = require('byteballcore/validation_utils.js');

angular.module('copayApp.services').factory('aliasValidationService', function($state, $rootScope, configService, gettextCatalog) {

	var listOfAliases = {
		reddit: {
			dbKey: 'reddit',
			title: 'reddit account',
			regexp: /^reddit\/[a-zA-Z0-9\-_]{3,20}$/,
			transformToAccount: function (value) {
				return value.replace('reddit/', '');
			}
		},
		phone: {
			dbKey: 'phone',
			title: 'phone number',
			regexp: /^(\+)?(\d)+$/,
			transformToAccount: function (value) {
				return value.replace('+', '');
			}
		}
	};

	var root = {};
	
	root.getAliasObj = function (key) {
		if (!(key in listOfAliases)) {
			throw new Error('unknown account');
		}
		return listOfAliases[key];
	};

	root.getListOfAliases = function () {
		return listOfAliases;
	};

	root.validate = function (value) {
		for (var key in listOfAliases) {
			if (!listOfAliases.hasOwnProperty(key)) continue;
			if (listOfAliases[key].regexp.test(value)) {
				var account = listOfAliases[key].transformToAccount(value);
				return { isValid: true, key: key, account: account };
			}
		}
		return { isValid: false };
	};

	root.getBbAddressByKeyValue = function (key, value, callback) {
		if (!listOfAliases[key]) {
			return callback('Account type not found');
		}

		var obj = listOfAliases[key];
		var attestorAddress = configService.getSync().attestorAddresses[key];
		if (!attestorAddress) {
			var message = gettextCatalog.getString('Attestor') + " ";
			message += '"' + gettextCatalog.getString(obj.title) + '" ';
			message += gettextCatalog.getString('does not have address');
			return callback(null, message);
		}

		var db = require('byteballcore/db.js');
		db.query("SELECT \n\
				address, is_stable \n\
			FROM attested_fields \n\
			CROSS JOIN units USING(unit) \n\
			WHERE attestor_address=? \n\
				AND field=? \n\
				AND value=? \n\
			ORDER BY attested_fields.rowid DESC \n\
			LIMIT 1",
			[attestorAddress, obj.dbKey, value],
			function(rows) {
				if (!rows.length || !rows[0].is_stable) {
					var message = gettextCatalog.getString(obj.title) + " ";
					message += '"' + value + '" ';
					message += gettextCatalog.getString('does not have byteball address');
					return callback(null, message);
				}

				var bbAddress = rows[0].address;

				if (!ValidationUtils.isValidAddress(bbAddress)) {
					return callback("unrecognized bb_address: " + bbAddress);
				}
				
				callback(null, null, bbAddress);
		});
	};

	root.isValid = function (value) {
		for (var key in listOfAliases) {
			if (!listOfAliases.hasOwnProperty(key)) continue;
			if (listOfAliases[key].regexp.test(value)) {
				return true;
			}
		}
		return false;
	};

	return root;
});
