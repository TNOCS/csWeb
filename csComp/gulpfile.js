/// <vs SolutionOpened='default' />
// http://andy-carter.com/blog/a-beginners-guide-to-the-task-runner-gulp
// http://www.smashingmagazine.com/2014/06/11/building-with-gulp/

var gulp      = require('gulp'),
    gutil     = require('gulp-util'),
    insert    = require('gulp-insert'),
    uglify    = require('gulp-uglify'),
    minifyCss = require('gulp-cssmin'),
    rename    = require('gulp-rename'),
    debug     = require('gulp-debug'),
    cache     = require('gulp-cached'),
    concat    = require('gulp-concat'),
    order     = require('gulp-order'),
    plumber   = require('gulp-plumber'),
    useref    = require('gulp-useref'),
    gulpif    = require('gulp-if'),
    //exec      = require('child_process').exec,
    watch     = require('gulp-watch');

    gulp.task('built', function() {
        return gulp.src('./js/**/*.js')
            // .pipe(debug({title: 'before ordering:'}))
            // .pipe(order([
            //     "translations/locale-nl.js"
            // ]))
            // .pipe(debug({title: 'after ordering:'}))
            .pipe(concat('csComp.js'))
            .pipe(gulp.dest('./dist'));
    });

    gulp.task('builtDef', function() {
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

// gulp.task('debug-built', function() {
//     var assets = useref.assets();
//
//     return gulp.src('./index.html')
//         .pipe(assets)
//         .pipe(assets.restore())
//         .pipe(useref())
//         .pipe(gulp.dest('dist'));
// });
//
// gulp.task('release-built', function() {
//     var assets = useref.assets();
//
//     return gulp.src('./index.html')
//         .pipe(assets)
//         .pipe(gulpif('*.js', uglify()))
//         //.pipe(gulpif('*.css', minifyCss()))
//         .pipe(assets.restore())
//         .pipe(useref())
//         .pipe(gulp.dest('dist'))
//         .on('error', gutil.log);
// });

// gulp.task('run node', function (cb) {
//   exec('node server.js', function (err, stdout, stderr) {
//     console.log(stdout);
//     console.log(stderr);
//     cb(err);
//   });
// })

gulp.task('convertTemplates2Ts', function() {
    gulp.src('./**/*.tpl.html')
        .pipe(plumber())
        .pipe(cache('templates'))
        .pipe(insert.prepend(function(file) {
            var filename = file.path.substring(file.path.lastIndexOf('\\') + 1, file.path.lastIndexOf('.tpl.html'));
            return 'module ' + filename + ' { export var html = \'';
        }))
        .pipe(insert.append('\'; }'))
        .pipe(insert.transform(function(contents) {
            return contents.replace(/(\r\n|\n|\r)/gm, "");
        }))
        .pipe(rename({ extname: '.ts' }))
        .pipe(gulp.dest('./'));
});

gulp.task('watch', function () {
    gulp.watch('./**/*.tpl.html', ['convertTemplates2Ts']);
    gulp.watch('./js/**/*.js', ['built']);
    gulp.watch('./js/**/*.d.ts', ['builtDef']);
});

gulp.task('default', ['convertTemplates2Ts', 'watch']);
