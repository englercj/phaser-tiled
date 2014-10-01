# gulp-tiled-pack

This is a gulp plugin that will create phaser asset packs for tilemaps. Right now, it only works with
the JSON formatted maps.

## Usage

```js
var gulp = require('gulp'),
    tiledmapPack = require('gulp-tiled-pack');

/*****
 * Assets Phaser packs task, creates phaser asset loader packs for tilemaps
 *****/
gulp.task('pack', function () {
    return gulp.src('./src/assets/**/*.json')
        .pipe(tiledmapPack({ baseUrl: 'assets' }))
        .pipe(gulp.dest('./public/assets'));
});
```
