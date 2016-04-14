var Tilelayer = require('./Tilelayer');
var Objectlayer = require('./Objectlayer');
var Tile = require('./Tile');
var Tileset = require('./Tileset');
var TilemapParser = require('./TilemapParser');
var utils = require('../utils');
var C = require('../constants');

/**
 * Tiled map that represents an entire tile map with multiple layers or object groups.
 * Often it is easier to create a tilemap using the object factor on a world, rather
 * than doing it manually yourself.
 *
 * @class Tilemap
 * @constructor
 * @param {Phaser.Game} game - Game reference to the currently running game.
 * @param {string} [key] - The name of the tiledmap, this is usually the filename without the extension.
 * @param {Phaser.Group|Phaser.SpriteBatch} [group] - Group to add the tilemap to.
 */
function Tilemap(game, key, group) {
    Phaser.Group.call(this, game, group, key);

    var data = TilemapParser.parse(game, key);

    this.type = Phaser.TILEMAP;

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
     * @property {number} scaledTileWidth - The scaled width of the tiles in the map (in pixels).
     */
    this.scaledTileWidth = this.tileWidth;

    /**
     * @property {number} scaledTileHeight - The scaled height of the tiles in the map (in pixels).
     */
    this.scaledTileHeight = this.tileHeight;

    /**
     * @property {string} orientation - The orientation of the map data (as specified in Tiled), usually 'orthogonal'.
     */
    this.orientation = data.orientation;

    /**
     * @property {string} renderorder - The renderorder of the map
     */
    this.renderorder = data.renderorder;

    /**
     * @property {boolean} obeyRenderorder - If true then the map's renderorder will be obeyed.  Defaults to false.
     */
    this.obeyRenderorder = false;

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
    this.layers = [];

    /**
     * @property {array} tilesets - An array of Tilesets.
     */
    this.tilesets = [];

    /**
     * @property {array} objects - An array of Tiled Object Layers.
     */
    this.objects = [];

    /**
     * @property {array} images - An array of Tiled Image Layers.
     */
    this.images = [];

    /**
     * @property {array} collideIndexes - An array of tile indexes that collide.
     */
    this.collideIndexes = [];

    /**
     * @property {array} collision - An array of collision data (polylines, etc).
     */
    // this.collision = data.collision;

    /**
     * @property {number} currentLayer - The current layer.
     */
    this.currentLayer = 0;

    /**
     * @property {array} debugMap - Map data used for debug values only.
     */
    this.debugMap = [];

    this.preventingRecalculate = false;
    this.needToRecalculate = null;

    // tell when camera scale is modified
    this._camScaleX = 0;
    this._camScaleY = 0;

    // should all layers do a full rerender?
    this.dirty = true;

    // update the world bounds
    this.game.world.setBounds(0, 0, this.widthInPixels, this.heightInPixels);

    // create each tileset
    for (var t = 0, tl = data.tilesets.length; t < tl; ++t) {
        var ts = data.tilesets[t];
        this.tilesets.push(new Tileset(game, key, ts));
    }

    // create each layer
    for (var i = 0, il = data.layers.length; i < il; ++i) {
        var lyr;
        var ldata = data.layers[i];

        switch (ldata.type) {
            case 'tilelayer':
                lyr = new Tilelayer(game, this, ldata, this.layers.length);
                this.layers.push(lyr);

                // calculate the tile faces
                this.calculateFaces(this.layers.length - 1);
                break;

            case 'objectgroup':
                lyr = new Objectlayer(game, this, ldata, this.objects.length);
                this.objects.push(lyr);
                break;

            case 'imagelayer':
                lyr = game.add.sprite(ldata.x, ldata.y, utils.cacheKey(key, 'layer', ldata.name), null, this);

                lyr.visible = ldata.visible;
                lyr.apha = ldata.opacity;

                this.images.push(lyr);
                break;
        }
    }
}

Tilemap.prototype = Object.create(Phaser.Group.prototype);
Tilemap.prototype.constructor = Tilemap;

module.exports = Tilemap;

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

    this.scaledTileWidth = tileWidth * this.game.camera.scale.x;
    this.scaledTileHeight = tileHeight * this.game.camera.scale.y;

    this.widthInPixels = this.width * tileWidth;
    this.heightInPixels = this.height * tileWidth;

    // update the world bounds
    this.game.world.setBounds(0, 0, this.width * this.game.camera.scale.x, this.height * this.game.camera.scale.y);
};

