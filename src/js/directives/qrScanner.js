'use strict';

var breadcrumbs = require('ocore/breadcrumbs.js');

angular.module('copayApp.directives')
    .directive('qrScanner', ['$rootScope', '$timeout', '$modal', 'isCordova', 'gettextCatalog',
      function($rootScope, $timeout, $modal, isCordova, gettextCatalog) {

        var controller = function($scope) {

          $scope.cordovaOpenScanner = function() {
            window.ignoreMobilePause = true;
            window.plugins.spinnerDialog.show(null, gettextCatalog.getString('Preparing camera...'), true);
            $timeout(function() {
              cordova.plugins.barcodeScanner.scan(
                  function onSuccess(result) {
                    $timeout(function() {
                      window.plugins.spinnerDialog.hide();
                      window.ignoreMobilePause = false;
                    }, 100);
                    if (result.cancelled) return;

                    $timeout(function() {
                      var data = result.text;
                      $scope.onScan({ data: data });
                    }, 1000);
                  },
                  function onError(error) {
                    $timeout(function() {
                      window.ignoreMobilePause = false;
                      window.plugins.spinnerDialog.hide();
                    }, 100);
                    alert('Scanning error');
                  }
              );
              if ($scope.beforeScan) {
                $scope.beforeScan();
              }
            }, 100);
          };

          $scope.modalOpenScanner = function() {
            var parentScope = $scope;
            var ModalInstanceCtrl = function($scope, $rootScope, $modalInstance) {
              // QR code Scanner
              var video;
              var canvas;
              var $video;
              var context;
              var localMediaStream;
              var prevResult;
              let closed = false;
              let scanTimer;
              let initTimer;

              var _scan = function(evt) {
                if (closed) return;
                if (localMediaStream) {
                  context.drawImage(video, 0, 0, 300, 225);
                  try {
                    qrcode.decode();
                  } catch (e) {
                    //qrcodeError(e);
                  }
                }
                if (!closed)
                  scanTimer = $timeout(_scan, 800);
              };

              var _scanStop = function() {
                if (closed) return;
                closed = true;
                $timeout.cancel(scanTimer);
                $timeout.cancel(initTimer);
                if (localMediaStream && localMediaStream.active) {
                  var localMediaStreamTrack = localMediaStream.getTracks();
                  for (var i = 0; i < localMediaStreamTrack.length; i++) {
                    localMediaStreamTrack[i].stop();
                  }
                } else {
                  try {
                    localMediaStream.stop();
                  } catch(e) {
                    // Older Chromium not support the STOP function
                  };
                }
                localMediaStream = null;
				if (video) {
					video.srcObject = null;
					video.src = '';
				}
                if (qrcode.callback === onDecode)
                  qrcode.callback = angular.noop;
              };

              function onDecode(data) {
                if (closed) return;
                if (prevResult != data) {
                  prevResult = data;
                  return;
                }
                _scanStop();
                $modalInstance.close(data);
              }
              qrcode.callback = onDecode;
              $scope.$on('$destroy', _scanStop);
              $modalInstance.result.then(_scanStop, _scanStop);

              var _successCallback = function(stream) {
                if (closed) {
                  stream.getTracks().forEach(function(track) { track.stop(); });
                  return;
                }
				if (process.versions['node-webkit'] === '0.14.7')
                	video.src = (window.URL && window.URL.createObjectURL(stream)) || stream;
				else // newer versions of chrome
					video.srcObject = stream;
                localMediaStream = stream;
                video.play();
                scanTimer = $timeout(_scan, 1000);
              };

              var _videoError = function(err) {
				breadcrumbs.add('qr scanner video error');
                $scope.cancel();
              };

              var setScanner = function() {
                navigator.getUserMedia = navigator.getUserMedia ||
                    navigator.webkitGetUserMedia || navigator.mozGetUserMedia ||
                    navigator.msGetUserMedia;
                window.URL = window.URL || window.webkitURL ||
                    window.mozURL || window.msURL;
              };

              $scope.init = function() {
                setScanner();
                initTimer = $timeout(function() {
                  if (closed) return;
                  if (parentScope.beforeScan) {
                    parentScope.beforeScan();
                  }
                  canvas = document.getElementById('qr-canvas');
				  if (!canvas)
					  return;
                  context = canvas.getContext('2d');


                  video = document.getElementById('qrcode-scanner-video');
                  $video = angular.element(video);
                  canvas.width = 300;
                  canvas.height = 225;
                  context.clearRect(0, 0, 300, 225);

                  navigator.getUserMedia({
                    video: true
                  }, _successCallback, _videoError);
                }, 500);
              };

              $scope.cancel = function() {
				breadcrumbs.add('qr scanner cancel');
                _scanStop();
				try{
                	$modalInstance.dismiss('cancel');
				}
				catch(e){
					e.bIgnore = true;
				//	throw e;
				}
              };
            };

            var modalInstance = $modal.open({
              transient: true,
              templateUrl: 'views/modals/scanner.html',
              windowClass: 'full',
              controller: ModalInstanceCtrl,
              backdrop : 'static',
              keyboard: false
            });
            modalInstance.result.then(function(data) {
              parentScope.onScan({ data: data });
            }, angular.noop);

          };

          $scope.openScanner = function() {
            if (isCordova) {
              $scope.cordovaOpenScanner();
            }
            else {
              $scope.modalOpenScanner();
            }
          };
        };

        return {
          restrict: 'E',
          scope: {
            onScan: "&",
            beforeScan: "&"
          },
          controller: controller,
          replace: true,
          template: '<a id="camera-icon" class="p10" ng-click="openScanner()"><i class="icon-scan size-21" style="display: flex;margin-bottom: 2px"></i></a>'
        }
      }
    ]);
