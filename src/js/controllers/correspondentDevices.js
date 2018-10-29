'use strict';

angular
	.module('copayApp.controllers')
	.filter('order', function(type) {
		return {};
		console.info(type);
	})
	.controller('correspondentDevicesController', function(
		$scope,
		$timeout,
		configService,
		profileService,
		go,
		correspondentListService,
		$state,
		$rootScope
	) {
		var wallet = require('byteballcore/wallet.js');
		var bots = require('byteballcore/bots.js');
		var mutex = require('byteballcore/mutex.js');
		var db = require('byteballcore/db.js');
		
		var fc = profileService.focusedClient;

		this.$onInit = function () {
			$scope.readList();
		};

		$scope.editCorrespondentList = false;
		$scope.selectedCorrespondentList = {};
		$scope.backgroundColor = fc.backgroundColor;

		// Contacts filter
		$scope.contactsSearchText = '';
		$scope.contactsFilter = $scope.newMsgByAddressComparator;
		$scope.contactsFilterLabel = 'default';
		$scope.contactsFiltersList = [{
			label: 'alpha',
			type: $scope.newMsgByAddressComparator,
		}, {
			label: 'new',
			type: $scope.sortByDate,
		}];

		// Bots filter
		$scope.botsSearchText = '';
		$scope.botsFilter = 'default';
		$scope.botsFilterLabel = 'default';
		$scope.botsFiltersList = [{
			label: 'default',
			type: $scope.newMsgByAddressComparator,
		}, {
			label: 'alpha',
			type: 'name',
		}];

		$scope.state = $state;

		$scope.hideRemove = true;

		var listScrollTop = 0;

		$scope.$on('$stateChangeStart', function(
			evt,
			toState,
			toParams,
			fromState
		) {
			if (toState.name === 'correspondentDevices') {
				$scope.readList();
				setTimeout(function() {
					document.querySelector(
						'[ui-view=chat]'
					).scrollTop = listScrollTop;
					$rootScope.$emit('Local/SetTab', 'chat', true);
				}, 5);
			}
		});

		$scope.showCorrespondent = function(correspondent) {
			console.log('showCorrespondent', correspondent);
			correspondentListService.currentCorrespondent = correspondent;
			listScrollTop = document.querySelector('[ui-view=chat]').scrollTop;
			go.path('correspondentDevices.correspondentDevice');
		};

		$scope.showBot = function(bot) {
			$state.go('correspondentDevices.bot', { id: bot.id });
		};

		$scope.toggleEditCorrespondentList = function() {
			$scope.editCorrespondentList = !$scope.editCorrespondentList;
			$scope.selectedCorrespondentList = {};
		};

		$scope.toggleSelectCorrespondentList = function(addr) {
			$scope.selectedCorrespondentList[addr] = $scope
				.selectedCorrespondentList[addr]
				? false
				: true;
		};

		$scope.sortByDate = function(correspondent) {
			return new Date(correspondent.last_message_date);
		}

		$scope.newMsgByAddressComparator = function(correspondent) {
			return (
				-$scope.newMessagesCount[correspondent.device_address] ||
				correspondent.name.toLowerCase()
			);
		};

		$scope.beginAddCorrespondent = function() {
			console.log('beginAddCorrespondent');
			listScrollTop = document.querySelector('[ui-view=chat]').scrollTop;
			go.path('correspondentDevices.addCorrespondentDevice');
		};

		$scope.changeFilter = function(section, filter) {
			$scope[section + 'FilterLabel'] = filter.label;
			$scope[section + 'Filter'] = filter.type;
		};

		$scope.readList = function() {
			$scope.error = null;
			correspondentListService.list(function(err, ab) {
				if (err) {
					$scope.error = err;
					return;
				}

				wallet.readDeviceAddressesUsedInSigningPaths(function(
					arrNotRemovableDeviceAddresses
				) {
					// add a new property indicating whether the device can be removed or not

					var length = ab.length;
					for (var i = 0; i < length; i++) {
						corrDev = ab[i];

						corrDevAddr = corrDev.device_address;

						var ix = arrNotRemovableDeviceAddresses.indexOf(
							corrDevAddr
						);

						// device is removable when not in list
						corrDev.removable = ix == -1;
					}
				});

				db.query("SELECT correspondent_address, MAX(creation_date) AS 'last_message_date' FROM chat_messages GROUP BY creation_date", function(data) {
					var list = [];
					var chatMessagesHash = {};

					data.forEach(element => {
						chatMessagesHash[element.correspondent_address] = element.last_message_date;
					});

					list = ab.map(function(correspondent) {
						return Object.assign({}, correspondent, {
							last_message_date: chatMessagesHash[correspondent.device_address],
						});
					});

					$scope.list = list;
				});

				bots.load(function(err, rows) {
					if (err) $scope.botsError = err.toString();
					$scope.bots = rows;
					$timeout(function() {
						$scope.$digest();
					});
				});
			});
		};

		$scope.hideRemoveButton = function(removable) {
			return $scope.hideRemove || !removable;
		};

		$scope.remove = function(device_address) {
			mutex.lock(['remove_device'], function(unlock) {
				// check to be safe
				wallet.determineIfDeviceCanBeRemoved(device_address, function(
					bRemovable
				) {
					if (!bRemovable) {
						unlock();
						return console.log(
							'device ' + device_address + ' is not removable'
						);
					}
					var device = require('byteballcore/device.js');

					// send message to paired device
					// this must be done before removing the device
					device.sendMessageToDevice(
						device_address,
						'removed_paired_device',
						'removed'
					);

					// remove device
					device.removeCorrespondentDevice(
						device_address,
						function() {
							unlock();
							$scope.hideRemove = true;
							correspondentListService.currentCorrespondent = null;
							$scope.readList();
							$rootScope.$emit('Local/SetTab', 'chat', true);
							setTimeout(function() {
								document.querySelector(
									'[ui-view=chat]'
								).scrollTop = listScrollTop;
							}, 5);
						}
					);
				});
			});
		};

		$scope.cancel = function() {
			console.log('cancel clicked');
			go.walletHome();
		};
	});
