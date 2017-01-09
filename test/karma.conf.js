// Karma configuration
// Generated on Wed Jun 03 2015 16:17:08 GMT+0200 (W. Europe Daylight Time)

// To run from the command line, make sure you have karma-cli installed using 
// npm i -g karma-cli
// so you can run
// karma start --auto-watch=true --single-run=false --browsers=Chrome test\karma.conf.js

module.exports = function(config) {
    config.set({

        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '..',

        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['jasmine'],

        // list of files / patterns to load in the browser
        // Note that we don't need to load angular.js separately, as it's already included in csWeb-dep.js
        files: [
            'dist-bower/csWeb-dep.js',
            'csComp/includes/bower_dep/bower_components/angular-mocks/angular-mocks.js',
            'test/bower_components/angularUtils-pagination/dirPagination.js',
            'dist-bower/csComp.js',
            'test/csComp/app.js',
            'dist-bower/csTemplates.js',
            'out/test/csComp/spec/**/*.js',
            'out/test/csComp/mock/**/*.js'
        ],

        // list of files to exclude
        exclude: [],

        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
            // source files, that you wanna generate coverage for
            // do not include tests or libraries
            // (these files will be instrumented by Istanbul)
            //'csComp/js/**/*.js': ['coverage'] // not working anymore???
            'dist-bower/csComp.js': ['coverage']
        },

        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['progress', 'coverage'],

        coverageReporter: {
            type: 'lcov',
            dir: 'coverage/'
        },

        // web server port
        port: 9876,

        // enable / disable colors in the output (reporters and logs)
        colors: true,

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: false,

        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ['PhantomJS'],
        browserDisconnectTimeout: 10000,
        browserDisconnectTolerance: 2,
        browserNoActivityTimeout: 30000,

        // Which plugins to enable
        plugins: [
            'karma-phantomjs-launcher',
            'karma-chrome-launcher',
            'karma-jasmine',
            'karma-coverage'
        ],

        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: true
    });
};
