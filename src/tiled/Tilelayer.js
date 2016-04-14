var utils = require('../utils');

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
function Tilelayer(game, map, layer, index) {
    Phaser.Group.call(this, game, map);

    this.index = index;

    // Non-Tiled related properties

    /**
     * The map instance this tilelayer belongs to
     *
     * @property map
     * @type Tilemap
     */
    this.map = map;

    /**
     * The const type of this object.
     *
     * @property type
     * @type Number
     * @default
     */
    this.type = Phaser.TILEMAPLAYER;

    /**
    * An object that is fixed to the camera ignores the position of any ancestors in the display list
    * and uses its x/y coordinates as offsets from the top left of the camera.
    *
    * @property {boolean} fixedToCamera - Fixes this object to the Camera.
    * @default
    */
    this.fixedToCamera = false;

    /**
    * @property {Phaser.Point} cameraOffset - If this object is fixed to the camera then use this Point
    * to specify how far away from the Camera x/y it's rendered.
    */
    this.cameraOffset = new Phaser.Point(0, 0);

    /**
     * All the tiles this layer has
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
    // TODO: This doesn't actually work yet!
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
    * @property {number} rayStepRate - When ray-casting against tiles this is the number of steps it will jump.
    * For larger tile sizes you can increase this to improve performance.
    * @default
    */
    this.rayStepRate = 4;

    // translate some tiled properties to our inherited properties
    this.x = layer.x || 0;
    this.y = layer.y || 0;
    this.alpha = layer.opacity !== undefined ? layer.opacity : 1;
    this.visible = layer.visible !== undefined ? layer.visible : true;

    // physics bodies in this layer
    this.bodies = [];

    // some private trackers
    this._buffered = { left: false, right: false, top: false, bottom: false };
    this._scroll = new Phaser.Point(); // the current scroll position
    this._scrollDelta = new Phaser.Point(); // the current delta of scroll since the last sprite move
    this._renderArea = new Phaser.Rectangle(); // the area to render in tiles

    /**
    * @property {object} _mc - Local map data and calculation cache.
    * @private
    */
    this._mc = {
        cw: map.tileWidth,
        ch: map.tileHeight,
        tx: 0,
        ty: 0,
        tw: 0,
        th: 0
    };

    // should we clear and rerender all the tiles
    this.dirty = true;

    // if batch is true, store children in a spritebatch
    if (this.properties.batch) {
        this.container = this.addChild(new Phaser.SpriteBatch(game));
    }
    else {
        this.container = this;
    }

    for (var i = 0; i < this.tileIds.length; ++i) {
        var x = i % this.size.x;
        var y = (i - x) / this.size.x;

        if (!this.tiles[y]) {
            this.tiles[y] = {};
        }

        this.tiles[y][x] = null;
    }

    this._tilePool = [];
    this._animTexturePool = [];
}

Tilelayer.prototype = Object.create(Phaser.Group.prototype);
Tilelayer.prototype.constructor = Tilelayer;

module.exports = Tilelayer;

Tilelayer.prototype.setupRenderArea = function () {
    // calculate the X/Y start of the render area as the tile location of the top-left of the camera view.
    this._renderArea.x = this.game.math.clampBottom(this.game.math.floorTo(this._scroll.x / this.map.scaledTileWidth), 0);
    this._renderArea.y = this.game.math.clampBottom(this.game.math.floorTo(this._scroll.y / this.map.scaledTileHeight), 0);

    // the width of the render area is the camera view width in tiles
    this._renderArea.width = this.game.math.ceilTo(this.game.camera.view.width / this.map.scaledTileWidth);

    // ensure we don't go outside the map width
    this._renderArea.width = (this._renderArea.x + this._renderArea.width > this.map.size.x) ?
        (this.map.size.x - this._renderArea.x) : this._renderArea.width;

    // the height of the render area is the camera view height in tiles
    this._renderArea.height = this.game.math.ceilTo(this.game.camera.view.height / this.map.scaledTileHeight);

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

    var physics = this.game.physics;

    if (physics.arcade) {
        physics.arcade.setBoundsToWorld();
    }

    if (physics.ninja) {
        physics.ninja.setBoundsToWorld();
    }

    if (physics.p2) {
        physics.p2.setBoundsToWorld(true, true, false, true, false);
    }
};

