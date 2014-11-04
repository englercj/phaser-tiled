# gulp-tiled-pack

This is a gulp plugin that will create phaser asset packs for tilemaps. This is useful to not
have to hard-code the assets required by a tilemap into your code. You can change the layers,
tilesets, images, etc. and just use this tool to regenerate the asset pack.

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
