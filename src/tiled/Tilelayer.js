var Tile = require('./Tile'),
    utils = require('../utils');

/**
 * The Tilelayer is the visual tiled layer that actually displays on the screen
 *
 * This class will be created by the Tilemap.
 *
 * @class Tilelayer
 * @extends Group
 * @constructor
 * @param game {Phaser.Game} The game instance this belongs to
 * @param map {Tilemap} The tilemap instance that this belongs to
 * @param index {Number} The index of the layer in the tilemap
 * @param width {Number} The width of the renderable area of the layer
 * @param height {Number} The height of the renderable area of the layer
 */
//
// TODO: Add chunk prerendering?
//
// for discussions about this implementation:
//   see: https://github.com/GoodBoyDigital/pixi.js/issues/48
//   and: https://github.com/photonstorm/phaser/issues/1145
function Tilelayer(game, map, layer, width, height) {
    Phaser.Group.call(this, game, map);

    // Non-Tiled related properties

    /**
     * The map instance this tilelayer belongs to
     *
     * @property map
     * @type Tilemap
     */
    this.map = map;

    /**
     * The index of the layer in the map
     *
     * @property index
     * @type Number
     */
    // this.index = index;

    /**
     * The const type of this object.
     *
     * @property type
     * @type Number
     * @default
     */
    this.type = Phaser.TILEMAPLAYER;

    /**
     * The current map of all tiles on the screen
     *
     * @property tiles
     * @type Object
     */
    this.tiles = {};

    /**
     * The scroll speed of the layer relative to the camera
     * (e.g. a scrollFactor of 0.5 scrolls half as quickly as the
     * 'normal' layers do)
     *
     * @property scroll
     * @type Phaser.Point
     * @default new Phaser.Point(1, 1)
     */
    this.scrollFactor = new Phaser.Point(1, 1);

    // Tiled related properties

    /**
     * The name of the layer
     *
     * @property name
     * @type String
     * @default ''
     */
    this.name = layer.name || '';

    /**
     * The size of the layer
     *
     * @property size
     * @type Phaser.Point
     * @default new Phaser.Point(1, 1)
     */
    this.size = new Phaser.Point(layer.width || 0, layer.height || 0);

    /**
     * The tile IDs of the tilemap
     *
     * @property tileIds
     * @type Uint32Array|Array
     */
    this.tileIds = Phaser.devicetypedArray ? new Uint32Array(layer.data) : layer.data;

    /**
     * The user-defined properties of this group. Usually defined in the TiledEditor
     *
     * @property properties
     * @type Object
     */
    this.properties = utils.parseTiledProperties(layer.properties);

    /**
     * The Tiled type of tile layer, should always be 'tilelayer'
     *
     * @property layerType
     * @type String
     * @default 'tilelayer'
     * @readOnly
     */
    this.layerType = layer.type || 'tilelayer';

    //translate some tiled properties to our inherited properties
    this.x = layer.x || 0;
    this.y = layer.y || 0;
    this.alpha = layer.opacity !== undefined ? layer.opacity : 1;
    this.visible = layer.visible !== undefined ? layer.visible : true;

    //some private trackers
    this._tilePool = [];
    this._buffered = { left: false, right: false, top: false, bottom: false };
    this._scroll = new Phaser.Point(); // the current scroll position
    this._scrollDelta = new Phaser.Point(); // the current delta of scroll since the last sprite move
    this._renderArea = new Phaser.Rectangle(); // the area to render in tiles

    this._scaledTileSize = new Phaser.Point();
    this.dirty = true;

    if (this.properties.batch) {
        this.container = this.addChild(new Phaser.SpriteBatch());
    } else {
        this.container = this;
    }
}

Tilelayer.prototype = Object.create(Phaser.Group.prototype);
Tilelayer.prototype.constructor = Tilelayer;

module.exports = Tilelayer;

