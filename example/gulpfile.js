// Configure gulp scripts
// Output application name
var appName = 'csWebApp';
var path2csWeb = '../';

var gulp          = require('gulp'),
    del           = require('del'),
    insert        = require('gulp-insert'),
    uglify        = require('gulp-uglify'),
    useref        = require('gulp-useref'),
    rename        = require('gulp-rename'),
    debug         = require('gulp-debug'),
    cache         = require('gulp-cached'),
    concat        = require('gulp-concat'),
    plumber       = require('gulp-plumber'),
    watch         = require('gulp-watch'),
    gulpif        = require('gulp-if'),
    exec          = require('child_process').exec,
    templateCache = require('gulp-angular-templatecache'),
    deploy        = require('gulp-gh-pages');

gulp.task('clean', function(cb) {
    // NOTE Careful! Removes all generated javascript files and certain folders.
    del([
        path2csWeb + 'csServerComp/ServerComponents/**/*.js',
        path2csWeb + 'csComp/js/**',
        'public/cs/**',
        'dist',
        'ServerComponents/**',
        'services/**',
        path2csWeb + 'test/csComp/**/*.js'
    ], { force: true }, cb);
});

gulp.task('deploy-githubpages', function() {
    return gulp.src("./dist/**/*")
        .pipe(deploy({
            branch:'master',
            cacheDir : '.deploy'
        }))
});

gulp.task('built_csComp', function() {
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
        .pipe(gulp.dest('./public/cs/js'));
});

gulp.task('compile_all', function() {
    exec('cd ' + path2csWeb + 'csServerComp && tsc');
    exec('cd ' + path2csWeb + 'csComp && tsc');
    exec('tsc');
    exec('cd ' + path2csWeb + 'test && tsc');
    //exec('gulp all');
    //return exec('cd ' + path2csWeb + 'test/csComp && karma');
});

//gulp.task('built', ['compile_all', 'default']);

gulp.task('copy_csServerComp', function() {
    return gulp.src(path2csWeb + 'csServerComp/ServerComponents/**/*.js')
        //.pipe(concat('csServerComp.js'))
        .pipe(gulp.dest('./ServerComponents'));
});

gulp.task('built_csServerComp.d.ts', function() {
    gulp.src(path2csWeb + 'csServerComp/ServerComponents/**/*.d.ts')
        .pipe(plumber())
        //  .pipe(concat('csServerComp.d.ts'))
        .pipe(gulp.dest('./ServerComponents'));
    //.pipe(gulp.dest('./public/cs/js'));
});

gulp.task('copy_csServerComp_scripts', function() {
    return gulp.src(path2csWeb + 'csServerComp/Scripts/**/*.ts')
        //.pipe(concat('csComp.js'))
        .pipe(gulp.dest('./Scripts'));
});

gulp.task('copy_example_scripts', function() {
    return gulp.src('./Scripts/**/*.ts')
        .pipe(gulp.dest(path2csWeb + 'test/Scripts'));
});

gulp.task('built_csComp_classes', function() {
    return gulp.src(path2csWeb + 'csComp/classes/**/*.ts')
        // .pipe(debug({
        //     title: 'built_csComp_classes:'
        // }))
        // .pipe(debug({title: 'before ordering:'}))
        // .pipe(order([
        //     "translations/locale-nl.js"
        // ]))
        // .pipe(debug({title: 'after ordering:'}))
        .pipe(concat('csCompClasses.ts'))
        .pipe(gulp.dest(path2csWeb + 'csServerComp/classes'));
});


gulp.task('built_csComp.d.ts', function() {
    gulp.src(path2csWeb + 'csComp/js/**/*.d.ts')
        // .pipe(debug({title: 'before ordering:'}))
        // .pipe(order([
        //     "translations/locale-nl.js"
        // ]))
        // .pipe(debug({title: 'after ordering:'}))
        .pipe(plumber())
        .pipe(concat('csComp.d.ts'))
        .pipe(insert.prepend('/// <reference path="../leaflet/leaflet.d.ts" />\r\n'))
        .pipe(insert.prepend('/// <reference path="../crossfilter/crossfilter.d.ts" />\r\n'))
        .pipe(gulp.dest('Scripts/typings/cs'));
    gulp.src('./Scripts/typings/cs/csComp.d.ts')
        .pipe(gulp.dest(path2csWeb + 'test/Scripts/typings/cs'));
});

gulp.task('create_templateCache', function() {
    console.log('Creating templateCache.')
    var options = {
        module: appName,
        filename: 'csTemplates.js'
    }

    gulp.src(path2csWeb + 'csComp/**/*.tpl.html')
        // .pipe(debug({
        //     title: 'create_templateCache:'
        // }))
        .pipe(templateCache(options))
        .pipe(gulp.dest('public/cs/js'))
})

