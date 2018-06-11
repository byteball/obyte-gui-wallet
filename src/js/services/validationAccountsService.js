'use strict';

var ValidationUtils = require('byteballcore/validation_utils.js');

angular.module('copayApp.services').factory('aliasValidationService', function($state, $rootScope, configService, gettextCatalog) {

	const listOfAliases = {
		reddit: {
			dbKey: 'reddit',
			title: 'reddit account',
			regexp: /^reddit\/[a-zA-Z0-9\-_]{3,20}$/,
			transformToAccount: (value) => {
				return value.replace('reddit/', '');
			}
		},
		phone: {
			dbKey: 'phone',
			title: 'phone number',
			regexp: /^(\+)?(\d)+$/,
			transformToAccount: (value) => {
				return value.replace('+', '');
			}
		}
	};

	let root = {};
	
	root.getAliasObj = function (key) {
		if (!(key in listOfAliases)) {
			throw new Error('unknown account');
		}
		return listOfAliases[key];
	};

	root.validate = function (value) {
		for (const key in listOfAliases) {
			if (!listOfAliases.hasOwnProperty(key)) continue;
			if (listOfAliases[key].regexp.test(value)) {
				const account = listOfAliases[key].transformToAccount(value);
				return { isValid: true, key: key, account: account };
			}
		}
		return { isValid: false };
	};

	root.getBbAddressByKeyValue = function (key, value, callback) {
		if (!listOfAliases[key]) {
			return callback('Account type not found');
		}

		const obj = listOfAliases[key];
		const attestorAddress = configService.getSync().attestorAddresses[key];
		if (!attestorAddress) {
			return callback('Attestor not found');
		}

		const db = require('byteballcore/db.js');
		db.query(`SELECT
				address, is_stable
			FROM attested_fields
			CROSS JOIN units USING(unit)
			WHERE attestor_address=?
				AND field=?
				AND value=?
			ORDER BY attested_fields.rowid DESC 
			LIMIT 1`,
			[attestorAddress, obj.dbKey, value],
			function(rows) {
				if (!rows.length || !rows[0].is_stable) {
					const message = `"${value}" `;
					message += `${gettextCatalog.getString(obj.title)} `;
					message += gettextCatalog.getString('does not have attested address');
					return callback(null, message);
				}

				const bbAddress = rows[0].address;

				if (!ValidationUtils.isValidAddress(bbAddress)) {
					return callback(`unrecognized bb_address: ${bbAddress}`);
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
