var gulp          = require('gulp');
var tsconfig      = require('gulp-tsconfig-files');
var run           = require('gulp-run');

gulp.task('servercomp_tsconfig_files', function() {
  gulp.src(['./csServerComp/**/*.ts',
            '!./csServerComp/OfflineSearch/**/*.ts',
            '!./csServerComp/ServerComponents/**/*.d.ts',
            '!./csServerComp/node_modules/**/*.ts',
            '!./csServerComp/Classes/*.d.ts',
        ],
      {base: 'csServerComp'})
    .pipe(gulp.dest('./'))
    .pipe(tsconfig({
      path:     'csServerComp/tsconfig.json',
    }));
});

gulp.task('servercomp_tsc', function() {
  run('tsc -p csServerComp').exec()
  .pipe(gulp.dest('output'));
});

gulp.task('default', ['servercomp_tsconfig_files', 'servercomp_tsc']);
