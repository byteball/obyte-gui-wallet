'use strict';

var device = require('byteballcore/device.js');
var walletDefinedByKeys = require('byteballcore/wallet_defined_by_keys.js');

angular.module('copayApp.controllers').controller('correspondentDeviceController',
  function($scope, $rootScope, $timeout, $sce, $modal, configService, profileService, animationService, isCordova, go, correspondentListService, lodash) {
	
	var self = this;
	var win = nw.Window.get();
	console.log("correspondentDeviceController");
	
	var fc = profileService.focusedClient;
	$scope.backgroundColor = fc.backgroundColor;
	var correspondent = correspondentListService.currentCorrespondent;
	$scope.correspondent = correspondent;
	var myPaymentAddress;
	document.chatForm.message.focus();
	
	if (!correspondentListService.messageEventsByCorrespondent[correspondent.device_address])
		correspondentListService.messageEventsByCorrespondent[correspondent.device_address] = [];
	$scope.messageEvents = correspondentListService.messageEventsByCorrespondent[correspondent.device_address];

	$scope.send = function() {
		$scope.error = null;
		setOngoingProcess("sending");
		device.sendMessageToDevice(correspondent.device_address, "text", $scope.message, {
			ifOk: function(){
				setOngoingProcess();
				//$scope.messageEvents.push({bIncoming: false, message: $sce.trustAsHtml($scope.message)});
				$scope.messageEvents.push({bIncoming: false, message: correspondentListService.formatOutgoingMessage($scope.message)});
				$scope.message = "";
				$scope.$apply();
			},
			ifError: function(error){
				setOngoingProcess();
				setError(error);
			}
		});
	};
	
	$scope.insertMyAddress = function(){
		issueNextAddressIfNecessary(appendMyPaymentAddress);
	};
	
	$scope.requestPayment = function(){
		issueNextAddressIfNecessary(showRequestPaymentModal);
	};
	
	$scope.sendPayment = function(address, amount, asset){
		console.log("will send payment to "+address);
		if (asset && $scope.index.arrBalances.filter(function(balance){ return (balance.asset === asset); }).length === 0){
			console.log("i do not own anything of asset "+asset);
			return;
		}
		go.send(function(){
			//$rootScope.$emit('Local/SetTab', 'send', true);
			$rootScope.$emit('paymentRequest', address, amount, asset, correspondent.device_address);
		});
	};

	$scope.showPayment = function(asset){
		console.log("will show payment in asset "+asset);
		if (!asset)
			throw Error("no asset in showPayment");
		if (asset && $scope.index.arrBalances.filter(function(balance){ return (balance.asset === asset); }).length === 0){
			console.log("i do not own anything of asset "+asset);
			return;
		}
		var assetIndex = lodash.findIndex($scope.index.arrBalances, {asset: asset});
		if (assetIndex < 0)
			throw Error("failed to find asset index of asset "+asset);
		$scope.index.assetIndex = assetIndex;
		go.history();
	};

	// send a command to the bot
	$scope.sendCommand = function(command, description){
		console.log("will send command "+command);
		$scope.message = command;
		$scope.send();
	};

	$scope.editCorrespondent = function() {
		go.path('editCorrespondentDevice');
	};

	$scope.stopCountNewMessages = function() {
		$scope.newMessagesCount=0;
		$scope.counterEnabled = false;
	}
	$scope.stopCountNewMessages();
	win.on('focus', function(){$scope.stopCountNewMessages();$scope.$apply();});
	win.on('blur', function(){$scope.counterEnabled = true;});
	$scope.$watch('newMessagesCount', function(count) {
		if (count) {
			win.setBadgeLabel(""+count);
		} else {
			win.setBadgeLabel("");
		}
	});
	$scope.$watchCollection('messageEvents', function (newMessages, oldMessages) {
		if (!$scope.counterEnabled) return;
		var diffArray = lodash.difference(newMessages, oldMessages)
		if (diffArray.length)
			for (var i in diffArray) {
				if (diffArray[i].bIncoming) $scope.newMessagesCount++;
			}
	});

	function setError(error){
		console.log("send error:", error);
		$scope.error = error;
	}
	
	function issueNextAddressIfNecessary(onDone){
		if (myPaymentAddress) // do not issue new address
			return onDone();
		walletDefinedByKeys.issueOrSelectNextAddress(fc.credentials.walletId, 0, function(addressInfo){
			myPaymentAddress = addressInfo.address; // cache it in case we need to insert again
			onDone();
			$scope.$apply();
		});
	}
	
	function appendText(text){
		if (!$scope.message)
			$scope.message = '';
		if ($scope.message && $scope.message.charAt($scope.message.length - 1) !== ' ')
			$scope.message += ' ';
		$scope.message += text;
		$scope.message += ' ';
		if (!document.chatForm) // already gone
			return;
		var msgField = document.chatForm.message;
		msgField.focus();
		msgField.selectionStart = msgField.selectionEnd = msgField.value.length;
	}
	
	function appendMyPaymentAddress(){
		appendText(myPaymentAddress);
	}
	
	function showRequestPaymentModal(){
		$rootScope.modalOpened = true;
		var self = this;
		var fc = profileService.focusedClient;
		var ModalInstanceCtrl = function($scope, $modalInstance) {
			var config = configService.getSync();
			var configWallet = config.wallet;
			var walletSettings = configWallet.settings;
			$scope.unitToBytes = walletSettings.unitToBytes;
			$scope.unitName = walletSettings.unitName;
			$scope.color = fc.backgroundColor;
			$scope.isCordova = isCordova;
			$scope.buttonLabel = 'Request payment';
			//$scope.selectedAsset = $scope.index.arrBalances[$scope.index.assetIndex];
			//console.log($scope.index.arrBalances.length+" assets, current: "+$scope.asset);

			Object.defineProperty($scope,
				"_customAmount", {
				get: function() {
					return $scope.customAmount;
				},
				set: function(newValue) {
					$scope.customAmount = newValue;
				},
				enumerable: true,
				configurable: true
			});

			$scope.submitForm = function(form) {
				var amount = form.amount.$modelValue;
				//var asset = form.asset.$modelValue;
				var asset = $scope.index.arrBalances[$scope.index.assetIndex].asset;
				if (!asset)
					throw Error("no asset");
				var amountInSmallestUnits = (asset === 'base') ? parseInt((amount * $scope.unitToBytes).toFixed(0)) : amount;
				var params = 'amount='+amountInSmallestUnits;
				if (asset !== 'base')
					params += '&asset='+encodeURIComponent(asset);
				var units = (asset === 'base') ? $scope.unitName : ('of '+asset);
				appendText('['+amount+' '+units+'](byteball:'+myPaymentAddress+'?'+params+')');
				$modalInstance.dismiss('cancel');
			};

			$scope.cancel = function() {
				$modalInstance.dismiss('cancel');
			};
		};

		var modalInstance = $modal.open({
			templateUrl: 'views/modals/customized-amount.html',
			windowClass: animationService.modalAnimated.slideUp,
			controller: ModalInstanceCtrl,
			scope: $scope
		});

		var disableCloseModal = $rootScope.$on('closeModal', function() {
			modalInstance.dismiss('cancel');
		});

		modalInstance.result.finally(function() {
			$rootScope.modalOpened = false;
			disableCloseModal();
			var m = angular.element(document.getElementsByClassName('reveal-modal'));
			m.addClass(animationService.modalAnimated.slideOutDown);
		});
	}

	function setOngoingProcess(name) {
		if (isCordova) {
			if (name) {
				window.plugins.spinnerDialog.hide();
				window.plugins.spinnerDialog.show(null, name + '...', true);
			} else {
				window.plugins.spinnerDialog.hide();
			}
		} else {
			$scope.onGoingProcess = name;
			$timeout(function() {
				$rootScope.$apply();
			});
		}
	};
	
}).directive('sendPayment', function($compile){
	console.log("sendPayment directive");
	return {
		replace: true,
		//scope: {address: '@'},
		//template: '<a ng-click="sendPayment(address)">{{address}}</a>',
		//template: '<a ng-click="console.log(789)">{{address}} 88</a>',
		link: function($scope, element, attrs){
			console.log("link called", attrs, element);
			//element.attr('ng-click', "console.log(777)");
			//element.removeAttr('send-payment');
			//$compile(element)($scope);
			//$compile(element.contents())($scope);
			//element.replaceWith($compile('<a ng-click="sendPayment(\''+attrs.address+'\')">'+attrs.address+'</a>')(scope));
			//element.append($compile('<a ng-click="console.log(123456)">'+attrs.address+' 99</a>')($scope));
			element.bind('click', function(){
				console.log('clicked', attrs);
				$scope.sendPayment(attrs.address);
			});
		}
	};
}).directive('dynamic', function ($compile) {
	return {
		restrict: 'A',
		replace: true,
		link: function (scope, ele, attrs) {
			scope.$watch(attrs.dynamic, function(html) {
				ele.html(html);
				$compile(ele.contents())(scope);
			});
		}
	};
}).directive('scrollBottom', function ($timeout) { // based on http://plnkr.co/edit/H6tFjw1590jHT28Uihcx?p=preview
	return {
		scope: {
			scrollBottom: "="
		},
		link: function (scope, element) {
			scope.$watchCollection('scrollBottom', function (newValue) {
				if (newValue)
					$timeout(function(){
						element[0].scrollTop = element[0].scrollHeight;
					}, 100);
			});
		}
	}
}).directive('bindToHeight', function ($window) {
	return {
		restrict: 'A',
		link: function (scope, elem, attrs) {
			var attributes = scope.$eval(attrs['bindToHeight']);
			var targetElem = angular.element(document.querySelector(attributes[1]));

			// Watch for changes
			scope.$watch(function () {
				return targetElem[0].clientHeight;
			},
			function (newValue, oldValue) {
				if (newValue != oldValue) {
					elem.css(attributes[0], newValue + 'px');
					elem[0].scrollTop = elem[0].scrollHeight;
				}
			});
		}
	};
}).directive('ngEnter', function() {
    return function(scope, element, attrs) {
        element.bind("keydown", function(e) {
            if(e.which === 13 && !e.shiftKey) {
                scope.$apply(function(){
                    scope.$eval(attrs.ngEnter, {'e': e});
                });
                e.preventDefault();
            }
        });
    };
});;
