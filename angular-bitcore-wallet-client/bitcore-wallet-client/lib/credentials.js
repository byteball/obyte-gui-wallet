'use strict';

var crypto = require('crypto');
var $ = require('preconditions').singleton();
var _ = require('lodash');

var Bitcore = require('bitcore-lib');
var Mnemonic = require('bitcore-mnemonic');
var sjcl = require('sjcl');

var Common = require('./common');
var Constants = Common.Constants;

var FIELDS = [
  'walletId',
  'network',
  'xPrivKey',
  'xPrivKeyEncrypted',
  'xPubKey',
  'publicKeyRing',
  'walletName',
  'm',
  'n',
  'externalSource',
  'mnemonic',
  'mnemonicEncrypted',
  'entropySource',
  'mnemonicHasPassphrase',
  'derivationStrategy',
  'account',
];

function Credentials() {
  this.version = '1.0.0';
  this.derivationStrategy = Constants.DERIVATION_STRATEGIES.BIP44;
  this.account = 0;
};

function _checkNetwork(network) {
  if (!_.includes(['livenet', 'testnet'], network)) throw new Error('Invalid network');
};

Credentials.create = function(network, account) {
  _checkNetwork(network);

  var x = new Credentials();

  x.network = network;
  x.account = account;
  x.xPrivKey = (new Bitcore.HDPrivateKey(network)).toString();
  x._expand();
  return x;
};

var wordsForLang = {
  'en': Mnemonic.Words.ENGLISH,
  'es': Mnemonic.Words.SPANISH,
  'ja': Mnemonic.Words.JAPANESE,
  'zh': Mnemonic.Words.CHINESE,
  'fr': Mnemonic.Words.FRENCH,
};

Credentials.createWithMnemonic = function(network, passphrase, language, account) {
    _checkNetwork(network);
    if (!wordsForLang[language])
        throw new Error('Unsupported language');
    $.shouldBeNumber(account);

    var m = new Mnemonic(wordsForLang[language]);
    while (!Mnemonic.isValid(m.toString())) {
		console.log('--- retrying mnemonic generation');
        m = new Mnemonic(wordsForLang[language])
    };
    var x = new Credentials();

    x.network = network;
    x.account = account;
    x.xPrivKey = m.toHDPrivateKey(passphrase, network).toString();
    x._expand();
    x.mnemonic = m.phrase;
    x.mnemonicHasPassphrase = !!passphrase;

    console.log("credentials: createWithMnemonic " + network + ', ' + passphrase + ',' + language + ',' + account);

    return x;
};

Credentials.fromExtendedPrivateKey = function(xPrivKey, account) {
  var x = new Credentials();
  x.xPrivKey = xPrivKey;
  x.account = account || 0;
  x._expand();
  return x;
};

// note that mnemonic / passphrase is NOT stored. Now stored
Credentials.fromMnemonic = function(network, words, passphrase, account, derivationStrategy) {
  _checkNetwork(network);
  $.shouldBeNumber(account);
  $.checkArgument(_.includes(_.values(Constants.DERIVATION_STRATEGIES), derivationStrategy));

  var m = new Mnemonic(words);
  var x = new Credentials();
  x.xPrivKey = m.toHDPrivateKey(passphrase, network).toString();
  x.mnemonic = words; // store the mnemonic
  x.mnemonicHasPassphrase = !!passphrase;
  x.account = account;
  x.derivationStrategy = derivationStrategy;
  x._expand();
  return x;
};

/* 
 * BWC uses
 * xPrivKey -> m/44'/network'/account' -> Base Address Key
 * so, xPubKey is PublicKeyHD(xPrivKey.derive("m/44'/network'/account'").
 *
 * For external sources, this derivation should be done before
 * call fromExtendedPublicKey
 *
 * entropySource should be a HEX string containing pseudo-random data, that can
 * be deterministically derived from the xPrivKey, and should not be derived from xPubKey
 */
Credentials.fromExtendedPublicKey = function(xPubKey, source, entropySourceHex, account, derivationStrategy) {
  $.checkArgument(entropySourceHex);
  $.shouldBeNumber(account);
  $.checkArgument(_.includes(_.values(Constants.DERIVATION_STRATEGIES), derivationStrategy));

  var entropyBuffer = new Buffer(entropySourceHex, 'hex');
  //require at least 112 bits of entropy
  $.checkArgument(entropyBuffer.length >= 14, 'At least 112 bits of entropy are needed')

  var x = new Credentials();
  x.xPubKey = xPubKey;
  x.entropySource = Bitcore.crypto.Hash.sha256sha256(entropyBuffer).toString('hex');
  x.account = account;
  x.derivationStrategy = derivationStrategy;
  x.externalSource = source;
  x._expand();
  return x;
};

// Get network from extended private key or extended public key
Credentials._getNetworkFromExtendedKey = function(xKey) {
  $.checkArgument(xKey && _.isString(xKey));
  return xKey.charAt(0) == 't' ? 'testnet' : 'livenet';
};


Credentials.prototype._hashFromEntropy = function(prefix, length) {
  $.checkState(prefix);
  var b = new Buffer(this.entropySource, 'hex');
  var b2 = Bitcore.crypto.Hash.sha256hmac(b, new Buffer(prefix));
  return b2.slice(0, length);
};


