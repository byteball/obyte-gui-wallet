'use strict';

angular.module('copayApp.controllers')
	.controller('preferencesController',
		function($scope, $rootScope, $filter, $timeout, $modal, $log, lodash, configService, profileService, uxLanguage, $q) {

			this.init = function() {
				var config = configService.getSync();
				this.unitName = config.wallet.settings.unitName;
				this.currentLanguageName = uxLanguage.getCurrentLanguageName();
				var fc = profileService.focusedClient;
				if (!fc)
					return;
				
				if (window.touchidAvailable) {
					var walletId = fc.credentials.walletId;
					this.touchidAvailable = true;
					config.touchIdFor = config.touchIdFor || {};
					$scope.touchid = config.touchIdFor[walletId];
				}
				
				//$scope.encrypt = fc.hasPrivKeyEncrypted();
				this.externalSource = null;

				$scope.numCosigners = fc.credentials.n;
				var walletDefinedByKeys = require('ocore/wallet_defined_by_keys.js');
				var db = require('ocore/db.js');
				walletDefinedByKeys.readAddresses(fc.credentials.walletId, {}, function(addresses) {
					$scope.numAddresses = addresses.length;
					db.query(
						"SELECT 1 FROM private_profiles WHERE address=? UNION SELECT 1 FROM attestations WHERE address=?", 
						[addresses[0], addresses[0]], 
						function(rows){
							$scope.bHasAttestations = (rows.length > 0);
							$scope.bEditable = ($scope.numAddresses === 1 && $scope.numCosigners === 1 && !$scope.bHasAttestations);
							$timeout(function(){
								$rootScope.$apply();
							});
						}
					);
				});
				// TODO externalAccount
				//this.externalIndex = fc.getExternalIndex();
			};
	
			var unwatchRequestTouchid = $scope.$watch('touchid', function(newVal, oldVal) {
				if (newVal == oldVal || $scope.touchidError) {
					$scope.touchidError = false;
					return;
				}
				var walletId = profileService.focusedClient.credentials.walletId;

				var opts = {
					touchIdFor: {}
				};
				opts.touchIdFor[walletId] = newVal;

				$rootScope.$emit('Local/RequestTouchid', function(err) {
					if (err) {
						$log.debug(err);
						$timeout(function() {
							$scope.touchidError = true;
							$scope.touchid = oldVal;
						}, 100);
					}
					else {
						configService.set(opts, function(err) {
							if (err) {
								$log.debug(err);
								$scope.touchidError = true;
								$scope.touchid = oldVal;
							}
						});
					}
				});
			});

			$scope.$on('$destroy', function() {
				unwatchRequestTouchid();
			});

			$scope.$watch('index.isSingleAddress', function(newValue, oldValue) {
				if (oldValue == newValue) return;
				profileService.setSingleAddressFlag(newValue);
			});
		});