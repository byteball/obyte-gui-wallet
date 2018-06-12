'use strict';

angular
	.module('copayApp.controllers')
	.controller('preferencesAttestorAddressesCtrl', PreferencesAttestorAddressesCtrl);

function PreferencesAttestorAddressesCtrl(
	$scope, $timeout,
	configService, go,
	attestorAddressListService, aliasValidationService
) {
	var configAttestorAddresses = configService.getSync().attestorAddresses;
	var listOfAliases = aliasValidationService.getListOfAliases();

	this.arrAttestorAddresses = [];
	for (var key in configAttestorAddresses) {
		if (!configAttestorAddresses.hasOwnProperty(key)) continue;
		var value = configAttestorAddresses[key];
		var obj = aliasValidationService.getAliasObj(key);
		var title = obj.title;
		title = title[0].toUpperCase() + title.substr(1);
		this.arrAttestorAddresses.push({key: key, value: value, title: title});
	}
	for (var key in listOfAliases) {
		if (!listOfAliases.hasOwnProperty(key) || configAttestorAddresses.hasOwnProperty(key)) continue;
		var obj = listOfAliases[key];
		var title = obj.title;
		title = title[0].toUpperCase() + title.substr(1);
		this.arrAttestorAddresses.push({key: key, value: "", title: title});
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

	this.edit = function (key) {
		attestorAddressListService.currentKey = key;
		go.path('preferencesGlobal.preferencesAttestorAddresses.preferencesEditAttestorAddress');
	};
}
