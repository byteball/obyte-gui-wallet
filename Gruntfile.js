module.exports = function(grunt) {
  // Project Configuration
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    exec: {
      version: {
        command: 'node ./util/version.js'
      },
      clear: {
        command: 'rm -Rf node_modules yarn.lock'
      },
      osx64: {
        command: "../obytebuilds/"+process.env.npm_package_version+"-mac-x64/build-osx.sh osx64"
      }
    },
    watch: {
      options: {
        dateFormat: function(time) {
          grunt.log.writeln('The watch finished in ' + time + 'ms at ' + (new Date()).toString());
          grunt.log.writeln('Waiting for more changes...');
        },
      },
      css: {
        files: ['src/css/*.css'],
        tasks: ['concat:css']
      },
      main: {
        files: [
          'src/js/polyfills.js',
          'src/js/init.js',
          'src/js/app.js',
          'src/js/directives/*.js',
          'src/js/filters/*.js',
          'src/js/routes.js',
          'src/js/services/*.js',
          'src/js/models/*.js',
          'src/js/controllers/*.js'
        ],
        tasks: ['concat:js']
      }
    },
    concat: {
      options: {
        sourceMap: false,
        sourceMapStyle: 'link' // embed, link, inline
      },
      angular: {
        src: [
          'node_modules/@bower_components/fastclick/lib/fastclick.js',
          'node_modules/@bower_components/qrcode-generator/js/qrcode.js',
          'node_modules/@bower_components/qrcode-decoder-js/lib/qrcode-decoder.js',
          'node_modules/@bower_components/moment/min/moment-with-locales.js',
          'node_modules/@bower_components/angular/angular.js',
          'node_modules/@bower_components/angular-ui-router/release/angular-ui-router.js',
          'node_modules/@bower_components/angular-foundation/mm-foundation-tpls.js',
          'node_modules/@bower_components/angular-moment/angular-moment.js',
          'node_modules/@bower_components/ng-lodash/build/ng-lodash.js',
          'node_modules/@bower_components/angular-qrcode/angular-qrcode.js',
          'node_modules/@bower_components/angular-gettext/dist/angular-gettext.js',
          'node_modules/@bower_components/angular-touch/angular-touch.js',
          'node_modules/@bower_components/angular-carousel/dist/angular-carousel.js',
          'node_modules/@bower_components/angular-ui-switch/angular-ui-switch.js',
          'node_modules/@bower_components/angular-elastic/elastic.js',
          'node_modules/@bower_components/ui-router-extras/release/ct-ui-router-extras.js',
          'node_modules/@bower_components/markdown-it/dist/markdown-it.min.js',
          'node_modules/@bower_components/chart.js/dist/Chart.min.js',
          'node_modules/@bower_components/chartjs-plugin-datalabels/dist/chartjs-plugin-datalabels.min.js'
        ],
        dest: 'public/angular.js'
      },
      js: {
        src: [
          'src/js/polyfills.js',
          'angular-bitcore-wallet-client/index.js',
          'src/js/app.js',
          'src/js/routes.js',
          'src/js/directives/*.js',
          'src/js/filters/*.js',
          'src/js/models/*.js',
          'src/js/services/*.js',
          'src/js/controllers/*.js',
          'src/js/version.js',
          'src/js/init.js'
        ],
        dest: 'public/obyte.js'
      },
      css: {
        src: ['src/css/*.css'],
        dest: 'public/css/obyte.css'
      },
      foundation: {
        src: [
          'node_modules/@bower_components/angular/angular-csp.css',
          'node_modules/@bower_components/foundation/css/foundation.css',
          'node_modules/@bower_components/animate.css/animate.css',
          'node_modules/@bower_components/angular-ui-switch/angular-ui-switch.css',
          'node_modules/@bower_components/angular-carousel/dist/angular-carousel.css'
        ],
        dest: 'public/css/foundation.css',
      }
    },
    uglify: {
      options: {
        mangle: false
      },
      prod: {
        files: {
          'public/obyte.js': ['public/obyte.js'],
          'public/angular.js': ['public/angular.js']
        }
      },
	  partialClient: {
        files: {
          'public/partialClient.js': ['public/partialClient.js']
        }
      }
    },
    babel: {
      options: {
        sourceMaps: false,
        presets: ['@babel/preset-env']
      },
      prod: {
        files: {
          'public/obyte.js': 'public/obyte.js',
        //  'public/angular.js': 'public/angular.js',
          'public/partialClient.js': 'public/partialClient.js'
        }
      },
    },
    nggettext_extract: {
      pot: {
        files: {
          'i18n/po/template.pot': [
            'public/index.html', 
            'public/views/*.html', 
            'public/views/**/*.html',
            'src/js/routes.js',
            'src/js/services/*.js',
            'src/js/controllers/*.js'
          ]
        }
      },
    },
    nggettext_compile: {
      all: {
        options: {
		  format: "json",
          module: 'copayApp'
        },
		files: [
			{
				expand: true,
				dot: true,
				cwd: "i18n/po",
				dest: "public/languages",
				src: ["*.po"],
				ext: ".json"
			}
		]
      },
    },
    copy: {
      icons: {
        expand: true,
        flatten: true,
        src: 'node_modules/@bower_components/foundation-icon-fonts/foundation-icons.*',
        dest: 'public/icons/'
      },
      modules: {
        expand: true,
        flatten: true,
        options: {timestamp: true, mode: true},
        src: ['src/js/fileStorage.js'],
        dest: 'public/'
      },
      osx: {
        expand: true,
        flatten: true,
        options: {timestamp: true, mode: true},
        src: ['webkitbuilds/build-osx.sh', 'webkitbuilds/app.entitlements', 'webkitbuilds/Background.png'],
        dest: "../obytebuilds/"+process.env.npm_package_version+"-mac-x64"
      },
      linux64: {
		options: {timestamp: true, mode: true},
        files: [
          {expand: true, cwd: './webkitbuilds/', src: ['obyte.desktop', '../public/img/icons/logo-circle.ico', '../public/img/icons/logo-circle-256.png'], dest: "../obytebuilds/"+process.env.npm_package_version+"-linux-x64/", flatten: true, filter: 'isFile', options: {timestamp: true, mode: true} }
        ],
      },
      linux32: {
		options: {timestamp: true, mode: true},
        files: [
          {expand: true, cwd: './webkitbuilds/', src: ['obyte.desktop', '../public/img/icons/logo-circle.ico', '../public/img/icons/logo-circle-256.png'], dest: "../obytebuilds/"+process.env.npm_package_version+"-linux-x86/", flatten: true, filter: 'isFile', options: {timestamp: true, mode: true} }
        ],
      }
    },
    compress: {
      linux32: {
        options: {
          archive: "../obytebuilds/"+process.env.npm_package_version+"-linux-x86/obyte-linux32.zip"
        },
        expand: true,
        cwd: "../obytebuilds/"+process.env.npm_package_version+"-linux-x86/",
        src: ['**/*'],
        dest: 'obyte-linux32/'
      },
      linux64: {
        options: {
          archive: "../obytebuilds/"+process.env.npm_package_version+"-linux-x64/obyte-linux64.zip"
        },
        expand: true,
        cwd: "../obytebuilds/"+process.env.npm_package_version+"-linux-x64/",
        src: ['**/*'],
        dest: 'obyte-linux64/'
      }
    },
    browserify: {
        dist:{
            options:{
                exclude: ['sqlite3', 'nw.gui', 'mysql', 'ws', 'regedit', 'fs', 'path', 'socks'],
                ignore: ['../ocore/kvstore.js', './node_modules/ocore/kvstore.js', '../ocore/desktop_app.js', './node_modules/ocore/desktop_app.js', '../ocore/mail.js', './node_modules/ocore/mail.js']
            },
            src: 'public/obyte.js',
            dest: 'public/obyte.js'
        },
	    partialClient:{
		    options:{
          exclude: ['sqlite3', 'nw.gui', 'mysql', 'ws', 'regedit', 'fs', 'path', 'socks'],
          ignore: ['../ocore/kvstore.js', './node_modules/ocore/kvstore.js', '../ocore/desktop_app.js', './node_modules/ocore/desktop_app.js', '../ocore/mail.js', './node_modules/ocore/mail.js']
		    },
		    src: 'src/js/partialClient.js',
		    dest: 'public/partialClient.js'
        }
    },
    // .deb proved to be very slow to produce and install: lintian spends a lot of time verifying a .bin file
    debian_package: {
        linux64: {
            files: [
                {expand: true, cwd: "../obytebuilds/"+process.env.npm_package_version+"-linux-x64/", src: ['**/*'], dest: '/opt/obyte/'}
                //{expand: true, cwd: '../obytebuilds/obyte-test/linux64', src: ['obyte.desktop'], dest: '/usr/share/applications/obyte-test.desktop'}
            ],
            options: {
                maintainer: {
                    name: 'Obyte',
                    email: 'o@obyte.org'
                },
                long_description: 'Smart payments made simple',
                target_architecture: 'amd64'
            }
        }
    },
    innosetup_compiler: {
        win64: {
            options: {
                gui: false,
                verbose: false
            },
            script: 'webkitbuilds/setup-win64.iss'
        },
        win32: {
            options: {
                gui: false,
                verbose: false
            },
            script: 'webkitbuilds/setup-win32.iss'
        }
    },
    clean: {
    	options: {
    		force: true
    	},
    	mac: {
    		src: [
		    	"../obytebuilds/mac*/"+process.env.npm_package_name+".app/Contents/Resources/app/node_modules/rocksdb/prebuilds/!(darwin)-*/**",
	        	"../obytebuilds/mac*/"+process.env.npm_package_name+".app/Contents/Resources/app/node_modules/rocksdb/build/**",
		    	"../obytebuilds/mac*/"+process.env.npm_package_name+".app/Contents/Frameworks/Electron Framework.framework/Resources/!(en)*.lproj/**",
		    	"../obytebuilds/mac*/"+process.env.npm_package_name+".app/Contents/Resources/!(en)*.lproj/**"
	    	]
		},
	    win: {
		    src: [
		    	"../obytebuilds/*-win-*/node_modules/rocksdb/prebuilds/**",
	        	"../obytebuilds/*-win-*/node_modules/rocksdb/build/Release/!(leveldown.node)**",
		    	"../obytebuilds/*-win-*/locales/!(en)*.pak*",
		    	"../obytebuilds/*-win-*/node_modules/*",
		    	"../obytebuilds/*-win-*/*(chromedriver.exe|nwjc.exe)"
		    ],
		    filter: function(filepath) {
	    		var prodDeps = getDeps('prod');
	    		var modName = filepath.substr(filepath.lastIndexOf('node_modules')+13);
	    		var remove = !prodDeps.includes(modName);
				return remove
	    	}
		},
	    linux: {
	    	src: [
		    	"../obytebuilds/*linux-*/resources/app/node_modules/rocksdb/prebuilds/!(linux)-*/**",
	        	"../obytebuilds/*linux-*/resources/app/node_modules/rocksdb/build/deps/**",
		    	"../obytebuilds/*linux-*/locales/!(en)*.pak*",
		    	"../obytebuilds/*linux-*/*(chromedriver|nwjc)"
		    ]
	    }
    }
  });

