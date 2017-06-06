var fs = require('fs');
var PROJECT = process.argv[2];
var file = fs.readFileSync(PROJECT + '/www/index.html').toString();

file = file
	.replace('<div class="page"', '<div class="page" style="display:none"')
	.replace('<!-- PLACEHOLDER: LIGHT CLIENT HTML -->', fs.readFileSync(PROJECT + '/www/lightClient.html'))
	.replace('<!-- PLACEHOLDER: CORDOVA SRIPT -->', '<script type="text/javascript" charset="utf-8" src="cordova.js"></script>')
	.replace('<script src="angular.js"></script>', '')
	.replace('<script src="byteball.js"></script>', '<script src="light.js" id="lightScript"></script>')
	.replace('<body ng-cloak class="ng-cloak">', '<body>');

fs.writeFileSync(PROJECT + '/www/index.html', file);