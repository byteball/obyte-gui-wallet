'use strict';

var device = require('byteballcore/device.js');
var URI = require('byteballcore/uri.js');
var eventBus = require('byteballcore/event_bus.js');
var ValidationUtils = require('byteballcore/validation_utils.js');
var walletGeneral = require('byteballcore/wallet_general.js');

angular.module('copayApp.services').factory('correspondentListService', function($state, $rootScope, $sce, $compile, configService, storageService, profileService, go) {
	var root = {};
	
	function addIncomingMessageEvent(from_address, body, bAnotherCorrespondent){
		walletGeneral.readMyAddresses(function(arrMyAddresses){
			body = highlightActions(escapeHtml(body), arrMyAddresses);
			body = nl2br(body);
			console.log("body with markup: "+body);
			addMessageEvent(true, from_address, body, bAnotherCorrespondent);
		});
	}
	
	function addMessageEvent(bIncoming, peer_address, body, bAnotherCorrespondent){
		if (!root.messageEventsByCorrespondent[peer_address])
			root.messageEventsByCorrespondent[peer_address] = [];
		//root.messageEventsByCorrespondent[peer_address].push({bIncoming: true, message: $sce.trustAsHtml(body)});
		root.messageEventsByCorrespondent[peer_address].push({bIncoming: bIncoming, message: body});
		if (!$state.is('correspondentDevice'))
			go.path('correspondentDevice');
		else if (bAnotherCorrespondent)
			$state.reload();
		else
			$rootScope.$digest();
	}
	
	function highlightActions(text, arrMyAddresses){
		return text.replace(/\b[2-7A-Z]{32}\b(?!\?(amount|asset|device_address))/g, function(address){
			if (!ValidationUtils.isValidAddress(address))
				return address;
			if (arrMyAddresses.indexOf(address) >= 0)
				return address;
			//return '<a send-payment address="'+address+'">'+address+'</a>';
			return '<a ng-click="sendPayment(\''+address+'\')">'+address+'</a>';
			//return '<a send-payment ng-click="sendPayment(\''+address+'\')">'+address+'</a>';
			//return '<a send-payment ng-click="console.log(\''+address+'\')">'+address+'</a>';
			//return '<a onclick="console.log(\''+address+'\')">'+address+'</a>';
		}).replace(/\[.*?\]\(byteball:([0-9A-Z]{32})\?([\w=&;+%]+)\)/g, function(str, address, query_string){ // payment description within [] is ignored
			if (!ValidationUtils.isValidAddress(address))
				return str;
			if (arrMyAddresses.indexOf(address) >= 0)
				return str;
			var assocParams = URI.parseQueryString(query_string, '&amp;');
			// device address where to send private payload to.  Not used for now, will send to correspondent's device address
			var device_address = assocParams['device_address'] || ''; 
			var strAmount = assocParams['amount'];
			if (!strAmount)
				return str;
			var amount = parseInt(strAmount);
			if (amount + '' !== strAmount)
				return str;
			var asset = assocParams['asset'] || 'base';
			console.log("asset="+asset);
			if (asset !== 'base' && asset.length !== 44) // invalid asset
				return str;
			var amountStr = 'Payment request: ';
			if (asset === 'base'){
				var walletSettings = configService.getSync().wallet.settings;
				var unitToBytes = walletSettings.unitToBytes;
				var amountInUnits = amount / unitToBytes;
				var unitName = walletSettings.unitName;
				amountStr += amountInUnits+' '+unitName;
			}
			else
				amountStr += amount + ' of ' + asset;
			return '<a ng-click="sendPayment(\''+address+'\', '+amount+', \''+asset+'\', \''+device_address+'\')">'+amountStr+'</a>';
		}).replace(/\[(.+?)\]\(command:(.+?)\)/g, function(str, description, command){
			return '<a ng-click="sendCommand(\''+escapeQuotes(command)+'\', \''+escapeQuotes(description)+'\')">'+description+'</a>';
		});
	}
	
	function nl2br(text){
		return text.replace(/\r/g, '').replace(/\n/g, '<br>');
	}
	
	function escapeHtml(text){
		return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	}
	
	function escapeHtmlAndInsertBr(text){
		return nl2br(escapeHtml(text));
	}
	
	function escapeQuotes(text){
		return text.replace(/(['"])/g, "\\$1");
	}
	
	function setCurrentCorrespondent(correspondent_device_address, onDone){
		if (!root.currentCorrespondent || correspondent_device_address !== root.currentCorrespondent.device_address)
			device.readCorrespondent(correspondent_device_address, function(correspondent){
				root.currentCorrespondent = correspondent;
				onDone(true);
			});
		else
			onDone(false);
	}
	
	// amount is in smallest units
	function getAmountText(amount, asset){
		if (asset === 'base'){
			var walletSettings = configService.getSync().wallet.settings;
			var unitToBytes = walletSettings.unitToBytes;
			var unitName = walletSettings.unitName;
			amount /= unitToBytes;
			return amount + ' ' + unitName;
		}
		else
			return amount + ' of ' + asset;
	}
		
	console.log("correspondentListService");
	
	eventBus.on("text", function(from_address, body){
		setCurrentCorrespondent(from_address, function(bAnotherCorrespondent){
			addIncomingMessageEvent(from_address, body, bAnotherCorrespondent);
		});
	});
	
	eventBus.on("sent_payment", function(peer_address, amount, asset){
		setCurrentCorrespondent(peer_address, function(bAnotherCorrespondent){
			var body = '<a ng-click="showPayment(\''+asset+'\')" class="payment">Payment: '+getAmountText(amount, asset)+'</a>';
			addMessageEvent(false, peer_address, body, bAnotherCorrespondent);
		});
	});
	
	eventBus.on("received_payment", function(peer_address, amount, asset){
		setCurrentCorrespondent(peer_address, function(bAnotherCorrespondent){
			var body = '<a ng-click="showPayment(\''+asset+'\')" class="payment">Payment: '+getAmountText(amount, asset)+'</a>';
			addMessageEvent(true, peer_address, body, bAnotherCorrespondent);
		});
	});
	
	eventBus.on('paired', function(device_address){
		if ($state.is('correspondentDevices'))
			return $state.reload(); // refresh the list
		if (!$state.is('correspondentDevice'))
			return;
		if (!root.currentCorrespondent)
			return;
		if (device_address !== root.currentCorrespondent.device_address)
			return;
		// re-read the correspondent to possibly update its name
		device.readCorrespondent(device_address, function(correspondent){
			// do not assign a new object, just update its property (this object was already bound to a model)
			root.currentCorrespondent.name = correspondent.name;
			$rootScope.$digest();
		});
	});
	
	$rootScope.$on('Local/CorrespondentInvitation', function(event, device_pubkey, device_hub, pairing_secret){
		console.log('CorrespondentInvitation', device_pubkey, device_hub, pairing_secret);
		root.acceptInvitation(device_hub, device_pubkey, pairing_secret, function(){});
	});

	
	root.setCurrentCorrespondent = setCurrentCorrespondent;
	root.escapeHtmlAndInsertBr = escapeHtmlAndInsertBr;
	
	root.list = function(cb) {
	  device.readCorrespondents(function(arrCorrespondents){
		  cb(null, arrCorrespondents);
	  });
	};
	
	root.startWaitingForPairing = function(cb){
		device.startWaitingForPairing(function(pairingInfo){
			cb(pairingInfo);
		});
	};
	
	root.acceptInvitation = function(hub_host, device_pubkey, pairing_secret, cb){
		//return setTimeout(cb, 5000);
		if (device_pubkey === device.getMyDevicePubKey())
			return cb("cannot pair with myself");
		// the correspondent will be initially called 'New', we'll rename it as soon as we receive the reverse pairing secret back
		device.addUnconfirmedCorrespondent(device_pubkey, hub_host, 'New', function(device_address){
			device.startWaitingForPairing(function(reversePairingInfo){
				device.sendPairingMessage(hub_host, device_pubkey, pairing_secret, reversePairingInfo.pairing_secret, {
					ifOk: cb,
					ifError: cb
				});
			});
			// this continues in parallel
			// open chat window with the newly added correspondent
			device.readCorrespondent(device_address, function(correspondent){
				root.currentCorrespondent = correspondent;
				if (!$state.is('correspondentDevice'))
					go.path('correspondentDevice');
				else
					$state.reload();
			});
		});
	};
	
	root.currentCorrespondent = null;
	root.messageEventsByCorrespondent = {};

  /*
  root.remove = function(addr, cb) {
	var fc = profileService.focusedClient;
	root.list(function(err, ab) {
	  if (err) return cb(err);
	  if (!ab) return;
	  if (!ab[addr]) return cb('Entry does not exist');
	  delete ab[addr];
	  storageService.setCorrespondentList(fc.credentials.network, JSON.stringify(ab), function(err) {
		if (err) return cb('Error deleting entry');
		root.list(function(err, ab) {
		  return cb(err, ab);
		});
	  });
	}); 
  };

  root.removeAll = function() {
	var fc = profileService.focusedClient;
	storageService.removeCorrespondentList(fc.credentials.network, function(err) {
	  if (err) return cb('Error deleting correspondentList');
	  return cb();
	});
  };*/

	return root;
});
