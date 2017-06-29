'use strict';

angular.module('copayApp.controllers').controller('importController',
	function($scope, $rootScope, $location, $timeout, $log, storageService, fileSystemService, isCordova, isMobile) {
		
		var JSZip = require("jszip");
		var async = require('async');
		var crypto = require('crypto');
		var conf = require('byteballcore/conf');
		var userAgent = navigator.userAgent;
		
		if(isCordova) {
			var zip = new JSZip();
		}else{
			var unzip = require('unzip' + '');
		}
		
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
		
		function generateListFilesForIos() {
			var backupDirPath = window.cordova.file.documentsDirectory + '/Byteball/';
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
			var db = require('byteballcore/db');
			var dbDirPath = fileSystemService.getDatabaseDirPath() + '/';
			db.close(function() {
				async.forEachOfSeries(zip.files, function(objFile, key, callback) {
					if (key == 'profile') {
						zip.file(key).async('string').then(function(data) {
							storageService.storeProfile(Profile.fromString(data), callback);
						});
					}
					else if (key == 'config') {
						zip.file(key).async('string').then(function(data) {
							storageService.storeConfig(data, callback);
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
				}, function(err) {
					if (err) return cb(err);
					return cb();
				});
			});
		}
		
		function writeDBAndFileStoragePC(cb) {
			var db = require('byteballcore/db');
			var dbDirPath = fileSystemService.getDatabaseDirPath() + '/';
			db.close(function() {
				async.series([
					function(callback) {
						fileSystemService.readFile(dbDirPath + 'temp/' + 'profile', function(err, data) {
							if(err) return callback(err);
							storageService.storeProfile(Profile.fromString(data.toString()), callback)
						});
					},
					function(callback) {
						fileSystemService.readFile(dbDirPath + 'temp/' + 'config', function(err, data) {
							if(err) return callback(err);
							storageService.storeConfig(data.toString(), callback);
						});
					},
					function(callback) {
						fileSystemService.readdir(dbDirPath + 'temp/', function(err, fileNames) {
							fileNames = fileNames.filter(function(name){ return /\.sqlite/.test(name); });
							async.forEach(fileNames, function(name, callback2) {
								fileSystemService.nwMoveFile(dbDirPath + 'temp/' + name, dbDirPath + name, callback2);
							}, function(err) {
								if(err) return callback(err);
								callback();
							})
						});
					},
					function(callback) {
						var existsConfJson = fileSystemService.nwExistsSync(dbDirPath + 'temp/conf.json');
						var existsLight = fileSystemService.nwExistsSync(dbDirPath + 'temp/light');
						if(existsConfJson){
							fileSystemService.nwMoveFile(dbDirPath + 'temp/conf.json', dbDirPath + 'conf.json', callback);
						}else if(existsLight && !existsConfJson){
							fileSystemService.nwWriteFile(dbDirPath + 'conf.json', JSON.stringify({bLight: true}, null, '\t'), callback);
						}else if(!existsLight && conf.bLight){
							var _conf = require(dbDirPath + 'conf.json');
							_conf.bLight = false;
							fileSystemService.nwWriteFile(dbDirPath + 'conf.json', JSON.stringify(_conf, null, '\t'), callback);
						}else{
							callback();
						}
					},
					function(callback) {
						fileSystemService.readdir(dbDirPath + 'temp/', function(err, fileNames) {
							async.forEach(fileNames, function(name, callback2) {
								fileSystemService.nwUnlink(dbDirPath + 'temp/' + name, callback2);
							}, function(err) {
								if(err) return callback(err);
								fileSystemService.nwRmDir(dbDirPath + 'temp/', function() {
									callback();
								});
							})
						});
					}
				], function(err) {
					cb(err);
				})
			});
		}
		
		function decrypt(buffer, password) {
			password = Buffer.from(password);
			var decipher = crypto.createDecipheriv('aes-256-ctr', crypto.pbkdf2Sync(password, '', 100000, 32, 'sha512'), crypto.createHash('sha1').update(password).digest().slice(0, 16));
			var arrChunks = [];
			var CHUNK_LENGTH = 2003;
			for (var offset = 0; offset < buffer.length; offset += CHUNK_LENGTH) {
				arrChunks.push(decipher.update(buffer.slice(offset, Math.min(offset + CHUNK_LENGTH, buffer.length)), 'utf8'));
			}
			arrChunks.push(decipher.final());
			return Buffer.concat(arrChunks);
		}
		
		function showError(text) {
			self.importing = false;
			self.error = text;
			$timeout(function() {
				$rootScope.$apply();
			});
			return false;
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
				}, function(err) {
					showError('Incorrect password or file');
				})
			}else {
				password = Buffer.from(password);
				var decipher = crypto.createDecipheriv('aes-256-ctr', crypto.pbkdf2Sync(password, '', 100000, 32, 'sha512'), crypto.createHash('sha1').update(password).digest().slice(0, 16));
				data.pipe(decipher).pipe(unzip.Extract({ path: fileSystemService.getDatabaseDirPath() + '/temp/' })).on('error', function(err) {
					if(err.message === "Invalid signature in zip file"){
						showError('Incorrect password or file');
					}else{
						showError(err);
					}
				}).on('finish', function() {
					setTimeout(function() {
						writeDBAndFileStoragePC(function(err) {
							if (err) return showError(err);
							self.importing = false;
							$rootScope.$emit('Local/ShowAlert', "Import successfully completed, please restart the application.", 'fi-check', function() {
								if (navigator && navigator.app)
									navigator.app.exitApp();
								else if (process.exit)
									process.exit();
							});
						});
					}, 100);
				});
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
		
		self.walletImport = function() {
			self.error = '';
			if(isMobile.Android() && self.androidVersion < 5){
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
					var backupDirPath = window.cordova.file.documentsDirectory + '/Byteball/';
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