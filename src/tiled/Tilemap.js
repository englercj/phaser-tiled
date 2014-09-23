var Tilelayer = require('./Tilelayer'),
    Objectlayer = require('./Objectlayer'),
    Tile = require('./Tile'),
    Tileset = require('./Tileset'),
    TilemapParser = require('./TilemapParser'),
    utils = require('../utils');

// TODO: object spritepool

/**
 * Tiled map that represents an entire tile map with multiple layers or object groups.
 * Often it is easier to create a tilemap using the object factor on a world, rather
 * than doing it manually yourself.
 *
 * @class Tilemap
 * @constructor
 * @param {Phaser.Game} game - Game reference to the currently running game.
 * @param {string} [key] - The key of the tilemap data as stored in the Cache. If you're creating a
 *      blank map either leave this parameter out or pass `null`.
 * @param {number} [tileWidth=32] - The pixel width of a single map tile. If using CSV data you must
 *      specify this. Not required if using Tiled map data.
 * @param {number} [tileHeight=32] - The pixel height of a single map tile. If using CSV data you must
 *      specify this. Not required if using Tiled map data.
 * @param {number} [width=10] - The width of the map in tiles. If this map is created from Tiled or
 *      CSV data you don't need to specify this.
 * @param {number} [height=10] - The height of the map in tiles. If this map is created from Tiled or
 *      CSV data you don't need to specify this.
 */
function Tilemap(game, key, tileWidth, tileHeight, width, height, group) {
    var data = TilemapParser.parse(game, key, tileWidth, tileHeight, width, height);

    Phaser.Group.call(this, game, group, key);

    this.type = Phaser.TILEMAP;

    /**
     * The game instance this tilemap belongs to
     *
     * @property game
     * @type Game
     */
    // this.game = game;

    /**
     * The key of this map data in the Phaser.Cache.
     *
     * @property key
     * @type String
     */
    this.key = key;

    if (data === null) {
        return;
    }

    /**
     * @property {number} width - The width of the map (in tiles).
     */
    // this.width = data.width;

    /**
     * @property {number} height - The height of the map (in tiles).
     */
    // this.height = data.height;

    this.size = new Phaser.Point(data.width, data.height);

    /**
     * @property {number} tileWidth - The base width of the tiles in the map (in pixels).
     */
    this.tileWidth = data.tilewidth;

    /**
     * @property {number} tileHeight - The base height of the tiles in the map (in pixels).
     */
    this.tileHeight = data.tileheight;

    /**
     * @property {string} orientation - The orientation of the map data (as specified in Tiled), usually 'orthogonal'.
     */
    this.orientation = data.orientation;

    /**
     * @property {number} format - The format of the map data, either Phaser.Tilemap.CSV or Phaser.Tilemap.TILED_JSON.
     */
    this.format = data.format;

    /**
     * @property {number} version - The version of the map data (as specified in Tiled, usually 1).
     */
    this.version = data.version;

    /**
     * @property {object} properties - Map specific properties as specified in Tiled.
     */
    this.properties = utils.parseTiledProperties(data.properties);

    /**
     * @property {number} widthInPixels - The width of the map in pixels based on width * tileWidth.
     */
    this.widthInPixels = data.width * data.tilewidth;

    /**
     * @property {number} heightInPixels - The height of the map in pixels based on height * tileHeight.
     */
    this.heightInPixels = data.height * data.tileheight;

    /**
     * @property {array} layers - An array of Tilemap layer data.
     */
    // this.layers = data.layers;

    /**
     * @property {array} tilesets - An array of Tilesets.
     */
    // this.tilesets = data.tilesets;

    /**
     * @property {array} tiles - The super array of Tiles.
     */
    // this.tiles = data.tiles;

    /**
     * @property {array} objects - An array of Tiled Object Layers.
     */
    // this.objects = data.objects;

    /**
     * @property {array} collideIndexes - An array of tile indexes that collide.
     */
    // this.collideIndexes = [];

    /**
     * @property {array} collision - An array of collision data (polylines, etc).
     */
    // this.collision = data.collision;

    /**
     * @property {array} images - An array of Tiled Image Layers.
     */
    // this.images = data.images;

    /**
     * @property {number} currentLayer - The current layer.
     */
    // this.currentLayer = 0;

    /**
     * @property {array} debugMap - Map data used for debug values only.
     */
    // this.debugMap = [];

    /**
    * @property {array} _results - Internal var.
     * @private
     */
    // this._results = [];

    /**
    * @property {number} _tempA - Internal var.
     * @private
     */
    // this._tempA = 0;

    /**
    * @property {number} _tempB - Internal var.
     * @private
     */
    // this._tempB = 0;

    this.tilesets = [];

    // create each tileset
    for(var t = 0, tl = data.tilesets.length; t < tl; ++t) {
        var ts = data.tilesets[t];
        this.tilesets.push(new Tileset(ts.name, ts));
    }

    this.layers = [];
    this.objects = [];
    this.images = [];

    // create each layer
    for(var i = 0, il = data.layers.length; i < il; ++i) {
        var lyr, ldata = data.layers[i];

        switch(ldata.type) {
            case 'tilelayer':
                lyr = new Tilelayer(game, this, ldata, width, height);
                this.layers.push(lyr);
                break;

            case 'objectgroup':
                // lyr = new Objectlayer(game, this, ldata, width, height);
                this.objects.push(lyr);
                break;

            case 'imagelayer':
                //TODO: layer texture data
                lyr = new Tile(game);
                this.images.push(lyr);
                this.addChild(lyr);
                break;
        }
    }

    // update the world bounds
    this.game.world.setBounds(0, 0, this.widthInPixels, this.heightInPixels);
}

