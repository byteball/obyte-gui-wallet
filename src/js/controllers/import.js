'use strict';

angular.module('copayApp.controllers').controller('importController',
	function($scope, $rootScope, $location, $timeout, $log, storageService, fileSystemService, isCordova, isMobile, electron, profileService) {
		
		var JSZip = require("jszip");
		var async = require('async');
		var crypto = require('crypto');
		var conf = require('ocore/conf');
		var userAgent = navigator.userAgent;
		var files = [conf.database.filename, conf.database.filename+"-shm", conf.database.filename+"-wal",
			'conf.json'
		];
		
		if(isCordova) {
			var zip = new JSZip();
		}else{
			var unzip = require('unzipper' + '');
		}
		var fc = profileService.focusedClient;

		const TITLE_BYTES = Buffer.from([0x4F, 0x42, 0x59, 0x02]); // OBY2
		const SALT_LENGTH = 16;
		const IV_LENGTH = 16;
		const HEADER_LENGTH = TITLE_BYTES.length + SALT_LENGTH + IV_LENGTH;

		var self = this;
		self.importing = false;
		self.password = '';
		self.error = '';
		self.iOs = isMobile.iOS();
		self.android = isMobile.Android() && window.cordova;
		self.arrBackupFiles = [];
		self.androidVersion = isMobile.Android() ? parseFloat(userAgent.slice(userAgent.indexOf("Android")+8)) : null;
		self.oldAndroidFilePath = null;
		self.oldAndroidFileName = '';

		function migrateJoints(callback) {
			conf = require('ocore/conf');
			if (!conf.bLight || conf.storage !== 'sqlite' || isCordova) return callback();
			// re-open SQLite
			var sqlite3 = require('sqlite3');
			var path = require('ocore/desktop_app').getAppDataDir() + '/';
			var db = new sqlite3.Database(path + conf.database.filename, sqlite3.OPEN_READONLY);
			db.get("PRAGMA user_version", function(err, row) {
				// old backups will be migrated on next launch
				if (row.user_version < 30) return callback();
				// re-open RocksDB
				var kvstore = require('ocore/kvstore');
				kvstore.open(function(err){
					if(err) return callback(err);
					var batch = kvstore.batch();
					db.each("SELECT unit, json FROM joints", function (err, row) {
						if(err) console.log(err);
						batch.put('j\n'+ row.unit, row.json);
					},
					function(err, count) {
						if(err) return callback(err);
						console.log(count + ' joints migrated');
						batch.write(function(err) {
							if(err) return callback(err);
							kvstore.close(callback);
						});
					});
				});
			});
		}

		function generateListFilesForIos() {
			var backupDirPath = window.cordova.file.documentsDirectory + '/Obyte/';
			fileSystemService.readdir(backupDirPath, function(err, listFilenames) {
				if (listFilenames){
					listFilenames.forEach(function(name) {
						var dateNow = parseInt(name.split(' ')[1]);
						self.arrBackupFiles.push({
							name: name.replace(dateNow, new Date(dateNow).toLocaleString()),
							originalName: name,
							time: dateNow
						})
					});
				}
				$timeout(function() {
					$rootScope.$apply();
				});
			});
		}
		
		if (self.iOs) generateListFilesForIos();
		
		function writeDBAndFileStorageMobile(zip, cb) {
			var db = require('ocore/db');
			var dbDirPath = fileSystemService.getDatabaseDirPath() + '/';
			async.series([
				function(next) {
					db.close(function() {
						// remove old SQLite database
						fileSystemService.deleteDirFiles(dbDirPath, next);
					});
				},
				function(next) {
					// unzip files
					async.forEachOfSeries(zip.files, function(objFile, key, callback) {
						if (key == 'profile') {
							zip.file(key).async('string').then(function(data) {
								storageService.storeProfile(Profile.fromString(data), callback);
								storageService.storeProfile = function(){};
							});
						}
						else if (key == 'focusedWalletId') {
							zip.file(key).async('string').then(function(data) {
								storageService.storeFocusedWalletId(data, callback);
								storageService.storeFocusedWalletId = function(){};
							});
						}
						else if (/addressbook-/.test(key)) {
							zip.file(key).async('string').then(function(data) {
								storageService.setAddressbook(fc.credentials.network, data, callback);
								storageService.setAddressbook = function(){};
							});
						}
						else if (key == 'config') {
							zip.file(key).async('string').then(function(data) {
								storageService.storeConfig(data, callback);
								storageService.storeConfig = function(){};
							});
						}
						else if (/\.sqlite/.test(key)) {
							zip.file(key).async('nodebuffer').then(function(data) {
								fileSystemService.cordovaWriteFile(dbDirPath, null, key, data, callback);
							});
						}
						else {
							callback();
						}
					}, next);
				}
			], cb);
		}
		
		function writeDBAndFileStoragePC(cb) {
			var db = require('ocore/db');
			var kvstore = require('ocore/kvstore');
			var dbDirPath = fileSystemService.getDatabaseDirPath() + '/';
			async.series([
				function(next) {
					kvstore.close(function() {
						// remove old RocksDB database
						fileSystemService.deleteDirFiles(dbDirPath + 'rocksdb/', next);
					});
				},
				function(next) {
					db.close(function() {
						// remove our own old files
						async.each(files, (f, cb) => {
							fileSystemService.nwUnlink(dbDirPath + f, cb)
						}, err => {
							if (err && err.code != 'ENOENT')
								return next(err);
							next();
						});
					});
				},
				function(next) {
					// restore wallet profile
					fileSystemService.readFile(dbDirPath + 'temp/' + 'profile', function(err, data) {
						if(err) return next(err);
						storageService.storeProfile(Profile.fromString(data.toString()), next)
						storageService.storeProfile = function(){};
					});
				},
				function(next) {
					// restore wallet focused profile
					fileSystemService.readFile(dbDirPath + 'temp/' + 'focusedWalletId', function(err, data) {
						if(err) return next();
						storageService.storeFocusedWalletId(data, next);
						storageService.storeFocusedWalletId = function(){};
					});
				},
				function(next) {
					// restore wallet config
					fileSystemService.readFile(dbDirPath + 'temp/' + 'config', function(err, data) {
						if(err) return next(err);
						storageService.storeConfig(data.toString(), next);
						storageService.storeConfig = function(){};
					});
				},
				function(next) {
					// restore wallet config
					fileSystemService.readFile(dbDirPath + 'temp/' + 'addressbook-'+fc.credentials.network, function(err, data) {
						if(err) return next();
						storageService.setAddressbook(fc.credentials.network, data.toString(), next);
						storageService.setAddressbook = function(){};
					});
				},
				function(next) {
					// recreate conf.json
					var existsConfJson = fileSystemService.nwExistsSync(dbDirPath + 'temp/conf.json');
					var existsLight = fileSystemService.nwExistsSync(dbDirPath + 'temp/light');
					if(existsConfJson){
						fileSystemService.nwMoveFile(dbDirPath + 'temp/conf.json', dbDirPath + 'conf.json', next);
					}else if(existsLight && !existsConfJson){
						fileSystemService.nwWriteFile(dbDirPath + 'conf.json', JSON.stringify({bLight: true}, null, '\t'), next);
					}else if(!existsLight && conf.bLight){
						var _conf = require(dbDirPath + 'conf.json');
						_conf.bLight = false;
						fileSystemService.nwWriteFile(dbDirPath + 'conf.json', JSON.stringify(_conf, null, '\t'), next);
					}else{
						next();
					}
				},
				function(next) {
					// move SQLite database in place
					fileSystemService.readdir(dbDirPath + 'temp/', function(err, fileNames) {
						fileNames = fileNames.filter(function(name){ return /\.sqlite/.test(name); });
						async.forEach(fileNames, function(name, callback) {
							fileSystemService.nwMoveFile(dbDirPath + 'temp/' + name, dbDirPath + name, callback);
						}, next);
					});
				},
				function(next) {
					if (fileSystemService.nwExistsSync(dbDirPath + 'temp/rocksdb/')) {
						// move RocksDB database in place (only when backup originates from desktop)
						fileSystemService.nwRmDir(dbDirPath + 'rocksdb/', function(err) {
							fileSystemService.nwRename(dbDirPath + 'temp/rocksdb/', dbDirPath + 'rocksdb/', next);
						});
					}
					else {
						// move joints from SQLite to RocksDB (only when backup originates from mobile)
						migrateJoints(next);
					}
				},
				function(next) {
					// cleanup extracted files and folders
					fileSystemService.deleteDirFiles(dbDirPath + 'temp/', function(err) {
						fileSystemService.nwRmDir(dbDirPath + 'temp/', next);
					});
				}
			], cb);
		}

		function isV2Format(buffer) {
			if (buffer.length < HEADER_LENGTH) return false;
			return buffer.slice(0, TITLE_BYTES.length).equals(TITLE_BYTES);
		}

		function decryptV1(buffer, password) {
			password = Buffer.from(password);
			const key = crypto.pbkdf2Sync(password, '', 100000, 32, 'sha512');
			const iv = crypto.createHash('sha1').update(password).digest().slice(0, 16);
			const decipher = crypto.createDecipheriv('aes-256-ctr', key, iv);
			var arrChunks = [];
			const CHUNK_LENGTH = 2048;
			for (var offset = 0; offset < buffer.length; offset += CHUNK_LENGTH) {
				arrChunks.push(decipher.update(buffer.slice(offset, Math.min(offset + CHUNK_LENGTH, buffer.length)), 'utf8'));
			}
			arrChunks.push(decipher.final());
			return Buffer.concat(arrChunks);
		}

		function decryptV2(buffer, password) {
			password = Buffer.from(password);
			const salt = buffer.slice(TITLE_BYTES.length, TITLE_BYTES.length + SALT_LENGTH);
			const iv = buffer.slice(TITLE_BYTES.length + SALT_LENGTH, HEADER_LENGTH);
			const encryptedData = buffer.slice(HEADER_LENGTH);
			const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha512');
			const decipher = crypto.createDecipheriv('aes-256-ctr', key, iv);
			const arrChunks = [];
			const CHUNK_LENGTH = 2048;
			for (let offset = 0; offset < encryptedData.length; offset += CHUNK_LENGTH) {
				arrChunks.push(decipher.update(encryptedData.slice(offset, Math.min(offset + CHUNK_LENGTH, encryptedData.length)), 'utf8'));
			}
			arrChunks.push(decipher.final());
			return Buffer.concat(arrChunks);
		}

		function decrypt(buffer, password) {
			if (isV2Format(buffer)) {
				return decryptV2(buffer, password);
			}
			return decryptV1(buffer, password);
		}

		function createDecipherFromHeader(header, password) {
			password = Buffer.from(password);
			const salt = header.slice(TITLE_BYTES.length, TITLE_BYTES.length + SALT_LENGTH);
			const iv = header.slice(TITLE_BYTES.length + SALT_LENGTH, HEADER_LENGTH);
			const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha512');
			return crypto.createDecipheriv('aes-256-ctr', key, iv);
		}

		function createV1Decipher(password) {
			password = Buffer.from(password);
			const key = crypto.pbkdf2Sync(password, '', 100000, 32, 'sha512');
			const iv = crypto.createHash('sha1').update(password).digest().slice(0, 16);
			return crypto.createDecipheriv('aes-256-ctr', key, iv);
		}
		
		function showError(text) {
			self.importing = false;
			self.error = text;
			$timeout(function() {
				$rootScope.$apply();
			});
			return false;
		}
		
		function handlePCImportSuccess() {
			setTimeout(function() {
				writeDBAndFileStoragePC(function(err) {
					if (err) return showError(err);
					self.importing = false;
					$rootScope.$emit('Local/ShowAlert', "Import successfully completed, please restart the application.", 'fi-check', function() {
						if (navigator && navigator.app)
							navigator.app.exitApp();
						else if (electron.isDefined())
							electron.relaunch();
						else if (process.exit)
							process.exit();
					});
				});
			}, 100);
		}

		function handlePCImportError(err) {
			if (err.message === "Invalid signature in zip file") {
				showError('Incorrect password or file');
			} else {
				showError(err);
			}
		}

		function unzipAndWriteFiles(data, password) {
			if(isCordova) {
				zip.loadAsync(decrypt(data, password)).then(function(zip) {
					if (!zip.file('light')) {
						self.importing = false;
						self.error = 'Mobile version supports only light wallets.';
						$timeout(function() {
							$rootScope.$apply();
						});
					}
					else {
						writeDBAndFileStorageMobile(zip, function(err) {
							if (err) return showError(err);
							self.importing = false;
							$rootScope.$emit('Local/ShowAlert', "Import successfully completed, please restart the application.", 'fi-check', function() {
								if (navigator && navigator.app)
									navigator.app.exitApp();
								else if (process.exit)
									process.exit();
							});
						});
					}
				}, function() {
					showError('Incorrect password or file');
				})
			} else {
				const { PassThrough } = require('stream' + '');
				const passThrough = new PassThrough();
				const headerChunks = [];
				const extractPath = fileSystemService.getDatabaseDirPath() + '/temp/';
				let headerBytesRead = 0;
				let headerProcessed = false;
				let decipherStream = null;

				data.on('data', function(chunk) {
					if (headerProcessed) {
						passThrough.write(chunk);
						return;
					}

					headerChunks.push(chunk);
					headerBytesRead += chunk.length;

					if (headerBytesRead >= HEADER_LENGTH) {
						headerProcessed = true;
						const headerBuffer = Buffer.concat(headerChunks);
						const isV2 = headerBuffer.slice(0, TITLE_BYTES.length).equals(TITLE_BYTES);

						if (isV2) {
							decipherStream = createDecipherFromHeader(headerBuffer.slice(0, HEADER_LENGTH), password);
							const remaining = headerBuffer.slice(HEADER_LENGTH);
							if (remaining.length > 0) {
								passThrough.write(remaining);
							}
						} else {
							decipherStream = createV1Decipher(password);
							passThrough.write(headerBuffer);
						}

						passThrough
							.pipe(decipherStream)
							.pipe(unzip.Extract({ path: extractPath }))
							.on('error', handlePCImportError)
							.on('finish', handlePCImportSuccess);
					}
				});

				data.on('end', function() {
					passThrough.end();
				});

				data.on('error', handlePCImportError);
			}
		}
		
		self.oldAndroidInputFileClick = function() {
			if(isMobile.Android() && self.androidVersion < 5) {
				window.plugins.mfilechooser.open([], function(uri) {
					self.oldAndroidFilePath = 'file://' + uri;
					self.oldAndroidFileName = uri.split('/').pop();
					$timeout(function() {
						$rootScope.$apply();
					});
				}, function(error) {
					alert(error);
				});
			}
		};

		self.setWalletFileName = function($ev) {
			self.walletFile = $ev.target.files[0];
		}
		
		self.walletImport = function() {
			self.error = '';
			if(isMobile.Android() && self.androidVersion < 5){
				if (!self.oldAndroidFilePath)
					return;
				self.importing = true;
				fileSystemService.readFile(self.oldAndroidFilePath, function(err, data) {
					unzipAndWriteFiles(data, self.password);
				})
			}
			else if ($scope.file){
				self.importing = true;
				fileSystemService.readFileFromForm($scope.file, function(err, data) {
					if (err) return showError(err);
					unzipAndWriteFiles(data, self.password);
				});
			}
		};
		
		self.iosWalletImportFromFile = function(fileName) {
			$rootScope.$emit('Local/NeedsPassword', false, null, function(err, password) {
				if (password) {
					var backupDirPath = window.cordova.file.documentsDirectory + '/Obyte/';
					fileSystemService.readFile(backupDirPath + fileName, function(err, data) {
						if (err) return showError(err);
						unzipAndWriteFiles(data, password);
					})
				}
			});
		};
		
		$scope.getFile = function() {
			$timeout(function() {
				$rootScope.$apply();
			});
		};
	});