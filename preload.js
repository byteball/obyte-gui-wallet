const Module = require("module");

const BLOCKED = ["child_process", "cluster", "worker_threads", "vm"];

const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
	if (request === "child_process") {
		var parentPath = parent && parent.filename ? parent.filename : "";
		// Allow internal node_modules (e.g. mail.js) to use the real child_process
		if (parentPath.includes("node_modules")) {
			return originalLoad.call(this, request, parent, isMain);
		}
		console.warn(
			"[Security] child_process stubbed for: " +
				(parentPath || "renderer"),
		);
		var noop = function () {};
		return {
			exec: noop,
			execSync: function () {
				return "";
			},
			spawn: noop,
			spawnSync: function () {
				return { stdout: "", stderr: "", status: 0 };
			},
			fork: noop,
			execFile: noop,
			execFileSync: function () {
				return "";
			},
		};
	}
	if (BLOCKED.includes(request)) {
		var parentPath = parent && parent.filename ? parent.filename : "";
		if (parentPath.includes("node_modules")) {
			return originalLoad.call(this, request, parent, isMain);
		}
		console.warn(
			"[Security] " + request + " blocked for: " + (parentPath || "renderer"),
		);
		return {};
	}
	return originalLoad.call(this, request, parent, isMain);
};

Object.defineProperty(Module, "_load", {
	writable: false,
	configurable: false,
});
