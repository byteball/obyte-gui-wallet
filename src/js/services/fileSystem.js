'use strict';

angular.module('copayApp.services')
.factory('fileSystemService', function($log, isCordova) {
	var root = {},
		bFsInitialized = false;
	
	var fs = require('fs' + '');
	try {
		var desktopApp = require('byteballcore/desktop_app.js' + '');
	} catch (e) {
		
	}
	
	root.init = function(cb) {
		if (bFsInitialized) return cb(null);
		
		function onFileSystemSuccess(fileSystem) {
			console.log('File system started: ', fileSystem.name, fileSystem.root.name);
			bFsInitialized = true;
			return cb(null);
		}
		
		function fail(evt) {
			var msg = 'Could not init file system: ' + evt.target.error.code;
			console.log(msg);
			return cb(msg);
		}
		
		window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onFileSystemSuccess, fail);
	};
	
	root.readFileFromForm = function(file, cb) {
		if (isCordova) {
			var reader = new FileReader();
			reader.onloadend = function() {
				var fileBuffer = Buffer.from(new Uint8Array(this.result));
				cb(null, fileBuffer);
			};
			reader.readAsArrayBuffer(file);
		}
		else {
			return cb(null, fs.createReadStream(file.path));
		}
	};
	
	root.readFile = function(path, cb) {
		if (isCordova) {
			root.init(function() {
				window.resolveLocalFileSystemURL(path, function(fileEntry) {
					fileEntry.file(function(file) {
						root.readFileFromForm(file, cb);
					});
				}, function(e) {
					throw new Error('error: ' + JSON.stringify(e));
				});
			});
		}
		else {
			fs.readFile(path, function(err, data) {
				return err ? cb(err) : cb(null, data);
			});
		}
	};
	
	root.getPath = function(path, cb) {
		return cb(null, path.replace(/\\/g, '/'));
	};
	
	root.nwWriteFile = function(path, data, cb) {
		if (!isCordova) {
			fs.writeFile(path, data, function(err) {
				return err ? cb(err) : cb(null);
			});
		}
		else {
			cb('use cordovaWriteFile')
		}
	};
	
	// example: fileSystemService.cordovaWriteFile(cordova.file.externalRootDirectory, 'testFolder', 'testFile.txt', 'testText :)', function(err) {
	root.cordovaWriteFile = function(cordovaFile, path, fileName, data, cb) {
		if (isCordova) {
			root.init(function() {
				window.resolveLocalFileSystemURL(cordovaFile, function(dirEntry) {
					if (!path || path == '.' || path == '/') {
						_cordovaWriteFile(dirEntry, fileName, data, cb);
					}
					else {
						dirEntry.getDirectory(path, {create: true, exclusive: false}, function(dirEntry1) {
							_cordovaWriteFile(dirEntry1, fileName, data, cb);
						}, cb);
					}
				}, cb);
			});
		}
		else {
			cb('use nwWriteFile');
		}
	};
	
	function _cordovaWriteFile(dirEntry, name, data, cb) {
		if(typeof data != 'string') data = data.buffer;
		dirEntry.getFile(name, {create: true, exclusive: false}, function(file) {
			file.createWriter(function(writer) {
				writer.onwriteend = function() {
					cb(null); 
				};
				writer.write(data);
			}, cb);
		}, cb);
	}
	
	root.readdir = function(path, cb) {
		if (isCordova) {
			root.init(function() {
				window.resolveLocalFileSystemURL(path,
					function(fileSystem) {
						var reader = fileSystem.createReader();
						reader.readEntries(
							function(entries) {
								cb(null, entries.map(function(entry) {
									return entry.name
								}));
							},
							function(err) {
								cb(err);
							}
						);
					}, function(err) {
						cb(err);
					}
				);
			});
		}
		else {
			fs.readdir(path, function(err, entries) {
				return err ? cb(err) : cb(null, entries);
			});
		}
	};
	
	root.nwMoveFile = function(oldPath, newPath, cb){
		var read = fs.createReadStream(oldPath);
		var write = fs.createWriteStream(newPath);

		read.pipe(write);
		read.on('end',function() {
			fs.unlink(oldPath, cb);
		});
	};
	
	root.nwUnlink = function(path, cb) {
		fs.unlink(path, cb);
	};
	
	root.nwRmDir = function(path, cb) {
		fs.rmdir(path, cb);
	};
	
	root.nwExistsSync = function(path) {
		return fs.existsSync(path);
	};
	
	
	root.getParentDirPath = function() {
		if (!isCordova) return false;
		switch (window.cordova.platformId) {
			case 'ios':
				return window.cordova.file.applicationStorageDirectory + '/Library';
			case 'android':
			default:
				return window.cordova.file.applicationStorageDirectory;
		}
	};
	
	root.getDatabaseDirName = function() {
		if (!isCordova) return false;
		switch (window.cordova.platformId) {
			case 'ios':
				return 'LocalDatabase';
			case 'android':
			default:
				return 'databases';
		}
	};
	
	root.getDatabaseDirPath = function() {
		if (isCordova) {
			return root.getParentDirPath() + '/' + root.getDatabaseDirName();
		}
		else {
			return desktopApp.getAppDataDir();
		}
	};

	root.recursiveMkdir = function(path, mode, callback) {
		var parentDir = require('path' + '').dirname(path);
		
		fs.stat(parentDir, function(err, stats) {
			if (err && err.code !== 'ENOENT')
				throw Error("failed to stat dir: "+err);

			if (err && err.code === 'ENOENT') {
				root.recursiveMkdir(parentDir, mode, function(err) {
					if (err)
						callback(err);
					else
						fs.mkdir(path, mode, callback);
				});
			} else {
				fs.mkdir(path, mode, callback);
			}
		});
	};
	
	return root;
});
