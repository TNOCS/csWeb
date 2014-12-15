/// <vs SolutionOpened='default' />
// http://andy-carter.com/blog/a-beginners-guide-to-the-task-runner-gulp
// http://www.smashingmagazine.com/2014/06/11/building-with-gulp/

var gulp = require('gulp'),
    plumber = require('gulp-plumber'),
    watch = require('gulp-watch');

gulp.task('copy_csComp', function () {
    gulp.src('../csComp/dist/*.*')
        .pipe(plumber())
        .pipe(gulp.dest('csComp'));
});


gulp.task('watch', function () {
    gulp.watch('../csComp/dist/*.*', ['copy_csComp']);
});

gulp.task('default', ['copy_csComp', 'watch']);