/**
* Gets the layer index based on the layers name.
*
* @method Phaser.Tilemap#getIndex
* @protected
* @param {array} location - The local array to search.
* @param {number|string|object} name - The name of the array element to get.
* @return {number} The index of the element in the array, or null if not found.
*/
Tilemap.prototype.getIndex = function (location, name) {

    if (typeof name === 'string') {
        for (var i = 0; i < location.length; i++)
        {
            if (location[i].name === name)
            {
                return i;
            }
        }
    }
    else if (typeof name === 'object') {
        return name.index;
    }
    else if (typeof name === 'number') {
        return name;
    }

    return -1;

};

/**
* Gets the layer index based on its name.
*
* @method Phaser.Tilemap#getTilelayerIndex
* @param {number|string|object} name - The name of the layer to get.
* @return {number} The index of the layer in this tilemap, or null if not found.
*/
Tilemap.prototype.getTilelayerIndex = Tilemap.prototype.getLayer = function (name) {

    return this.getIndex(this.layers, name);

};

/**
* Gets the tileset index based on its name.
*
* @method Phaser.Tilemap#getTilesetIndex
* @param {number|string|object} name - The name of the tileset to get.
* @return {number} The index of the tileset in this tilemap, or null if not found.
*/
Tilemap.prototype.getTilesetIndex = function (name) {

    return this.getIndex(this.tilesets, name);

};

/**
* Gets the image index based on its name.
*
* @method Phaser.Tilemap#getImagelayer
* @param {number|string|object} name - The name of the image to get.
* @return {number} The index of the image in this tilemap, or null if not found.
*/
Tilemap.prototype.getImagelayerIndex = function (name) {

    return this.getIndex(this.images, name);

};

/**
* Gets the object index based on its name.
*
* @method Phaser.Tilemap#getObjectlayerIndex
* @param {number|string|object} name - The name of the object to get.
* @return {number} The index of the object in this tilemap, or null if not found.
*/
Tilemap.prototype.getObjectlayerIndex = function (name) {

    return this.getIndex(this.objects, name);

};

/**
* Gets the layer based on its name.
*
* @method Phaser.Tilemap#getTilelayer
* @param {number|string|object} name - The name of the layer to get.
* @return {Tilelayer} The index of the layer in this tilemap, or null if not found.
*/
Tilemap.prototype.getTilelayer = function (name) {

    return this.layers[this.getTilelayerIndex(name)];

};

/**
* Gets the tileset index based on its name.
*
* @method Phaser.Tilemap#getTileset
* @param {number|string|object} name - The name of the tileset to get.
* @return {Tileset} The index of the tileset in this tilemap, or null if not found.
*/
Tilemap.prototype.getTileset = function (name) {

    return this.tilesets[this.getTilesetIndex(name)];

};

/**
* Gets the image index based on its name.
*
* @method Phaser.Tilemap#getImagelayer
* @param {number|string|object} name - The name of the image to get.
* @return {Image} The index of the image in this tilemap, or null if not found.
*/
Tilemap.prototype.getImagelayer = function (name) {

    return this.images[this.getImagelayerIndex(name)];

};

/**
* Gets the object index based on its name.
*
* @method Phaser.Tilemap#getObjectlayer
* @param {number|string|object} name - The name of the object to get.
* @return {Objectlayer} The index of the object in this tilemap, or null if not found.
*/
Tilemap.prototype.getObjectlayer = function (name) {

    return this.objects[this.getObjectlayerIndex(name)];

};

/**
* Turn off/on the recalculation of faces for tile or collission updates.
* setPreventRecalculate(true) puts recalculation on hold while
* setPreventRecalculate(false) recalculates all the changed layers.
*
* @method Phaser.Tilemap#setPreventRecalculate
* @param {boolean} if true it will put the recalculation on hold.
*/
Tilemap.prototype.setPreventRecalculate = function (value) {

    if ((value === true) && (this.preventingRecalculate !== true))
    {
        this.preventingRecalculate = true;
        this.needToRecalculate = {};
    }

    if ((value ===  false) && (this.preventingRecalculate === true))
    {
        this.preventingRecalculate = false;
        for (var i in this.needToRecalculate) {
            this.calculateFaces(i);
        }
        this.needToRecalculate = false;
    }

};

