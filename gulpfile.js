// Documentation
//
// For compiling csServerComp, we need to:
// * INIT [servercomp_tsconfig_files] update the tsconfig file
// * INIT [servercomp_tsc] transpile the ts files in csServerComp, outDir = ./dist-npm.
//   Run tsc -w -p . in vscode or any other editor (tsc watches for file changes, and runs tsc on save).
// * [built_csServerComp.d.ts] watch the generated d.ts files in dist-npm, and concatenate them to dist-npm/csWeb.d.ts.
// * Copy this to test folder.
//
// For compiling csComp, we need to:
// * INIT [comp_tsconfig_files] update the tsconfig file
// * INIT [servercomp_tsc] transpile the ts files in csComp, outDir = js
//   Run tsc -w -p . in vscode or any other editor (tsc watches for file changes, and runs tsc on save).
// * [built_csComp, built_csComp.d.ts] watch the generated *.js and *.d.ts files and concatenate them to dist-bower/csComp.js, dist-bower/csComp.d.ts.
// * [sass, include-js, include-css] watch sass and other included files
// * Copy this to test folder.

var gulp = require('gulp'),
    tsconfig = require('gulp-tsconfig'),
    tsd = require('gulp-tsd'),
    exec = require('child_process').execSync,
    install = require('gulp-install'),
    runSequence = require('run-sequence'),
    del = require('del'),
    insert = require('gulp-insert'),
    uglify = require('gulp-uglify'),
    useref = require('gulp-useref'),
    rename = require('gulp-rename'),
    debug = require('gulp-debug'),
    cache = require('gulp-cached'),
    concat = require('gulp-concat'),
    plumber = require('gulp-plumber'),
    watch = require('gulp-watch'),
    changed = require('gulp-changed'),
    templateCache = require('gulp-angular-templatecache'),
    deploy = require('gulp-gh-pages'),
    sass = require('gulp-sass'),
    purify = require('gulp-purifycss'),
    karma = require('karma'),
    concatCss = require('gulp-concat-css'),
    glob = require('glob');

// Gulp task upstream...
// Configure gulp scripts
// Output application name
var appName = 'csWebApp',
    path2csWeb = './';

function run(command, cb) {
    console.log('Run command: ' + command);
    try {
        exec(command);
        cb();
    } catch (err) {
        console.log('### Exception encountered on command: ' + command);
        console.log(err.stdout.toString());
        console.log('####################################');
        cb(err);
    }
}

gulp.task('bower', function (cb) {
    gulp.src([
        'csComp/includes/bower_dep/bower.json', // bower install
    ]).pipe(install(cb));

    var assets = useref.assets();

    return gulp.src('./csComp/includes/bower_dep/index.html')
        .pipe(assets)
        .pipe(assets.restore())
        .pipe(useref())
        .pipe(gulp.dest('./dist-bower'));
});


// This task runs tsd command on csComp folder
gulp.task('comp_tsd', function (cb) {
    tsd({
        command: 'reinstall',
        config: 'csComp/tsd.json',
    }, cb);
});

function buildTsconfig(config, globPattern, basedir) {
    config.tsConfig.comment = '! This tsconfig.json file has been generated automatically, please DO NOT edit manually.';
    return gulp.src(globPattern, { base: '.' })
        .pipe(rename(function (path) {
            path.dirname = path.dirname.replace(basedir, '.');
        }))
        .pipe(tsconfig(config)())
        .pipe(gulp.dest(basedir));
}

// This task updates the typescript dependencies on tsconfig file for csComp
gulp.task('comp_tsconfig_files', function () {
    var config = {
        tsOrder: ['**/*.ts'],
        tsConfig: {
            compilerOptions: {
                target: 'es5',
                module: 'commonjs',
                declaration: true,
                noImplicitAny: false,
                removeComments: false,
                noLib: false,
                outDir: 'js',
                sourceMap: true,
            },
            filesGlob: [
                './**/*.ts',
                '!./dist/csComp.d.ts',
                '!./js/**/*.d.ts',
                '!./js/**/*.js',
                '!./node_modules/**/*.ts',
            ],
            exclude: [],
        },
    };
    var globPattern = ['./csComp/**/*.ts',
        '!./csComp/includes/**/*.d.ts',
        '!./csComp/js/**/*.d.ts',
        '!./csComp/js/**/*.js',
    ];
    return buildTsconfig(config, globPattern, 'csComp');
});

