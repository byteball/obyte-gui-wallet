'use strict';

angular.module('copayApp.controllers').controller('preferencesTorController',
	function($scope, $log, $timeout, go, configService) {
		
		var conf = require('byteballcore/conf.js');
		var network = require('byteballcore/network.js');
		
		var bInitialized = false;
		
		var root = {};
		root.socksHost = null;
		root.socksPort = null;
		root.socksLocalDNS = false;
		
		$scope.errorHostInput = '';
		$scope.errorPortInput = '';
		
		$scope.torEnabled = conf.socksHost && conf.socksPort;
		configService.get(function(err, confService) {
			$scope.socksHost = conf.socksHost || confService.socksHost || '127.0.0.1';
			$scope.socksPort = conf.socksPort || confService.socksPort || '9150';
		});
		
		function setConfAndCloseConnections() {
			conf.socksHost = root.socksHost;
			conf.socksPort = root.socksPort;
			conf.socksLocalDNS = root.socksLocalDNS;
			network.closeAllWsConnections();
		}
		
		function saveConfToFile(cb) {
			var fs = require('fs' + '');
			var desktopApp = require('byteballcore/desktop_app.js');
			var appDataDir = desktopApp.getAppDataDir();
			var confJson;
			try {
				confJson = require(appDataDir + '/conf.json');
			} catch (e) {
				confJson = {};
			}
			confJson.socksHost = root.socksHost;
			confJson.socksPort = root.socksPort;
			confJson.socksLocalDNS = root.socksLocalDNS;
			fs.writeFile(appDataDir + '/conf.json', JSON.stringify(confJson, null, '\t'), 'utf8', function(err) {
				if (err) {
					$scope.$emit('Local/DeviceError', err);
					return;
				}
				cb();
			});
		}
		
		
		$scope.save = function(close, oldVal) {
			$scope.socksHost = (!$scope.socksHost) ? '127.0.0.1' : $scope.socksHost;
			$scope.socksPort = (!$scope.socksPort) ? 9150 : parseInt($scope.socksPort);
			if (!$scope.socksPort || !($scope.socksPort > 0 && $scope.socksPort <= 65535)) {
				$scope.errorPortInput = 'Port is invalid';
				if(!close && !oldVal) $scope.torEnabled = false;
				return;
			}
			$scope.errorPortInput = '';
			root.socksHost = $scope.torEnabled ? $scope.socksHost : null;
			root.socksPort = $scope.torEnabled ? $scope.socksPort : null;
			setConfAndCloseConnections();
			saveConfToFile(function() {
				configService.set({
					socksHost: $scope.socksHost,
					socksPort: $scope.socksPort
				}, function(err) {
					if (err) {
						$scope.$emit('Local/DeviceError', err);
						return;
					}
					if (close) {
						$timeout(function() {
							go.path('preferencesGlobal');
						}, 50);
					}
				});
			});
		};
		
		
		var unwatchTorEnabled = $scope.$watch('torEnabled', function(newVal, oldVal) {
			if (!bInitialized) {
				bInitialized = true;
				return;
			}
			$scope.save(false, oldVal);
		});
		
		$scope.$on('$destroy', function() {
			unwatchTorEnabled();
		});
		
	});
