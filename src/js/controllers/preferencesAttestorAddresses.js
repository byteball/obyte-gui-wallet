'use strict';

angular
	.module('copayApp.controllers')
	.controller('preferencesAttestorAddressesCtrl', PreferencesAttestorAddressesCtrl);

function PreferencesAttestorAddressesCtrl(
	$scope, $timeout,
	configService, go,
	attestorAddressListService, aliasValidationService
) {
	var config = configService.getSync();
	var configAttestorAddresses = config.attestorAddresses;
	console.log('!!!configAttestorAddresses', JSON.stringify(configAttestorAddresses, null, 4));
	var listOfAliases = aliasValidationService.getListOfAliases();

	this.arrAttestorAddresses = [];
	for (var attestorKey in configAttestorAddresses) {
		if (!configAttestorAddresses.hasOwnProperty(attestorKey)) continue;

		var value = configAttestorAddresses[attestorKey];
		var obj = aliasValidationService.getAliasObj(attestorKey);
		var title = obj.title;
		title = title[0].toUpperCase() + title.substr(1);
		this.arrAttestorAddresses.push({attestorKey: attestorKey, value: value, title: title});
	}
	for (var attestorKey in listOfAliases) {
		if (
			!listOfAliases.hasOwnProperty(attestorKey) ||
			configAttestorAddresses.hasOwnProperty(attestorKey)
		) continue;

		var obj = listOfAliases[attestorKey];
		var title = obj.title;
		title = title[0].toUpperCase() + title.substr(1);
		this.arrAttestorAddresses.push({attestorKey: attestorKey, value: "", title: title});
	}

	this.arrAttestorAddresses.sort(function (a, b) {
		if (a.title > b.title) {
			return 1;
		}
		if (a.title < b.title) {
			return -1;
		}
		return 0;
	});

	this.edit = function (attestorKey) {
		attestorAddressListService.currentAttestorKey = attestorKey;
		go.path('preferencesGlobal.preferencesAttestorAddresses.preferencesEditAttestorAddress');
	};
}
