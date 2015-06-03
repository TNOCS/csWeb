/// <vs SolutionOpened='default' />
// http://andy-carter.com/blog/a-beginners-guide-to-the-task-runner-gulp
// http://www.smashingmagazine.com/2014/06/11/building-with-gulp/

var gulp      = require('gulp'),
    gutil     = require('gulp-util'),
    uglify    = require('gulp-uglify'),
    minifyCss = require('gulp-cssmin'),
    debug     = require('gulp-debug'),
    concat    = require('gulp-concat'),
    order     = require('gulp-order'),
    plumber   = require('gulp-plumber'),
    //exec      = require('child_process').exec,
    watch     = require('gulp-watch');

    gulp.task('build_csComp', function() {
        return gulp.src('./js/**/*.js')
            // .pipe(debug({title: 'before ordering:'}))
            // .pipe(order([
            //     "translations/locale-nl.js"
            // ]))
            // .pipe(debug({title: 'after ordering:'}))
            .pipe(concat('csComp.js'))
            .pipe(gulp.dest('./dist'));
    });

    // gulp.task('debug-built', function() {g
    //     var assets = useref.assets();
    //
    //     return gulp.src('./public/index.html')
    //         .pipe(assets)
    //         .pipe(assets.restore())
    //         .pipe(useref())
    //         .pipe(gulp.dest('dist'));
    // });
    //
    // gulp.task('release-built', function() {
    //     var assets = useref.assets();
    //
    //     return gulp.src('./public/index.html')
    //         .pipe(assets)
    //         .pipe(gulpif('*.js', uglify()))
    //         .pipe(gulpif('*.css', minifyCss()))
    //         .pipe(assets.restore())
    //         .pipe(useref())
    //         .pipe(gulp.dest('dist'));
    // });

    gulp.task('build_csComp.d.ts', function() {
        return gulp.src('./js/**/*.d.ts')
            // .pipe(debug({title: 'before ordering:'}))
            // .pipe(order([
            //     "translations/locale-nl.js"
            // ]))
            // .pipe(debug({title: 'after ordering:'}))
            .pipe(concat('csComp.d.ts'))
            .pipe(gulp.dest('./dist'));
    });

    gulp.task('uglify', function() {
        return gulp.src('./js/**/*.js')
            .pipe(debug({title: 'before ordering:'}))
            // .pipe(order([
            //     "translations/locale-nl.js"
            // ]))
            // .pipe(debug({title: 'after ordering:'}))
            .pipe(uglify())
            .pipe(concat('csComp.min.js'))
            .pipe(gulp.dest('./dist'));
    });

gulp.task('watch', function () {
    gulp.watch('./js/**/*.js', ['built']);
    gulp.watch('./js/**/*.d.ts', ['builtDef']);
});

gulp.task('default', ['build_csComp', 'build_csComp.d.ts', 'watch']);
