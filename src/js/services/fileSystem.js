'use strict';

angular.module('copayApp.services')
.factory('fileSystemService', function($log, isCordova) {
	var async = require('async');
	var root = {},
		bFsInitialized = false;
	
	try {
		var fs = require('fs');
		var desktopApp = require('ocore/desktop_app.js' + '');
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
			console.log('readFileFromForm', file, JSON.stringify(file))
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

	root.deleteFile = function(path, cb) {
		if (isCordova) {
			root.init(function() {
				window.resolveLocalFileSystemURL(path, function(fileEntry) {
					fileEntry.remove(function() {
						cb();
					}, function() {
						cb('error deleting file');
					});
				}, function(e) {
					cb(JSON.stringify(e));
				});
			});
		}
		else {
			root.nwUnlink(path, cb);
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
	
	//on mobile, big files can crash the application, we write data by chunk to prevent this issue
	function writeByChunks(writer, data, handle) {
		var written = 0;
		const BLOCK_SIZE = 1*1024*1024; // write 1M every time of write
		function writeNext(cbFinish) {
			var chunkSize = Math.min(BLOCK_SIZE, data.byteLength - written);
			var dataChunk = data.slice(written, written + chunkSize);
			written += chunkSize;
			writer.onwrite = function(evt) {
				if (written < data.byteLength)
					writeNext(cbFinish);
				else
					cbFinish(null);
			};
			writer.write(dataChunk);
		}
		writeNext(handle);
	}

	function _cordovaWriteFile(dirEntry, name, data, cb) {
		if(typeof data != 'string') data = data.buffer;
		dirEntry.getFile(name, {create: true, exclusive: false}, function(file) {
			file.createWriter(function(writer) {
        		writeByChunks(writer, data, cb);
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

	root.deleteDirFiles = function(path, cb) {
		if (isCordova) {
			root.init(function() {
				window.resolveLocalFileSystemURL(path,
					function(fileSystem) {
						var reader = fileSystem.createReader();
						reader.readEntries(
							function(entries) {
								async.forEach(entries, function(entry, callback) {
									if (entry.isFile) {
										entry.remove(function(){
											callback();
										}, function() {
											callback('failed to delete: '+ entry.name);
										});
									}
									else
										callback(); // skip folders
								}, function(err) {
									if(err) return cb(err);
									cb();
								});
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
				if (err) return cb(err);
				async.forEach(entries, function(name, callback) {
					try {
						if (fs.lstatSync(path + name).isFile())
							root.nwUnlink(path + name, callback);
						else
							callback(); // skip folders
					}
					catch(e) {
						callback(e.message);
					}
				}, function(err) {
					if(err) return cb(err);
					cb();
				});
			});
		}
	};

	root.nwRename = function(oldPath, newPath, cb) {
		fs.rename(oldPath, newPath, cb);
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
