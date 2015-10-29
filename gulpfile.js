var gulp          = require('gulp');
var tsconfig      = require('gulp-tsconfig-files');
var exec          = require('child_process').exec;

function run(command, cb) {
  console.log('Calling command: "' + command + '"');
  exec(command, function(err, stdout, stderr) {
    console.log(stdout);
    cb(err);
  });
}

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
    .pipe(tsconfig({
      path:         'csComp/tsconfig.json',
      relative_dir: 'csComp/',
    }));
});

// This task compiles typescript on csComp
gulp.task('comp_tsc', function(cb) {
  run('tsc -p csComp', cb);
});

// This task updates the typescript dependencies on tsconfig file for csServerComp
gulp.task('servercomp_tsconfig_files', function() {
  gulp.src(['csServerComp/**/*.ts',
            '!csServerComp/OfflineSearch/**/*.ts',
            '!csServerComp/ServerComponents/**/*.d.ts',
            '!csServerComp/node_modules/**/*.ts',
            '!csServerComp/Classes/*.d.ts',
        ],
      {base: 'csServerComp'})
    .pipe(tsconfig({
      path:         'csServerComp/tsconfig.json',
      relative_dir: 'csServerComp/',
    }));
});

// This task compiles typescript on csServerComp
gulp.task('servercomp_tsc', function(cb) {
  run('tsc -p csServerComp', cb);
});

gulp.task('default', [

                      'comp_tsconfig_files',
                      'comp_tsc',

                      // 'servercomp_tsconfig_files',
                      // 'servercomp_tsc',
                     ]);