Tilelayer.prototype.setupRenderArea = function () {
    this._scaledTileSize.x = this.map.tileWidth * this.game.camera.scale.x;
    this._scaledTileSize.y = this.map.tileHeight * this.game.camera.scale.y;

    this._renderArea.x = Phaser.Math.clampBottom(Phaser.Math.floor(this._scroll.x / this._scaledTileSize.x), 0);
    this._renderArea.y = Phaser.Math.clampBottom(Phaser.Math.floor(this._scroll.y / this._scaledTileSize.y), 0);

    this._renderArea.width = Phaser.Math.ceil(this.game.camera.view.width / this._scaledTileSize.x);

    // ensure we don't go outside the map width
    this._renderArea.width = (this._renderArea.x + this._renderArea.width > this.map.size.x) ?
        (this.map.size.x - this._renderArea.x) : this._renderArea.width;

    this._renderArea.height = Phaser.Math.ceil(this.game.camera.view.height / this._scaledTileSize.y);

    // ensure we don't go outside the map height
    this._renderArea.height = (this._renderArea.y + this._renderArea.height > this.map.size.y) ?
        (this.map.size.y - this._renderArea.y) : this._renderArea.height;
};

/**
 * Sets the world size to match the size of this layer.
 *
 * @method resizeWorld
 */
Tilelayer.prototype.resizeWorld = function () {
    this.game.world.setBounds(0, 0, this.widthInPixels, this.heightInPixels);
};

/**
 * Automatically called by World.postUpdate. Handles scrolling the layer
 *
 * @method postUpdate
 */
Tilelayer.prototype.postUpdate = function () {
    Phaser.Group.prototype.postUpdate.call(this);

    if (this.fixedToCamera) {
        this.position.x = (this.game.camera.view.x + this.cameraOffset.x) / this.game.camera.scale.x;
        this.position.y = (this.game.camera.view.y + this.cameraOffset.y) / this.game.camera.scale.y;
    }

    if (this.dirty) {
        this.dirty = false;

        // setup the render area
        this.setupRenderArea();

        // resize the world to the new size
        this.resizeWorld();

        // render the tiles on the screen
        this.setupTiles();

        return this;
    }

    this.scrollX = this.game.camera.x * this.scrollFactor.x;
    this.scrollY = this.game.camera.y * this.scrollFactor.y;
    this.updatePan();
};

/**
 * Clears the current tiles and sets up the render area
 *
 * @method setupTiles
 * @private
 */
Tilelayer.prototype.setupTiles = function () {
    // clear all the tiles
    this.clearTiles();

    // setup a tile for each location in the renderArea
    for (var x = this._renderArea.x; x < this._renderArea.right; ++x) {
        for (var y = this._renderArea.y; y < this._renderArea.bottom; ++y) {
            this.moveTileSprite(-1, -1, x, y);
        }
    }

    // reset buffered status
    this._buffered.left = this._buffered.right = this._buffered.top = this._buffered.bottom = false;

    // reset panDelta
    this._scrollDelta.x = this._scroll.x % this._scaledTileSize.x;
    this._scrollDelta.y = this._scroll.y % this._scaledTileSize.y;

    if (this.name === 'ground') {
        console.log('setup');
        console.table(this.tiles);
    }
};

/**
 * Clears all the tiles currently used to render the layer
 *
 * @method clearTiles
 * @param remove {Boolean} Should this tile be completely removed (never to bee seen again)
 * @return {Tilelayer} Returns itself.
 * @chainable
 */
Tilelayer.prototype.clearTiles = function (remove) {
    for (var c = this.children.length - 1; c > -1; --c) {
        if (this.children[c].type === Phaser.TILESPRITE) {
            this.clearTile(this.children[c], remove);
        }
    }

    this.tiles = {};

    return this;
};

Tilelayer.prototype.clearTile = function (tile, remove) {
    tile.visible = false;

    if (remove) {
        this.removeChild(tile);
    }
    else {
        this._tilePool.push(tile);
    }
};

Tilelayer.prototype._freeTile = function (x, y) {
    if (this.tiles[y] && this.tiles[y][x]) {
        this.clearTile(this.tiles[y][x]);
        this.tiles[y][x] = undefined;
    }
};

/**
 * Moves a tile sprite from one position to another, and creates a new tile
 * if the old position didn't have a sprite
 *
 * @method moveTileSprite
 * @param fromTileX {Number} The x coord of the tile in units of tiles (not pixels) to move from
 * @param fromTileY {Number} The y coord of the tile in units of tiles (not pixels) to move from
 * @param toTileX {Number} The x coord of the tile in units of tiles (not pixels) to move to
 * @param toTileY {Number} The y coord of the tile in units of tiles (not pixels) to move to
 * @return {Tile} The sprite to display
 */
