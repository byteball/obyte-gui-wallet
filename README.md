O<sub>byte</sub> is a wallet for storage and transfer of decentralized value.  See [obyte.org](https://obyte.org/).

## Binary Downloads

[Obyte.org](https://obyte.org/)


## Installation

1. Install [Node.js](https://nodejs.org/download/release/v16.10.0/), preferrably somewhat latest version. If you already have another version of Node.js installed, you can use [NVM](https://github.com/creationix/nvm) to keep both. Install [Yarn](https://classic.yarnpkg.com/lang/en/).
```bash
nvm install 16
nvm use 16
npm install -g yarn
```

2. Then you need build tools to rebuild native modules for Electron (secp256k1 atleast, and some more on Windows platforms). We use [nw-gyp](https://github.com/nwjs/nw-gyp#installation) for rebuilding modules, you can read the requirements for nw-gyp for your platform on it's page. Basically you need C++ build tools and Python2.7.

    * On **Ubuntu**-like platforms and other **Linux**:

    ```bash
    sudo apt install python g++ make
    ```

    * On **macOS** you need to install XCode and Command Line Tools, Python2.7 is already installed in your system. After installing XCode, run:

    ```bash
    xcode-select --install
    ```

    * On **Windows** you need C++ Build Tools 2015 or 2017 (not later) and Python2.7, everything can be installed via one command:

      * Run cmd.exe with Administrator privileges and run: `yarn global add windows-build-tools`. This will take some time, be patient.

3. Now clone the source:
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

## Web Inspector

To open Chrome Dev Tools (web inspector) inside your currently running Obyte application, press Control-I (Command-I for Macs).

## Build O<sub>byte</sub> App Bundles

You need NPM to be at least version 7, so run `npm -v` to check your currently installed version, and if it has lower version, update: `yarn global add npm@7`.
All app bundles will be placed at `../obytebuilds` dir. 


### Android
- Install jdk1.8 (9 and higher won't work)
- Install Android SDK (install Android Studio and use its setup wizard to install latest SDK), then put `export ANDROID_HOME=~/Library/Android/sdk` inside your `~/.zshrc` or `~/.bash_profile`, then `yes | $ANDROID_HOME/tools/bin/sdkmanager --licenses`
- Install Cordova `yarn global add cordova`
- Install [Gradle](https://gradle.org/install/) (macOS: `brew install gradle`)
- Run `make android-debug`

### iOS

- Install Xcode
- Install Cordova `yarn global add cordova`
- Install ios-deploy `yarn global add ios-deploy`
- Install [CocoaPods](https://cocoapods.org) `brew install cocoapods`, then `pod setup`
- Run `make ios-debug`
  * In case of `DeviceSupport` missing error, run `cd /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform/DeviceSupport/ && sudo ln -s 10.3.1\ \(14E8301\)/ 10.3`
  * If you encounter 'bitcore' not found after app launch, install it `yarn add bitcore-lib`, then rerun make again.
  * On code signing error, open Xcode project `../obytebuilds/project-IOS/platforms/ios` in Xcode, open project properties, select Obyte target and set your AppleID account as a team. Xcode may also ask you to change bundle identifier to be unique, just append any random string to 'org.byteball.wallet' bundle identifier.
  * *Never open Xcode project using .xcodeproj file*, just open the directory `../obytebuilds/project-IOS/platforms/ios` in Xcode instead

### macOS

- `yarn dist:macarm64` or `yarn dist:macx64`

### Windows

- `yarn dist:winx64`

### Linux

- `yarn dist:linuxx64` or `yarn dist:linuxarm64`


## O<sub>byte</sub> Backups and Recovery

O<sub>byte</sub> uses a single extended private key for all wallets, BIP44 is used for wallet address derivation.  There is a BIP39 mnemonic for backing up the wallet key, but it is not enough.  Private payments and co-signers of multisig wallets are stored only in the app's data directory, which you have to back up manually:

* macOS: `~/Library/Application Support/obyte-gui-wallet`
* Linux: `~/.config/obyte-gui-wallet`
* Windows: `%APPDATA%\obyte-gui-wallet`


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