/**
 * Automatically called by Tilemap.postUpdate. Handles scrolling the layer and updating the scale
 *
 * @method postUpdate
 */
Tilelayer.prototype.postUpdate = function () {
    Phaser.Group.prototype.postUpdate.call(this);

    if (this.fixedToCamera) {
        this.position.x = (this.game.camera.view.x + this.cameraOffset.x) / this.game.camera.scale.x;
        this.position.y = (this.game.camera.view.y + this.cameraOffset.y) / this.game.camera.scale.y;
    }

    // TODO: this seems to not work properly when scale changes on the fly. Look into that...
    if (this.dirty || this.map.dirty) {
        // no longer dirty
        this.dirty = false;

        // setup the render area, and scaled tilesize
        this.setupRenderArea();

        // resize the world to the new size
        // TODO: Seems dangerous to do this here, may break if user wants to manually set bounds
        // and this reset it each time scale changes.
        this.resizeWorld();

        // render the tiles on the screen
        this.setupTiles();

        return this;
    }

    this.scrollX = this.game.camera.x;
    this.scrollY = this.game.camera.y;

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

    var area = (this._renderArea.width + 2) * (this._renderArea.height + 2);

    // prealloc the pool with the necessary objects
    while (this._tilePool.length < area) {
        this._tilePool.push(this._createTile());
    }

    // dealloc objects that we no longer need
    while (this._tilePool.length > area) {
        this._tilePool.pop().destroy();
    }

    // reset buffered status
    this._buffered.left = this._buffered.right = this._buffered.top = this._buffered.bottom = false;

    // reset scroll delta
    this._scrollDelta.x = this._scroll.x % this.map.scaledTileWidth;
    this._scrollDelta.y = this._scroll.y % this.map.scaledTileHeight;

    // setup the current viewport
    // setup a tile for each location in the renderArea
    for (var x = this._renderArea.x; x < this._renderArea.right; ++x) {
        for (var y = this._renderArea.y; y < this._renderArea.bottom; ++y) {
            this.moveTileSprite(-1, -1, x, y);
        }
    }

    this.sortTiles();
};

/**
 * Sorts the tiles based on their sort order (which will be set according to the map's renderorder) if
 * the map's obeyRenderorder is set to true
 *
 * @method sortTiles
 */
Tilelayer.prototype.sortTiles = function () {
    if (this.map.obeyRenderorder) {
        this.sort('sortOrder', Phaser.Group.SORT_ASCENDING);
    }
};

/**
 * Clears all the tiles currently used to render the layer
 *
 * @method clearTiles
 * @return {Tilelayer} Returns itself.
 * @chainable
 */
Tilelayer.prototype.clearTiles = function () {
    for (var c = this.container.children.length - 1; c > -1; --c) {
        if (this.container.children[c].type === Phaser.TILESPRITE) {
            this.clearTile(this.container.children[c]);
        }
    }

    return this;
};

Tilelayer.prototype.clearTile = function (tile) {
    // this was playing an animation, put its texture back into the animation texture pool
    if (tile.animations._anims.tile && tile.animations._anims.tile.isPlaying) {
        this._animTexturePool.push(tile.texture);
    }

    tile.sortOrder = 0;
    tile.visible = false;
    tile.animations.stop();
    this._tilePool.push(tile);
};

Tilelayer.prototype._freeTile = function (x, y) {
    if (this.tiles[y] && this.tiles[y][x]) {
        this.clearTile(this.tiles[y][x]);
        this.tiles[y][x] = null;
    }
};