Tilelayer.prototype.moveTileSprite = function (fromTileX, fromTileY, toTileX, toTileY) {
    // free the tiles we are dealing with
    this._freeTile(toTileX, toTileY);
    this._freeTile(fromTileX, fromTileY);

    // if off the map, just ignore it
    if (toTileX < 0 || toTileY < 0 || toTileX >= this.map.size.x || toTileY >= this.map.size.y) {
        return;
    }

    var tile,
        id = (toTileX + (toTileY * this.size.x)),
        tileId = this.tileIds[id],
        set = this.map.getTileset(tileId);

    // if no tileset, return
    if (!set) {
        return;
    }

    // calculate some values for the tile
    var texture = set.getTileTexture(tileId),
        props = set.getTileProperties(tileId),
        posX = (toTileX * this.map.tileWidth) + set.tileoffset.x,
        posY = (toTileY * this.map.tileHeight) + set.tileoffset.y;

    // grab a new tile from the pool
    tile = this._tilePool.pop();

    // if we couldn't find a tile from the pool, then create a new tile
    if (!tile) {
        tile = new Tile(this.game, posX, posY, texture);

        this.container.addChild(tile);
    }
    else {
        tile.position.x = posX;
        tile.position.y = posY;

        tile.setTexture(texture);
    }

    tile.blendMode = (props.blendMode || this.properties.blendMode) ?
        Phaser.blendModes[(props.blendMode || this.properties.blendMode)] : Phaser.blendModes.NORMAL;

    tile.visible = true;

    // update sprite reference in the map
    if (!this.tiles[toTileY]) {
        this.tiles[toTileY] = {};
    }

    this.tiles[toTileY][toTileX] = tile;

    return tile;
};

/**
 * Pans the layer around, rendering stuff if necessary
 *
 * @method updatePan
 * @return {Tilelayer} Returns itself.
 * @chainable
 */
Tilelayer.prototype.updatePan = function () {
    // First, check if we need to build a buffer around the viewport
    // usually this happens on the first pan after a full render
    // caused by a viewport resize. We do this buffering here instead
    // of in the initial render because in the initial render, the buffer
    // may try to go negative which has no tiles. Plus doing it here
    // reduces the number of tiles that need to be created initially.

    // moving world right, so left will be exposed
    if (this._scrollDelta.x > 0 && !this._buffered.left) {
        this._buffered.left = true;
        this._renderLeft(true);
    }
    // moving world left, so right will be exposed
    else if (this._scrollDelta.x < 0 && !this._buffered.right) {
        this._buffered.right = true;
        this._renderRight(true);
    }

    // moving world down, so top will be exposed
    if (this._scrollDelta.y > 0 && !this._buffered.top) {
        this._buffered.top = true;
        this._renderUp(true);
    }
    // moving world up, so bottom will be exposed
    else if (this._scrollDelta.y < 0 && !this._buffered.bottom) {
        this._buffered.bottom = true;
        this._renderDown(true);
    }

    // Here is where the actual panning gets done, we check if the pan
    // delta is greater than a scaled tile and if so pan that direction.
    // The reason we do it in a while loop is because the delta can be
    // large than 1 scaled tile and may require multiple render pans
    // (this can happen if you can .pan(x, y) with large values)

    // moved position right, so render left
    while (this._scrollDelta.x >= this._scaledTileSize.x) {
        this._renderLeft();
        this._scrollDelta.x -= this._scaledTileSize.x;
    }

    // moved position left, so render right
    while (this._scrollDelta.x <= -this._scaledTileSize.x) {
        this._renderRight();
        this._scrollDelta.x += this._scaledTileSize.x;
    }

    // moved position down, so render up
    while (this._scrollDelta.y >= this._scaledTileSize.y) {
        this._renderUp();
        this._scrollDelta.y -= this._scaledTileSize.y;
    }

    // moved position up, so render down
    while (this._scrollDelta.y <= -this._scaledTileSize.y) {
        this._renderDown();
        this._scrollDelta.y += this._scaledTileSize.y;
    }
};

/**
 * Renders tiles to the left, pulling from the far right
 *
 * @method _renderLeft
 * @param [forceNew=false] {Boolean} If set to true, new tiles are created instead of trying to recycle
 * @private
 */