// This task updates the typescript dependencies on tsconfig file for csServerComp
gulp.task('servercomp_tsconfig_files', function () {
    var config = {
        tsOrder: ['**/*.ts'],
        tsConfig: {
            version: '1.6.2',
            compilerOptions: {
                target: 'es5',
                module: 'commonjs',
                declaration: true,
                noImplicitAny: false,
                outDir: './../dist-npm',
                removeComments: true,
                noLib: false,
                preserveConstEnums: true,
                suppressImplicitAnyIndexErrors: true,
                sourceMap: true,
            },
            filesGlob: [
                './**/*.ts',
                '!./**/*.d.ts',
                './Scripts/**/*.d.ts',
                '!./OfflineSearch/**/*.*',
            ],
            exclude: [],
        },
    };
    var globPattern = ['csServerComp/**/*.ts',
        '!csServerComp/OfflineSearch/**/*.ts',
        '!csServerComp/ServerComponents/**/*.d.ts',
        '!csServerComp/Classes/*.d.ts',
    ];
    return buildTsconfig(config, globPattern, 'csServerComp');
});

gulp.task('test_tsconfig_files', function () {
    var config = {
        tsOrder: ['**/*.ts'],
        tsConfig: {
            version: '1.5.0-alpha',
            compilerOptions: {
                target: 'es5',
                module: 'commonjs',
                declaration: false,
                noImplicitAny: false,
                removeComments: true,
                noLib: false,
                preserveConstEnums: true,
                suppressImplicitAnyIndexErrors: true,
            },
            filesGlob: [
                './**/*.ts',
                '!./node_modules/**/*.ts',
            ],
            exclude: [],
        },
    };
    return buildTsconfig(config, './test/**/*.ts', 'test');
});

// This task compiles typescript on csComp
gulp.task('comp_tsc', function (cb) {
    return run('tsc -p csComp', cb);
});

// This task runs tsd command on csServerComp folder
gulp.task('servercomp_tsd', function (cb) {
    tsd({
        command: 'reinstall',
        config: 'csServerComp/tsd.json',
    }, cb);
});

// This task compiles typescript on csServerComp, sending the output to dist-npm
gulp.task('servercomp_tsc', function (cb) {
    gulp.src('package.json')
        .pipe(gulp.dest('dist-npm'));
    return run('tsc -p csServerComp', cb);
});

gulp.task('tsc', function (cb) {
    return run('tsc -w -p csServerComp & tsc -w -p csComp', cb);
});

// This task runs tsd command on test folder
gulp.task('test_tsd', function (cb) {
    tsd({
        command: 'reinstall',
        config: 'test/tsd.json',
    }, cb);
});

gulp.task('test_tsc', function (cb) {
    return run('tsc -p test', cb);
});

gulp.task('init', function (cb) {
    runSequence(
         // csServerComp section
        'servercomp_tsd',
        'servercomp_tsconfig_files',
        'servercomp_tsc',
        // csComp section
        //'comp_tsd',
        'comp_tsconfig_files',
        'comp_tsc',
        'built_csComp',
        'built_csComp.d.ts',
        'sass',
        'create_templateCache',
        // dependencies
        'bower',
        'include_css',
        'include_images',
        cb);
});

gulp.task('travis', function (cb) {
    runSequence(
        'init',
        'test',
        cb);
});

gulp.task('karma', ['bower'], function (cb) {
    new karma.Server({
        configFile: __dirname + '/test/karma.conf.js',
        singleRun: true,
    }, cb).start();
});

gulp.task('test', function (cb) {
    runSequence(
        'built_csComp.d.ts',
        'test_tsd',
        'test_tsconfig_files',
        'test_tsc',
        'karma',
        cb);
});

gulp.task('dev', ['default']);

gulp.task('start', ['init']);

// Only for example project
// gulp.task('csspurify', function () {
//     return gulp.src(path2csWeb + 'example/public/cs/css/csstyles.css')
//         .pipe(purify([path2csWeb + 'example/public/cs/js/**/*.js', path2csWeb + 'example/**/*.html']))
//         .pipe(gulp.dest(path2csWeb + 'example/public/cs/css/csclean.css'));
// });

gulp.task('clean', function (cb) {
    // NOTE Careful! Removes all generated javascript files and certain folders.
    del([
        path2csWeb + 'csServerComp/ServerComponents/**/*.js',
        path2csWeb + 'csComp/js/**',
        path2csWeb + 'test/csComp/**/*.js',
        path2csWeb + 'test/Scripts/typings/cs/**/',
    ], {
           force: true
        }, cb);
});

