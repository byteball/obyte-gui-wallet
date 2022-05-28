const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const package = require('./package.json');
const sqlite3 = require('sqlite3').verbose();
const level = require('level-rocksdb');
const fs = require('fs');
const Badge = require('electron-windows-badge');

if (process.platform === 'win32') { // fix for Electron not working when UTF-8 symbols in path
	app.commandLine.appendSwitch('no-sandbox')
	app.commandLine.appendSwitch('disable-gpu')
	app.commandLine.appendSwitch('disable-software-rasterizer')
	app.commandLine.appendSwitch('disable-gpu-compositing')
	app.commandLine.appendSwitch('disable-gpu-rasterization')
	app.commandLine.appendSwitch('disable-gpu-sandbox')
	app.commandLine.appendSwitch('--no-sandbox')
	app.disableHardwareAcceleration();
}

// rename byteball to obyte 
const isTestnet = package.name.includes('-tn');
const oldUserDir = (process.platform == 'win32' ? process.env.LOCALAPPDATA : app.getPath('appData')) + '/byteball' + (isTestnet ? '-tn' : '');
const oldLocalStorageRelativeDir = process.platform === 'win32' ? 'User Data/Default/Local Storage' : 'Default/Local Storage';
const extensionId = isTestnet ? 'fhbdbceecnjfepdnmkgncdnkleeblcpf' : 'ppgbkonninhcodjcnbpghnagfadnfjck';
const files = ['conf.json', 'rocksdb', oldLocalStorageRelativeDir,
	'byteball-light.sqlite', 'byteball-light.sqlite-shm', 'byteball-light.sqlite-wal',
	'byteball.sqlite', 'byteball.sqlite-shm', 'byteball.sqlite-wal'];
const renamedFlagFile = `${app.getPath('userData')}/.renamed`;

if (!fs.existsSync(renamedFlagFile)) {
	if (fs.existsSync(oldUserDir)) {
		console.log(`moving files from ${oldUserDir} to ${app.getPath('userData')}`);
		if (!fs.existsSync(`${app.getPath('userData')}/Default`)){
			fs.mkdirSync(`${app.getPath('userData')}/Default`);
		}
		if (process.platform === 'win32' && !fs.existsSync(`${app.getPath('userData')}/User Data/Default`)){
			fs.mkdirSync(`${app.getPath('userData')}/User Data/Default`, { recursive: true });
		}
		for (const file of files) {
			try {
				console.log(`moving ${file}`);
				fs.renameSync(`${oldUserDir}/${file}`, `${app.getPath('userData')}/${file}`);
				console.log(`OK`);
			} catch(e) {
				console.log(`failed to move ${file}`, e);
			}
		}
	}
	fs.writeFileSync(renamedFlagFile, "true");
	fs.rmSync(oldUserDir, { recursive: true, force: true });
}
// UPGRADE old NW.js localStorage to new rocksdb storage
let upgradeKeys = {};
const lsUpgradedFlagFile = `${app.getPath('userData')}/.upgraded`;
const oldLSDir = `${app.getPath('userData')}/${oldLocalStorageRelativeDir}`;
const lsSqliteFile = `${oldLSDir}/chrome-extension_${extensionId}_0.localstorage`;
const lsLevelDBDir = `${oldLSDir}/leveldb`;
const walletDataDir = `walletdata`;
let walletDataPath = `${app.getPath('userData')}/${walletDataDir}`;
let lsUpgrader1, lsUpgrader2;
if (!fs.existsSync(lsUpgradedFlagFile)) {
	lsUpgrader1 = new Promise((resolve, reject) => {
		const db = new sqlite3.Database(lsSqliteFile, sqlite3.OPEN_READONLY, (err) => {
			if (err) {
				console.log(`failed to open sqlite db ${lsSqliteFile}`, err);
				return resolve();
			}
			console.log(`Upgrading Local Storage from SQLite database...`);
			db.all(`SELECT key, value FROM ItemTable WHERE key IN ('profile', 'config', 'agreeDisclaimer', 'focusedWalletId', 'addressbook-livenet', 'addressbook-testnet')`, [], (err, rows) => {
				if (err)
					return resolve();
				for (const row of rows) {
					handleRow(row.key, new TextDecoder('utf-16').decode(row.value));
				}
				resolve();
			});
		});
	});
	lsUpgrader2 = new Promise((resolve, reject) => {
		const leveldb = level(lsLevelDBDir, { createIfMissing: false }, function (err, db) {
			if (err) {
				console.log(`failed to open leveldb ${lsLevelDBDir}`, err);
				return resolve();
			}
			console.log(`Upgrading Local Storage from LevelDB database...`);
			leveldb.createReadStream().on('data', function (data) {
				const key = data.key.replace('_chrome-extension://' + extensionId + '\0\1', '');
				handleRow(key, data.value.substring(1))
			}).on('end', function () {
				resolve();
			});
		});
	});
}
function handleRow(key, value) {
	switch (key) {
		case "config":
		case "agreeDisclaimer":
		case "profile":
		case "focusedWalletId":
		case "addressbook-livenet":
		case "addressbook-testnet":
			upgradeKeys[key] = value;
			break;
	}
}
async function finishLSUpgrade() {
	await Promise.all([lsUpgrader1, lsUpgrader2]);
	if (Object.keys(upgradeKeys).length == 0)
		return;
	if (process.platform === 'win32') {
		process.chdir(app.getPath('userData')); // workaround non-latin characters in path
		walletDataPath = walletDataDir;
	}
	level(walletDataPath, { createIfMissing: true }, async (err, db) => {
		if (err)
			return console.error(`can't create ${walletDataPath} database`);
		for (const key in upgradeKeys) {
			console.log(`storing ${key}...`);
			await db.put(key, upgradeKeys[key]);
		}
		fs.writeFileSync(lsUpgradedFlagFile, "true");
		fs.rmSync(oldLSDir, {recursive: true, force: true});
		db.close()
	});
}

