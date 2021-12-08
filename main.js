const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const package = require('./package.json');

let mainWindow;
function createWindow () {
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
	mainWindow.loadFile('public/index.html');
	mainWindow.webContents.openDevTools();
	if (urlToLoad) {
		ipcMain.on('done-loading', () => {
			mainWindow.webContents.send('open', urlToLoad);
		});
	}
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