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
// TODO: Allow optional use of SpriteBatch instead of Group?
//
// for discussions about this implementation:
//   see: https://github.com/GoodBoyDigital/pixi.js/issues/48
//   and: https://github.com/photonstorm/phaser/issues/1145
function Tilelayer(game, map, layer, width, height) {
    Phaser.Group.call(this, game, map);

    // Non-Tiled related properties

    /**
     * The game instance this tilelayer belongs to
     *
     * @property game
     * @type Phaser.Game
     */
    // this.game = game;

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
    this.tiles = [];

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

    /**
     * Is this layer supposed to be preRendered?
     *
     * @property preRender
     * @type Boolean
     * @default false
     */
    // this.preRender = layer.preRender || this.properties.preRender || this.map.properties.preRender || false;

    /**
     * The size of a chunk when pre rendering
     *
     * @property chunkSize
     * @type Phaser.Point
     * @default new Phaser.Point(512, 512)
     */
    // this.chunkSize = new Phaser.Point(
    //     layer.chunkSizeX || layer.chunkSize || this.properties.chunkSizeX || this.properties.chunkSize || 512,
    //     layer.chunkSizeY || layer.chunkSize || this.properties.chunkSizeY || this.properties.chunkSize || 512
    // );

    //translate some tiled properties to our inherited properties
    this.x = layer.x || 0;
    this.y = layer.y || 0;
    this.alpha = layer.opacity !== undefined ? layer.opacity : 1;
    this.visible = layer.visible !== undefined ? layer.visible : true;

    //some private trackers
    // this._preRendered = false;
    this._tilePool = [];
    this._buffered = { left: false, right: false, top: false, bottom: false };
    this._scroll = new Phaser.Point(); // the current scroll position
    this._scrollDelta = new Phaser.Point(); // the current delta of scroll since the last sprite move
    this._renderArea = new Phaser.Rectangle(); // the area to render in tiles

    this._camWidth = 0;
    this._camHeight = 0;
    this._camScaleX = 0;
    this._camScaleY = 0;
    this._scaledTileSize = new Phaser.Point();
    this.dirty = true;

    // this.updateRenderArea(width, height);

    // this.physicsContainer = new SpriteBatch();
    // this.createPhysicalTiles();
}

Tilelayer.prototype = Object.create(Phaser.Group.prototype);
Tilelayer.prototype.constructor = Tilelayer;

module.exports = Tilelayer;

