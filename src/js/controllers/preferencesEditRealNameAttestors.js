'use strict';

angular
	.module('copayApp.controllers')
	.controller('preferencesEditRealNameAttestorsCtrl', PreferencesEditRealNameAttestorsCtrl);

function PreferencesEditRealNameAttestorsCtrl(
	$scope, $timeout,
	go, configService,
	attestorAddressListService, aliasValidationService
) {
	var ValidationUtils = require("ocore/validation_utils.js");
	//var currAttestorAddressKey = attestorAddressListService.currentAttestorKey;
	//var objAttestorAddress = aliasValidationService.getAliasObj(currAttestorAddressKey);
	var self = this;

	this.attestorAddresses = configService.getSync().realNameAttestorAddresses || {};

	this.save = function () {
		var savingConfigData = {realNameAttestorAddresses:[]};

		for (var i = 0; i < this.attestorAddresses.length; i++) {
			var pair = this.attestorAddresses[i];
			var newAddress = pair.address.trim();
			if (newAddress !== '' && !ValidationUtils.isValidAddress(newAddress)) {
				return setError("new attestor address is invalid");
			}

			savingConfigData.realNameAttestorAddresses.push({address: newAddress});
		}

		configService.set(savingConfigData, function (err) {
			if (err)
				return $scope.$emit('Local/DeviceError', err);

			$timeout(function () {
				goBack();
			}, 50);
		});
	};

	this.removeAttestorAddress = function (address) {
		var idx = this.attestorAddresses.findIndex(function(pair) {return pair.address == address;});
		if (idx > -1)
			this.attestorAddresses.splice(idx, 1);
	}

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