gulp.task('create_dist', function() {
    gulp.src('public/images/*.*')
        .pipe(plumber())
        .pipe(gulp.dest('./dist/images/'));

    gulp.src(path2csWeb + 'csComp/includes/images/*.*')
        .pipe(plumber())
        .pipe(gulp.dest('./dist/cs/images/'));

    gulp.src('public/data/**/*.*')
        .pipe(plumber())
        .pipe(gulp.dest('./dist/data/'));

    gulp.src('public/cs/css/ROsanswebtextregular.ttf')
        .pipe(plumber())
        .pipe(gulp.dest('./dist/css/'));

    gulp.src('public/bower_components/Font-Awesome/fonts/*.*')
        .pipe(plumber())
        .pipe(gulp.dest('./dist/fonts/'));

    var assets = useref.assets();

    return gulp.src('./public/*.html')
        .pipe(assets)
        .pipe(assets.restore())
        .pipe(useref())
        .pipe(gulp.dest('dist'));
});

gulp.task('create_dist_of_server', function() {
    gulp.src('node_modules/express')
        .pipe(plumber())
        .pipe(gulp.dest('./dist/node_modules/'));
    gulp.src('node_modules/body_parser')
        .pipe(plumber())
        .pipe(gulp.dest('./dist/node_modules/'));
    gulp.src('node_modules/serve-favicon')
        .pipe(plumber())
        .pipe(gulp.dest('./dist/node_modules/'));
    gulp.src('node_modules/rootpath')
        .pipe(plumber())
        .pipe(gulp.dest('./dist/node_modules/'));
    gulp.src('node_modules/socket.io')
        .pipe(plumber())
        .pipe(gulp.dest('./dist/node_modules/'));
    gulp.src('node_modules/chokidar')
        .pipe(plumber())
        .pipe(gulp.dest('./dist/node_modules/'));
    gulp.src('server.js')
        .pipe(plumber())
        .pipe(gulp.dest('./dist/'));
});

gulp.task('create_dist_of_client_and_server', ['create_dist', 'create_dist_of_server']);

gulp.task('minify_csComp', function() {
    // gulp.src(path2csWeb + 'csComp/dist/csComp.js')
    //    .pipe(plumber())
    //    .pipe(gulp.dest('public/js/cs'));
    gulp.src('public/js/cs/csComp.js')
        .pipe(plumber())
        .pipe(uglify())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest('public/cs/js'));
});

gulp.task('include_js', function() {
    gulp.src(path2csWeb + 'csComp/includes/js/**/*.*')
        // .pipe(debug({
        //     title: 'include_js:'
        // }))
        .pipe(plumber())
        .pipe(gulp.dest('./public/cs/js'));
});

gulp.task('include_css', function() {
    gulp.src(path2csWeb + 'csComp/includes/css/*.*')
        .pipe(plumber())
        .pipe(gulp.dest('./public/cs/css'));
});

gulp.task('include_images', function() {
    gulp.src(path2csWeb + 'csComp/includes/images/*.*')
        .pipe(plumber())
        .pipe(gulp.dest('./public/cs/images/'));
});

gulp.task('watch', function() {
    gulp.watch(path2csWeb + 'csServerComp/ServerComponents/**/*.js', ['copy_csServerComp']);
    gulp.watch(path2csWeb + 'csServerComp/Scripts/**/*.ts', ['copy_csServerComp_scripts']);
    gulp.watch(path2csWeb + 'csServerComp/ServerComponents/**/*.d.ts', ['built_csServerComp.d.ts']);

    gulp.watch(path2csWeb + 'csComp/js/**/*.js', ['built_csComp']);
    gulp.watch(path2csWeb + 'csComp/js/**/*.d.ts', ['built_csComp.d.ts']);
    gulp.watch(path2csWeb + 'csComp/**/*.tpl.html', ['create_templateCache']);
    gulp.watch(path2csWeb + 'csComp/includes/**/*.css', ['include_css']);
    gulp.watch(path2csWeb + 'csComp/includes/**/*.js', ['include_js']);
    gulp.watch(path2csWeb + 'csComp/includes/images/*.*', ['include_images']);
});

gulp.task('all', ['create_templateCache', 'copy_csServerComp', 'built_csServerComp.d.ts', 'copy_csServerComp_scripts', 'built_csComp', 'built_csComp.d.ts', 'include_css', 'include_js', 'include_images', 'copy_example_scripts']);

gulp.task('deploy', ['create_dist','deploy-githubpages']);

gulp.task('default', ['all', 'watch']);
