'use strict';

angular.module('copayApp.controllers').controller('exportController',
	function($rootScope, $scope, $timeout, $log, backupService, storageService, fileSystemService, isCordova, isMobile, gettextCatalog, notification) {
		
		var async = require('async');
		var JSZip = require("jszip");
		var crypt = require('crypto');
		var conf = require('byteballcore/conf');
		var zip = new JSZip();
		
		var self = this;
		self.error = null;
		self.success = null;
		self.password = null;
		self.repeatpassword = null;
		self.exported = false;
		self.isCordova = isCordova;
		self.bCompression = false;
		
		function addingDBAndConfToZip(cb) {
			var dbDirPath = fileSystemService.getDatabaseDirPath() + '/';
			fileSystemService.getListFilesAndFolders(dbDirPath, function(err, listFilenames) {
				if (err) return cb(err);
				listFilenames = listFilenames.filter(function(name) {
					return (name == 'conf.json' || /\.sqlite/.test(name));
				});
				async.forEachSeries(listFilenames, function(name, callback) {
					fileSystemService.readFile(dbDirPath + '/' + name, function(err, data) {
						if (err) return callback(err);
						zip.file(name, data);
						callback();
					});
				}, cb);
			});
		}
		
		function saveFile(file, cb) {
			var nameBackupFile = 'backupWallet ' + Date.now();
			if (!isCordova) {
				var a = angular.element('<input type="file" nwsaveas="' + nameBackupFile + '" />');
				a[0].click();
				a.bind('change', function() {
					fileSystemService.nwWriteFile(this.value, file, function(err) {
						cb(err);
					});
				})
			}
			else {
				fileSystemService.cordovaWriteFile((isMobile.iOS() ? window.cordova.file.documentsDirectory: window.cordova.file.externalRootDirectory), 'Byteball', nameBackupFile, file, function(err) {
					cb(err);
				});
			}
		}
		
		function encrypt(buffer, password) {
			var cipher = crypt.createCipher('aes-256-ctr', crypt.createHash('sha1').update(password).digest('hex'));
			return Buffer.concat([cipher.update(buffer), cipher.final()]);
		}
		
		function showError(text) {
			self.exported = false;
			self.error = text;
			$timeout(function() {
				$rootScope.$apply();
			});
			return false;
		}
		
		self.walletExport = function() {
			self.exported = true;
			self.error = '';
			storageService.getProfile(function(err, profile) {
				storageService.getConfig(function(err, config) {
					zip.file('profile', JSON.stringify(profile));
					zip.file('config', config);
					if (isCordova || conf.bLight) zip.file('light', 'true');
					addingDBAndConfToZip(function(err) {
						if (err) return showError(err);
						var zipParams = {type: "nodebuffer"};
						if (isCordova) {
							zipParams = {type: "nodebuffer", compression: 'DEFLATE', compressionOptions: {level: 9}};
						}
						else if (!isCordova && self.bCompression) {
							zipParams = {type: "nodebuffer", compression: 'DEFLATE', compressionOptions: {level: 6}};
						}
						zip.generateAsync(zipParams).then(function(zipFile) {
							saveFile(encrypt(zipFile, self.password), function(err) {
								if (err) return showError();
								self.exported = false;
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
		}
	});