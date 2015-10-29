var gulp          = require('gulp');
var tsconfig      = require('gulp-tsconfig-files');
var run           = require('gulp-run');

// This task updates the typescript dependencies on tsconfig file for csComp
gulp.task('comp_tsconfig_files', function() {
  gulp.src(['./csComp/**/*.ts',
            './csComp/**/*.ts',
            '!./csComp/dist/csComp.d.ts',
            '!./csComp/js/**/*.d.ts',
            '!./csComp/js/**/*.js',
            '!./csComp/node_modules/**/*.ts',
        ],
      {base: 'csComp'})
    .pipe(gulp.dest('./csComp'))
    .pipe(tsconfig({
      path: 'csComp/tsconfig.json',
    }));
});

// This task compiles typescript on csComp
gulp.task('comp_tsc', function() {
  run('tsc -p csComp').exec();
});

// This task updates the typescript dependencies on tsconfig file for csServerComp
gulp.task('servercomp_tsconfig_files', function() {
  gulp.src(['./csServerComp/**/*.ts',
            '!./csServerComp/OfflineSearch/**/*.ts',
            '!./csServerComp/ServerComponents/**/*.d.ts',
            '!./csServerComp/node_modules/**/*.ts',
            '!./csServerComp/Classes/*.d.ts',
        ],
      {base: 'csServerComp'})
    .pipe(gulp.dest('./csServerComp'))
    .pipe(tsconfig({
      path: 'csServerComp/tsconfig.json',
    }));
});

// This task compiles typescript on csServerComp
gulp.task('servercomp_tsc', function() {
  run('tsc -p csServerComp').exec();
});

gulp.task('default', [
                      'comp_tsconfig_files',
                      'comp_tsc',
                     ]);
