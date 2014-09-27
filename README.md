# Phaser Tiled

This is a replacement for the tilemap implementation in the [Phaser][0] game framework.
The purpose of this plugin is to optimize the tilemaps for large complex maps built with
the [Tiled Map Editor][1].

This plugin optimizes the rendering of large scrolling tilemaps. It also adds support for
many more Tiled features and lots of advanced functionality.

[0]: https://github.com/photonstorm/phaser
[1]: http://www.mapeditor.org/

## Usage

Simply download the `dist/phaser-tiled.js` script and include it on your page after including Phaser:

```html
<script src="phaser.js"></script>
<script src="phaser-tiled.js"></script>
```

After adding the script to the page you can activate it by enabling the plugin:

```js
game.add.plugin(Phaser.Plugin.Tiled);
```

## Tiled features not yet implemented:

1. Object layers
2. Image layers
3. Animated tiles
4. Multi-image tilesets

## Phaser Tilemap API features still needed:

Layer Properties:
- tileColor
- wrap
- scrollFactor

Map Methods:
- Nearly all methods not related to rendering

Object Layer:
- object spritepool to pull custom object from
- Test, only minimally implemented right now

Image Layer:
- Completely unimplemented

General:
- Physics
- Rerender on resize/rescale seems off
- Tile render debug stuff
- Memory optimizations
