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
      }
    },
    browserify: {
        dist:{
            options:{
                exclude: ['sqlite3', 'electron', 'mysql', 'ws', 'regedit', 'fs', 'path', 'socks'],
                ignore: ['../ocore/kvstore.js', './node_modules/ocore/kvstore.js', '../ocore/desktop_app.js', './node_modules/ocore/desktop_app.js', '../ocore/mail.js', './node_modules/ocore/mail.js']
            },
            src: 'public/obyte.js',
            dest: 'public/obyte.js'
        },
	    partialClient:{
		    options:{
          exclude: ['sqlite3', 'electron', 'mysql', 'ws', 'regedit', 'fs', 'path', 'socks'],
          ignore: ['../ocore/kvstore.js', './node_modules/ocore/kvstore.js', '../ocore/desktop_app.js', './node_modules/ocore/desktop_app.js', '../ocore/mail.js', './node_modules/ocore/mail.js']
		    },
		    src: 'src/js/partialClient.js',
		    dest: 'public/partialClient.js'
        }
    },
    clean: {
    	options: {
    		force: true
    	},
    	mac: {
    		src: [
		    	"../obytebuilds/mac*/Obyte*.app/Contents/Resources/app/node_modules/rocksdb/prebuilds/!(darwin)-*/**",
	        	"../obytebuilds/mac*/Obyte*.app/Contents/Resources/app/node_modules/rocksdb/build/**",
		    	"../obytebuilds/mac*/Obyte*.app/Contents/Frameworks/Electron Framework.framework/Resources/!(en)*.lproj/**",
		    	"../obytebuilds/mac*/Obyte*.app/Contents/Resources/!(en)*.lproj/**"
	    	]
		},
	    win: {
			src: [
				"../obytebuilds/*win-*/resources/app/node_modules/rocksdb/prebuilds/!(win*)-*/**",
				"../obytebuilds/*win-*/resources/app/node_modules/rocksdb/build/deps/**",
				"../obytebuilds/*win-*/locales/!(en)*.pak*"
			]
		},
	    linux: {
	    	src: [
		    	"../obytebuilds/*linux-*/resources/app/node_modules/rocksdb/prebuilds/!(linux)-*/**",
	        	"../obytebuilds/*linux-*/resources/app/node_modules/rocksdb/build/deps/**",
		    	"../obytebuilds/*linux-*/locales/!(en)*.pak*"
		    ]
	    }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-angular-gettext');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-babel');
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.registerTask('default', ['nggettext_compile', 'exec:version', 'concat', 'copy:icons', 'copy:modules']);
  grunt.registerTask('watch-dev', ['default', 'watch']);
  grunt.registerTask('cordova', ['default', 'browserify', 'babel']);
  grunt.registerTask('cordova-prod', ['cordova', 'uglify']);
  grunt.registerTask('translate', ['nggettext_extract']);
  grunt.registerTask('prepare-dist', ['default']);
  grunt.registerTask('partial', ['browserify:partialClient', 'uglify:partialClient']);
  grunt.registerTask('partial-fast', ['browserify:partialClient']);

};
