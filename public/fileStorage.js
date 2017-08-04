var lodash = require('lodash');
var _dir, _fs;

var init = function(cb) {
	if (_dir) return cb(null, _fs, _dir);

	function onFileSystemSuccess(fileSystem) {
		console.log('File system started: ' + fileSystem.name + ', ' + fileSystem.root.name);
		_fs = fileSystem;
		getDir(function(err, newDir) {
			if (err || !newDir.nativeURL) return cb(err);
			_dir = newDir;
			console.log("Got main dir: " + _dir.nativeURL);
			return cb(null, _fs, _dir);
		});
	}

	function fail(evt) {
		var msg = 'Could not init file system: ' + evt.target.error.code;
		console.log(msg);
		return cb(msg);
	}

	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onFileSystemSuccess, fail);
};

// See https://github.com/apache/cordova-plugin-file/#where-to-store-files
var getDir = function(cb) {
	if (!cordova.file) {
		return cb('Could not write on device storage');
	}

	var url = cordova.file.dataDirectory;
	// This could be needed for windows
	// if (cordova.file === undefined) {
	//   url = 'ms-appdata:///local/';
	window.resolveLocalFileSystemURL(url, function(dir) {
		return cb(null, dir);
	}, function(err) {
		console.warn(err);
		return cb(err || 'Could not resolve filesystem:' + url);
	});
};

var get = function(k, cb) {
	init(function(err, fs, dir) {
		if (err) return cb(err);
		dir.getFile(k, {
			create: false
		}, function(fileEntry) {
			if (!fileEntry) return cb();
			fileEntry.file(function(file) {
				var reader = new FileReader();

				reader.onloadend = function(e) {
					if (this.result)
						console.log("Read: " + this.result);
					return cb(null, this.result)
				};

				reader.readAsText(file);
			});
		}, function(err) {
			// Not found
			if (err.code === 1) return cb();
			else return cb(err);
		});
	})
};

var set = function(k, v, cb) {
	init(function(err, fs, dir) {
		if (err) return cb(err);
		dir.getFile(k, {
			create: true
		}, function(fileEntry) {
			// Create a FileWriter object for our FileEntry (log.txt).
			fileEntry.createWriter(function(fileWriter) {

				fileWriter.onwriteend = function(e) {
					console.log('Write completed.');
					return cb();
				};

				fileWriter.onerror = function(e) {
					var err = e.error ? e.error : JSON.stringify(e);
					console.log('Write failed: ' + err);
					return cb('Fail to write:' + err);
				};

				if (lodash.isObject(v))
					v = JSON.stringify(v);

				if (!lodash.isString(v)) {
					v = v.toString();
				}

				console.log('Writing: '+k+'='+v);
				fileWriter.write(v);

			}, cb);
		}, cb);
	});
};

exports.init = init;
exports.get = get;
exports.set = set;
