'use strict';

angular.module('copayApp.controllers').controller('exportController',
	function($rootScope, $scope, $timeout, $log, $filter, backupService, storageService, fileSystemService, isCordova, isMobile, gettextCatalog, notification, electron, profileService, configService) {
		var async = require('async');
		var crypto = require('crypto');
		var conf = require('ocore/conf');
		var zip;
		if (isCordova) {
			var JSZip = require("jszip");
			zip = new JSZip();
		} else {
			var _zip = require('zip' + '');
			zip = null;
		}
		var fc = profileService.focusedClient;

		const TITLE_BYTES = Buffer.from([0x4F, 0x42, 0x59, 0x02]); // OBY2
		const SALT_LENGTH = 16;
		const IV_LENGTH = 16;

		var self = this;
		self.error = null;
		self.success = null;
		self.password = null;
		self.repeatpassword = null;
		self.exporting = false;
		self.isCordova = isCordova;
		self.bCompression = false;
		self.connection = null;
		if (!isCordova)
			$scope.downloadsDir = (process.env.HOME || process.env.USERPROFILE || '~') + require('path').sep +'Downloads';

		function migrateJoints(callback) {
			if (!conf.bLight || isCordova) return callback();
			var options = {};
			options.gte = "j\n";
			options.lte = "j\n\uFFFF";
			var db = require('ocore/db');
			var kvstore = require('ocore/kvstore');
			var stream = kvstore.createReadStream(options);
			var arrQueries = [];
			stream.on('data', function (data) {
					var unit = data.key.substr(2);
					var json = data.value;
					db.addQuery(arrQueries, "INSERT " + db.getIgnore() + " INTO joints (unit, json) VALUES (?,?)", [unit, json]);
				})
				.on('end', function(){
					console.log(arrQueries.length + ' joints migrated');
					async.series(arrQueries, callback);
				})
				.on('error', callback);
		}

		function addDBAndConfToZip(cb) {
			var dbDirPath = fileSystemService.getDatabaseDirPath() + '/';
			listDBFiles(dbDirPath, function(err, listFilenames) {
				if (err) return cb(err);
				if (isCordova) {
					async.forEachSeries(listFilenames, function(name, callback) {
						fileSystemService.readFile(dbDirPath + '/' + name, function(err, data) {
							if (err) return callback(err);
							zip.file(name, data);
							callback();
						});
					}, cb);
				}
				else {
					async.forEachSeries(listFilenames, function(name, callback) {
						fileSystemService.getPath(dbDirPath + '/' + name, function(err, path) {
							if (err) return callback(err);
							zip.file(name, path);
							callback();
						});
					}, cb);
				}
			});
		}

		function listDBFiles(dbDirPath, cb) {
			fileSystemService.readdir(dbDirPath, function(err, listFilenames) {
				if (err) return cb(err);
				listFilenames = listFilenames.filter(function(name) {
					return (name == 'conf.json' || /\.sqlite/.test(name));
				});
				if(isCordova)
					cb(null, listFilenames);
				else {
					fileSystemService.readdir(dbDirPath + 'rocksdb/', function(err, listRocksDB) {
						if (err) return cb(err);
						listRocksDB.forEach(function(filename) {
							// exclude LOCK file and old LOG files, list everything else
							if (filename !== 'LOCK' && filename.substring(0, 8) !== 'LOG.old.') {
								listFilenames.push('rocksdb/' + filename);
							}
						});
						cb(null, listFilenames);
					});
				}
			});
		}

		function capitalizeFirstLetter(s) {
			return s.charAt(0).toUpperCase() + s.slice(1);
		}

		function saveFile(file, cb) {
			const Program = capitalizeFirstLetter(conf.program);
			var backupFilename = Program + 'Backup-' + $filter('date')(Date.now(), 'yyyy-MM-dd-HH-mm-ss') + '.encrypted';
			if (!isCordova) {
				electron.once('save-dialog-done', (evt, path) => {
					if (!path)
						return;
					cb(path);
				});
				electron.emit('open-save-dialog', {defaultPath: backupFilename});
			}
			else {
				const isIos = isMobile.iOS();
				const location1 = isIos ? window.cordova.file.cacheDirectory : window.cordova.file.externalRootDirectory;
				const location2 = isIos ? window.cordova.file.cacheDirectory : window.cordova.file.externalApplicationStorageDirectory;
				const path = Program;

				function save(location) {
					fileSystemService.cordovaWriteFile(location, path, backupFilename, file, function (err) {
						if (err) {
							console.log(`saving to ${location} failed`, err);
							if (!isIos && location === location1) {
								console.log(`will try ${location2}`);
								return save(location2);
							}
							return cb(err);
						}
						const fullPath = location + path + '/' + backupFilename;
						var text = isIos ? gettextCatalog.getString('Now you have to send this file somewhere to restore from it later ("Save to Files", send to yourself using chat apps, etc.)') : gettextCatalog.getString('File saved to ' + fullPath + '. You can now also send it somewhere using chat apps or email to have more copies of the backup');
						navigator.notification.alert(text, function () {
							window.plugins.socialsharing.shareWithOptions({ files: [fullPath] }, function () { }, function () { });
						}, 'Backup done');
						cb(err);
					});
				}

				save(location1);
			}
		}

		function encrypt(buffer, password) {
			password = Buffer.from(password);
			const salt = crypto.randomBytes(SALT_LENGTH);
			const iv = crypto.randomBytes(IV_LENGTH);
			const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha512');
			const cipher = crypto.createCipheriv('aes-256-ctr', key, iv);
			var arrChunks = [];
			var CHUNK_LENGTH = 2003;
			for (var offset = 0; offset < buffer.length; offset += CHUNK_LENGTH) {
				arrChunks.push(cipher.update(buffer.slice(offset, Math.min(offset + CHUNK_LENGTH, buffer.length)), 'utf8'));
			}
			arrChunks.push(cipher.final());
			
			const encryptedData = Buffer.concat(arrChunks);
			return Buffer.concat([TITLE_BYTES, salt, iv, encryptedData]);
		}

		function createCipherWithHeader(password) {
			password = Buffer.from(password);
			const salt = crypto.randomBytes(SALT_LENGTH);
			const iv = crypto.randomBytes(IV_LENGTH);
			const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha512');
			const cipher = crypto.createCipheriv('aes-256-ctr', key, iv);
			const header = Buffer.concat([TITLE_BYTES, salt, iv]);
			return { cipher: cipher, header: header };
		}

		function showError(text) {
			self.exporting = false;
			self.error = text;
			$timeout(function() {
				$rootScope.$apply();
			});
			return false;
		}
		
		function setRestoredFromBackup(newValue, cb) {
			configService.set({
				restoredFromBackup: newValue
			}, (err) => {
				if (err) {
					return $scope.$emit('Local/DeviceError', err);
				}
				
				if(cb) {
					cb();
				}
			})
		}
		
		function setLastBackupDate(newValue, cb) {
			configService.set({
				lastBackupDate: newValue
			}, (err) => {
				if (err) {
					return $scope.$emit('Local/DeviceError', err);
				}
				cb();
			})
		}

		self.walletExportPC = function(connection) {
			self.connection = connection;
			saveFile(null, function(path) {
				if(!path) return;
				const cipherData = createCipherWithHeader(self.password);
				zip = new _zip(path, {
					compressed: self.bCompression ? 6 : 0,
					cipher: cipherData.cipher,
					header: cipherData.header
				});
				storageService.getProfile(function(err, profile) {
					storageService.getConfig(function(err, config) {
						storageService.getFocusedWalletId(function(err, id) {
							storageService.getAddressbook(fc.credentials.network, function(err, ab) {
								zip.text('profile', JSON.stringify(profile));
								zip.text('config', config);
								zip.text('focusedWalletId', id);
								zip.text('addressbook-'+fc.credentials.network, ab);
								if (conf.bLight) zip.text('light', 'true');
								
								zip.setErrorCB((err) => {
									setRestoredFromBackup(false);
									return showError(err);
								})
								addDBAndConfToZip(function(err) {
									if (err) {
										setRestoredFromBackup(false);
										return showError(err);
									}
									zip.end(function() {
										setRestoredFromBackup(false);
										connection.release();
										self.connection = null;
										self.exporting = false;
										zip = null;
										$timeout(function() {
											$rootScope.$apply();
											notification.success(gettextCatalog.getString('Success'), gettextCatalog.getString('Export completed successfully', {}));
										});
									});
								});
							});
						});
					})
				})
			})
		};

		self.walletExportCordova = function(connection) {
			storageService.getProfile(function(err, profile) {
				storageService.getConfig(function(err, config) {
					storageService.getFocusedWalletId(function(err, id) {
						storageService.getAddressbook(fc.credentials.network, function(err, ab) {
							zip.file('profile', JSON.stringify(profile));
							zip.file('config', config);
							zip.file('focusedWalletId', id);
							zip.file('addressbook-'+fc.credentials.network, ab);
							zip.file('light', 'true');
							addDBAndConfToZip(function(err) {
								if (err) {
									setRestoredFromBackup(false);
									return showError(err);
								}
								var zipParams = {type: "nodebuffer", compression: 'DEFLATE', compressionOptions: {level: 9}};
								zip.generateAsync(zipParams).then(function(zipFile) {
									saveFile(encrypt(zipFile, self.password), function(err) {
										setRestoredFromBackup(false);
										connection.release();
										if (err) return showError(err);
										self.exporting = false;
										$timeout(function() {
											$rootScope.$apply();
											notification.success(gettextCatalog.getString('Success'), gettextCatalog.getString('Export completed successfully', {}));
										});
									})
								}, function(err) {
									setRestoredFromBackup(false);
									showError(err);
								})
							});
						});
					});
				});
			});
		};

		self.walletExport = function() {
			self.exporting = true;
			self.error = '';
			setRestoredFromBackup(true, () => {
				setLastBackupDate($filter('date')(Date.now(), 'yyyy-MM-dd HH:mm:ss'), () => {
				// move joints on light wallet from RocksDB to SQLite (so they could be imported on mobile)
					migrateJoints(function(err) {
						if (err) return showError(err);
						var db = require('ocore/db');
						db.takeConnectionFromPool(function(connection) {
							if (isCordova) {
								self.walletExportCordova(connection);
							} else {
								self.walletExportPC(connection);
							}
						});
					});
				});
			});
		}
	});