/**
* Internal function.
*
* @method Phaser.Tilemap#calculateFaces
* @protected
* @param {number} layer - The index of the TilemapLayer to operate on.
*/
Tilemap.prototype.calculateFaces = function (layer) {

    if (this.preventingRecalculate)
    {
        this.needToRecalculate[layer] = true;
        return;
    }

    var above = null;
    var below = null;
    var left = null;
    var right = null;

    for (var y = 0, h = this.layers[layer].size.y; y < h; y++)
    {
        for (var x = 0, w = this.layers[layer].size.x; x < w; x++)
        {
            var tile = this.layers[layer].tiles[y] ? this.layers[layer].tiles[y][x] : null;

            if (tile)
            {
                above = this.getTileAbove(layer, x, y);
                below = this.getTileBelow(layer, x, y);
                left = this.getTileLeft(layer, x, y);
                right = this.getTileRight(layer, x, y);

                if (tile.collides)
                {
                    tile.faceTop = true;
                    tile.faceBottom = true;
                    tile.faceLeft = true;
                    tile.faceRight = true;
                }

                if (above && above.collides)
                {
                    //  There is a tile above this one that also collides,
                    // so the top of this tile is no longer interesting
                    tile.faceTop = false;
                }

                if (below && below.collides)
                {
                    //  There is a tile below this one that also collides,
                    // so the bottom of this tile is no longer interesting
                    tile.faceBottom = false;
                }

                if (left && left.collides)
                {
                    //  There is a tile left this one that also collides,
                    // so the left of this tile is no longer interesting
                    tile.faceLeft = false;
                }

                if (right && right.collides)
                {
                    //  There is a tile right this one that also collides,
                    // so the right of this tile is no longer interesting
                    tile.faceRight = false;
                }
            }
        }
    }

};

/**
* Gets the tile above the tile coordinates given.
* Mostly used as an internal function by calculateFaces.
*
* @method Phaser.Tilemap#getTileAbove
* @param {number} layer - The local layer index to get the tile from.
* @param {number} x - The x coordinate to get the tile from. In tiles, not pixels.
* @param {number} y - The y coordinate to get the tile from. In tiles, not pixels.
*/
Tilemap.prototype.getTileAbove = function (layer, x, y) {

    if (y > 0)
    {
        return this.layers[layer].tiles[y - 1] ? this.layers[layer].tiles[y - 1][x] : null;
    }

    return null;

};

/**
* Gets the tile below the tile coordinates given.
* Mostly used as an internal function by calculateFaces.
*
* @method Phaser.Tilemap#getTileBelow
* @param {number} layer - The local layer index to get the tile from.
* @param {number} x - The x coordinate to get the tile from. In tiles, not pixels.
* @param {number} y - The y coordinate to get the tile from. In tiles, not pixels.
*/
Tilemap.prototype.getTileBelow = function (layer, x, y) {

    if (y < this.layers[layer].height - 1)
    {
        return this.layers[layer].tiles[y + 1] ? this.layers[layer].tiles[y + 1][x] : null;
    }

    return null;

};

/**
* Gets the tile to the left of the tile coordinates given.
* Mostly used as an internal function by calculateFaces.
*
* @method Phaser.Tilemap#getTileLeft
* @param {number} layer - The local layer index to get the tile from.
* @param {number} x - The x coordinate to get the tile from. In tiles, not pixels.
* @param {number} y - The y coordinate to get the tile from. In tiles, not pixels.
*/
Tilemap.prototype.getTileLeft = function (layer, x, y) {

    if (x > 0)
    {
        return this.layers[layer].tiles[y] ? this.layers[layer].tiles[y][x - 1] : null;
    }

    return null;

};

/**
* Gets the tile to the right of the tile coordinates given.
* Mostly used as an internal function by calculateFaces.
*
* @method Phaser.Tilemap#getTileRight
* @param {number} layer - The local layer index to get the tile from.
* @param {number} x - The x coordinate to get the tile from. In tiles, not pixels.
* @param {number} y - The y coordinate to get the tile from. In tiles, not pixels.
*/
Tilemap.prototype.getTileRight = function (layer, x, y) {

    if (x < this.layers[layer].size.x - 1)
    {
        return this.layers[layer].tiles[y] ? this.layers[layer].tiles[y][x + 1] : null;
    }

    return null;

};

