Byteball is a wallet for storage and transfer of decentralized value.  See [byteball.org](https://byteball.org/).

## Binary Downloads

[Byteball.org](https://byteball.org/)

## Main Features

TBD

## Installation

Clone the source:

```sh
git clone https://github.com/byteball/byteball.git
cd byteball
```

If you are building for testnet, switch to testnet branch:
```sh
git checkout testnet
```

Install [bower](http://bower.io/) and [grunt](http://gruntjs.com/getting-started) if you haven't already:

```sh
npm install -g bower
npm install -g grunt-cli
```

Download and install [NW.js](http://nwjs.io/downloads/).  Version 0.14.7 is recommended.

Build Byteball:

```sh
bower install
npm install
grunt
```

Then run Byteball desktop client:

```sh
/path/to/your/nwjs/nwjs .
```
If the client complains about node_sqlite3.node not being found, copy the file from the neighboring directory to where the program tries to find it, and run again.

## Build Byteball App Bundles

### Android

- Install Android SDK
- Run `make android-debug`

### iOS

- Install Xcode 7 (or newer)
- Run `make ios-debug`

### macOS

- `grunt desktop`
- copy `node_modules` into the app bundle ../byteballbuilds/Byteball/osx64/Byteball.app/Contents/Resources/app.nw, except those that are important only for development (karma, grunt, jasmine)
- `grunt dmg`

### Windows

- `grunt desktop`
- copy `node_modules` into the app bundle ../byteballbuilds/Byteball/win64, except those that are important only for development (karma, grunt, jasmine)
- `grunt inno64`

### Linux

- `grunt desktop`
- copy `node_modules` into the app bundle ../byteballbuilds/Byteball/linux64, except those that are important only for development (karma, grunt, jasmine)
- `grunt linux64`


## About Byteball

TBD

## Byteball Backups and Recovery

Byteball uses a single extended private key for all wallets, BIP44 is used for wallet address derivation.  There is a BIP39 mnemonic for backing up the wallet key, but it is not enough.  Private payments and co-signers of multisig wallets are stored only in the app's data directory, which you have to back up manually:

* macOS: `~/Library/Application Support/byteball`
* Linux: `~/.config/byteball`
* Windows: `%LOCALAPPDATA%\byteball`





## Support

* [GitHub Issues](https://github.com/byteball/byteball/issues)
  * Open an issue if you are having problems with this project
* [Email Support](mailto:byteball@byteball.org)

## Credits

The GUI is based on [Copay](https://github.com/bitpay/copay), the most beautiful and easy to use Bitcoin wallet.

## License

MIT.