var cachedDeps = [];
function getDeps(type) {
	if (cachedDeps[type])
		return cachedDeps[type];
	var deps = Buffer.from(require("child_process").spawnSync("npm" + (process.platform == "win32" ? ".cmd" : ""), ["list", "--depth=Infinity", "--" + type, "--parseable", "--silent"]).stdout).toString("ascii").split("\n");
	deps.shift();
	deps.pop();
	deps = deps.map(d => {
		d = d
		.substr(d.indexOf("node_modules") + 13)  // remove garbage from start
		.replace("\r", ""); // remove caret return on win platform
		if (d.indexOf("/") != -1)
			d = d.substr(0, d.indexOf("/")); // remove nested modules from the end
		if (d.indexOf("\\") != -1)
			d = d.substr(0, d.indexOf("\\")); // remove nested modules from the end
		return d;
	})
	cachedDeps[type] = deps;
}

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-angular-gettext');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-babel');
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('innosetup-compiler');
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.registerTask('default', ['nggettext_compile', 'exec:version', 'concat', 'copy:icons', 'copy:modules']);
  grunt.registerTask('watch-dev', ['default', 'watch']);
  grunt.registerTask('cordova', ['default', 'browserify', 'babel']);
  grunt.registerTask('cordova-prod', ['cordova', 'uglify']);
  grunt.registerTask('translate', ['nggettext_extract']);
  grunt.registerTask('prepare-dist', ['default']);
  grunt.registerTask('desktop', ['default']);
  grunt.registerTask('dmg', ['copy:osx', 'exec:osx64']);
  grunt.registerTask('linux64', ['copy:linux64', 'compress:linux64']);
  grunt.registerTask('linux32', ['copy:linux32', 'compress:linux32']);
  grunt.registerTask('deb', ['debian_package:linux64']);
  grunt.registerTask('inno64', ['innosetup_compiler:win64']);
  grunt.registerTask('inno32', ['innosetup_compiler:win32']);
  grunt.registerTask('partial', ['browserify:partialClient', 'uglify:partialClient']);
  grunt.registerTask('partial-fast', ['browserify:partialClient']);

};
