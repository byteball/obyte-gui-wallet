#!/usr/bin/env node

const {spawnSync} = require('child_process');
const fs = require('fs');

process.chdir('node_modules/secp256k1')
const flagFile = '.rebuilt';

try {
	if (fs.existsSync(flagFile)) {
		console.log('secp256k1 was already rebuilt for NW.js, skipping this step.')
		return;
	}
} catch(err) {}

console.log(`rebuilding secp256k1 for NW.js version ${process.env.npm_package_build_nwVersion}...`)
spawnSync('npx', ['-q', 'nw-gyp', 'rebuild' ,`--target=${process.env.npm_package_build_nwVersion}`], {stdio: 'inherit'});
fs.writeFileSync(flagFile, '');
