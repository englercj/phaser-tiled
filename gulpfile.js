var gulp = require('gulp'),
    connect = require('gulp-connect'),
    tiledmapPack = require('./node_modules/phaser-tiled/tools/gulp-tiled-pack');

gulp.task('pack', function () {
    return gulp.src('./maps/**/*.{json,tmx}')
        .pipe(tiledmapPack({ useExtInKey: true, baseUrl: 'maps' }))
        .pipe(gulp.dest('./maps'));
});

gulp.task('dev', ['pack'], function() {
    connect.server();
});

gulp.task('default', ['pack']);
