'use strict';

var ValidationUtils = require('byteballcore/validation_utils.js');

angular.module('copayApp.services').factory('validationAccountsService', function($state, $rootScope, configService, gettextCatalog) {

	const data = {
		reddit: {
			dbKey: 'reddit',
			title: 'reddit account',
			regexp: /^reddit\/[a-zA-Z0-9\-_]{3,20}$/,
			transformToAccount: (value) => {
				return value.replace('reddit/', '');
			}
		},
		phoneRu: {
			dbKey: 'phone-ru',
			title: 'russian phone number',
			regexp: /^(\+7|7|8)([0-9]){10}$/,
			transformToAccount: (value) => {
				return value.replace('+', '');
			}
		}
	};

	let root = {};
	
	root.getDataObj = function (key) {
		if (!(key in data)) {
			throw new Error('unknown account');
		}
		return data[key];
	};

	root.validate = function (value) {
		for (const key in data) {
			if (!data.hasOwnProperty(key)) continue;
			if (data[key].regexp.test(value)) {
				const account = data[key].transformToAccount(value);
				return { isValid: true, key: key, account: account };
			}
		}
		return { isValid: false };
	};

	root.getBbAddressByKeyValue = function (key, value, callback) {
		if (!data[key]) {
			return callback('Account type not found');
		}

		const obj = data[key];
		console.log("configService.getSync().attestorsAccounts", configService.getSync(), configService);
		const attestorAddress = configService.getSync().attestorsAccounts[key];
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
		for (var key in data) {
			if (!data.hasOwnProperty(key)) continue;
			if (data[key].regexp.test(value)) {
				return true;
			}
		}
		return false;
	};

	return root;
});
