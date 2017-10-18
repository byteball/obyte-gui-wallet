var BLACKBYTES_ASSET = require('byteballcore/constants').BLACKBYTES_ASSET;
var balances = require('byteballcore/balances');
var utils = require('../../angular-bitcore-wallet-client/bitcore-wallet-client/lib/common/utils');
var fileSystem = require('./fileStorage');
var completeClientLoaded = false;

window.onerror = function (message) {
	console.error(new Error('Error partialClient: ' + message));
	getFromId('splash').style.display = 'block';
	wallet.loadCompleteClient(true);
};

function initWallet() {
	var root = {};
	root.profile = null;
	root.focusedClient = null;
	root.walletClients = {};
	root.config = null;

	var decryptOnMobile = function(text, cb) {
		var json;
		try {
			json = JSON.parse(text);
		} catch (e) {
		}

		if (!json) return cb('Could not access storage');

		if (!json.iter || !json.ct) {
			return cb(null, text);
		}
		return cb(null, text);
	};

	function createObjProfile(profile) {
		profile = JSON.parse(profile);
		var Profile = {};
		Profile.version = '1.0.0';
		Profile.createdOn = profile.createdOn;
		Profile.credentials = profile.credentials;

		if (Profile.credentials[0] && typeof Profile.credentials[0] !== 'object')
			throw ("credentials should be an object");

		if (!profile.xPrivKey && !profile.xPrivKeyEncrypted)
			throw Error("no xPrivKey, even encrypted");
		if (!profile.tempDeviceKey)
			throw Error("no tempDeviceKey");
		Profile.xPrivKey = profile.xPrivKey;
		Profile.mnemonic = profile.mnemonic;
		Profile.xPrivKeyEncrypted = profile.xPrivKeyEncrypted;
		Profile.mnemonicEncrypted = profile.mnemonicEncrypted;
		Profile.tempDeviceKey = profile.tempDeviceKey;
		Profile.prevTempDeviceKey = profile.prevTempDeviceKey; // optional
		Profile.my_device_address = profile.my_device_address;
		return Profile;
	}

	function setWalletClients(credentials) {
		if (root.walletClients[credentials.walletId] && root.walletClients[credentials.walletId].started)
			return;

		var client = {credentials: credentials};

		client.credentials.xPrivKey = root.profile.xPrivKey;
		client.credentials.mnemonic = root.profile.mnemonic;
		client.credentials.xPrivKeyEncrypted = root.profile.xPrivKeyEncrypted;
		client.credentials.mnemonicEncrypted = root.profile.mnemonicEncrypted;

		root.walletClients[credentials.walletId] = client;
		root.walletClients[credentials.walletId].started = true;
	}

	function readStorage(cb) {
		fileSystem.get('agreeDisclaimer', function(err, agreeDisclaimer) {
			fileSystem.get('profile', function(err, profile) {
				fileSystem.get('focusedWalletId', function(err, focusedWalletId) {
					fileSystem.get('config', function(err, config) {
						window.config = config;
						cb(agreeDisclaimer, profile, focusedWalletId, config ? JSON.parse(config) : config);
					});
				});
			});
		});
	}

	function setWalletNameAndColor(walletName) {
		if(completeClientLoaded) return;
		var color = root.config.colorFor ? root.config.colorFor[root.focusedClient.credentials.walletId] : '#4A90E2';
		if(!color) color = '#4A90E2';
		getFromId('name1Color').style.color = color;
		getFromId('name1').innerHTML = walletName;
		getFromId('name2').innerHTML = walletName;
		getFromId('spinnerBg').style.backgroundColor = color;
		getFromId('amountBg').style.backgroundColor = color;
		var subStrName = getFromId('subStrName');
		subStrName.style.backgroundColor = color;
		subStrName.innerHTML = walletName.substr(0, 1);
		document.getElementsByClassName('page')[1].style.display = 'block';
	}

	function setBalancesAndPages(balances) {
		if(completeClientLoaded) return;
		var htmlBalances = '';
		var htmlPages = '';
		var slideNumber = 0;

		function addHtml(asset, amount, slideNumber) {
			var firstPage = slideNumber === 0;
			htmlBalances += '<li id="balance' + slideNumber + '" style="display: ' + ( firstPage ? 'inline-block' : 'none') + ';"><div><strong class="size-36">' + formatAmount(amount, asset) + '</strong></div></li>';
			htmlPages += '<span id="page' + slideNumber + '" ' + (firstPage ? 'class="active"' : '') + '>●</span>';
		}

		for (var asset in balances) {
			addHtml(asset, balances[asset].stable, slideNumber++);
		}
		getFromId('balances').innerHTML = htmlBalances;
		getFromId('pages').innerHTML = htmlPages;
	}

	function setWalletsInMenu() {
		if(completeClientLoaded) return;
		var selectedWalletId = root.focusedClient.credentials.walletId;
		var colors = root.config.colorFor;
		var html = '';

		for (var key in root.walletClients) {
			var credentials = root.walletClients[key].credentials;
			var walletId = credentials.walletId;

			html += '<li onclick="wallet.selectWallet(\'' + walletId + '\')" id="w' + walletId + '" class="nav-item ' + (walletId === selectedWalletId ? 'selected' : '') + '">' +
				'<a class="oh"><div class="avatar-wallet " style="background-color: ' + (colors && colors[walletId] ? colors[walletId] : '#4A90E2') + '">' + credentials.walletName.substr(0, 1) + ' </div>' +
				'<div class="name-wallet m8t">' + credentials.walletName + '</div></a></li>';
		}

		getFromId('walletList').innerHTML = html;
	}

	function loadCompleteClient(showClient) {
		self._bByteballCoreLoaded = false; //"fix" : Looks like you are loading multiple copies of byteball core, which is not supported. Running 'npm dedupe' might help.
		var body = document.body;
		var page = document.createElement('div');

		body.appendChild(page);
		var angularJs = document.createElement('script');
		angularJs.src = 'angular.js';
		angularJs.onload = function() {
			var byteballJS = document.createElement('script');
			byteballJS.src = 'byteball.js';
			body.appendChild(byteballJS);
			byteballJS.onload = function() {
				if(showClient) showCompleteClient();
			}
		};

		body.appendChild(angularJs);
	}

	function showCompleteClient() {
		getFromId('splash').style.display = 'none';
		swipeListener.close();
		var pages = document.getElementsByClassName('page');
		if (pages.length === 2) {
			document.getElementsByClassName('page')[1].remove();
			document.getElementsByClassName('page')[0].style.display = 'block';
			completeClientLoaded = true;
		}
	}

	function initFocusedWallet(cb) {
		setWalletNameAndColor(root.focusedClient.credentials.walletName);
		balances.readBalance(root.focusedClient.credentials.walletId, function(assocBalances) {
			if (!assocBalances[BLACKBYTES_ASSET])
				assocBalances[BLACKBYTES_ASSET] = {is_private: 1, stable: 0, pending: 0};
			balances.readSharedBalance(root.focusedClient.credentials.walletId, function(assocSharedBalances) {
				for (var asset in assocSharedBalances)
					if (!assocBalances[asset])
						assocBalances[asset] = {stable: 0, pending: 0};
				setBalancesAndPages(assocBalances);
				setSlider(assocBalances);
				cb();
			});
		})
	}

	function loadProfile() {
		readStorage(function(agreeDisclaimer, profile, focusedWalletId, config) {
			if (!agreeDisclaimer || !profile) {
				getFromId('splash').style.display = 'block';
				loadCompleteClient(true);
				return;
			}
			root.config = config;
			decryptOnMobile(profile, function(err, profile) {
				if(err){
					getFromId('splash').style.display = 'block';
					loadCompleteClient(true);
					return;
				}
				root.profile = createObjProfile(profile);
				//If password is set hide wallet display, show splash instead
				if(root.profile.xPrivKeyEncrypted)
				{
					getFromId('splash').style.display = 'block';
				}
				root.profile.credentials.forEach(function(credentials) {
					setWalletClients(credentials);
				});
				if (focusedWalletId)
					root.focusedClient = root.walletClients[focusedWalletId];
				else
					root.focusedClient = [];

				if (root.focusedClient.length === 0)
					root.focusedClient = root.walletClients[Object.keys(root.walletClients)[0]];
				initFocusedWallet(function() {
					console.log('partial client load end');
					setWalletsInMenu();
					loadCompleteClient();
				});
			});
		});
	}

	function selectWallet(walletId) {
		if(completeClientLoaded) return;
		var divFocusedClient = getFromId('w' + root.focusedClient.credentials.walletId);
		divFocusedClient.className = divFocusedClient.className.replace('selected').trim();
		getFromId('w' + walletId).className += 'selected';
		root.focusedClient = root.walletClients[walletId];
		fileSystem.set('focusedWalletId', walletId, function() {});
		initFocusedWallet(function() {});
		openOrCloseMenu();
	}
	
	function formatAmount(bytes, asset) {
		var setting = root.config.wallet.settings;
		var name = asset;
		var unitCode;
		if(asset === 'base'){
			name = setting.unitName;
			unitCode = setting.unitCode;
		}else if(asset === BLACKBYTES_ASSET){
			name = setting.bbUnitName;
			unitCode = setting.bbUnitCode;
		}else {
			unitCode = 'one';
		}
		return utils.formatAmount(bytes, unitCode) + ' ' + name;
	}

	root.showCompleteClient = showCompleteClient;
	root.loadProfile = loadProfile;
	root.selectWallet = selectWallet;
	root.loadCompleteClient = loadCompleteClient;
	root.clientCompleteLoaded = function(){return completeClientLoaded;};
	return root;
}

