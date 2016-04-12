var gulp    = require('gulp');
var path    = require('path');
var gutil   = require('gulp-util');
var eslint  = require('gulp-eslint');
var jscs    = require('gulp-jscs');
var tiledmapPack = require('gulp-phaser-tiled-pack');
var connect = require('gulp-connect');

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
gulp.task('watch', function () {
    var bundler = watchify(createBundler());

    bundler.on('update', function (file) {
        gulp.start('lint');
        rebundle.call(this, file).pipe(connect.reload());
    });

    gulp.watch('testmaps/maps/**/*', ['packmaps']);
    gulp.watch('testmaps/js/*', function (file) {
        gulp.start('lint');
        gulp.src('testmaps/js/*').pipe(connect.reload(file));
    });

    connect.server({
        root: '',
        livereload: true
    });

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
            'testmaps/js/*.js',
            'gulpfile.js',
            '!node_modules/**'
        ])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(jscs())
        .pipe(jscs.reporter());
});

gulp.task('packmaps', function () {
    return gulp.src('./testmaps/maps/{iso,ortho}/*.{json,tmx}')
        .pipe(tiledmapPack({ useExtInKey: true, baseUrl: 'maps' }))
        .pipe(gulp.dest('./testmaps/maps'))
        .pipe(connect.reload());
});

gulp.task('dev', ['packmaps', 'lint', 'build', 'watch']);

/*****
 * Base task
 *****/
gulp.task('default', ['lint', 'build']);