/**
* Sets the current layer to the given index.
*
* @method Phaser.Tilemap#setLayer
* @param {number|string|Phaser.TilemapLayer} layer - The layer to set as current.
*/
Tilemap.prototype.setLayer = function (layer) {

    layer = this.getTilelayerIndex(layer);

    if (this.layers[layer])
    {
        this.currentLayer = layer;
    }

};

/**
* Checks if there is a tile at the given location.
*
* @method Phaser.Tilemap#hasTile
* @param {number} x - X position to check if a tile exists at (given in tile units, not pixels)
* @param {number} y - Y position to check if a tile exists at (given in tile units, not pixels)
* @param {number|string|Phaser.TilemapLayer} layer - The layer to set as current.
* @return {boolean} True if there is a tile at the given location, otherwise false.
*/
Tilemap.prototype.hasTile = function (x, y, layer) {

    layer = this.getTilelayerIndex(layer);

    return !!(this.layers[layer].tiles[y] ? this.layers[layer].tiles[y][x] : false);

};

/**
* Removes the tile located at the given coordinates and updates the collision data.
*
* @method Phaser.Tilemap#removeTile
* @param {number} x - X position to place the tile (given in tile units, not pixels)
* @param {number} y - Y position to place the tile (given in tile units, not pixels)
* @param {number|string|Phaser.TilemapLayer} [layer] - The layer to modify.
* @return {Phaser.Tile} The Tile object that was removed from this map.
*/
Tilemap.prototype.removeTile = function (x, y, layer) {

    layer = this.getTilelayerIndex(layer);

    if (x >= 0 && x < this.layers[layer].size.x && y >= 0 && y < this.layers[layer].size.y)
    {
        if (this.hasTile(x, y, layer))
        {
            var tile = this.layers[layer].tiles[y][x];

            this.layers[layer].tiles[y][x] = null;
            this.layers[layer].dirty = true;

            this.calculateFaces(layer);

            return tile;
        }
    }

};

/**
* Removes the tile located at the given coordinates and updates the collision data.
* The coordinates are given in pixel values.
*
* @method Phaser.Tilemap#removeTileWorldXY
* @param {number} x - X position to remove the tile (given in pixels)
* @param {number} y - Y position to remove the tile (given in pixels)
* @param {number} tileWidth - The width of the tile in pixels.
* @param {number} tileHeight - The height of the tile in pixels.
* @param {number|string|Phaser.TilemapLayer} [layer] - The layer to modify.
* @return {Phaser.Tile} The Tile object that was removed from this map.
*/
Tilemap.prototype.removeTileWorldXY = function (x, y, tileWidth, tileHeight, layer) {

    x = this.game.math.snapToFloor(x, tileWidth) / tileWidth;
    y = this.game.math.snapToFloor(y, tileHeight) / tileHeight;

    return this.removeTile(x, y, layer);

};

