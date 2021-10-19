O<sub>byte</sub> is a wallet for storage and transfer of decentralized value.  See [obyte.org](https://obyte.org/).

## Binary Downloads

[Obyte.org](https://obyte.org/)


## Installation

1. Install [Node.js](https://nodejs.org/download/release/v16.10.0/), preferrably somewhat latest version. If you already have another version of Node.js installed, you can use [NVM](https://github.com/creationix/nvm) to keep both. Install [Yarn](https://classic.yarnpkg.com/lang/en/).
```bash
nvm install 16
nvm use 16
nvm install -g yarn
```

2. Then you need build tools to rebuild native modules for NW.js (secp256k1 atleast, and some more on Windows platforms). We use [nw-gyp](https://github.com/nwjs/nw-gyp#installation) for rebuilding modules, you can read the requirements for nw-gyp for your platform on it's page. Basically you need C++ build tools and Python2.7.

    * On **Ubuntu**-like platforms and other **Linux**:

    ```bash
    sudo apt install python g++
    ```

    * On **macOS** you need to install XCode and Command Line Tools, Python2.7 is already installed in your system. After installing XCode, run:

    ```bash
    xcode-select --install
    ```

    * On **Windows** you need to manually download and install:

      * [Python2.7](https://www.python.org/downloads/release/python-2718/)
      * C++ Build Tools 2015 (not later). To install Build Tools, you have two options:
        - Install [Microsoft Build Tools 2015](https://www.microsoft.com/en-us/download/details.aspx?id=48159)
        - Install [Visual Studio 2015](https://go.microsoft.com/fwlink/?LinkId=532606&clcid=0x409) and select Common Tools for Visual C++ during setup.
      * [Windows 8.1 SDK](https://go.microsoft.com/fwlink/p/?LinkId=323507)

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


## Build O<sub>byte</sub> App Bundles

You need NPM to be at least version 7, so run `npm -v` to check your currently installed version, and if it has lower version, update: `npm install -g npm@7`.
All app bundles will be placed at `../obytebuilds` dir. 


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
There is a script that handles the whole image creation process, the following procedure has been tested on Ubuntu 21.10.

Install tools:
`sudo apt install desktop-file-utils libglib2.0-bin`

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
