const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const package = require('./package.json');
const sqlite3 = require('sqlite3').verbose();
const level = require('level-rocksdb');
const fs = require('fs');

// UPGRADE old NW.js localStorage to electron format
let upgradeKeys = {};
const userDir = app.getPath('userData');
const lsSqliteFile = `${userDir}/Default/Local Storage/chrome-extension_ppgbkonninhcodjcnbpghnagfadnfjck_0.localstorage`;
let lsUpgrader1 = new Promise((resolve, reject) => {
	const db = new sqlite3.Database(lsSqliteFile, (err) => {
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
const lsLevelDBDir = `${userDir}/Default/Local Storage/leveldb`;
let lsUpgrader2 = new Promise((resolve, reject) => {
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
		webPreferences: {
			contextIsolation: false,
			nodeIntegration: true
			//preload: path.join(__dirname, 'preload.js')
		}
	});
	let file = 'public/index.html';
	if (upgrade) {
		file = 'public/upgrader.html';
	}
	mainWindow.loadFile(file);
	mainWindow.webContents.openDevTools();
	if (upgrade) {
		mainWindow.webContents.send('upgradeKeys', JSON.stringify(upgradeKeys));
		ipcMain.on('done-upgrading', () => {
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
	ipcMain.on('set-badge-count', (event, count) => {
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