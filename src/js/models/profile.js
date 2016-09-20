'use strict';

/**
 * Profile
 *
 * credential: array of OBJECTS
 */
function Profile() {
	this.version = '1.0.0';
};

Profile.create = function(opts) {
	opts = opts || {};

	var x = new Profile();
	x.createdOn = Date.now();
	x.credentials = opts.credentials || [];
	if (!opts.xPrivKey && !opts.xPrivKeyEncrypted)
		throw Error("no xPrivKey, even encrypted");
	if (!opts.mnemonic && !opts.mnemonicEncrypted)
		throw Error("no mnemonic, even encrypted");
	if (!opts.tempDeviceKey)
		throw Error("no tempDeviceKey");
	x.xPrivKey = opts.xPrivKey;
	x.mnemonic = opts.mnemonic;
	x.xPrivKeyEncrypted = opts.xPrivKeyEncrypted;
	x.mnemonicEncrypted = opts.mnemonicEncrypted;
	x.tempDeviceKey = opts.tempDeviceKey;
	x.prevTempDeviceKey = opts.prevTempDeviceKey; // optional
	x.my_device_address = opts.my_device_address;
	return x;
};


Profile.fromObj = function(obj) {
	var x = new Profile();

	x.createdOn = obj.createdOn;
	x.credentials = obj.credentials;

	if (x.credentials[0] && typeof x.credentials[0] != 'object')
		throw ("credentials should be an object");

	if (!obj.xPrivKey && !obj.xPrivKeyEncrypted)
		throw Error("no xPrivKey, even encrypted");
//	if (!obj.mnemonic && !obj.mnemonicEncrypted)
//		throw Error("no mnemonic, even encrypted");
	if (!obj.tempDeviceKey)
		throw Error("no tempDeviceKey");
	x.xPrivKey = obj.xPrivKey;
	x.mnemonic = obj.mnemonic;
	x.xPrivKeyEncrypted = obj.xPrivKeyEncrypted;
	x.mnemonicEncrypted = obj.mnemonicEncrypted;
	x.tempDeviceKey = obj.tempDeviceKey;
	x.prevTempDeviceKey = obj.prevTempDeviceKey; // optional
	x.my_device_address = obj.my_device_address;
	
	return x;
};


Profile.fromString = function(str) {
	return Profile.fromObj(JSON.parse(str));
};

Profile.prototype.toObj = function() {
	return JSON.stringify(this);
};


