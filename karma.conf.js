//
// See http://karma-runner.github.io/2.0/config/configuration-file.html
//
module.exports = function(config) {
    config.set({
        frameworks: ['qunit'], // 'jquery-3.3.1', don't include as a framework, just add to 'files'
        files: [
          // vendor css

          // project css
          'public_html/css/barView.css',

          // vendor libraries
          'public_html/vendor/jquery.js',
          'public_html/vendor/jquery-ui.js',
          'public_html/vendor/qunit-tap.js',
          'public_html/vendor/d3.js',

          // project code
          'public_html/js/barView.js',

          // test cases
          'tests/**/*.js'
        ],

        reporters: [], // remove 'progress' to cleanup output, add for debugging

//        browsers: ['ChromeHeadless'],
          browsers: ['Chrome'],
//        browsers: ['Firefox'],
//        browsers: ['PhantomJS'], // 'PhantomJS' doesn't support ES6 i.e. 'let'
//        browsers: ['Chrome', 'Firefox'],

        plugins: [
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            //'karma-phantomjs-launcher', // phantomjs doesn't support ES6 i.e. 'let'
            'karma-qunit'
            //'karma-jquery' // don't include as a plugin, just add jquery to 'files'
        ],

        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: false,

        // default is true
        autoWatch: false,

        // Karma log level. This effects the initial log output as karma starts up. E.g.
        // connecting to the browser etc. Levels above DEBUG are ok for general dev. DEBUG
        // is very verbose. Show entire config, all files served etc.
        //
        // LOG_DEBUG,
        // LOG_INFO (default),
        // LOG_WARN,
        // LOG_ERROR,
        // LOG_DISABLE
        logLevel: config.LOG_INFO,

        // browserConsoleLogOptions are passed to the current browser (?) The observations
        // below are from ChromeHeadless.
        //
        // - Levels below warn will suppress most console output.
        //
        // - A terminal setting of false turns off all console out, but file logging
        //   still works. See also 'client.captureConsole'
        //
        // - Path turns on file output.  Not setting it turns off file output. See
        //   also 'client.captureConsole'
        //
        // level: 'debug' (default), 'info', 'warn', 'error'
        // terminal: true (default), false
        // path: undefined (default), 'path/to/logfile'
        browserConsoleLogOptions: {
          level: "info",
          format: "%b %T: %m",
          path: "browser-console.log",
          terminal: true
        },

        // Karma client (e.g. QUnit) settings.
        //
        // - captureConsole,  Pipe console output to the terminal. If false, then
        //   file logging, browserConsoleLogOptions, will be disabled as well.
        //
        // - qunit.autostart, If false, QUnit.start will have to be explicitly called.
        // - qunit.showUI: ? ... depends on clearContext:false
        client: {
          clearContext: false,
          captureConsole: true,
          qunit: {
            showUI: true,
            testTimeout: 5000,
            autostart: true,
            notrycatch: true
          }
        } // client
    }); // config.set
};