window.wallet = new initWallet();

document.addEventListener("deviceready", function() {
	wallet.loadProfile();
});

setTimeout(function () {
	var divTextDbLock = getFromId('textDbLock');
	if(divTextDbLock){
		divTextDbLock.style.display = 'inline-block';
	}
}, 15000);


//slider
function _slider(assocBalances) {
	var self = {};
	self.n = 0;
	self.numberOfSlides = Object.keys(assocBalances).length - 1;

	function setPage(prev, next) {
		if(completeClientLoaded) return;
		getFromId('balance' + prev).style.display = 'none';
		getFromId('balance' + next).style.display = 'block';
		getFromId('page' + prev).className = '';
		getFromId('page' + next).className = 'active';
	}

	self.next = function() {
		if (self.n < self.numberOfSlides) {
			setPage(self.n, ++self.n);
		}
	};

	self.prev = function() {
		if (self.n > 0) {
			setPage(self.n, --self.n);
		}
	};
	return self;
}

function setSlider(assocBalances) {
	window.slider = new _slider(assocBalances);
}

//menu
var menuAnimated = false;
window.openOrCloseMenu = function() {
	if(completeClientLoaded) return;
	if (menuAnimated) return;
	var menuDiv = document.getElementsByClassName('off-canvas-wrap')[1];
	if (menuDiv) {
		menuAnimated = true;
		if (menuDiv.className.indexOf('move-right') === -1) {
			menuDiv.className = menuDiv.className.trim() + ' move-right';
			setTimeout(function() {
				menuAnimated = false;
			}, 200);
		} else {
			menuDiv.className = menuDiv.className.replace('move-right', '').trim();
			setTimeout(function() {
				menuAnimated = false;
			}, 200);
		}
	}
};