Tilelayer.prototype._createTile = function () {
    var s = new Phaser.Sprite(this.game);

    s.type = Phaser.TILESPRITE;
    s.sortOrder = 0;

    this.container.addChild(s);

    return s;
};

Tilelayer.prototype._resetTile = function (tile, x, y, tileId, tileset) {
    // calculate some values for the tile
    var texture = tileset.getTileTexture(tileId);
    var props = tileset.getTileProperties(tileId);
    var animData = tileset.getTileAnimations(tileId);
    var blendMode = props.blendMode || this.properties.blendMode;

    tile.reset(x, y);

    tile.setTexture(texture);

    tile.blendMode = blendMode ? Phaser.blendModes[blendMode] : Phaser.blendModes.NORMAL;

    // add animations if there are any
    if (animData) {
        tile.animations.loadFrameData(animData.data);

        // use a tile animation texture, each animated tile *must* be using
        // a separate texture or they will share one and mess with eachother's
        // animations. Phaser updates a sprite's texture frame as animations play out
        // so a shared texture means each sprite's update effects other sprites besides itself.
        var animTexture = this._animTexturePool.pop() || new PIXI.Texture(texture.baseTexture, texture.frame);

        animTexture.baseTexture = texture.baseTexture;
        animTexture.frame.copyFrom(texture.frame);
        animTexture.setFrame(animTexture.frame);

        tile.setTexture(animTexture);

        if (!tile.animations._anims.tile) {
            tile.animations.add('tile');
        }

        tile.animations.play('tile', animData.rate, true);
    }

    // Flipped states based on TiledEditor source:
    // https://github.com/bjorn/tiled/blob/0ae2b91d31dfc5caf35cb4f116d71cec73a5ac7d/src/libtiled/maprenderer.cpp#L134-L154

    // setup the flipped states
    if (props.flippedX) {
        tile.scale.x = -1;
        tile.position.x += tileset.tileWidth;
    }
    else {
        tile.scale.x = 1;
    }

    if (props.flippedY) {
        tile.scale.y = -1;
        tile.position.y += tileset.tileHeight;
    }
    else {
        tile.scale.y = 1;
    }

    if (props.flippedAD) {
        tile.rotation = 1.5707963267948966; // this.game.math.degToRad(90);
        tile.scale.x *= -1;

        var sx = tile.scale.x;
        tile.scale.x = tile.scale.y;
        tile.scale.y = sx;

        var halfDiff = Math.abs(tile.height / 2) - Math.abs(tile.width / 2);
        tile.position.y += halfDiff;
        tile.position.x += halfDiff;
    }
    else {
        tile.rotation = 0;
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
        return null;
    }

    var tile;
    var id = (toTileX + (toTileY * this.size.x));
    var tileId = this.tileIds[id];
    var tileset = this.map.getTileset(tileId);

    // if no tileset, return
    if (!tileset) {
        return null;
    }

    // grab a new tile from the pool
    // should exist since we just freed earlier, and the pool is hydrated
    // with enough tiles for the viewport
    tile = this._tilePool.pop();

    // if we couldn't find a tile from the pool, then explode.
    if (!tile) {
        throw new Error(
            '[phaser-tiled] Unable to find a tile in the pool, this shouldn\'t be possible! ' +
            'Please report this issue at (https://github.com/englercj/phaser-tiled/issues), ' +
            'and include a running example.'
        );
    }

    this._resetTile(
        tile,
        (toTileX * this.map.tileWidth) + tileset.tileoffset.x,
        (toTileY * this.map.tileHeight) + tileset.tileoffset.y,
        tileId,
        tileset
    );

    // sort order of tile, could/should be in _resetTile but it would need the map coordinates
    if (this.map.obeyRenderorder) {
        if (this.map.orientation === 'orthogonal') {
            if (this.map.renderorder === 'right-up') {
                tile.sortOrder = toTileX - this.map.size.x * toTileY;
            }
            else if (this.map.renderorder === 'right-down') {
                tile.sortOrder = toTileX + this.map.size.x * toTileY;
            }
            else if (this.map.renderorder === 'left-up') {
                tile.sortOrder = -toTileX - this.map.size.x * toTileY;
            }
            else if (this.map.renderorder === 'left-down') {
                tile.sortOrder = -toTileX + this.map.size.x * toTileY;
            }
        }
    }

    // update sprite reference in the map
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
    // larger than 1 scaled tile and may require multiple render pans
    // (this can happen if you can .pan(x, y) with large values)

    var sortRequired = false;

    // moved position right, so render left
    while (this._scrollDelta.x >= this.map.scaledTileWidth) {
        this._renderLeft();
        this._scrollDelta.x -= this.map.scaledTileWidth;
        sortRequired = true;
    }

    // moved position left, so render right
    while (this._scrollDelta.x <= -this.map.scaledTileWidth) {
        this._renderRight();
        this._scrollDelta.x += this.map.scaledTileWidth;
        sortRequired = true;
    }

    // moved position down, so render up
    while (this._scrollDelta.y >= this.map.scaledTileHeight) {
        this._renderUp();
        this._scrollDelta.y -= this.map.scaledTileHeight;
        sortRequired = true;
    }

    // moved position up, so render down
    while (this._scrollDelta.y <= -this.map.scaledTileHeight) {
        this._renderDown();
        this._scrollDelta.y += this.map.scaledTileHeight;
        sortRequired = true;
    }

    if (sortRequired) {
        this.sortTiles();
    }
};