Credentials.prototype._expand = function() {
  $.checkState(this.xPrivKey || (this.xPubKey && this.entropySource));

  var network = Credentials._getNetworkFromExtendedKey(this.xPrivKey || this.xPubKey);
  if (this.network) {
    $.checkState(this.network == network);
  } else {
    this.network = network;
  }

  if (this.xPrivKey) {
	console.log('_expand path: '+this.getBaseAddressDerivationPath());
    var xPrivKey = new Bitcore.HDPrivateKey.fromString(this.xPrivKey);

    // this extra derivation is not to share a non hardened xPubKey to the server.
    var addressDerivation = xPrivKey.derive(this.getBaseAddressDerivationPath());
    this.xPubKey = (new Bitcore.HDPublicKey(addressDerivation)).toString();
	console.log('_expand xPubKey: '+this.xPubKey);
  } else {
  }



  this.publicKeyRing = [{
    xPubKey: this.xPubKey,
  }];
};

Credentials.fromObj = function(obj) {
  var x = new Credentials();

  _.each(FIELDS, function(k) {
    x[k] = obj[k];
  });

  x.derivationStrategy = x.derivationStrategy || Constants.DERIVATION_STRATEGIES.BIP44;
  x.account = x.account || 0;

  $.checkState(x.xPrivKey || x.xPubKey || x.xPrivKeyEncrypted, "invalid input");
  return x;
};

Credentials.prototype.toObj = function() {
  var self = this;

  if (self.hasPrivKeyEncrypted())
    self.lock();

  var x = {};
  _.each(FIELDS, function(k) {
    if (k !== 'xPrivKey' && k !== 'mnemonic' && k !== 'xPrivKeyEncrypted' && k !== 'mnemonicEncrypted')
        x[k] = self[k];
  });
  return x;
};

Credentials.prototype.getBaseAddressDerivationPath = function() {
  var purpose;
  switch (this.derivationStrategy) {
    case Constants.DERIVATION_STRATEGIES.BIP44:
      purpose = '44';
      break;
    case Constants.DERIVATION_STRATEGIES.BIP48:
      purpose = '48';
      break;
  }

  var coin = (this.network == 'livenet' ? "0" : "1");
  return "m/" + purpose + "'/" + coin + "'/" + this.account + "'";
};

Credentials.prototype.getDerivedXPrivKey = function() {
  var path = this.getBaseAddressDerivationPath();
  return new Bitcore.HDPrivateKey(this.xPrivKey, this.network).derive(path);
};


Credentials.prototype.addWalletInfo = function(walletName, m, n) {
  //this.walletId = crypto.createHash("sha256").update(this.xPubKey, "utf8").digest("base64");
  this.walletName = walletName;
  this.m = m;
  this.n = n;


  // Use m/48' for multisig hardware wallets
  if (!this.xPrivKey && this.externalSource && n > 1) {
    this.derivationStrategy = Constants.DERIVATION_STRATEGIES.BIP48;
  }

  if (n == 1) {
    this.addPublicKeyRing([{
      xPubKey: this.xPubKey
    }]);
  }
};

Credentials.prototype.hasWalletInfo = function() {
  return !!this.n;
};

Credentials.prototype.isPrivKeyEncrypted = function() {
  return (!!this.xPrivKeyEncrypted) && !this.xPrivKey;
};

Credentials.prototype.hasPrivKeyEncrypted = function() {
  return (!!this.xPrivKeyEncrypted);
};

Credentials.prototype.setPrivateKeyEncryption = function(password, opts) {
  if (this.xPrivKeyEncrypted)
    throw new Error('Encrypted Privkey Already exists');

  if (!this.xPrivKey)
    throw new Error('No private key to encrypt');


  this.xPrivKeyEncrypted = sjcl.encrypt(password, this.xPrivKey, opts);
  if (!this.xPrivKeyEncrypted)
    throw new Error('Could not encrypt');

  if (this.mnemonic)
    this.mnemonicEncrypted = sjcl.encrypt(password, this.mnemonic, opts);
};


Credentials.prototype.disablePrivateKeyEncryption = function() {
  if (!this.xPrivKeyEncrypted)
    throw new Error('Private Key is not encrypted');

  if (!this.xPrivKey)
    throw new Error('Wallet is locked, cannot disable encryption');

  this.xPrivKeyEncrypted = null;
  this.mnemonicEncrypted = null;
};


Credentials.prototype.lock = function() {
  if (!this.xPrivKeyEncrypted)
    throw new Error('Could not lock, no encrypted private key');

  delete this.xPrivKey;
  delete this.mnemonic;
};

Credentials.prototype.unlock = function(password) {
  $.checkArgument(password);

  if (this.xPrivKeyEncrypted) {
    this.xPrivKey = sjcl.decrypt(password, this.xPrivKeyEncrypted);
    if (this.mnemonicEncrypted) {
      this.mnemonic = sjcl.decrypt(password, this.mnemonicEncrypted);
    }
  }
};

Credentials.prototype.addPublicKeyRing = function(publicKeyRing) {
  this.publicKeyRing = _.clone(publicKeyRing);
};

Credentials.prototype.canSign = function() {
  return (!!this.xPrivKey || !!this.xPrivKeyEncrypted);
};

Credentials.prototype.setNoSign = function() {
  delete this.xPrivKey;
  delete this.xPrivKeyEncrypted;
  delete this.mnemonic;
  delete this.mnemonicEncrypted;
};

Credentials.prototype.isComplete = function() {
  if (!this.m || !this.n) return false;
  if (!this.publicKeyRing || this.publicKeyRing.length != this.n) return false;
  return true;
};

Credentials.prototype.hasExternalSource = function() {
  return (typeof this.externalSource == "string");
};

Credentials.prototype.getExternalSourceName = function() {
  return this.externalSource;
};

Credentials.prototype.getMnemonic = function() {
  if (this.mnemonicEncrypted && !this.mnemonic) {
    throw new Error('Credentials are encrypted');
  }

  return this.mnemonic;
};


Credentials.prototype.clearMnemonic = function() {
  delete this.mnemonic;
  delete this.mnemonicEncrypted;
};


module.exports = Credentials;
