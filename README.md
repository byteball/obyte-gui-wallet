O<sub>byte</sub> is a wallet for storage and transfer of decentralized value.  See [obyte.org](https://obyte.org/).

## Binary Downloads

[Obyte.org](https://obyte.org/)

## Main Features

TBD

## Installation

Download and install [NW.js v0.14.7 LTS](https://dl.nwjs.io/v0.14.7) and [Node.js v5.12.0](https://nodejs.org/download/release/v5.12.0/).  These versions are recommended for easiest install but newer versions will work too.  If you already have another version of Node.js installed, you can use [NVM](https://github.com/creationix/nvm) to keep both.

Clone the source:

```sh
git clone https://github.com/byteball/obyte-gui-wallet.git
cd obyte-gui-wallet
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

Build O<sub>byte</sub>:

```sh
bower install
npm install # on macOS: env CXXFLAGS="-mmacosx-version-min=10.9" LDFLAGS="-mmacosx-version-min=10.9" npm install
grunt
```
If you are on Windows or using NW.js and Node.js versions other than recommended, see [NW.js instructions about building native modules](http://docs.nwjs.io/en/latest/For%20Users/Advanced/Use%20Native%20Node%20Modules/).

After first run, you'll likely encounter runtime error complaining about node_sqlite3.node not being found, copy the file from the neighboring directory to where the program tries to find it, and run again (e.g. from `obyte-gui-wallet/node_modules/sqlite3/lib/binding/node-v47-darwin-x64` to `obyte-gui-wallet/node_modules/sqlite3/lib/binding/node-webkit-v0.14.7-darwin-x64`). If that didn't work, copy node_sqlite3.node from node_modules folder, which is got installed with installer file from obyte.org website.

Then run O<sub>byte</sub> desktop client:

```sh
/path/to/your/nwjs/nwjs .
```

If you have run `grunt desktop` then there is 0.14.7 NW.js also installed in cache folder.

## Build O<sub>byte</sub> App Bundles

All app bundles will be placed at `../obytebuilds` dir, so create it first: `mkdir -p ../obytebuilds`. You need newer version of Node.js (latest should work) to assemble Android & iOS bundles, so use NVM to manage your Node.js installations (to keep v5.12 for NW.js and latest one for mobile platforms). Remember to switch to newer Node.js version (`nvm use 8`) before installing any software from the instructions below.


### Android
- Install jdk1.8 (9 and higher won't work)
- Install Android SDK (from Android Studio)
- Install Cordova `npm install cordova -g`
- Install [Gradle](https://gradle.org/install/) (macOS: `brew install gradle`)
- Run `make android-debug`

### iOS

- Install Xcode
- Install Cordova `npm install cordova -g`
- Install ios-deploy `npm install -g ios-deploy`
- Install [CocoaPods](https://cocoapods.org) `brew install cocoapods`, then `pod setup`
- Run `make ios-debug`
  * In case of `DeviceSupport` missing error, run `cd /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform/DeviceSupport/ && sudo ln -s 10.3.1\ \(14E8301\)/ 10.3`
  * If you encounter 'bitcore' not found after app launch, install it `npm install bitcore-lib`, then rerun make again.
  * On code signing error, open Xcode project `../obytebuilds/project-IOS/platforms/ios` in Xcode, open project properties, select Obyte target and set your AppleID account as a team. Xcode may also ask you to change bundle identifier to be unique, just append any random string to 'org.byteball.wallet' bundle identifier.
  * *Never open Xcode project using .xcodeproj file*, just open the directory `../obytebuilds/project-IOS/platforms/ios` in Xcode instead

### macOS

- `grunt desktop`
- copy `node_modules` into the app bundle ../obytebuilds/Obyte/osx64/Obyte.app/Contents/Resources/app.nw, except those that are important only for development (karma, grunt, jasmine)
- `grunt dmg`

### Windows

- `grunt desktop`
- copy `node_modules` into the app bundle ../obytebuilds/Obyte/win64, except those that are important only for development (karma, grunt, jasmine)
- `grunt inno64`

### Linux

- `grunt desktop`
- copy `node_modules` into the app bundle ../obytebuilds/Obyte/linux64, except those that are important only for development (karma, grunt, jasmine)
- `grunt linux64`


## About O<sub>byte</sub>

TBD

## O<sub>byte</sub> Backups and Recovery

O<sub>byte</sub> uses a single extended private key for all wallets, BIP44 is used for wallet address derivation.  There is a BIP39 mnemonic for backing up the wallet key, but it is not enough.  Private payments and co-signers of multisig wallets are stored only in the app's data directory, which you have to back up manually:

* macOS: `~/Library/Application Support/byteball`
* Linux: `~/.config/byteball`
* Windows: `%LOCALAPPDATA%\byteball`


## Translations

O<sub>byte</sub> uses standard gettext PO files for translations and [Crowdin](https://crowdin.com/project/byteball) as the front-end tool for translators. To join our team of translators, please create an account at [Crowdin](https://crowdin.com) and translate the O<sub>byte</sub> documentation and application text into your native language.

To download and build using the latest translations from Crowdin, please use the following commands:

```sh
cd i18n
node crowdin_download.js
```

This will download all partial and complete language translations while also cleaning out any untranslated ones.


## Support

* [GitHub Issues](https://github.com/byteball/obyte-gui-wallet/issues)
  * Open an issue if you are having problems with this project
* [Email Support](mailto:byteball@byteball.org)

## Credits

The GUI is based on [Copay](https://github.com/bitpay/copay), the most beautiful and easy to use Bitcoin wallet.

## License

MIT.