let mainWindow;
async function createWindow () {
	await finishLSUpgrade();

	mainWindow = new BrowserWindow({
		width: 400,
		height: 700,
		resizable: false,
		icon: path.join(__dirname, '/public/img/icons/logo-circle-256.png'),
		webPreferences: {
			contextIsolation: false,
			nodeIntegration: true
			//preload: path.join(__dirname, 'preload.js')
		}
	});
	new Badge(mainWindow, {});
	mainWindow.loadFile('public/index.html');
	mainWindow.webContents.on('devtools-opened', () => {
		mainWindow.resizable = true;
	});
	if (urlToLoad) {
		ipcMain.on('done-loading', () => {
			mainWindow.webContents.send('open', urlToLoad);
		});
	}
	mainWindow.on('focus', () => {
		mainWindow.webContents.send('focus');
	});
	mainWindow.on('blur', () => {
		mainWindow.webContents.send('blur');
	});
	ipcMain.on('update-badge', (event, count) => {
		app.setBadgeCount(count);
	});
	ipcMain.on('relaunch', () => {
		app.relaunch();
		app.quit();
	});
	ipcMain.on('exit', () => {
		app.quit();
	});
	ipcMain.on('open-save-dialog', (event, opts) => {
		const path = dialog.showSaveDialogSync(mainWindow, opts);
		mainWindow.webContents.send('save-dialog-done', path);
	});
	mainWindow.webContents.on('before-input-event', (event, input) => {
		if ((input.control || input.meta) && input.key.toLowerCase() === 'i') {
			mainWindow.webContents.openDevTools({mode: 'detach'});
		}
	});
}

let protocols = isTestnet ? ["obyte-tn", "byteball-tn"] : ["obyte", "byteball"];
if (process.defaultApp) {
	if (process.argv.length >= 2) {
		protocols.forEach(pr => {
			app.setAsDefaultProtocolClient(pr, process.execPath, [path.resolve(process.argv[1])]);
		});
	}
} else {
	protocols.forEach(pr => {
		app.setAsDefaultProtocolClient(pr);
	});
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
	app.quit();
//	return;
}

app.on('second-instance', (event, commandLine, workingDirectory) => {
	// Someone tried to run a second instance, we should focus our window.
	if (mainWindow) {
		if (mainWindow.isMinimized())
			mainWindow.restore();
		mainWindow.focus();
		mainWindow.webContents.send('open', commandLine.at(-1));
	}
});

app.whenReady().then(() => {
	createWindow();
	app.on('activate', function () {
		if (BrowserWindow.getAllWindows().length === 0)
			createWindow();
	});
	if (process.platform === 'darwin') {
		const template = [{
				label: app.name,
				submenu:[{label: 'Quit', role: 'quit'}]
		}, {
			label: 'Edit',
			submenu: [
				{label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo'},
				{label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo'},
				{type: 'separator'},
				{label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut'},
				{label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy'},
				{label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste'},
				{label: 'Select All', accelerator: 'CmdOrCtrl+A', role: 'selectAll'}
			]
		}];
		const menu = Menu.buildFromTemplate(template);
		Menu.setApplicationMenu(menu);
	} else
		Menu.setApplicationMenu(null);
});

app.on('window-all-closed', function () {
	app.quit();
});

let urlToLoad;
if (process.argv.length >= 2) {
	let lastArg = process.argv.at(-1);
	if (lastArg.includes('obyte') || lastArg.includes('byteball')) {
		urlToLoad = lastArg;
	}
}
app.on('open-url', (event, url) => {
	if (mainWindow != null) {
		mainWindow.webContents.send('open', url);
		return;
	}
	urlToLoad = url;
});