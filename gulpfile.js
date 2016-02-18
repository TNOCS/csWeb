// Documentation
//
// For compiling, we need to:
// * INIT [tsconfig] update the tsconfig file
// * INIT [tsc] transpile the ts files to folder outDir.
// * [built_csComp, built_csComp.d.ts] watch the generated *.js and *.d.ts files and concatenate them to dist-bower/csComp.js, dist-bower/csComp.d.ts.
//   Run tsc -w -p . in vscode or any other editor (tsc watches for file changes, and runs tsc on save).
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
    path2csWeb = './',
    outDir = 'out';

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

gulp.task('bower_useref',function(cb){
    var assets = useref.assets();

    return gulp.src('./csComp/includes/bower_dep/index.html')
        .pipe(assets)
        .pipe(assets.restore())
        .pipe(useref())
        .pipe(gulp.dest('./dist-bower'));
});

gulp.task('concat_css', ['include_css'], function (cb) {
    var assets = useref.assets();

    return gulp.src('./csComp/includes/bower_dep/index.html')
        .pipe(assets)
        .pipe(assets.restore())
        .pipe(useref())
        .pipe(gulp.dest('./dist-bower')); 
});

gulp.task('bower', ['bower_install','bower_useref']);

gulp.task('bower_install', function () {
    return gulp.src([
        'csComp/includes/bower_dep/bower.json', // bower install
    ]).pipe(install());
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

// This task updates the typescript dependencies on tsconfig file
gulp.task('tsconfig', function () {
    var globPattern = [
        './Scripts/**/*.d.ts',
        './csComp/**/*.ts',
        './csServerComp/**/*.ts',
        './test/**/*.ts',
        '!./csComp/includes/**/*.ts',
        '!./dist-npm',
        '!./dist-bower',
        '!./docker-dev',
        '!./docs',
        '!./csServerComp/OfflineSearch/**/*.ts',
        '!./node_modules/**/*.ts',
    ];
    var config = {
        tsOrder: ['**/*.ts'],
        tsConfig: {
            version: '1.7.3',
            compilerOptions: {
                target: 'es5',
                module: 'commonjs',
                declaration: true,
                noImplicitAny: false,
                removeComments: false,
                preserveConstEnums: true,
                noLib: false,
                outDir: outDir,
                sourceMap: true,
            },
            filesGlob: globPattern
        },
    };
    return buildTsconfig(config, globPattern, './');
});

// This task compiles typescript on csComp
gulp.task('tsc', function (cb) {
    return run('tsc -p .', cb);
});

// This task runs tsd command on csServerComp folder
gulp.task('tsd', function (cb) {
    tsd({
        command: 'reinstall',
        config: 'tsd.json',
    }, cb);
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
        path2csWeb + outDir,
    ], {
        force: true
    }, cb);
});

gulp.task('deploy-githubpages', function () {
    return gulp.src("path2csWeb + 'dist/**/*")
        .pipe(deploy({
            branch: 'master',
            cacheDir: '.deploy'
        }));
});

gulp.task('built_csComp', function () {
    return gulp.src(path2csWeb + outDir + '/csComp/**/*.js')
        .pipe(concat('csComp.js'))
        .pipe(gulp.dest(path2csWeb + 'dist-bower'));
});

gulp.task('built_csComp.d.ts', function () {
    return gulp.src(path2csWeb + outDir + '/csComp/**/*.d.ts')
        .pipe(plumber())
        .pipe(concat('csComp.d.ts'))
        .pipe(insert.prepend('/// <reference path="../leaflet/leaflet.d.ts" />\r\n'))
        .pipe(insert.prepend('/// <reference path="../crossfilter/crossfilter.d.ts" />\r\n'))
        .pipe(gulp.dest(path2csWeb + 'dist-bower'));
});

gulp.task('create_templateCache', function () {
    console.log('Creating templateCache.');
    var options = {
        module: appName,
        filename: 'csTemplates.js'
    };

    gulp.src(path2csWeb + 'csComp/**/*.tpl.html')
        .pipe(templateCache(options))
        .pipe(gulp.dest(path2csWeb + 'dist-bower'))
        .pipe(gulp.dest(path2csWeb + 'test/bower_components'));
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

gulp.task('sass', function () {
    gulp.src(path2csWeb + 'csComp/includes/css/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest(path2csWeb + 'dist-bower/css'))
        .pipe(gulp.dest(path2csWeb + 'csComp/includes/css'));
});

gulp.task('include_css', ['sass'], function () {
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

var watchOptions = {
    interval: 750, // default 100
    debounceDelay: 1000, // default 500
    mode: 'watch'
};
gulp.task('watch', function (cb) {
    gulp.watch(path2csWeb + outDir + '/csComp/**/*.js', watchOptions, ['built_csComp', 'built_csComp.d.ts']);
    gulp.watch(path2csWeb + 'csComp/directives/**/*.tpl.html', watchOptions, ['create_templateCache']);
    gulp.watch(path2csWeb + 'csComp/includes/css/csStyles.scss', watchOptions, ['concat_css']);
    gulp.watch(path2csWeb + 'csComp/includes/images/*.*', watchOptions, ['include_images']);
});

gulp.task('init', function (cb) {
    runSequence(
        'tsd',
        'tsconfig',
        'tsc',
        'built_csComp',
        'built_csComp.d.ts',
        'sass',
        'create_templateCache',
        'bower',
        'include_css',
        'include_images',
        cb);
});

// Initiallize the project and update the npm and bower package folders
gulp.task('update_packages', [
    'init',
    'minify_csComp'    
]);

gulp.task('default', ['update_packages', 'watch']);
