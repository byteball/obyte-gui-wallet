var Module = require('module');

var BLOCKED = new Set(['child_process', 'cluster', 'worker_threads', 'vm', 'dgram']);
var ALLOWED_CALLERS = [];

var noop = function() {};
var childProcessStub = {
	exec: noop, execSync: function() { return ''; },
	spawn: noop, spawnSync: function() { return { stdout: '', stderr: '', status: 0 }; },
	fork: noop, execFile: noop, execFileSync: function() { return ''; }
};

var originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
	var clean = request.replace(/['+\s]/g, '');
	if (BLOCKED.has(clean)) {
		var parentPath = parent && parent.filename ? parent.filename : '';
		for (var i = 0; i < ALLOWED_CALLERS.length; i++) {
			if (parentPath.indexOf(ALLOWED_CALLERS[i]) !== -1) {
				return originalLoad.call(this, request, parent, isMain);
			}
		}
		console.warn('[Security] Blocked require:', request, 'from:', parentPath);
		if (clean === 'child_process') return childProcessStub;
		return {};
	}
	return originalLoad.call(this, request, parent, isMain);
};

Object.defineProperty(Module, '_load', { writable: false, configurable: false });