Tilemap.prototype = Object.create(Phaser.Group.prototype);
Tilemap.prototype.constructor = Tilemap;

module.exports = Tilemap;

/**
* Creates an empty map of the given dimensions and one blank layer. If layers already exist they are erased.
*
* @method create
* @param {string} name - The name of the default layer of the map.
* @param {number} width - The width of the map in tiles.
* @param {number} height - The height of the map in tiles.
* @param {number} tileWidth - The width of the tiles the map uses for calculations.
* @param {number} tileHeight - The height of the tiles the map uses for calculations.
* @param {Phaser.Group} [group] - Optional Group to add the layer to. If not specified it will be added to
*       the World group.
* @return {Phaser.TilemapLayer} The TilemapLayer object. This is an extension of Phaser.Image and can be
*       moved around the display list accordingly.
*/
// Tilemap.prototype.create = function (name, width, height, tileWidth, tileHeight, group) {
//     if (typeof group === 'undefined') { group = this.game.world; }

//     this.width = width;
//     this.height = height;

//     this.setTileSize(tileWidth, tileHeight);

//     this.layers.length = 0;

//     return this.createBlankLayer(name, width, height, tileWidth, tileHeight, group);
// };

/**
 * Sets the base tile size for the map.
 *
 * @method setTileSize
 * @param {number} tileWidth - The width of the tiles the map uses for calculations.
 * @param {number} tileHeight - The height of the tiles the map uses for calculations.
 */
Tilemap.prototype.setTileSize = function (tileWidth, tileHeight) {
    this.tileWidth = tileWidth;
    this.tileHeight = tileHeight;
    this.widthInPixels = this.width * tileWidth;
    this.heightInPixels = this.height * tileHeight;
};

/**
 * Gets the tileset that an ID is associated with
 *
 * @method getTileset
 * @param tileId {Number} The id of the tile to find the tileset for
 * @return {TiledTileset} Returns the tileset if found, undefined if not
 */
Tilemap.prototype.getTileset = function (tileId) {
    for(var i = 0, il = this.tilesets.length; i < il; ++i) {
        if (this.tilesets[i].contains(tileId)) {
            return this.tilesets[i];
        }
    }
};

