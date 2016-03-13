/**
 * Base Tile implementation, a tile is a single tile in a tilemap layer
 *
 * @class Tile
 * @extends Phaser.Sprite
 * @constructor
 */
function Tile(game, x, y, tileId, tileset, layer) {
    Phaser.Sprite.call(this,
        game,
        (x * tileset.tileWidth) + tileset.tileoffset.x,
        (y * tileset.tileHeight) + tileset.tileoffset.y,
        tileset.getTileTexture(tileId)
    );

    this.type = Phaser.TILESPRITE;

    /**
    * @property {object} layer - The layer in the Tilemap data that this tile belongs to.
    */
    this.layer = layer;

    /**
    * @property {object} tileset - The tileset that this tile's texture is from.
    */
    this.tileset = tileset;

    /**
    * @property {Phaser.Point} tilePosition - The position of the tile in 'tile coords'
    */
    this.tilePosition = new Phaser.Point(x, y);

    /**
    * @property {number} centerX - The center of the tile.
    */
    this.centerX = Math.abs(tileset.tileWidth / 2);

    /**
    * @property {number} centerY - The height of the tile in pixels.
    */
    this.centerY = Math.abs(tileset.tileHeight / 2);

    /**
    * @property {object} properties - Tile specific properties.
    */
    this.properties = tileset.getTileProperties(tileId);

    /**
    * @property {boolean} scanned - Has this tile been walked / turned into a poly?
    */
    this.scanned = false;

    /**
    * @property {boolean} faceTop - Is the top of this tile an interesting edge?
    */
    this.faceTop = false;

    /**
    * @property {boolean} faceBottom - Is the bottom of this tile an interesting edge?
    */
    this.faceBottom = false;

    /**
    * @property {boolean} faceLeft - Is the left of this tile an interesting edge?
    */
    this.faceLeft = false;

    /**
    * @property {boolean} faceRight - Is the right of this tile an interesting edge?
    */
    this.faceRight = false;

    /**
    * @property {boolean} collideLeft - Indicating collide with any object on the left.
    * @default
    */
    this.collideLeft = this.properties.collideLeft !== undefined ?
        this.properties.collideLeft : (this.properties.collides || false);

    /**
    * @property {boolean} collideRight - Indicating collide with any object on the right.
    * @default
    */
    this.collideRight = this.properties.collideRight !== undefined ?
        this.properties.collideRight : (this.properties.collides || false);

    /**
    * @property {boolean} collideUp - Indicating collide with any object on the top.
    * @default
    */
    this.collideUp = this.properties.collideUp !== undefined ?
        this.properties.collideUp : (this.properties.collides || false);

    /**
    * @property {boolean} collideDown - Indicating collide with any object on the bottom.
    * @default
    */
    this.collideDown = this.properties.collideDown !== undefined ?
        this.properties.collideDown : (this.properties.collides || false);

    /**
    * @property {function} collisionCallback - Tile collision callback.
    * @default
    */
    this.collisionCallback = null;

    /**
    * @property {object} collisionCallbackContext - The context in which the collision callback will be called.
    * @default
    */
    this.collisionCallbackContext = this;

    // load animation data
    var animData = tileset.getTileAnimations(tileId);
    if (animData) {
        this.animations.copyFrameData(animData.data, 0);
        this.animations.add('tile', null, animData.rate, true).play();
    }

    // set the blend mode
    var blendMode = this.properties.blendMode || layer.properties.blendMode;
    this.blendMode = blendMode ? Phaser.blendModes[blendMode] : Phaser.blendModes.NORMAL;

    // setup the flipped states
    if (this.properties.flippedX) {
        this.scale.x = -1;
        this.position.x += tileset.tileWidth;
    }

    if (this.properties.flippedY) {
        this.scale.y = -1;
        this.position.y += tileset.tileHeight;
    }

    // from Tiled Editor:
    // https://github.com/bjorn/tiled/blob/b059a13b2864ea029fb741a90780d31cf5b67043/src/libtiled/maprenderer.cpp#L135-L145
    if (this.properties.flippedAD) {
        this.rotation = this.game.math.degToRad(90);
        this.scale.x *= -1;

        var sx = this.scale.x;
        this.scale.x = this.scale.y;
        this.scale.y = sx;

        var halfDiff = Math.abs(this.height / 2) - Math.abs(this.width / 2);
        this.position.y += halfDiff;
        this.position.x += halfDiff;
    }
}

Tile.prototype = Object.create(Phaser.Sprite.prototype);
Tile.prototype.constructor = Tile;

module.exports = Tile;

/**
* Check if the given x and y world coordinates are within this Tile.
*
* @method Phaser.Tile#containsPoint
* @param {number} x - The x coordinate to test.
* @param {number} y - The y coordinate to test.
* @return {boolean} True if the coordinates are within this Tile, otherwise false.
*/
Tile.prototype.containsPoint = function (x, y) {

    return !(x < this.worldX || y < this.worldY || x > this.right || y > this.bottom);

};

/**
* Check for intersection with this tile.
*
* @method Phaser.Tile#intersects
* @param {number} x - The x axis in pixels.
* @param {number} y - The y axis in pixels.
* @param {number} right - The right point.
* @param {number} bottom - The bottom point.
* @return {boolean} True if the coordinates are within this Tile, otherwise false.
*/
Tile.prototype.intersects = function (x, y, right, bottom) {

    if (right <= this.worldX)
    {
        return false;
    }

    if (bottom <= this.worldY)
    {
        return false;
    }

    if (x >= this.worldX + this.width)
    {
        return false;
    }

    if (y >= this.worldY + this.height)
    {
        return false;
    }

    return true;

};

