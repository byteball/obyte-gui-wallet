'use strict';

angular
	.module('copayApp.controllers')
	.controller('preferencesEditAttestorAddressCtrl', PreferencesEditAttestorAddressCtrl);

function PreferencesEditAttestorAddressCtrl(
	$scope, $timeout,
	go, configService,
	attestorAddressListService, aliasValidationService
) {
	var ValidationUtils = require("ocore/validation_utils.js");
	var currAttestorAddressKey = attestorAddressListService.currentAttestorKey;
	var objAttestorAddress = aliasValidationService.getAliasObj(currAttestorAddressKey);
	var configAttestorAddresses = configService.getSync().attestorAddresses;
	var self = this;

	this.title = objAttestorAddress.title + " attestor address";
	this.attestorAddress = configAttestorAddresses[currAttestorAddressKey] || "";

	this.save = function () {
		var newAddress = self.attestorAddress.trim();

		if (newAddress !== '' && !ValidationUtils.isValidAddress(newAddress)) {
			return setError("new attestor address is invalid");
		}

		var savingConfigData = {attestorAddresses:{}};
		savingConfigData.attestorAddresses[currAttestorAddressKey] = newAddress;

		configService.set(savingConfigData, function (err) {
			if (err)
				return $scope.$emit('Local/DeviceError', err);

			$timeout(function () {
				goBack();
			}, 50);
		});
	};

	function setError (error) {
		self.error = error;
		$timeout(function () {
			$scope.$apply();
		}, 100);
	}

	function goBack () {
		go.path('preferencesGlobal.preferencesAttestorAddresses');
	}
}
