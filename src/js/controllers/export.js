'use strict';

angular.module('copayApp.controllers').controller('exportController',
	function($rootScope, $scope, $timeout, $log, $filter, backupService, storageService, fileSystemService, isCordova, isMobile, gettextCatalog, notification) {

		var async = require('async');
		var crypto = require('crypto');
		var conf = require('byteballcore/conf');
		var zip;
		if (isCordova) {
			var JSZip = require("jszip");
			zip = new JSZip();
		} else {
			var _zip = require('zip' + '');
			zip = null;
		}

		var self = this;
		self.error = null;
		self.success = null;
		self.password = null;
		self.repeatpassword = null;
		self.exporting = false;
		self.isCordova = isCordova;
		self.bCompression = false;
		self.connection = null;

		function addDBAndConfToZip(cb) {
			var dbDirPath = fileSystemService.getDatabaseDirPath() + '/';
			fileSystemService.readdir(dbDirPath, function(err, listFilenames) {
				if (err) return cb(err);
				listFilenames = listFilenames.filter(function(name) {
					return (name == 'conf.json' || /\.sqlite/.test(name));
				});
				if(isCordova) {
					async.forEachSeries(listFilenames, function(name, callback) {
						fileSystemService.readFile(dbDirPath + '/' + name, function(err, data) {
							if (err) return callback(err);
							zip.file(name, data);
							callback();
						});
					}, cb);
				}else{
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

		function checkValueFileAndChangeStatusExported() {
			$timeout(function() {
				var inputFile = document.getElementById('nwExportInputFile');
				var value = inputFile ? inputFile.value : null;
				if(!value && self.exporting){
					self.exporting = false;
					$timeout(function() {
						$rootScope.$apply();
					});
				}
				if(!value && self.connection){
					self.connection.release();
					self.connection = false;
				}
				window.removeEventListener('focus', checkValueFileAndChangeStatusExported, true);
			}, 1000);
		}


		function saveFile(file, cb) {
			var backupFilename = 'ByteballBackup-' + $filter('date')(Date.now(), 'yyyy-MM-dd-HH-mm-ss') + '.encrypted';
			if (!isCordova) {
				var inputFile = document.getElementById('nwExportInputFile');
				inputFile.setAttribute("nwsaveas", backupFilename);
				inputFile.click();
				window.addEventListener('focus', checkValueFileAndChangeStatusExported, true);
				inputFile.onchange = function() {
					cb(this.value);
				};
			}
			else {
				fileSystemService.cordovaWriteFile((isMobile.iOS() ? window.cordova.file.documentsDirectory : window.cordova.file.externalRootDirectory), 'Byteball', backupFilename, file, function(err) {
					cb(err);
				});
			}
		}

		function encrypt(buffer, password) {
			password = Buffer.from(password);
			var cipher = crypto.createCipheriv('aes-256-ctr', crypto.pbkdf2Sync(password, '', 100000, 32, 'sha512'), crypto.createHash('sha1').update(password).digest().slice(0, 16));
			var arrChunks = [];
			var CHUNK_LENGTH = 2003;
			for (var offset = 0; offset < buffer.length; offset += CHUNK_LENGTH) {
				arrChunks.push(cipher.update(buffer.slice(offset, Math.min(offset + CHUNK_LENGTH, buffer.length)), 'utf8'));
			}
			arrChunks.push(cipher.final());
			return Buffer.concat(arrChunks);
		}

		function showError(text) {
			self.exporting = false;
			self.error = text;
			$timeout(function() {
				$rootScope.$apply();
			});
			return false;
		}

		self.walletExportPC = function(connection) {
			self.connection = connection;
			saveFile(null, function(path) {
				if(!path) return;
				var password = Buffer.from(self.password);
				var cipher = crypto.createCipheriv('aes-256-ctr', crypto.pbkdf2Sync(password, '', 100000, 32, 'sha512'), crypto.createHash('sha1').update(password).digest().slice(0, 16));
				zip = new _zip(path, {
					compressed: self.bCompression ? 6 : 0,
					cipher: cipher
				});
				storageService.getProfile(function(err, profile) {
					storageService.getConfig(function(err, config) {
						zip.text('profile', JSON.stringify(profile));
						zip.text('config', config);
						if (conf.bLight) zip.text('light', 'true');
						addDBAndConfToZip(function(err) {
							if (err) return showError(err);
							zip.end(function() {
								connection.release();
								self.connection = null;
								self.exporting = false;
								$timeout(function() {
									$rootScope.$apply();
									notification.success(gettextCatalog.getString('Success'), gettextCatalog.getString('Export completed successfully', {}));
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
					zip.file('profile', JSON.stringify(profile));
					zip.file('config', config);
					zip.file('light', 'true');
					addDBAndConfToZip(function(err) {
						if (err) return showError(err);
						var zipParams = {type: "nodebuffer", compression: 'DEFLATE', compressionOptions: {level: 9}};
						zip.generateAsync(zipParams).then(function(zipFile) {
							saveFile(encrypt(zipFile, self.password), function(err) {
								connection.release();
								if (err) return showError(err);
								self.exporting = false;
								$timeout(function() {
									$rootScope.$apply();
									notification.success(gettextCatalog.getString('Success'), gettextCatalog.getString('Export completed successfully', {}));
								});
							})
						}, function(err) {
							showError(err);
						})
					});
				});
			});
		};

		self.walletExport = function() {
			self.exporting = true;
			self.error = '';
			var db = require('byteballcore/db');
			db.takeConnectionFromPool(function(connection) {
				if (isCordova) {
					self.walletExportCordova(connection);
				} else {
					self.walletExportPC(connection);
				}
			});
		}
	});