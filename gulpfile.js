var gulp = require('gulp'),
    path = require('path'),
    git = require('gulp-git'),
    bump = require('gulp-bump'),
    gutil = require('gulp-util'),
    jshint = require('gulp-jshint'),

    es = require('event-stream'),
    source = require('vinyl-source-stream'),
    watchify = require('watchify'),
    browserify = require('browserify'),

    index = './src/index.js',
    outdir = './build',
    bundle = 'Phaser.Plugin.Tiled',
    outfile = 'phaser-tiled.js',
    ver = {
        major: 0,
        minor: 1,
        patch: 2
    },
    pkg = require('./package.json'),
    version = pkg.version.split('.');

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
gulp.task('dev', function() {
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
 * JSHint task, lints the lib and test *.js files.
 *****/
gulp.task('jshint', function () {
    return gulp.src([
            './src/**/*.js',
            'gulpfile.js'
        ])
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-summary'));
});

/*****
 * Base task
 *****/
gulp.task('default', ['jshint', 'build']);


/*****
 * Release task
 *****/
gulp.task('release', ['jshint', 'build'], function (cb) {
    var up = process.argv[3] || 'patch';

    up = up.replace('--', '');

    if (Object.keys(ver).indexOf(up) === -1) {
        return cb(new Error('Please specify major, minor, or patch release.'));
    }

    version[ver[up]]++;
    for (var i = 0; i < 3; ++i) {
        if (i > ver[up]) {
            version[i] = 0;
        }
    }

    version = 'v' + version.join('.');

    return es.merge(
            gulp.src('./package.json')
                .pipe(bump({ type: up }))
                .pipe(gulp.dest('./')),
            gulp.src(outdir + '/' + outfile)
                .pipe(gulp.dest('./dist'))
        )
        .pipe(git.commit('release ' + version))
        .pipe(git.tag(version, version, function () {}));
});
