O<sub>byte</sub> is a wallet for storage and transfer of decentralized value.  See [obyte.org](https://obyte.org/).

## Binary Downloads

[Obyte.org](https://obyte.org/)


## Installation

Install [Node.js v16](https://nodejs.org/download/release/v16.10.0/). If you already have another version of Node.js installed, you can use [NVM](https://github.com/creationix/nvm) to keep both. Install [Yarn](https://classic.yarnpkg.com/lang/en/).
```
nvm install 16
nvm use 16
nvm install -g yarn
```

Clone the source:

```sh
git clone https://github.com/byteball/obyte-gui-wallet.git
cd obyte-gui-wallet
```

If you are building for testnet, switch to testnet branch:
```sh
git checkout testnet
```


Build O<sub>byte</sub>:

```sh
yarn
```

Run O<sub>byte</sub>:

```sh
yarn start
```


## Build O<sub>byte</sub> App Bundles

All app bundles will be placed at `../obytebuilds` dir, so create it first: `mkdir -p ../obytebuilds`.


### Android
- Install jdk1.8 (9 and higher won't work)
- Install Android SDK (install Android Studio and use its setup wizard to install latest SDK), then put `export ANDROID_HOME=~/Library/Android/sdk` inside your `~/.zshrc` or `~/.bash_profile`, then `yes | $ANDROID_HOME/tools/bin/sdkmanager --licenses`
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

- `yarn dist:mac`
- `yarn grunt dmg`

### Windows

- `yarn dist:win64` or `yarn dist:win86`
- `yarn grunt inno64`

### Linux

- `yarn dist:linux64` or `yarn dist:linux86`
- `yarn grunt linux64` or `yarn grunt linux32`


## O<sub>byte</sub> Backups and Recovery

O<sub>byte</sub> uses a single extended private key for all wallets, BIP44 is used for wallet address derivation.  There is a BIP39 mnemonic for backing up the wallet key, but it is not enough.  Private payments and co-signers of multisig wallets are stored only in the app's data directory, which you have to back up manually:

* macOS: `~/Library/Application Support/byteball`
* Linux: `~/.config/byteball`
* Windows: `%LOCALAPPDATA%\byteball`


## Create an AppImage

The application and the libraries it requires can be bundled into a one-file executable called AppImage. It should run on most Linux distribution without any additional package installation.
There is a script that handles the whole image creation process, the following procedure has been tested on Ubuntu 16.04.

Install tools:
`sudo apt-get install build-essential python desktop-file-utils libglib2.0-bin`

Clone the source:

```sh
git clone https://github.com/byteball/obyte-gui-wallet.git
cd obyte-gui-wallet
```

If you are building for testnet, switch to testnet branch:
```sh
git checkout testnet
```


Go to appimage directory and execute the script:

```sh
./appimage/appimage.sh
```

When completed, you will find the appimage in `../obytebuilds`

Obyte appimage can be launched from any directory, ensure to make it executable then launch it:

```
chmod a+x obyte-x86_64.AppImage
./obyte-x86_64.AppImage
```


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