/**
* Set a callback to be called when this tile is hit by an object.
* The callback must true true for collision processing to take place.
*
* @method Phaser.Tile#setCollisionCallback
* @param {function} callback - Callback function.
* @param {object} context - Callback will be called within this context.
*/
Tile.prototype.setCollisionCallback = function (callback, context) {

    this.collisionCallback = callback;
    this.collisionCallbackContext = context;

};

/**
* Clean up memory.
*
* @method Phaser.Tile#destroy
*/
Tile.prototype.destroy = function () {
    Phaser.Sprite.prototype.destroy.apply(this, arguments);

    this.layer = null;
    this.tileset = null;
    this.tilePosition = null;

    this.properties = null;

    this.collisionCallback = null;

    this.collisionCallbackContext = null;
};

/**
* Sets the collision flags for each side of this tile and updates the interesting faces list.
*
* @method Phaser.Tile#setCollision
* @param {boolean} left - Indicating collide with any object on the left.
* @param {boolean} right - Indicating collide with any object on the right.
* @param {boolean} up - Indicating collide with any object on the top.
* @param {boolean} down - Indicating collide with any object on the bottom.
*/
Tile.prototype.setCollision = function (left, right, up, down) {

    this.collideLeft = left;
    this.collideRight = right;
    this.collideUp = up;
    this.collideDown = down;

    this.faceLeft = left;
    this.faceRight = right;
    this.faceTop = up;
    this.faceBottom = down;

};

/**
* Reset collision status flags.
*
* @method Phaser.Tile#resetCollision
*/
Tile.prototype.resetCollision = function () {

    this.collideLeft = false;
    this.collideRight = false;
    this.collideUp = false;
    this.collideDown = false;

    this.faceLeft = false;
    this.faceRight = false;
    this.faceTop = false;
    this.faceBottom = false;

};

/**
* Is this tile interesting?
*
* @method Phaser.Tile#isInteresting
* @param {boolean} collides - If true will check any collides value.
* @param {boolean} faces - If true will check any face value.
* @return {boolean} True if the Tile is interesting, otherwise false.
*/
Tile.prototype.isInteresting = function (collides, faces) {

    if (collides && faces)
    {
        //  Does this tile have any collide flags OR interesting face?
        return (this.collideLeft || this.collideRight || this.collideUp || this.collideDown ||
            this.faceTop || this.faceBottom || this.faceLeft || this.faceRight || this.collisionCallback);
    }
    else if (collides)
    {
        //  Does this tile collide?
        return (this.collideLeft || this.collideRight || this.collideUp || this.collideDown);
    }
    else if (faces)
    {
        //  Does this tile have an interesting face?
        return (this.faceTop || this.faceBottom || this.faceLeft || this.faceRight);
    }

    return false;

};

/**
* Copies the tile data and properties from the given tile to this tile.
*
* @method Phaser.Tile#copy
* @param {Phaser.Tile} tile - The tile to copy from.
*/
Tile.prototype.copy = function (tile) {

    this.index = tile.index;
    this.alpha = tile.alpha;
    this.properties = tile.properties;

    this.collideUp = tile.collideUp;
    this.collideDown = tile.collideDown;
    this.collideLeft = tile.collideLeft;
    this.collideRight = tile.collideRight;

    this.collisionCallback = tile.collisionCallback;
    this.collisionCallbackContext = tile.collisionCallbackContext;

};

Object.defineProperty(Tile.prototype, 'worldX', {
    get: function () {
        return this.position.x;
    },
    set: function (val) {
        this.position.x = val;
    }
});

Object.defineProperty(Tile.prototype, 'worldY', {
    get: function () {
        return this.position.y;
    },
    set: function (val) {
        this.position.y = val;
    }
});

/**
* @name Phaser.Tile#collides
* @property {boolean} collides - True if this tile can collide on any of its faces.
* @readonly
*/
Object.defineProperty(Tile.prototype, 'collides', {

    get: function () {
        return (this.collideLeft || this.collideRight || this.collideUp || this.collideDown);
    }

});

/**
* @name Phaser.Tile#canCollide
* @property {boolean} canCollide - True if this tile can collide on any of its faces or has a collision callback set.
* @readonly
*/
Object.defineProperty(Tile.prototype, 'canCollide', {

    get: function () {
        return (this.collideLeft || this.collideRight || this.collideUp || this.collideDown || this.collisionCallback);
    }

});

/**
* @name Phaser.Tile#left
* @property {number} left - The x value in pixels.
* @readonly
*/
Object.defineProperty(Tile.prototype, 'left', {

    get: function () {
        return this.worldX;
    }

});

/**
* @name Phaser.Tile#right
* @property {number} right - The sum of the x and width properties.
* @readonly
*/
Object.defineProperty(Tile.prototype, 'right', {

    get: function () {
        return this.worldX + this.width;
    }

});

/**
* @name Phaser.Tile#top
* @property {number} top - The y value.
* @readonly
*/
Object.defineProperty(Tile.prototype, 'top', {

    get: function () {
        return this.worldY;
    }

});

/**
* @name Phaser.Tile#bottom
* @property {number} bottom - The sum of the y and height properties.
* @readonly
*/
Object.defineProperty(Tile.prototype, 'bottom', {

    get: function () {
        return this.worldY + this.height;
    }

});
