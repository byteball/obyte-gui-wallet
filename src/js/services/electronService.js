'use strict';

angular.module('copayApp.services').factory('electron', function electronFactory() {
	var root = {};
	let electron;
	try {
		electron = require('electron');
	}
	catch(e){}

	root.isDefined = function() {
		return !!electron;
	};

	root.readFromClipboard = function() {
		if (!electron) return;
		return electron.clipboard.readText();
	};

	root.writeToClipboard = function(text) {
		if (!electron) return;
		return electron.clipboard.writeText(text);
	};
	root.emit = (evt, ...args) => {
		if (!electron) return;
		electron.ipcRenderer.send(evt, ...args);
	};
	root.on = (evt, cb) => {
		if (!electron) return;
		electron.ipcRenderer.on(evt, cb);
	}
	root.once = (evt, cb) => {
		if (!electron) return;
		electron.ipcRenderer.once(evt, cb);
	}
	root.relaunch = () => {
		if (!electron) return;
		electron.ipcRenderer.send('relaunch');
	}
	root.exit = () => {
		if (!electron) return;
		electron.ipcRenderer.send('exit');
	}
	root.getElectronInstance = () => {
		if (!electron) return;
		return electron;
	};

	return root;
});
