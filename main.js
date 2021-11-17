const { app, BrowserWindow } = require('electron')
const path = require('path')

function createWindow () {
	const mainWindow = new BrowserWindow({
		width: 1200,
		height: 1000,
		webPreferences: {
			contextIsolation: false,
			nodeIntegration: true
			//preload: path.join(__dirname, 'preload.js')
			
		}
	})
	mainWindow.loadFile('public/index.html')

	mainWindow.webContents.openDevTools()
}

app.whenReady().then(() => {
	createWindow()
	app.on('activate', function () {
		if (BrowserWindow.getAllWindows().length === 0) createWindow()
	})
})

app.on('window-all-closed', function () {
	app.quit()
})