/**
* Gets all tiles that intersect with the given line.
*
* @method Phaser.TilemapLayer#getRayCastTiles
* @memberof Phaser.TilemapLayer
* @param {Phaser.Line} line - The line used to determine which tiles to return.
* @param {number} [stepRate] - How many steps through the ray will we check? If undefined or
*       null it uses TilemapLayer.rayStepRate.
* @param {boolean} [collides=false] - If true only return tiles that collide on one or more faces.
* @param {boolean} [interestingFace=false] - If true only return tiles that have interesting faces.
* @return {array<Phaser.Tile>} An array of Phaser.Tiles.
*/
Tilelayer.prototype.getRayCastTiles = function (line, stepRate, collides, interestingFace) {

    if (typeof stepRate === 'undefined' || stepRate === null) { stepRate = this.rayStepRate; }
    if (typeof collides === 'undefined') { collides = false; }
    if (typeof interestingFace === 'undefined') { interestingFace = false; }

    //  First get all tiles that touch the bounds of the line
    var tiles = this.getTiles(line.x, line.y, line.width, line.height, collides, interestingFace);

    if (tiles.length === 0)
    {
        return tiles;
    }

    //  Now we only want the tiles that intersect with the points on this line
    var coords = line.coordinatesOnLine(stepRate);
    var total = coords.length;
    var results = [];

    for (var i = 0; i < tiles.length; i++)
    {
        for (var t = 0; t < total; t++)
        {
            if (tiles[i].containsPoint(coords[t][0], coords[t][1]))
            {
                results.push(tiles[i]);
                break;
            }
        }
    }

    return results;

};

