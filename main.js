const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const package = require('./package.json');
const sqlite3 = require('sqlite3').verbose();
const level = require('level-rocksdb');
const fs = require('fs');
const Badge = require('electron-windows-badge');

// UPGRADE old NW.js localStorage to electron format
let upgradeKeys = {};
const userDir = process.platform == 'win32' ? process.env.LOCALAPPDATA + '/' + package.name : app.getPath('userData');
const files = ['conf.json',
	'byteball-light.sqlite', 'byteball-light.sqlite-shm', 'byteball-light.sqlite-wal',
	'byteball.sqlite', 'byteball.sqlite-shm', 'byteball.sqlite-wal'];
const upgradedFlagFile = `${app.getPath('userData')}/.upgraded`;
const lsSqliteFile = `${userDir}/Default/Local Storage/chrome-extension_ppgbkonninhcodjcnbpghnagfadnfjck_0.localstorage`;
const lsLevelDBDir = `${userDir}/Default/Local Storage/leveldb`;
let lsUpgrader1, lsUpgrader2;
if (!fs.existsSync(upgradedFlagFile)) {
	if (process.platform == 'win32') { // move all files from Local to Roaming
		for (const file of files) {
			fs.rename(`${userDir}/${file}`, `${app.getPath('userData')}/${file}`, err => {});
		}
	}
	lsUpgrader1 = new Promise((resolve, reject) => {
		const db = new sqlite3.Database(lsSqliteFile, sqlite3.OPEN_READONLY, (err) => {
			if (err)
				return resolve();
			db.all(`SELECT key, value FROM ItemTable WHERE key IN ('profile', 'config', 'agreeDisclaimer')`, [], (err, rows) => {
				if (err)
					return resolve();
				for (const row of rows) {
					handleRow(row.key, row.value.toString().replace(/\0/g, ''));
				}
				resolve();
			});
		});
	});
	lsUpgrader2 = new Promise((resolve, reject) => {
		const leveldb = level(lsLevelDBDir, { createIfMissing: false }, function (err, db) {
			if (err)
				return resolve();
			leveldb.createReadStream().on('data', function (data) {
				const key = data.key.replace('_chrome-extension://ppgbkonninhcodjcnbpghnagfadnfjck\0\1', '');
				handleRow(key, data.value.substring(1))
			}).on('end', function () {
				resolve();
			});
		});
	});
}
function handleRow(key, value) {
	try {
		let v = JSON.parse(value);
	} catch(e) {
		return;
	}
	switch (key) {
		case "config":
		case "agreeDisclaimer":
		case "profile":
			upgradeKeys[key] = value;
			break;
	}
}
/// UPGRADE

let mainWindow;
async function createWindow () {
	await Promise.all([lsUpgrader1, lsUpgrader2]);
	let upgrade = Object.keys(upgradeKeys).length > 0;

	mainWindow = new BrowserWindow({
		width: 1200,
		height: 1000,
		resizable: false,
		icon: "./public/img/icons/logo-circle-256.png",
		webPreferences: {
			contextIsolation: false,
			nodeIntegration: true
			//preload: path.join(__dirname, 'preload.js')
		}
	});
	new Badge(mainWindow, {});
	let file = 'public/index.html';
	if (upgrade) {
		file = 'public/upgrader.html';
	}
	mainWindow.loadFile(file);
	mainWindow.webContents.openDevTools();
	if (upgrade) {
		mainWindow.webContents.send('upgradeKeys', JSON.stringify(upgradeKeys));
		ipcMain.on('done-upgrading', () => {
			fs.writeFileSync(upgradedFlagFile, "true");
			fs.rmSync(lsSqliteFile, {force: true});
			fs.rmSync(lsLevelDBDir, {recursive: true, force: true});
		});
	}
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
}

if (process.defaultApp) {
	if (process.argv.length >= 2) {
		app.setAsDefaultProtocolClient(package.name, process.execPath, [path.resolve(process.argv[1])]);
	}
} else {
	app.setAsDefaultProtocolClient(package.name);
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
	app.quit();
	return;
}

app.on('second-instance', (event, commandLine, workingDirectory) => {
	// Someone tried to run a second instance, we should focus our window.
	if (mainWindow) {
		if (mainWindow.isMinimized())
			mainWindow.restore();
		mainWindow.focus();
	}
});

app.whenReady().then(() => {
	createWindow();
	app.on('activate', function () {
		if (BrowserWindow.getAllWindows().length === 0)
			createWindow();
	});
	Menu.setApplicationMenu(null);
});

app.on('window-all-closed', function () {
	app.quit();
});

let urlToLoad;
app.on('open-url', (event, url) => {
	if (mainWindow != null) {
		mainWindow.webContents.send('open', url);
		return;
	}
	urlToLoad = url;
});