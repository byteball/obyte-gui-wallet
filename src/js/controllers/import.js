'use strict';

angular.module('copayApp.controllers').controller('importController',
	function($scope, $rootScope, $location, $timeout, $log, storageService, fileSystemService, isCordova, isMobile) {
		
		var JSZip = require("jszip");
		var async = require('async');
		var crypt = require('crypto');
		var conf = require('byteballcore/conf');
		var zip = new JSZip();
		
		var self = this;
		self.imported = false;
		self.password = '';
		self.error = '';
		self.iOs = isMobile.iOS();
		self.arrBackupFiles = [];
		
		function generateListFilesForIos() {
			var backupDirPath = window.cordova.file.documentsDirectory + '/';
			fileSystemService.getListFilesAndFolders(backupDirPath, function(err, listFilenames) {
				listFilenames.forEach(function(name) {
					var dateNow = parseInt(name.split(' ')[1]);
					self.arrBackupFiles.push({
						name: name.replace(dateNow, new Date(dateNow).toLocaleString()),
						originalName: name,
						time: dateNow
					})
				});
				$timeout(function() {
					$rootScope.$apply();
				});
			});
		}
		
		if (self.iOs) generateListFilesForIos();
		
		function writeDBAndFileStorage(zip, cb) {
			var db = require('byteballcore/db');
			var dbDirPath = fileSystemService.getDatabaseDirPath() + '/';
			db.close(function() {
			});
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
				else if (key == 'conf.json' && !isCordova) {
					zip.file(key).async('string').then(function(data) {
						fileSystemService.nwWriteFile(dbDirPath + key, data, callback);
					});
				}
				else if (/\.sqlite/.test(key)) {
					zip.file(key).async('nodebuffer').then(function(data) {
						if (isCordova) {
							fileSystemService.cordovaWriteFile(dbDirPath, null, key, data, callback);
						}
						else {
							fileSystemService.nwWriteFile(dbDirPath + key, data, callback);
						}
					});
				}
				else {
					callback();
				}
			}, function(err) {
				if (err) return cb(err);
				if (!isCordova && zip.file('light') && !zip.file('conf.json')) {
					fileSystemService.nwWriteFile(dbDirPath + 'conf.json', JSON.stringify({bLight: true}, null, '\t'), cb);
				}
				else if (!isCordova && !zip.file('light') && conf.bLight) {
					var _conf = require(dbDirPath + 'conf.json');
					_conf.bLight = false;
					fileSystemService.nwWriteFile(dbDirPath + 'conf.json', JSON.stringify(_conf, null, '\t'), cb);
				}
				else {
					return cb();
				}
			});
		}
		
		function decrypt(buffer, password) {
			var decipher = crypt.createDecipher('aes-256-ctr', crypt.createHash('sha1').update(password).digest('hex'));
			return Buffer.concat([decipher.update(buffer), decipher.final()]);
		}
		
		function showError(text) {
			self.imported = false;
			self.error = text;
			$timeout(function() {
				$rootScope.$apply();
			});
			return false;
		}
		
		function unzipAndWriteFiles(data, password) {
			zip.loadAsync(decrypt(data, password)).then(function(zip) {
				if (isCordova && !zip.file('light')) {
					self.imported = false;
					self.error = 'Mobile version supports only light wallets.';
					$timeout(function() {
						$rootScope.$apply();
					});
				}
				else {
					writeDBAndFileStorage(zip, function(err) {
						if (err) return showError(err);
						self.imported = false;
						$rootScope.$emit('Local/ShowAlert', "Import successfully completed, please restart the application.", 'fi-alert', function() {
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
		}
		
		self.walletImport = function() {
			self.imported = true;
			self.error = '';
			fileSystemService.readFileFromForm($scope.file, function(err, data) {
				if (err) return showError(err);
				unzipAndWriteFiles(data, self.password);
			});
		};
		
		self.iosWalletImportFromFile = function(fileName) {
			$rootScope.$emit('Local/NeedsPassword', false, null, function(err, password) {
				if (password) {
					var backupDirPath = window.cordova.file.documentsDirectory + '/';
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