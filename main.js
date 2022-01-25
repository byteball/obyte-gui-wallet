const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const package = require('./package.json');
const sqlite3 = require('sqlite3').verbose();
const level = require('level-rocksdb');
const fs = require('fs');
const Badge = require('electron-windows-badge');

// UPGRADE old NW.js localStorage to electron format & rename byteball to obyte
const oldUserDir = (process.platform == 'win32' ? process.env.LOCALAPPDATA : app.getPath('appData')) + '/byteball';
const userDir = process.platform == 'win32' ? process.env.LOCALAPPDATA + '/' + package.name : app.getPath('userData');
const files = ['conf.json', 'rocksdb', 'Default/Local Storage',
	'byteball-light.sqlite', 'byteball-light.sqlite-shm', 'byteball-light.sqlite-wal',
	'byteball.sqlite', 'byteball.sqlite-shm', 'byteball.sqlite-wal'];
const renamedFlagFile = `${app.getPath('userData')}/.renamed`;

if (!fs.existsSync(renamedFlagFile)) {
	if (fs.existsSync(oldUserDir)) {
		console.log(`moving files from ${oldUserDir} to ${userDir}`);
		if (!fs.existsSync(`${app.getPath('userData')}/Default`)){
			fs.mkdirSync(`${app.getPath('userData')}/Default`);
		}
		for (const file of files) {
			try {
				console.log(`moving ${file}`);
				fs.renameSync(`${oldUserDir}/${file}`, `${app.getPath('userData')}/${file}`);
				console.log(`OK`);
			} catch(e) {
			}
		}
	}
	fs.writeFileSync(renamedFlagFile, "true");
}

let upgradeKeys = {};
const lsUpgradedFlagFile = `${app.getPath('userData')}/.upgraded`;
const lsSqliteFile = `${app.getPath('userData')}/Default/Local Storage/chrome-extension_ppgbkonninhcodjcnbpghnagfadnfjck_0.localstorage`;
const lsLevelDBDir = `${app.getPath('userData')}/Default/Local Storage/leveldb`;
let lsUpgrader1, lsUpgrader2;
if (!fs.existsSync(lsUpgradedFlagFile)) {
	lsUpgrader1 = new Promise((resolve, reject) => {
		const db = new sqlite3.Database(lsSqliteFile, sqlite3.OPEN_READONLY, (err) => {
			if (err)
				return resolve();
			console.log(`Upgrading Local Storage from SQLite database...`);
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
			console.log(`Upgrading Local Storage from LevelDB database...`);
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
	let file = 'public/index.html';
	if (upgrade) {
		file = 'public/upgrader.html';
	}
	mainWindow.loadFile(file);
	mainWindow.webContents.on('devtools-opened', () => {
		mainWindow.resizable = true;
	});
	// mainWindow.webContents.openDevTools();
	if (upgrade) {
		mainWindow.webContents.send('upgradeKeys', JSON.stringify(upgradeKeys));
		ipcMain.on('done-upgrading', () => {
			fs.writeFileSync(lsUpgradedFlagFile, "true");
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

let protocols = process.env.testnet ? ["obyte-tn", "byteball-tn"] : ["obyte", "byteball"];
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
	return;
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