gulp.task('sass', function () {
    gulp.src(path2csWeb + 'csComp/includes/css/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(changed(path2csWeb + 'csComp/includes/css/'))
        .pipe(gulp.dest(path2csWeb + 'csComp/includes/css/'));
    //.pipe(gulp.dest(path2csWeb + 'dist-bower/'));
});

gulp.task('deploy-githubpages', function () {
    return gulp.src("path2csWeb + 'dist/**/*")
        .pipe(deploy({
            branch: 'master',
            cacheDir: '.deploy'
        }));
});

gulp.task('built_csComp', function () {
    return gulp.src(path2csWeb + 'csComp/js/**/*.js')
    // .pipe(debug({
    //     title: 'built_csComp:'
    // }))
    // .pipe(debug({title: 'before ordering:'}))
    // .pipe(order([
    //     "translations/locale-nl.js"
    // ]))
    // .pipe(debug({title: 'after ordering:'}))
        .pipe(concat('csComp.js'))
    //.pipe(gulp.dest(path2csWeb + 'example/public/cs/js'))
        .pipe(gulp.dest(path2csWeb + 'dist-bower'));
});

gulp.task('compile_all', function () {
    /* runsequence('servercomp_tsc','comp_tsc','test_tsc'); insead ? */
    exec('cd ' + path2csWeb + 'csServerComp && tsc');
    exec('cd ' + path2csWeb + 'csComp && tsc');
    //exec('tsc');
    exec('cd ' + path2csWeb + 'test && tsc');
});

gulp.task('built_csComp.d.ts', function () {
    return gulp.src(path2csWeb + 'csComp/js/**/*.d.ts')
        .pipe(plumber())
        .pipe(concat('csComp.d.ts'))
        .pipe(insert.prepend('/// <reference path="../leaflet/leaflet.d.ts" />\r\n'))
        .pipe(insert.prepend('/// <reference path="../crossfilter/crossfilter.d.ts" />\r\n'))
    // .pipe(changed(path2csWeb + 'example/Scripts/typings/cs'))
    // .pipe(gulp.dest(path2csWeb + 'example/Scripts/typings/cs'))
    //.pipe(changed(path2csWeb + 'test/Scripts/typings/cs'))
        .pipe(gulp.dest(path2csWeb + 'dist-bower'))
        .pipe(gulp.dest(path2csWeb + 'test/Scripts/typings/cs'));
});

gulp.task('create_templateCache', function () {
    console.log('Creating templateCache.');
    var options = {
        module: appName,
        filename: 'csTemplates.js'
    };

    gulp.src(path2csWeb + 'csComp/**/*.tpl.html')
        .pipe(templateCache(options))
        .pipe(gulp.dest(path2csWeb + 'dist-bower'));
});

gulp.task('minify_csComp', function () {
    gulp.src(path2csWeb + 'dist-bower/csComp.js')
        .pipe(plumber())
        .pipe(uglify())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest(path2csWeb + 'dist-bower'));
});

gulp.task('include_css', function () {
    gulp.src(path2csWeb + 'csComp/includes/css/*.*')
        .pipe(plumber())
        .pipe(changed(path2csWeb + 'dist-bower/css'))
        .pipe(gulp.dest(path2csWeb + 'dist-bower/css'));
});

gulp.task('include_images', function () {
    gulp.src(path2csWeb + 'csComp/includes/images/**/*.*')
        .pipe(plumber())
        .pipe(changed(path2csWeb + 'dist-bower/images'))
        .pipe(gulp.dest(path2csWeb + 'dist-bower/images'));
});

gulp.task('watch', function (cb) {
    gulp.watch(path2csWeb + 'csComp/js/**/*.js', ['built_csComp', 'built_csComp.d.ts']);
    gulp.watch(path2csWeb + 'csComp/**/*.tpl.html', ['create_templateCache']);
    gulp.watch(path2csWeb + 'csComp/includes/**/*.scss', ['sass']);
    gulp.watch(path2csWeb + 'csComp/includes/**/*.css', ['include_css']);
    gulp.watch(path2csWeb + 'csComp/includes/images/*.*', ['include_images']);
});

// Initiallize the project and update the npm and bower package folders
gulp.task('update_packages', [
    'init',
    'built_csComp',
    'built_csComp.d.ts',
    'minify_csComp'    
]);

gulp.task('default', ['update_packages', 'watch']);
