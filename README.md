# Phaser Tiled

This is a replacement for the tilemap implementation in the [Phaser][0] game framework.
The purpose of this plugin is to optimize the tilemaps for large complex maps built with
the [Tiled Map Editor][1].

This plugin optimizes the rendering of large scrolling tilemaps. It also adds support for
many more Tiled features and lots of advanced functionality. You can read [Why use this plugin?][2]
below for more details.

**Note**: The recommended version of Tiled for use with this plugin is `v0.15`. Any other version
is not officially supported.

[0]: https://github.com/photonstorm/phaser
[1]: http://www.mapeditor.org/
[2]: #why-use-this-plugin

## Usage

Simply download the `phaser-tiled.js` script from the [latest release](https://github.com/englercj/phaser-tiled/releases) and include it on your page after including Phaser:

```html
<script src="phaser.js"></script>
<script src="phaser-tiled.js"></script>
```

### Javascript
After adding the script to the page you can activate it by enabling the plugin:

```js
game.add.plugin(Phaser.Plugin.Tiled);
```

Then you can add a Tiled map to your game like this:

```js
// By using the built-in cache key creator, the plugin can automagically
// find all the necessary items in the cache.
// The params are (map-key, type, tiled-name). The `key` is an arbitrary key
// you make up to identify the map it belongs to. The `type` is the type of
// resource it is loading. The `tiled-name` is for layers, the name should match
// the name of the layer in the map.
var cacheKey = Phaser.Plugin.Tiled.utils.cacheKey;

// load the tiled map, notice it is "tiledmap" and not "tilemap"
game.load.tiledmap(cacheKey('my-tiledmap', 'tiledmap'), 'assets/levels/tilemap.json', null, Phaser.Tilemap.TILED_JSON);

// load the images for your tilesets, make sure the last param to "cacheKey" is
// the name of the tileset in your map so the plugin can find it later
game.load.image(cacheKey('my-tiledmap', 'tileset', 'tileset1-name'), 'assets/levels/tileset1.png');
game.load.image(cacheKey('my-tiledmap', 'tileset', 'tileset2-name'), 'assets/levels/tileset2.png');

// if you have image layers, be sure to load those too! Again,
// make sure the last param is the name of your layer in the map.
game.load.image(cacheKey('my-tiledmap', 'layer', 'layer-name'), 'assets/levels/layer.png');

////////////
// Later after loading is complete:

// add the tiledmap to the game
// this method takes the key for the tiledmap which has been used in the cacheKey calls
// earlier, and an optional group to add the tilemap to (defaults to game.world).
var map = game.add.tiledmap('my-tiledmap');
```

That can get pretty heavy, and hardcoding what to load and how to name it can stink! Luckily, there is an easier
way to handle it. Instead of hard-coding what the tilemap should load and be named, this plugin has a gulp task
that can generate a Phaser Asset Pack that describes what and how to load the tiledmap. If you have this pack
it becomes trivial to load and create a tiledmap:

```js
// the key will be the filename of the map without the extension.
game.load.pack('my-tiledmap', 'assets/levels/tilemap-assets.json');

////////////
// Later after loading is complete:
var map = game.add.tiledmap('my-tiledmap');
```

Wow, that was a lot easier! You can find out more about the generator on [it's GitHub page][10].

[10]: https://github.com/englercj/gulp-phaser-tiled-pack

### Typescript

Download the phaser-tiled.d.ts and add it to your project. (The file is located in the typescript folder)
You also need the normal [phaser-tiled.js](https://github.com/englercj/phaser-tiled/releases) file.

First of all you need to make sure you add a reference to the phaser and phaser-tiled typescript files.

```ts
/// <reference path="lib/phaser.d.ts"/>
/// <reference path="lib/phaser-tiled.d.ts"/>
```

Now you need to load the plugin. This needs to be done in the preload function.

```ts
//This is in the preload function
this.game.add.plugin(new Tiled(this.game, this.game.stage));

//Now you need to load the tiledmap. Notice that it says tiledmap.
var cacheKey = Phaser.Plugin.Tiled.utils.cacheKey;
//Since you can't add methods to existing classes in typescript you need to cast to any.
(<any>this.game.load).tiledmap(cacheKey('myTiledMap', 'tiledmap'), 'maps/myTiledMap.json', null, Phaser.Tilemap.TILED_JSON);

//Now you need to load the tilesets.
this.game.load.image(cacheKey('myTiledMap', 'tileset', 'Grass'), 'images/tilesets/Grass.png');
this.game.load.image(cacheKey('myTiledMap', 'tileset', 'Dirt'), 'images/tilesets/Dirt.png');

// You can load image layers like this:
this.game.load.image(cacheKey('myTiledMap', 'layer', 'yourLayerName'), 'images/imageLayers/layer.png');
//The last parameter should be the name of your layer in your tiled map

```

Now the loading part is done and we will continue after the loading is complete.

```ts
//This is normally in the create method
//Make sure you cast it to any again.
var map = (<any>this.game.add).tiledmap('myTiledMap');
```


### Physics

This plugin comes with a couple ways to implement physics for your games. Right now the only officially supported engine
is p2.js, but hopefully arcade and others can join the party soon (need it now? submit a PR!).

#### Using the object tools

To create the physics bodies based on a tilemap, the simplest way is to create an object layer in Tiled Editor and use
the object tools to draw physics. You can use the rectangle, ellipse, polygon, or polyline tools. The only caveats are
that circles (not ellipses) are supported so height and width of the ellipse must be the same, and if you use the polyline
tool be sure to close the path to make a convex polygon!

Here is how you can convert your objects into collision bodies:

```js
var map = game.add.tiledmap('tilemap-key');

game.physics.p2.convertTiledCollisionObjects(map, 'objectlayer-name');
```

That is it! All the objects in the layer named `objectlayer-name` will be converted to p2 physics bodies and added
to the simulation.

#### Using collidable tiles

The second method is to set the `collides` custom property on tiles in a tileset to `true`. This tells the engine that
that specific tile is collidable wherever it is in the map, and a body will be created for it.

Here is how you can convert your collidable tiles into collision bodies:

```js
var map = game.add.tiledmap('tilemap-key');

game.physics.p2.convertTiledmap(map, 'tilelayer-name');
```

That is it! All the collidable tiles in the layer named `tilelayer-name` will be converted to p2 physics bodies
and added to the simulation. This will also try to combine bodies that are adjacent on the same X axis into a single
body to reduce the total number of bodies that are created. This algorithm can (and should) be much improved.

## Why use this plugin?

Here are some features this plugin has that Phaser doesn't, or that this plugin
tries to do better:

1. Faster render times
2. Support for Tiled XML format
3. Support for tile flipping
4. Support for animated tiles (added in Tiled v0.10.0)
5. Automatic layer creation from tiled data
6. Automatic tileset creation from tiled data

## Show me the performance!

Using a large test map with 256x256 tiles, each 16x16 pixels, and 3 layers of them. [phaser-debug][20]
gives me this performance graph for the core phaser tilemap implementation:

![Slow][21]

The spikes you see there are when I pan around the map. Using the same map with this plugin I get this:

![Fast][22]

[20]: https://github.com/englercj/phaser-debug
[21]: http://static.pantherdev.com/misc/slow_lttp_debug.png
[22]: http://static.pantherdev.com/misc/fast_lttp_debug.png


## Supported custom properties

#### Tilemap
None, yet.

#### Tileset
None, yet.

#### Tileset Tile (specific tile in the tileset)
 - `collideLeft` - true will make this tile collide on the left
 - `collideRight` - true will make this tile collide on the right
 - `collideUp` - true will make this tile collide on the top
 - `collideDown` - true will make this tile collide on the bottom
 - `collides` - true will set all collision sides to true, if that collision side doesn't have a specific override
 - `blendMode` - string of the blendMode constant to use for this tile (e.g. 'NORMAL')

#### Tile Layer
 - `batch` - true will place tile sprites into a SpriteBatch container.

#### Object Layer
 - `batch` - true will place object sprites into a SpriteBatch container.
 - `blendMode` - string of the blendMode constant to use for all objects in this layer (e.g. 'NORMAL').

#### Object Layer Object (specific object in the layer)
 - `blendMode` - string of the blendMode constant to use for this object (e.g. 'NORMAL')
 - `texture` - string of the texture to load from the cache, usually the URL you would load the texture with.
 - `collides` - true/false whether this object is collidable, falls back to the tileset tile collides property.
 - `sensor` - Makes the physics shape a sensor shape when `collides` is true.
 - `anchor` - A custom anchor override for a tile in array format, e.g. "[0,1]"

#### Image Layer
None, yet.

## Tiled features not yet implemented:

1. Object layers
2. Image layers
3. Multi-image tilesets

## Phaser Tilemap API features still needed:

Layer Properties:
 - tileColor
 - wrap
 - scrollFactor

Map Methods:
 - setTileIndexCallback
 - setTileLocationCallback
 - setCollision
 - setCollisionBetween
 - setCollisionByExclusion
 - setCollisionByIndex
 - copy
 - paste
 - swap
 - swapHandler
 - forEach
 - replace
 - random
 - shuffle
 - fill

Object Layer:
 - object spritepool to pull custom object from
 - Test, only minimally implemented right now

Image Layer:
 - Completely unimplemented

General:
 - Rerender on resize/rescale seems off
 - Tile render debug stuff (edges, physics, etc)
 - Memory optimizations