window.menuIsOpen = function() {
	return document.getElementsByClassName('off-canvas-wrap')[1] && document.getElementsByClassName('off-canvas-wrap')[1].className.indexOf('move-right') !== -1;
};


//swipe
function _swipeListener() {
	document.addEventListener('touchstart', handleTouchStart, false);
	document.addEventListener('touchmove', handleTouchMove, false);
	
	var root = {};
	var xDown = null;
	var yDown = null;
	var focusOnAmountBg = false;

	function handleTouchStart(evt) {
		focusOnAmountBg = false;
		if(evt.path) {
			for (var i = 0, l = evt.path.length; i < l; i++) {
				if (evt.path[i].id === 'amountBg') {
					focusOnAmountBg = true;
					break;
				}
			}
		}
		xDown = evt.touches[0].clientX;
		yDown = evt.touches[0].clientY;
	}

	function handleTouchMove(evt) {
		if (!xDown || !yDown) return;

		var xUp = evt.touches[0].clientX;
		var yUp = evt.touches[0].clientY;

		var xDiff = xDown - xUp;
		var yDiff = yDown - yUp;

		if (Math.abs(xDiff) > Math.abs(yDiff)) {
			if (xDiff > 0) {
				listen('left');
			} else {
				listen('right');
			}
		}

		xDown = null;
		yDown = null;
		
	}
	function listen(direction) {
		if(direction === 'left'){
			if(focusOnAmountBg){
				slider.next();
			}else if(menuIsOpen()){
				openOrCloseMenu();
			}
		}else if(direction === 'right'){
			if(focusOnAmountBg){
				slider.prev();
			}else if(!menuIsOpen()){
				openOrCloseMenu();
			}
		}
	}
	root.close = function() {
		document.removeEventListener('touchstart', handleTouchStart, false);
		document.removeEventListener('touchmove', handleTouchMove, false);
	};
	
	return root;
}

var swipeListener = new _swipeListener();

//other
function getFromId(id) {
	return document.getElementById(id);
}