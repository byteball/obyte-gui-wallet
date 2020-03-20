'use strict';

angular
	.module('copayApp.controllers')
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
		var wallet = require('ocore/wallet.js');
		var bots = require('ocore/bots.js');
		var mutex = require('ocore/mutex.js');
		var db = require('ocore/db.js');
	
		var bFirstLoad = true;
		
		var fc = profileService.focusedClient;

		$scope.editCorrespondentList = false;
		$scope.selectedCorrespondentList = {};
		$scope.backgroundColor = fc.backgroundColor;

		$scope.state = $state;
	
		$scope.self = $scope;

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
			if ($scope.newMessagesCount[correspondent.device_address])
				return 'z'+$scope.newMessagesCount[correspondent.device_address];
			return correspondent.last_message_date;
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

		$scope.changeOrder = function(section, order) {
			$scope[section + 'SortOrderLabel'] = order.label;
			$scope[section + 'SortOrder'] = order.type;
			$scope[section + 'SortReverse'] = order.sortReverse;
		};

		$scope.readList = function() {
			$scope.error = null;
			correspondentListService.list(function(err, ab) {
				if (err) {
					$scope.error = err;
					return;
				}
				$scope.list = ab;

				wallet.readNonRemovableDevices(function(
					arrNotRemovableDeviceAddresses
				) {
					// add a new property indicating whether the device can be removed or not

					var length = ab.length;
					for (var i = 0; i < length; i++) {
						var corrDev = ab[i];

						var corrDevAddr = corrDev.device_address;

						var ix = arrNotRemovableDeviceAddresses.indexOf(
							corrDevAddr
						);

						// device is removable when not in list
						corrDev.removable = ix == -1;
					}
				});

				bots.load(function(err, rows) {
					if (err) $scope.botsError = err.toString();
					if (rows){ // skip if network error
						rows.forEach(function(row){
							row.name_and_desc = row.name + ' ' + row.description;
						});
					}
					$scope.bots = rows;
					$timeout(function() {
						$scope.$digest();
					});
				});
				
				db.query("SELECT correspondent_address, MAX(creation_date) AS last_message_date FROM chat_messages WHERE type='text' GROUP BY correspondent_address", function(rows) {
					var assocLastMessageDateByCorrespondent = correspondentListService.assocLastMessageDateByCorrespondent;

					rows.forEach(function(row) {
						if (!assocLastMessageDateByCorrespondent[row.correspondent_address] || row.last_message_date > assocLastMessageDateByCorrespondent[row.correspondent_address])
							assocLastMessageDateByCorrespondent[row.correspondent_address] = row.last_message_date;
					});

					ab = ab.forEach(function(correspondent) {
						correspondent.last_message_date = assocLastMessageDateByCorrespondent[correspondent.device_address] || '2016-12-25 00:00:00';
					});
					
					if (bFirstLoad){
						$scope.changeOrder('contacts', $scope.contactsSortOrderList[1]); // sort by recent
						bFirstLoad = false;
					}

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
					var device = require('ocore/device.js');

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
	
	
		// Contacts order
		$scope.contactsSearchText = '';
		$scope.contactsSortOrder = $scope.newMsgByAddressComparator;
		$scope.contactsSortOrderLabel = 'alphabetic';
		$scope.contactsSortOrderList = [{
			label: 'alphabetic',
			type: $scope.newMsgByAddressComparator,
		}, {
			label: 'recent',
			type: $scope.sortByDate,
			sortReverse: true
		}];

		// Bots order
		$scope.botsSearchText = '';
		$scope.botsSortOrder = undefined;
		$scope.botsSortOrderLabel = 'suggested';
		$scope.botsSortOrderList = [{
			label: 'suggested',
			type: undefined,
		}, {
			label: 'alphabetic',
			type: 'name',
		}];

	});
