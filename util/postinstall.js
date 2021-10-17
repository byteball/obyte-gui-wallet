#!/usr/bin/env node

const {spawnSync, fork} = require('child_process');
const fs = require('fs');
const flagFile = '.rebuilt';
const npx = process.platform == "win32" ? 'npx.cmd' : 'npx';

process.chdir('node_modules/secp256k1')
if (fs.existsSync(flagFile)) {
	console.log('secp256k1 was already rebuilt for NW.js, skipping this step.')
} else {
	console.log(`rebuilding secp256k1 for NW.js version ${process.env.npm_package_build_nwVersion}...`)
	let res = spawnSync(npx, [
			'--yes',
			'nw-gyp',
			'rebuild',
			'--build-from-source',
			'--runtime=node-webkit',
			'--target_arch=x64',
			'-j', '8',
			`--target=${process.env.npm_package_build_nwVersion}`], {stdio: 'inherit'});
	if (!res.error)
		fs.writeFileSync(flagFile, '');
}

if (process.platform == "win32") {
	process.chdir('../sqlite3')
	if (fs.existsSync(flagFile)) {
		console.log('sqlite3 was already rebuilt for NW.js, skipping this step.')
	} else {
		console.log(`rebuilding sqlite3 for NW.js version ${process.env.npm_package_build_nwVersion}...`)
		let res = spawnSync(npx, [
			'--yes',
			'node-pre-gyp',
			'rebuild',
			'--build-from-source',
			'--runtime=node-webkit',
			'--target_arch=x64',
			'-j', '8',
			`--target=${process.env.npm_package_build_nwVersion}`], {stdio: 'inherit'});
		if (!res.error)
			fs.writeFileSync(flagFile, '');
	}

	process.chdir('../rocksdb')
	if (fs.existsSync(flagFile)) {
		console.log('rocksdb was already rebuilt for NW.js, skipping this step.')
	} else {
		console.log(`rebuilding rocksdb for NW.js version ${process.env.npm_package_build_nwVersion}...`)
		let res = spawnSync(npx, [
			'--yes',
			'nw-gyp',
			'rebuild',
			'--build-from-source',
			'--runtime=node-webkit',
			'--target_arch=x64',
			'--no-clang',
			'-j', '8',
			`--target=${process.env.npm_package_build_nwVersion}`], {stdio: 'inherit'});
		if (!res.error)
			fs.writeFileSync(flagFile, '');
	}
}

// linux: gcc g++ python
// windows: python2.7 visual studio 2015
