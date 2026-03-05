'use strict';

var BLOCKED_MODULES = [
	'child_process', 'cluster', 'worker_threads', 'vm', 'dgram'
];

var ALLOWED_MODULES = [
	'fs', 'path', 'crypto', 'os', 'events', 'stream', 'async',
	'electron',
	'bitcore-mnemonic', 'bitcore-lib', 'secp256k1', 'lodash',
	'jszip', 'zip', 'unzipper', 'sqlite3', 'level-rocksdb',
	'ocore/aa_addresses.js',
	'ocore/aa_composer.js',
	'ocore/aa_validation.js',
	'ocore/arbiter_contract.js',
	'ocore/arbiters.js',
	'ocore/arbiters',
	'ocore/balances',
	'ocore/bots.js',
	'ocore/breadcrumbs.js',
	'ocore/chat_storage.js',
	'ocore/composer.js',
	'ocore/conf.js',
	'ocore/conf',
	'ocore/constants.js',
	'ocore/constants',
	'ocore/data_feeds.js',
	'ocore/db.js',
	'ocore/db',
	'ocore/desktop_app.js',
	'ocore/desktop_app',
	'ocore/device.js',
	'ocore/device',
	'ocore/event_bus.js',
	'ocore/formula/parse_ojson',
	'ocore/indivisible_asset',
	'ocore/kvstore',
	'ocore/light_wallet.js',
	'ocore/mutex.js',
	'ocore/my_witnesses.js',
	'ocore/my_witnesses',
	'ocore/network.js',
	'ocore/network',
	'ocore/node_modules/secp256k1',
	'ocore/object_hash.js',
	'ocore/object_length.js',
	'ocore/private_profile.js',
	'ocore/prosaic_contract.js',
	'ocore/signature.js',
	'ocore/storage.js',
	'ocore/string_utils.js',
	'ocore/uri.js',
	'ocore/validation_utils.js',
	'ocore/validation.js',
	'ocore/wallet_defined_by_addresses.js',
	'ocore/wallet_defined_by_addresses',
	'ocore/wallet_defined_by_keys.js',
	'ocore/wallet_defined_by_keys',
	'ocore/wallet_general.js',
	'ocore/wallet_general',
	'ocore/wallet.js',
	'./fileStorage',
	'./fileStorage.js',
	'../../angular-bitcore-wallet-client/bitcore-wallet-client/lib/common/utils',
	'../package.json',
];

var allowedSet = {};
for (var i = 0; i < ALLOWED_MODULES.length; i++) {
	allowedSet[ALLOWED_MODULES[i]] = true;
}
var blockedSet = {};
for (var i = 0; i < BLOCKED_MODULES.length; i++) {
	blockedSet[BLOCKED_MODULES[i]] = true;
}

var ALLOWED_DYNAMIC_PATTERNS = [/conf\.json$/];

function safeRequire(moduleName) {
	var clean = moduleName.replace(/['+\s]/g, '');
	if (blockedSet[clean]) {
		console.error('[safeRequire] BLOCKED:', moduleName);
		return {};
	}
	if (allowedSet[moduleName] || allowedSet[clean])
		return require(moduleName);
	for (var i = 0; i < ALLOWED_DYNAMIC_PATTERNS.length; i++) {
		if (ALLOWED_DYNAMIC_PATTERNS[i].test(clean))
			return require(moduleName);
	}
	console.error('[safeRequire] Not whitelisted:', moduleName);
	return {};
}

try {
	if (module.id && module.id.indexOf('safeRequire') !== -1) {
		module.exports = safeRequire;
	}
} catch(e) {}