/**
* Puts a tile of the given index value at the coordinate specified.
* If you pass `null` as the tile it will pass your call over to Tilemap.removeTile instead.
*
* @method Phaser.Tilemap#putTile
* @param {Phaser.Tile|number|null} tile - The index of this tile to set or a Phaser.Tile object,
*       null means to remove the tile.
* @param {number} x - X position to place the tile (given in tile units, not pixels)
* @param {number} y - Y position to place the tile (given in tile units, not pixels)
* @param {number|string|Phaser.TilemapLayer} [layer] - The layer to modify.
* @return {Phaser.Tile} The Tile object that was created or added to this map.
*/
Tilemap.prototype.putTile = function (tile, x, y, layer) {

    if (tile === null)
    {
        return this.removeTile(x, y, layer);
    }

    layer = this.getTilelayerIndex(layer);

    var tileId;
    var tileset;

    if (x >= 0 && x < this.layers[layer].size.x && y >= 0 && y < this.layers[layer].size.y)
    {
        if (!this.layers[layer].tiles[y]) {
            this.layers[layer].tiles[y] = {};
        }

        if (tile instanceof Phaser.Tile)
        {
            var idx = (y * this.layers[layer].size.x) + x;

            tileId = this.layers[layer].tileIds[idx];
            tileset = this.getTileset(tileId);

            if (this.hasTile(x, y, layer))
            {
                this.layers[layer].tiles[y][x].copy(tile);
            }
            else
            {
                this.layers[layer].tiles[y][x] = new Tile(this.game, x, y, tileId, tileset, this.layers[layer]);
            }
        }
        else
        {
            tileId = this.layers[layer].tileIds[tile];
            tileset = this.getTileset(tileId);

            this.layers[layer].tiles[y][x] = null;
            this.layers[layer].tiles[y][x] = new Tile(this.game, x, y, tileId, tileset, this.layers[layer]);
        }

        // if (this.collideIndexes.indexOf(index) > -1)
        // {
        //     this.layers[layer].tiles[y][x].setCollision(true, true, true, true);
        // }
        // else
        // {
        //     this.layers[layer].tiles[y][x].resetCollision();
        // }

        this.layers[layer].dirty = true;

        this.calculateFaces(layer);

        return this.layers[layer].tiles[y][x];
    }

    return null;

};

/**
* Puts a tile into the Tilemap layer. The coordinates are given in pixel values.
*
* @method Phaser.Tilemap#putTileWorldXY
* @param {Phaser.Tile|number} tile - The index of this tile to set or a Phaser.Tile object.
* @param {number} x - X position to insert the tile (given in pixels)
* @param {number} y - Y position to insert the tile (given in pixels)
* @param {number} tileWidth - The width of the tile in pixels.
* @param {number} tileHeight - The height of the tile in pixels.
* @param {number|string|Phaser.TilemapLayer} [layer] - The layer to modify.
* @return {Phaser.Tile} The Tile object that was created or added to this map.
*/
Tilemap.prototype.putTileWorldXY = function (tile, x, y, tileWidth, tileHeight, layer) {

    x = this.game.math.snapToFloor(x, tileWidth) / tileWidth;
    y = this.game.math.snapToFloor(y, tileHeight) / tileHeight;

    return this.putTile(tile, x, y, layer);

};

/**
* Gets a tile from the Tilemap Layer. The coordinates are given in tile values.
*
* @method Phaser.Tilemap#getTile
* @param {number} x - X position to get the tile from (given in tile units, not pixels)
* @param {number} y - Y position to get the tile from (given in tile units, not pixels)
* @param {number|string|Phaser.TilemapLayer} [layer] - The layer to get the tile from.
* @param {boolean} [nonNull=false] - If true getTile won't return null for empty tiles,
*       but a Tile object with an index of -1.
* @return {Phaser.Tile} The tile at the given coordinates or null if no tile was found or the coordinates were invalid.
*/
Tilemap.prototype.getTile = function (x, y, layer, nonNull) {

    if (typeof nonNull === 'undefined') { nonNull = false; }

    layer = this.getTilelayerIndex(layer);

    if (x >= 0 && x < this.layers[layer].size.x && y >= 0 && y < this.layers[layer].size.y)
    {
        return this.layers[layer].tiles[y] ? this.layers[layer].tiles[y][x] : null;
    }

    return null;

};

/**
* Gets a tile from the Tilemap layer. The coordinates are given in pixel values.
*
* @method Phaser.Tilemap#getTileWorldXY
* @param {number} x - X position to get the tile from (given in pixels)
* @param {number} y - Y position to get the tile from (given in pixels)
* @param {number} [tileWidth] - The width of the tiles. If not given the map default is used.
* @param {number} [tileHeight] - The height of the tiles. If not given the map default is used.
* @param {number|string|Phaser.TilemapLayer} [layer] - The layer to get the tile from.
* @return {Phaser.Tile} The tile at the given coordinates.
*/
Tilemap.prototype.getTileWorldXY = function (x, y, tileWidth, tileHeight, layer) {

    if (typeof tileWidth === 'undefined') { tileWidth = this.tileWidth; }
    if (typeof tileHeight === 'undefined') { tileHeight = this.tileHeight; }

    x = this.game.math.snapToFloor(x, tileWidth) / tileWidth;
    y = this.game.math.snapToFloor(y, tileHeight) / tileHeight;

    return this.getTile(x, y, layer);

};

