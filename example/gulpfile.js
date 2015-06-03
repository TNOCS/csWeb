// Configure gulp scripts
// Output application name
var appName = 'csWebApp';
var path2csWeb = '../';

var gulp = require('gulp'),
    insert = require('gulp-insert'),
    uglify = require('gulp-uglify'),
    useref = require('gulp-useref'),
    rename = require('gulp-rename'),
    debug = require('gulp-debug'),
    cache = require('gulp-cached'),
    concat = require('gulp-concat'),
    plumber = require('gulp-plumber'),
    watch = require('gulp-watch'),
    templateCache = require('gulp-angular-templatecache');

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
        //.pipe(gulp.dest('./public/cs/js'));
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
    var assets = useref.assets();

    return gulp.src('./public/*.html')
        .pipe(assets)
        .pipe(assets.restore())
        .pipe(useref())
        .pipe(gulp.dest('dist'));
});

gulp.task('create_release_dist', function() {
    var assets = useref.assets();

    return gulp.src('./public/*.html')
        .pipe(assets)
        .pipe(gulpif('*.js', uglify()))
        .pipe(gulpif('*.css', minifyCss()))
        .pipe(assets.restore())
        .pipe(useref())
        .pipe(gulp.dest('dist'));
});

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
    //gulp.watch(path2csWeb + 'csComp/classes/*.ts', ['built_csComp_classes']);
    gulp.watch(path2csWeb + 'csComp/js/**/*.d.ts', ['built_csComp.d.ts']);
    gulp.watch(path2csWeb + 'csComp/**/*.tpl.html', ['create_templateCache']);
    gulp.watch(path2csWeb + 'csComp/includes/**/*.css', ['include_css']);
    gulp.watch(path2csWeb + 'csComp/includes/**/*.js', ['include_js']);
    gulp.watch(path2csWeb + 'csComp/includes/images/*.*', ['include_images']);
});

gulp.task('default', ['create_templateCache', 'copy_csServerComp','built_csServerComp.d.ts','copy_csServerComp_scripts','built_csComp','built_csComp.d.ts', 'include_css', 'include_js', 'include_images', 'watch']);