/**
* Get all tiles that exist within the given area, defined by the top-left corner, width and height.
* Values given are in pixels, not tiles.
* @method Phaser.TilemapLayer#getTiles
* @memberof Phaser.TilemapLayer
* @param {number} x - X position of the top left corner.
* @param {number} y - Y position of the top left corner.
* @param {number} width - Width of the area to get.
* @param {number} height - Height of the area to get.
* @param {boolean} [collides=false] - If true only return tiles that collide on one or more faces.
* @param {boolean} [interestingFace=false] - If true only return tiles that have interesting faces.
* @return {array<Phaser.Tile>} An array of Phaser.Tiles.
*/
Tilelayer.prototype.getTiles = function (x, y, width, height, collides, interestingFace) {

    //  Should we only get tiles that have at least one of their collision flags set?
    // (true = yes, false = no just get them all)
    if (typeof collides === 'undefined') { collides = false; }
    if (typeof interestingFace === 'undefined') { interestingFace = false; }

    // adjust the x,y coordinates for scrollFactor
    // x = this._fixX(x);
    // y = this._fixY(y);

    if (width > this.widthInPixels)
    {
        width = this.widthInPixels;
    }

    if (height > this.heightInPixels)
    {
        height = this.heightInPixels;
    }

    //  Convert the pixel values into tile coordinates
    this._mc.tx = this.game.math.snapToFloor(x, this._mc.cw) / this._mc.cw;
    this._mc.ty = this.game.math.snapToFloor(y, this._mc.ch) / this._mc.ch;
    this._mc.tw = (this.game.math.snapToCeil(width, this._mc.cw) + this._mc.cw) / this._mc.cw;
    this._mc.th = (this.game.math.snapToCeil(height, this._mc.ch) + this._mc.ch) / this._mc.ch;

    //  This should apply the layer x/y here
    var results = [];
    var tile = null;

    for (var wy = this._mc.ty; wy < this._mc.ty + this._mc.th; wy++)
    {
        for (var wx = this._mc.tx; wx < this._mc.tx + this._mc.tw; wx++)
        {
            tile = this.getTile(wx, wy);
            if (tile)
            {
                if ((!collides && !interestingFace) || tile.isInteresting(collides, interestingFace))
                {
                    results.push(tile);
                }
            }
        }
    }

    return results;

};

Tilelayer.prototype.getTile = function (x, y) {
    return this.tiles[y] && this.tiles[y][x];
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

    // move all the far right tiles to the left side
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
    // move all the far left tiles to the right side
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

    // move all the far bottom tiles to the top side
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
    // move all the far top tiles to the bottom side
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
    this.clearTiles();

    // this will destroy the tile sprites that are children of this group
    Phaser.Group.prototype.destroy.apply(this, arguments);

    // destroy all the animation textures
    for (var i = 0; i < this._animTexturePool.length; ++i) {
        utils.destroyTexture(this._animTexturePool[i]);
    }

    this._tilePool = null;
    this._animTexturePool = null;

    this.bodies = null;
    this.tiles = null;

    this.map = null;
    this.cameraOffset = null;
    this.scrollFactor = null;

    this.size = null;
    this.tileIds = null;
    this.properties = null;

    this._buffered = null;
    this._scroll = null;
    this._scrollDelta = null;
    this._renderArea = null;
    this._mc = null;

    this.container = null;
};

Object.defineProperty(Tilelayer.prototype, 'scrollX', {
    get: function () {
        return this._scroll.x;
    },
    set: function (value) {
        if (value !== this._scroll.x) {
            this._scrollDelta.x -= value - this._scroll.x;
            this._scroll.x = value;
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
        }
    }
});

Object.defineProperty(Tilelayer.prototype, 'widthInPixels', {
    get: function () {
        return this.size.x * this.map.scaledTileWidth;
    }
});

Object.defineProperty(Tilelayer.prototype, 'heightInPixels', {
    get: function () {
        return this.size.y * this.map.scaledTileHeight;
    }
});

/**
* @name Phaser.TilemapLayer#collisionWidth
* @property {number} collisionWidth - The width of the collision tiles.
*/
Object.defineProperty(Tilelayer.prototype, 'collisionWidth', {

    get: function () {
        return this._mc.cw;
    },

    set: function (value) {

        this._mc.cw = value;

        // this.dirty = true;

    }

});

/**
* @name Phaser.TilemapLayer#collisionHeight
* @property {number} collisionHeight - The height of the collision tiles.
*/
Object.defineProperty(Tilelayer.prototype, 'collisionHeight', {

    get: function () {
        return this._mc.ch;
    },

    set: function (value) {

        this._mc.ch = value;

        // this.dirty = true;

    }

});