Tilelayer.prototype.updateRenderArea = function () {
    if (this._camWidth !== this.game.camera.view.width ||
        this._camHeight !== this.game.camera.view.height ||
        this._camScaleX !== this.game.camera.scale.x ||
        this._camScaleY !== this.game.camera.scale.y)
    {
        this._camWidth = this.game.camera.view.width;
        this._camHeight = this.game.camera.view.height;
        this._camScaleX= this.game.camera.scale.x;
        this._camScaleY = this.game.camera.scale.y;

        this._scaledTileSize.x = this.map.tileWidth * this.game.camera.scale.x;
        this._scaledTileSize.y = this.map.tileHeight * this.game.camera.scale.y;

        this._renderArea.width = Phaser.Math.ceil(this.game.camera.view.width / this._scaledTileSize.x);

        // ensure we don't go outside the map width
        this._renderArea.width = (this._renderArea.x + this._renderArea.width > this.map.size.x) ?
            (this.map.size.x - this._renderArea.x) : this._renderArea.width;

        this._renderArea.height = Phaser.Math.ceil(this.game.camera.view.width / this._scaledTileSize.y);

        // ensure we don't go outside the map height
        this._renderArea.height = (this._renderArea.y + this._renderArea.height > this.map.size.y) ?
            (this.map.size.y - this._renderArea.y) : this._renderArea.height;

        this.dirty = true;
    }

    this._renderArea.x = Phaser.Math.clampBottom(Phaser.Math.floor(this._scroll.x / this._scaledTileSize.x), 0);
    this._renderArea.y = Phaser.Math.clampBottom(Phaser.Math.floor(this._scroll.y / this._scaledTileSize.y), 0);
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

    this.updateRenderArea();

    if (this.dirty) {
        this.dirty = false;

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
    for(var x = this._renderArea.x; x < this._renderArea.right; ++x) {
        for(var y = this._renderArea.y; y < this._renderArea.bottom; ++y) {
            this.moveTileSprite(-1, -1, x, y);
        }
    }

    // reset buffered status
    this._buffered.left = this._buffered.right = this._buffered.top = this._buffered.bottom = false;

    // reset panDelta
    this._scrollDelta.x = this._scroll.x % this._scaledTileSize.x;
    this._scrollDelta.y = this._scroll.y % this._scaledTileSize.y;
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
    var c;

    // if(this.preRender && !remove) {
    //     for(c = this.children.length - 1; c > -1; --c) {
    //         this.children[c].visible = false;
    //     }

    //     return;
    // }

    // force rerender later
    // this._preRendered = false;

    for(c = this.children.length - 1; c > -1; --c) {
        if (this.children[c].type === Phaser.TILESPRITE) {
            this.clearTile(this.children[c], remove);
        }
    }

    this.tiles.length = 0;

    return this;
};

Tilelayer.prototype.clearTile = function (tile, remove) {
    tile.visible = false;
    // tile.disablePhysics();

    if (remove) {
        this.removeChild(tile);
    }
    else {
        this._tilePool.push(tile);
    }
};

Tilelayer.prototype._freeTile = function (x, y) {
    if (this.tiles[x] && this.tiles[x][y]) {
        this.clearTile(this.tiles[x][y]);
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
    // if off the map, just ignore it
    if (toTileX < 0 || toTileY < 0 || toTileX >= this.map.size.x || toTileY >= this.map.size.y) {
        return;
    }

    // free the tiles we are dealing with
    this._freeTile(toTileX, toTileY);
    this._freeTile(fromTileX, fromTileY);

    var tile,
        id = (toTileX + (toTileY * this.size.x)),
        tileId = this.tileIds[id],
        set = this.map.getTileset(tileId),
        texture,
        props,
        posX,
        posY,
        // hitArea,
        interactive;

    // if no tileset, return
    if (!set) {
        return;
    }

    //grab some values for the tile
    texture = set.getTileTexture(tileId);
    props = set.getTileProperties(tileId);
    // hitArea = props.hitArea || set.properties.hitArea;
    // interactive = this._getInteractive(set, props);
    posX = (toTileX * this.map.tileWidth) + set.tileoffset.x;
    posY = (toTileY * this.map.tileHeight) + set.tileoffset.y;

    // due to the fact that we use top-left anchors for everything, but tiled uses bottom-left
    // we need to move the position of each tile down by a single map-tile height. That is why
    // there is an addition of "this.map.tileSize.y" to the coords
    // posY += this.map.tileHeight;

    // grab a new tile from the pool
    tile = this._tilePool.pop();

    // if we couldn't find a tile from the pool, then create a new tile
    if (!tile) {
        tile = new Tile(this.game, posX, posY, texture);
        // tile.anchor.y = 1;

        this.addChild(tile);
    }
    else {
        tile.position.x = posX;
        tile.position.y = posY;

        tile.setTexture(texture);
    }

    tile.blendMode = (props.blendMode || this.properties.blendMode) ?
        Phaser.blendModes[(props.blendMode || this.properties.blendMode)] : Phaser.blendModes.NORMAL;

    // tile.interactive = interactive;
    // tile.hitArea = hitArea;
    // tile.mass = props.mass || 0;
    tile.visible = true;

    // if(tile.mass) {
    //     tile.enablePhysics(this.state.physics);
    // }

    // pass through all events
    // if (interactive) {
    //     tile.click = this.onTileEvent.bind(this, 'click', tile);
    //     tile.mousedown = this.onTileEvent.bind(this, 'mousedown', tile);
    //     tile.mouseup = this.onTileEvent.bind(this, 'mouseup', tile);
    //     tile.mousemove = this.onTileEvent.bind(this, 'mousemove', tile);
    //     tile.mouseout = this.onTileEvent.bind(this, 'mouseout', tile);
    //     tile.mouseover = this.onTileEvent.bind(this, 'mouseover', tile);
    //     tile.mouseupoutside = this.onTileEvent.bind(this, 'mouseupoutside', tile);
    // }

    //update sprite position in the map
    if (!this.tiles[toTileX]) {
        this.tiles[toTileX] = [];
    }

    this.tiles[toTileX][toTileY] = tile;

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
    // if (this.preRender) {
    //     return;
    // }

    var dx = this._scrollDelta.x,
        dy = this._scrollDelta.y,
        tszX = this._scaledTileSize.x,
        tszY = this._scaledTileSize.y;

    // First, check if we need to build a buffer around the viewport
    // usually this happens on the first pan after a full render
    // caused by a viewport resize. We do this buffering here instead
    // of in the initial render because in the initial render, the buffer
    // may try to go negative which has no tiles. Plus doing it here
    // reduces the number of tiles that need to be created initially.

    //moving world right, so left will be exposed
    if (dx > 0 && !this._buffered.left) {
        this._renderLeft(this._buffered.left = true);
    }
    //moving world left, so right will be exposed
    else if (dx < 0 && !this._buffered.right) {
        this._renderRight(this._buffered.right = true);
    }

    //moving world down, so top will be exposed
    if (dy > 0 && !this._buffered.top) {
        this._renderUp(this._buffered.top = true);
    }
    //moving world up, so bottom will be exposed
    else if (dy < 0 && !this._buffered.bottom) {
        this._renderDown(this._buffered.bottom = true);
    }

    // Here is where the actual panning gets done, we check if the pan
    // delta is greater than a scaled tile and if so pan that direction.
    // The reason we do it in a while loop is because the delta can be
    // large than 1 scaled tile and may require multiple render pans
    // (this can happen if you can .pan(x, y) with large values)

    // moved position right, so render left
    while(this._scrollDelta.x >= tszX) {
        this._renderLeft();
        this._scrollDelta.x -= tszX;
    }

    // moved position left, so render right
    while(this._scrollDelta.x <= -tszX) {
        this._renderRight();
        this._scrollDelta.x += tszX;
    }

    // moved position down, so render up
    while(this._scrollDelta.y >= tszY) {
        this._renderUp();
        this._scrollDelta.y -= tszY;
    }

    // moved position up, so render down
    while(this._scrollDelta.y <= -tszY) {
        this._renderDown();
        this._scrollDelta.y += tszY;
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
    //move all the far right tiles to the left side
    for(var i = 0; i < this._renderArea.height + 1; ++i) {
        this.moveTileSprite(
            forceNew ? -1 : this._renderArea.right,
            forceNew ? -1 : this._renderArea.top + i,
            this._renderArea.left - 1,
            this._renderArea.top + i
        );
    }

    this._renderArea.x--;

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
    for(var i = 0; i < this._renderArea.height + 1; ++i) {
        this.moveTileSprite(
            forceNew ? -1 : this._renderArea.left,
            forceNew ? -1 : this._renderArea.top + i,
            this._renderArea.right + 1,
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
    //move all the far bottom tiles to the top side
    for(var i = 0; i < this._renderArea.width + 1; ++i) {
        this.moveTileSprite(
            forceNew ? -1 : this._renderArea.left + i,
            forceNew ? -1 : this._renderArea.bottom,
            this._renderArea.left + i,
            this._renderArea.top - 1
        );
    }

    this._renderArea.y--;

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
    for(var i = 0; i < this._renderArea.width + 1; ++i) {
        this.moveTileSprite(
            forceNew ? -1 : this._renderArea.left + i,
            forceNew ? -1 : this._renderArea.top,
            this._renderArea.left + i,
            this._renderArea.bottom + 1
        );
    }

    if(!forceNew) {
        this._renderArea.y++;
    }

    if(forceNew) {
        this._renderArea.height++;
    }
};

/**
 * Destroys the tile layer completely
 *
 * @method destroy
 */
Tilelayer.prototype.destroy = function () {
    Phaser.Group.prototype.destroy.call(this);

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
        return this.size.x * this.map.tileWidth;
    }
});

Object.defineProperty(Tilelayer.prototype, 'heightInPixels', {
    get: function () {
        return this.size.y * this.map.tileHeight;
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



// Tilelayer.prototype.createPhysicalTiles = function () {
//     var tid, tex, set, props, tile,
//         szx = this.map.size.x,
//         tsx = this.map.tileSize.x,
//         tsy = this.map.tileSize.y;
//
//     for(var i = 0; i < this.tileIds.length; ++i) {
//         tid = this.tileIds[i];
//         set = this.map.getTileset(tid);
//
//         if(!set) continue;
//
//         props = set.getTileProperties(tid);
//
//         if(!props.mass) continue;
//
//         tex = set.getTileTexture(tid);
//         tile = new Tile(tex);
//         this.physicsContainer.addChild(tile);
//
//         tile.mass = props.mass;
//         tile.hitArea = props.hitArea || set.properties.hitArea;
//         tile.setPosition(
//             ((i % szx) * tsx) + set.tileoffset.x,
//             (math.floor(i / szx) * tsy) + set.tileoffset.y + tsy
//         );
//
//         tile.enablePhysics(this.state.physics);
//     }
// };

/**
 * Renders the map onto different canvases, one per chunk. This only runs once
 * then the canvases are used as a textures for tiles the size of chunks.
 *
 * @method _preRender
 * @private
 */
// Tilelayer.prototype._preRender = function () {
//     if(!this.visible)
//         return;
//
//     this._preRendered = true;
//     this.tileSize = this.chunkSize.clone();
//
//     var world = this.map,
//         width = world.size.x * world.tileSize.x,
//         height = world.size.y * world.tileSize.y,
//         xChunks = math.ceil(width / this.chunkSize.x),
//         yChunks = math.ceil(height / this.chunkSize.y);
//
//     //for each chunk
//     for(var x = 0; x < xChunks; ++x) {
//         for(var y = 0; y < yChunks; ++y) {
//             var cw = (x === xChunks - 1) ? width - (x * this.chunkSize.x) : this.chunkSize.x,
//                 ch = (y === yChunks - 1) ? height - (y * this.chunkSize.y) : this.chunkSize.y;
//
//             this._preRenderChunk(x, y, cw, ch);
//         }
//     }
// };

/**
 * Renders a single chunk to a single canvas and creates/places the tile instance for it.
 *
 * @method _preRenderChunk
 * @param cx {Number} The x-coord of this chunk's top left
 * @param cy {Number} The y-coord of this chunk's top left
 * @param w {Number} The width of this chunk
 * @param h {Number} The height of this chunk
 * @private
 */
// Tilelayer.prototype._preRenderChunk = function (cx, cy, w, h) {
//     var world = this.map,
//         tsx = world.tileSize.x,
//         tsy = world.tileSize.y,
//         xTiles = w / tsx,
//         yTiles = h / tsy,
//         nx = (cx * this.chunkSize.x) % tsx,
//         ny = (cy * this.chunkSize.y) % tsy,
//         tx = math.floor(cx * this.chunkSize.x / tsx),
//         ty = math.floor(cy * this.chunkSize.y / tsy),
//         sx = world.size.x,
//         sy = world.size.y,
//         canvas = document.createElement('canvas'),
//         ctx = canvas.getContext('2d');
//
//     canvas.width = w;
//     canvas.height = h;
//
//     //draw all the tiles in this chunk to the canvas
//     for(var x = 0; x < xTiles; ++x) {
//         for(var y = 0; y < yTiles; ++y) {
//             if(x + tx < sx && y + ty < sy) {
//                 var id = ((x + tx) + ((y + ty) * sx)),
//                     tid = this.tileIds[id],
//                     set = world.getTileset(tid),
//                     tex, frame;
//
//                 if(set) {
//                     tex = set.getTileTexture(tid);
//                     frame = tex.frame;
//
//                     ctx.drawImage(
//                         tex.baseTexture.source,
//                         frame.x,
//                         frame.y,
//                         frame.width,
//                         frame.height,
//                         (x * tsx) - nx + set.tileoffset.x,
//                         (y * tsy) - ny + set.tileoffset.y,
//                         frame.width,
//                         frame.height
//                     );
//                 }
//             }
//         }
//     }
//
//     //use the canvas as a texture for a tile to display
//     var tile = new Tile(Texture.fromCanvas(canvas));
//     tile.setPosition(
//         cx * this.chunkSize.x,
//         cy * this.chunkSize.y
//     );
//
//     if(!this.tiles[cx])
//         this.tiles[cx] = {};
//
//     this.addChild(tile);
//     this.tiles[cx][cy] = tile;
// };



/**
 * Called whenever a tile event occurs, this is used to echo to the parent.
 *
 * @method onTileEvent
 * @param eventName {String} The name of the event
 * @param tile {Tile} The tile the event happened to
 * @param data {mixed} The event data that was passed along
 * @private
 */
// Tilelayer.prototype.onTileEvent = function (eventName, tile, data) {
//     this.map.onTileEvent(eventName, tile, data);
// };

/**
 * Checks if an object should be marked as interactive
 *
 * @method _getInteractive
 * @param set {Tileset} The tileset for the object
 * @param props {Object} The Tiled properties object
 * @return {Boolean} Whether or not the item is interactive
 * @private
 */
// Tilelayer.prototype._getInteractive = function (set, props) {
//     //first check the lowest level value (on the tile iteself)
//     return props.interactive || //obj interactive
//             (set && set.properties.interactive) || //tileset interactive
//             this.properties.interactive || //layer interactive
//             this.map.properties.interactive; //map interactive
// };