/**
 * Destroys the tilemap instance
 *
 * @method destroy
 */
Tilemap.prototype.destroy = function () {
    Phaser.Group.prototype.destroy.apply(this, arguments);

    this.game = null;
    this.properties = null;
    this.tileSize = null;
    this.size = null;
    this.orientation = null;
    this.version = null;
    this.backgroundColor = null;
    this.tilesets = null;
    this.scaledTileSize = null;
    this.realSize = null;
};

/**
 * Spawns all the objects in the ObjectGroups of this map
 *
 * @method spawnObjects
 * @return {Tilemap} Returns itself.
 * @chainable
 */
Tilemap.prototype.spawnObjects = function () {
    for(var i = 0, il = this.objects.length; i < il; ++i) {
        this.objects[i].spawn();
    }

    return this;
};

/**
 * Spawns all the objects in the ObjectGroups of this map
 *
 * @method despawnObjects
 * @return {Tilemap} Returns itself.
 * @chainable
 */
Tilemap.prototype.despawnObjects = function () {
    for(var i = 0, il = this.objects.length; i < il; ++i) {
        this.objects[i].despawn();
    }

    return this;
};

/**
 * Clears all the tiles that are currently used on all tile layers
 *
 * @method clearTiles
 * @return {Tilemap} Returns itself.
 * @chainable
 */
Tilemap.prototype.clearTiles = function () {
    for(var i = 0, il = this.layers.length; i < il; ++i) {
        this.layers[i].clearTiles();
    }

    return this;
};

/**
 * Called by a Tilelayer when a tile event occurs. This is so you can listen for
 * the emitted events on the world instead of the tile itself.
 *
 * @method onTileEvent
 * @param eventName {String} The event name to emit, the prefix 'tile.' will be added to it
 * @param tile {Tile} The tile that has the event
 * @param data {InteractionData} The raw interaction object for the event
 * @private
 */
// Tilemap.prototype.onTileEvent = function (eventName, tile, data) {
//     this.emit('tile.' + eventName, {
//         tile: tile,
//         data: data
//     });
// };

/**
 * Called by a ObjectGroup when an object event occurs. This is so you can listen for
 * the emitted events on the world instead of the tile itself.
 *
 * @method onObjectEvent
 * @param eventName {String} The event name to emit, the prefix 'object.' will be added to it
 * @param obj {Sprite|Container} The object that has the event
 * @param data {InteractionData} The raw interaction object for the event
 * @private
 */
// Tilemap.prototype.onObjectEvent = function (eventName, obj, data) {
//     this.emit('object.' + eventName, {
//         object: obj,
//         data: data
//     });
// };

/**
 * Finds a layer based on the string name
 *
 * @method findLayer
 * @param name {String} The name of the layer to find
 * @return {Tilelayer|ObjectGroup|Sprite} Returns the layer if found, undefined if not
 */
Tilemap.prototype.findLayer = function (name) {
    for(var i = 0, il = this.children.length; i < il; ++i) {
        var o = this.children[i];

        if (o.name === name) {
            return o;
        }
    }
};

/**
 * @property CSV
 * @type {Number}
 * @static
 * @final
 */
Tilemap.CSV = 0;

/**
 * @property CSV
 * @type {Number}
 * @static
 * @final
 */
Tilemap.TILED_JSON = 1;

/**
 * @property CSV
 * @type {Number}
 * @static
 * @final
 */
Tilemap.TILED_XML = 2;

/**
 * @property CSV
 * @type {Number}
 * @static
 * @final
 */
Tilemap.NORTH = 0;

/**
 * @property CSV
 * @type {Number}
 * @static
 * @final
 */
Tilemap.EAST = 1;

/**
 * @property CSV
 * @type {Number}
 * @static
 * @final
 */
Tilemap.SOUTH = 2;

/**
 * @property CSV
 * @type {Number}
 * @static
 * @final
 */
Tilemap.WEST = 3;