Tilelayer.prototype._renderLeft = function (forceNew) {
    this._renderArea.x--;

    //move all the far right tiles to the left side
    for (var i = 0; i < this._renderArea.height; ++i) {
        this.moveTileSprite(
            forceNew ? -1 : this._renderArea.right,
            forceNew ? -1 : this._renderArea.top + i,
            this._renderArea.left,
            this._renderArea.top + i
        );
    }

    if (forceNew) {
        this._renderArea.width++;
    }
};

/**
 * Renders tiles to the right, pulling from the far left
 *
 * @method _renderRight
 * @param [forceNew=false] {Boolean} If set to true, new tiles are created instead of trying to recycle
 * @private
 */
Tilelayer.prototype._renderRight = function (forceNew) {
    //move all the far left tiles to the right side
    for (var i = 0; i < this._renderArea.height; ++i) {
        this.moveTileSprite(
            forceNew ? -1 : this._renderArea.left,
            forceNew ? -1 : this._renderArea.top + i,
            this._renderArea.right,
            this._renderArea.top + i
        );
    }

    if (!forceNew) {
        this._renderArea.x++;
    }

    if (forceNew) {
        this._renderArea.width++;
    }
};

/**
 * Renders tiles to the top, pulling from the far bottom
 *
 * @method _renderUp
 * @param [forceNew=false] {Boolean} If set to true, new tiles are created instead of trying to recycle
 * @private
 */
Tilelayer.prototype._renderUp = function (forceNew) {
    this._renderArea.y--;

    //move all the far bottom tiles to the top side
    for (var i = 0; i < this._renderArea.width; ++i) {
        this.moveTileSprite(
            forceNew ? -1 : this._renderArea.left + i,
            forceNew ? -1 : this._renderArea.bottom,
            this._renderArea.left + i,
            this._renderArea.top
        );
    }

    if (forceNew) {
        this._renderArea.height++;
    }
};

/**
 * Renders tiles to the bottom, pulling from the far top
 *
 * @method _renderDown
 * @param [forceNew=false] {Boolean} If set to true, new tiles are created instead of trying to recycle
 * @private
 */
Tilelayer.prototype._renderDown = function (forceNew) {
    //move all the far top tiles to the bottom side
    for (var i = 0; i < this._renderArea.width; ++i) {
        this.moveTileSprite(
            forceNew ? -1 : this._renderArea.left + i,
            forceNew ? -1 : this._renderArea.top,
            this._renderArea.left + i,
            this._renderArea.bottom
        );
    }

    if (!forceNew) {
        this._renderArea.y++;
    }

    if (forceNew) {
        this._renderArea.height++;
    }
};

/**
 * Destroys the tile layer completely
 *
 * @method destroy
 */
Tilelayer.prototype.destroy = function () {
    Phaser.Group.prototype.destroy.apply(this, arguments);

    this.state = null;
    this.name = null;
    this.size = null;
    this.tileIds = null;
    this.properties = null;
    this.type = null;
    this.position.x = null;
    this.position.y = null;
    this.alpha = null;
    this.visible = null;
    this.preRender = null;
    this.chunkSize = null;

    this._preRendered = null;
    this._tilePool = null;
    this._buffered = null;
    this._scroll = null;
    this._renderArea = null;
};

Object.defineProperty(Tilelayer.prototype, 'scrollX', {
    get: function () {
        return this._scroll.x;
    },
    set: function (value) {
        if (value !== this._scroll.x) {
            this._scrollDelta.x -= value - this._scroll.x;
            this._scroll.x = value;
            // this.updateRenderArea(this._renderArea.width, this._renderArea.height);
        }
    }
});

Object.defineProperty(Tilelayer.prototype, 'scrollY', {
    get: function () {
        return this._scroll.y;
    },
    set: function (value) {
        if (value !== this._scroll.y) {
            this._scrollDelta.y -= value - this._scroll.y;
            this._scroll.y = value;
            // this.updateRenderArea(this._renderArea.width, this._renderArea.height);
        }
    }
});

Object.defineProperty(Tilelayer.prototype, 'widthInPixels', {
    get: function () {
        return this.size.x * this._scaledTileSize.x;
    }
});

Object.defineProperty(Tilelayer.prototype, 'heightInPixels', {
    get: function () {
        return this.size.y * this._scaledTileSize.y;
    }
});

// Properties TODO:
// - fixedToCamera
// - cameraOffset
// - tileColor
// - debug stuff
// - rayStepRate
// - wrap

// Method TODO:
// - getRayCastTiles
// - getTiles
// -
// -
