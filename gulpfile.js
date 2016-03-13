var gulp    = require('gulp');
var path    = require('path');
var gutil   = require('gulp-util');
var eslint  = require('gulp-eslint');
var jscs    = require('gulp-jscs');

var source = require('vinyl-source-stream');
var watchify = require('watchify');
var browserify = require('browserify');

var index = './src/index.js';
var outdir = './build';
var bundle = 'Phaser.Plugin.Tiled';
var outfile = 'phaser-tiled.js';

function rebundle(file) {
    if (file) {
        gutil.log('Rebundling,', path.basename(file[0]), 'has changes.');
    }

    return this.bundle()
        // log errors if they happen
        .on('error', gutil.log.bind(gutil, 'Browserify Error'))
        .pipe(source(outfile))
        .pipe(gulp.dest(outdir));
}

function createBundler(args) {
    args = args || {};
    args.standalone = bundle;

    return browserify(index, args);
}

/*****
 * Dev task, incrementally rebuilds the output bundle as the the sources change
 *****/
gulp.task('dev', function () {
    watchify.args.standalone = bundle;
    var bundler = watchify(createBundler(watchify.args));

    bundler.on('update', rebundle);

    return rebundle.call(bundler);
});

/*****
 * Build task, builds the output bundle
 *****/
gulp.task('build', function () {
    return rebundle.call(createBundler());
});

/*****
 * ESLint task, lints the lib and test *.js files.
 *****/
gulp.task('lint', function () {
    return gulp.src([
            './src/**/*.js',
            'gulpfile.js',
            '!node_modules/**'
        ])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(jscs())
        .pipe(jscs.reporter());
});

/*****
 * Base task
 *****/
gulp.task('default', ['lint', 'build']);