/**
* Removes all layers from this tile map.
*
* @method Phaser.Tilemap#removeAllLayers
*/
Tilemap.prototype.removeAllLayers = function () {

    this.layers.length = 0;
    this.currentLayer = 0;

};

/**
* Dumps the tilemap data out to the console.
*
* @method Phaser.Tilemap#dump
*/
Tilemap.prototype.dump = function () {

    var txt = '';
    var args = [''];

    for (var y = 0; y < this.layers[this.currentLayer].size.y; y++)
    {
        for (var x = 0; x < this.layers[this.currentLayer].size.x; x++)
        {
            txt += '%c  ';

            if (this.layers[this.currentLayer].tiles[y] && this.layers[this.currentLayer].tiles[y][x])
            {
                if (this.debugMap[this.layers[this.currentLayer].tiles[y][x]])
                {
                    args.push('background: ' + this.debugMap[this.layers[this.currentLayer].tiles[y][x]]);
                }
                else
                {
                    args.push('background: #ffffff');
                }
            }
            else
            {
                args.push('background: rgb(0, 0, 0)');
            }
        }

        txt += '\n';
    }

    args[0] = txt;
    console.log.apply(console, args);

};

/**
 * Gets the tileset that an ID is associated with
 *
 * @method getTileset
 * @param tileId {Number} The id of the tile to find the tileset for
 * @return {TiledTileset} Returns the tileset if found, undefined if not
 */
Tilemap.prototype.getTileset = function (tileId) {
    for (var i = 0, il = this.tilesets.length; i < il; ++i) {
        if (this.tilesets[i].contains(tileId)) {
            return this.tilesets[i];
        }
    }
};

Tilemap.prototype.postUpdate = function () {
    if (this._camScaleX !== this.game.camera.scale.x || this._camScaleY !== this.game.camera.scale.y) {
        this._camScaleX = this.game.camera.scale.x;
        this._camScaleY = this.game.camera.scale.y;

        this.setTileSize(this.tileWidth, this.tileHeight);

        this.dirty = true;
    }

    Phaser.Group.prototype.postUpdate.apply(this, arguments);

    this.dirty = false;
};

/**
 * Spawns all the objects in the ObjectGroups of this map
 *
 * @method spawnObjects
 * @return {Tilemap} Returns itself.
 * @chainable
 */
Tilemap.prototype.spawnObjects = function (spawnCallback) {
    for (var i = 0, il = this.objects.length; i < il; ++i) {
        this.objects[i].spawn(spawnCallback);
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
    for (var i = 0, il = this.objects.length; i < il; ++i) {
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
    for (var i = 0, il = this.layers.length; i < il; ++i) {
        this.layers[i].clearTiles();
    }

    return this;
};

/**
 * Destroys the tilemap instance
 *
 * @method destroy
 */
Tilemap.prototype.destroy = function () {
    Phaser.Group.prototype.destroy.apply(this, arguments);

    for (var i = 0; i < this.tilesets.length; ++i) {
        this.tilesets[i].destroy();
    }

    this.position = null;
    this.scale = null;
    this.pivot = null;

    this.key = null;
    this.size = null;
    this.tileWidth = null;
    this.tileHeight = null;
    this.scaledTileWidth = null;
    this.scaledTileHeight = null;
    this.orientation = null;
    this.format = null;
    this.version = null;
    this.properties = null;
    this.widthInPixels = null;
    this.heightInPixels = null;

    this.layers = null;

    this.tilesets = null;

    this.objects = null;

    this.images = null;

    this.collideIndexes = null;

    this.debugMap = null;

    this.currentLayer = null;
    this.preventingRecalculate = null;
    this.needToRecalculate = null;
    this._camScaleX = null;
    this._camScaleY = null;
    this.dirty = null;
};

/**
* @name Phaser.Tilemap#layer
* @property {number|string|Phaser.TilemapLayer} layer - The current layer object.
*/
Object.defineProperty(Tilemap.prototype, 'layer', {

    get: function () {

        return this.layers[this.currentLayer];

    },

    set: function (value) {

        if (value !== this.currentLayer)
        {
            this.setLayer(value);
        }

    }

});

for (var key in C) {
    Tilemap[key] = C[key];
}
