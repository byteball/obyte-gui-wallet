'use strict';

angular.module('copayApp.controllers').controller('exportController',
	function($rootScope, $scope, $timeout, $log, backupService, storageService, fileSystemService, isCordova, isMobile, gettextCatalog, notification) {

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
		self.exported = false;
		self.isCordova = isCordova;
		self.bCompression = false;

		function addDBAndConfToZip(cb) {
			var dbDirPath = fileSystemService.getDatabaseDirPath() + '/';
			fileSystemService.readdir(dbDirPath, function(err, listFilenames) {
				if (err) return cb(err);
				listFilenames = listFilenames.filter(function(name) {
					return (name == 'conf.json' || /\.sqlite/.test(name));
				});
				var getFileOrPath = isCordova ? fileSystemService.readFile : fileSystemService.getPath;
				async.forEachSeries(listFilenames, function(name, callback) {
					getFileOrPath(dbDirPath + '/' + name, function(err, data) {
						if (err) return callback(err);
						zip.file(name, data);
						callback();
					});
				}, cb);
			});
		}

		function saveFile(file, cb) {
			var backupFilename = 'ByteballBackup' + Date.now() + '.encrypted';
			if (!isCordova) {
				var a = angular.element('<input type="file" nwsaveas="' + backupFilename + '" />');
				a[0].click();
				a.bind('change', function() {
					cb(this.value);
				})
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
			self.exported = false;
			self.error = text;
			$timeout(function() {
				$rootScope.$apply();
			});
			return false;
		}

		self.walletExportPC = function(connection) {
			saveFile(null, function(path) {
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
								var db = require('byteballcore/db');
								db.unlockConnect(connection, function() {
									self.exported = false;
									$timeout(function() {
										$rootScope.$apply();
										notification.success(gettextCatalog.getString('Success'), gettextCatalog.getString('Export completed successfully', {}));
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
					zip.file('profile', JSON.stringify(profile));
					zip.file('config', config);
					zip.file('light', 'true');
					addDBAndConfToZip(function(err) {
						if (err) return showError(err);
						var zipParams = {type: "nodebuffer", compression: 'DEFLATE', compressionOptions: {level: 9}};
						zip.generateAsync(zipParams).then(function(zipFile) {
							saveFile(encrypt(zipFile, self.password), function(err) {
								var db = require('byteballcore/db');
								db.unlockConnect(connection, function() {
									if (err) return showError(err);
									self.exported = false;
									$timeout(function() {
										$rootScope.$apply();
										notification.success(gettextCatalog.getString('Success'), gettextCatalog.getString('Export completed successfully', {}));
									});
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
			self.exported = true;
			self.error = '';
			var db = require('byteballcore/db');
			db.lockConnect(function(connection) {
				if (isCordova) {
					self.walletExportCordova(connection)
				} else {
					self.walletExportPC(connection);
				}
			});
		}
	});