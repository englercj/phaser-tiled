var gulp = require('gulp'),
    connect = require('gulp-connect'),
    tiledmapPack = require('gulp-phaser-tiled-pack');

gulp.task('pack', function () {
    return gulp.src('./maps/{iso,ortho}/*.{json,tmx}')
        .pipe(tiledmapPack({ useExtInKey: true, baseUrl: 'maps' }))
        .pipe(gulp.dest('./maps'));
});

gulp.task('dev', ['pack'], function() {
    connect.server();
});

gulp.task('default', ['pack']);
