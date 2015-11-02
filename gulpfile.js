var gulp          = require('gulp');
var tsconfig      = require('gulp-tsconfig-files');
var tsd           = require('gulp-tsd');
var exec          = require('child_process').exec;
var install       = require('gulp-install');

function run(command, cb) {
  exec(command, function(err, stdout, stderr) {
    if (err) {
      console.log('### ERROR ON COMMAND ' + command + ':');
    }

    console.log(stdout);
    cb(err);
  });
}

// This task runs tsd command on csComp folder
gulp.task('comp_tsd', function(cb) {
  tsd({
    command: 'reinstall',
    config: 'csComp/tsd.json',
  }, cb);
});

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

// This task runs tsd command on csServerComp folder
gulp.task('servercomp_tsd', function(cb) {
  tsd({
    command: 'reinstall',
    config: 'csServerComp/tsd.json',
  }, cb);
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

// Run required npm and bower installs for example folder
gulp.task('example_deps', function() {
  gulp.src([
      'example/package.json',       // npm install
      'example/public/bower.json',  // bower install
    ])
    .pipe(install());
});

gulp.task('default', [
                      'init',
                      'comp_tsconfig_files',
                      'comp_tsc',
                      'servercomp_tsconfig_files',
                      'servercomp_tsc',
                     ]);

gulp.task('init', [
    'comp_tsconfig_files',
    'comp_tsd',
    'comp_tsconfig_files',
    'comp_tsc',
    'servercomp_tsd',
    'servercomp_tsconfig_files',
    'servercomp_tsc',
    'example_deps',
]);

gulp.task('dev', ['?']);

gulp.task('start', ['?']);
