'use strict';

var ValidationUtils = require('ocore/validation_utils.js');

angular.module('copayApp.services').factory('aliasValidationService', function($timeout, configService, gettextCatalog) {

	var listOfAliases = {
		email: {
			dbKey: 'email',
			title: 'email',
			isValid: function (value) {
				return ValidationUtils.isValidEmail(value);
			},
			transformToAccount: function (value) {
				return value.replace(/^textcoin:/, '').toLowerCase();
			}
		},
		reddit: {
			dbKey: 'reddit_username',
			title: 'reddit account',
			isValid: function (value) {
				return /^reddit\/[a-z0-9\-_]{3,20}$/i.test(value);
			},
			transformToAccount: function (value) {
				return value.replace(/^reddit\//i, '').toLowerCase();
			}
		},
		steem: {
			dbKey: 'steem_username',
			title: 'steem account',
			isValid: function (value) {
				return /^steem\/[a-z0-9\-_.]{3,20}$/i.test(value);
			},
			transformToAccount: function (value) {
				return value.replace(/^steem\//i, '').toLowerCase();
			}
		},
		username: {
			dbKey: 'username',
			title: 'username',
			isValid: function (value) {
				return /^@([a-z\d\-_]){1,32}$/i.test(value);
			},
			transformToAccount: function (value) {
				return value.substr(1).toLowerCase();
			}
		},
		phone: {
			dbKey: 'phone',
			title: 'phone number',
			isValid: function (value) {
				return /^\+?\d{9,14}$/.test(value);
			},
			transformToAccount: function (value) {
				return value.replace('+', '');
			}
		}
	};
	var assocBbAddresses = {};
	var root = {};
	
	for (var attestorKey in listOfAliases) {
		if (!listOfAliases.hasOwnProperty(attestorKey)) continue;
		assocBbAddresses[attestorKey] = {};
	}

	root.getAliasObj = function (attestorKey) {
		if (!(attestorKey in listOfAliases)) {
			throw new Error('unknown alias');
		}
		return listOfAliases[attestorKey];
	};

	root.getListOfAliases = function () {
		return listOfAliases;
	};

	root.validate = function (value) {
		for (var attestorKey in listOfAliases) {
			if (!listOfAliases.hasOwnProperty(attestorKey)) continue;
			if (listOfAliases[attestorKey].isValid(value)) {
				var account = listOfAliases[attestorKey].transformToAccount(value);
				return { isValid: true, attestorKey: attestorKey, account: account };
			}
		}
		return { isValid: false };
	};

	root.checkAliasExists = function (attestorKey) {
		if (!listOfAliases.hasOwnProperty(attestorKey)) {
			throw new Error('Alias not found');
		}
	};

	root.getBbAddress = function (attestorKey, value) {
		root.checkAliasExists(attestorKey);
		return assocBbAddresses[attestorKey][value];
	};

	root.deleteAssocBbAddress = function (attestorKey, value) {
		root.checkAliasExists(attestorKey);
		delete assocBbAddresses[attestorKey][value];
	};

	root.resolveValueToBbAddress = function (attestorKey, value, callback) {
		function setResult(result) {
			assocBbAddresses[attestorKey][value] = result;
			$timeout(callback);
		}

		root.checkAliasExists(attestorKey);
		
		if (!listOfAliases[attestorKey]) {
			throw new Error('Alias not found');
		}

		var obj = listOfAliases[attestorKey];
		var attestorAddress = configService.getSync().attestorAddresses[attestorKey];
		if (!attestorAddress) {
			return setResult('none');
		}

		var conf = require('ocore/conf.js');
		var db = require('ocore/db.js');
		db.query(
			"SELECT \n\
				address, is_stable \n\
			FROM attested_fields \n\
			CROSS JOIN units USING(unit) \n\
			WHERE attestor_address=? \n\
				AND field=? \n\
				AND value=? \n\
			ORDER BY attested_fields.rowid DESC \n\
			LIMIT 1",
			[attestorAddress, obj.dbKey, value],
			function (rows) {
				if (rows.length > 0) {
					return setResult( (!conf.bLight || rows[0].is_stable) ? rows[0].address : 'unknown' );
				}
				// not found
				if (!conf.bLight) {
					return setResult('none');
				}
				// light
				var network = require('ocore/network.js');
				var params = {attestor_address: attestorAddress, field: obj.dbKey, value: value};
				network.requestFromLightVendor('light/get_attestation', params, function (ws, request, response) {
					if (response.error) {
						return setResult('unknown');
					}

					var attestation_unit = response;
					if (attestation_unit === "") {// no attestation
						return setResult('none');
					}

					network.requestHistoryFor([attestation_unit], [], function (err) {
						if (err) {
							return setResult('unknown');
						}
						// now attestation_unit is in the db (stable or unstable)
						root.resolveValueToBbAddress(attestorKey, value, callback);
					});
				});
			}
		);
	};

	root.isValid = function (value) {
		for (var attestorKey in listOfAliases) {
			if (!listOfAliases.hasOwnProperty(attestorKey)) continue;
			if (listOfAliases[attestorKey].isValid(value)) {
				return true;
			}
		}
		return false;
	};

	return root;
});
