var utils = require('../utils');

/**
 * This object represents a tileset used by a Tilemap.
 * There can be multiple Tilesets in a map
 *
 * @class Tileset
 * @extends Texture
 * @constructor
 * @param game {Phaser.Game} Phaser game this belongs to.
 * @param key {string} The name of the tiledmap, this is usually the filename without the extension.
 * @param settings {Object} All the settings for the tileset
 * @param settings.tilewidth {Number} The width of a single tile in the set
 * @param settings.tileheight {Number} The height of a single tile in the set
 * @param [settings.firstgid=1] {Number} The id of the first tile in the set, defaults to 1
 * @param [settings.spacing=0] {Number} The spacing around tiles in the tileset (in pixels)
 * @param [settings.margin=0] {Number} The margin around a tile in the tileset (in pixels)
 * @param [settings.tileoffset] {Object} The offset to apply to a tile rendered from this tileset
 * @param [settings.tileoffset.x=0] {Number} The X offset to apply to the tile
 * @param [settings.tileoffset.y=0] {Number} The Y offset to apply to the tile
 * @param [settings.properties] {Object} User-defined, custom properties that apply to the tileset
 * @param [settings.tileproperties] {Object} User-defined, custom properties that apply to tiles in the tileset.
 *          The keys of this object should the tile id of the properties
 * @param [settings.tiles] {Object} Extra metadata about specific tiles
 * @param [settings.imagewidth] {Number} An override for the image width
 * @param [settings.imageheight] {Number} An override for the image height
 */
//TODO: Implement multi-image tileset support
//TODO: Support external tilesets (TSX files) via the "source" attribute
//see: https://github.com/bjorn/tiled/wiki/TMX-Map-Format#tileset
function Tileset(game, key, settings) {
    var txkey = utils.cacheKey(key, 'tileset', settings.name),
        tx = PIXI.BaseTextureCache[txkey],
        ids,
        ttxkey,
        ttx,
        tileTextures;

    // if no main texture, check if multi-image tileset
    if (!tx && settings.tiles) {
        // need to sort because order matters here, and can't guarantee that the object's keys will be ordered.
        // We need a custom comparator because .sort() is lexagraphic, not numeric.
        ids = Object.keys(settings.tiles).sort(function (a, b) { return parseInt(a, 10) - parseInt(b, 10); });

        for (var i = 0; i < ids.length; ++i) {
            if (settings.tiles[ids[i]].image) {
                // this is a multi-image tileset
                tileTextures = tileTextures || [];

                ttxkey = utils.cacheKey(key, 'tileset_image_' + ids[i], settings.name);
                ttx = PIXI.TextureCache[ttxkey];

                if (!ttx) {
                    console.warn(
                        'Tileset "' + settings.name + '" unable to find texture cached by key "' +
                        ttxkey + '", using blank texture.'
                    );
                    ttx = new PIXI.Texture(new PIXI.BaseTexture());
                }

                tileTextures.push(ttx);
            }
        }
    }

    // if no main texture, and we didn't find any image tiles then warn about blank tileset
    if (!tx && !tileTextures) {
        console.warn(
            'Tileset "' + settings.name + '" unable to find texture cached by key "' +
            txkey +  '", using blank texture.'
        );
    }

    PIXI.Texture.call(this, tx || new PIXI.BaseTexture());

    this.game = game;

    this.multiImage = !!tileTextures;

    //Tiled Editor properties

    /**
     * The first tileId in the tileset
     *
     * @property firstgid
     * @type Number
     */
    this.firstgid = settings.firstgid || 1;

    /**
     * The name of the tileset
     *
     * @property name
     * @type String
     */
    this.name = settings.name;

    /**
     * The width of a tile in the tileset
     *
     * @property tileWidth
     * @type Number
     */
    this.tileWidth = settings.tilewidth;

    /**
     * The height of a tile in the tileset
     *
     * @property tileHeight
     * @type Number
     */
    this.tileHeight = settings.tileheight;

    /**
     * The spacing around a tile in the tileset
     *
     * @property spacing
     * @type Number
     */
    this.spacing = settings.spacing || 0;

    /**
     * The margin around a tile in the tileset
     *
     * @property margin
     * @type Number
     */
    this.margin = settings.margin || 0;

    /**
     * The offset of tile positions when rendered
     *
     * @property tileoffset
     * @type Phaser.Point
     */
    this.tileoffset = new Phaser.Point(
        settings.tileoffset ? settings.tileoffset.x : 0,
        settings.tileoffset ? settings.tileoffset.y : 0
    );

    //TODO: Support for "terraintypes," "image"
    //see: https://github.com/bjorn/tiled/wiki/TMX-Map-Format#tileset

    //Custom/Optional properties

    /**
     * The number of tiles calculated based on size, margin, and spacing
     *
     * @property numTiles
     * @type Vector
     */
    this.numTiles = this.multiImage ? tileTextures.length : new Phaser.Point(
        Phaser.Math.floor((this.baseTexture.width - this.margin) / (this.tileWidth - this.spacing)),
        Phaser.Math.floor((this.baseTexture.height - this.margin) / (this.tileHeight - this.spacing))
    );

    /**
     * The last tileId in the tileset
     *
     * @property lastgid
     * @type Number
     */
    this.lastgid = this.firstgid + (this.multiImage ? tileTextures.length : ((this.numTiles.x * this.numTiles.y) || 1)) - 1;

    /**
     * The properties of the tileset
     *
     * @property properties
     * @type Object
     */
    this.properties = utils.parseTiledProperties(settings.properties);

    /**
     * The properties of the tiles in the tileset
     *
     * @property tileproperties
     * @type Object
     */
    this.tileproperties = {};

    // massage tile tileproperties
    for (var k in settings.tileproperties) {
        this.tileproperties[k] = utils.parseTiledProperties(settings.tileproperties[k]);
    }

    /**
     * The size of the tileset
     *
     * @property size
     * @type Vector
     */
    this.size = this.multiImage ? new Phaser.Point(0, 0) : new Phaser.Point(
        settings.imagewidth || this.baseTexture.width,
        settings.imageheight || this.baseTexture.height
    );

    /**
     * The texture instances for each tile in the set
     *
     * @property textures
     * @type Array
     */
    this.textures = this.multiImage ? tileTextures : [];

    // generate tile textures for single image tileset
    if (!this.multiImage) {
        for(var t = 0, tl = this.lastgid - this.firstgid + 1; t < tl; ++t) {
            // convert the tileId to x,y coords of the tile in the Texture
            var y = Phaser.Math.floor(t / this.numTiles.x),
                x = (t - (y * this.numTiles.x));

            // get location in pixels
            x = (x * this.tileWidth) + (x * this.spacing) + this.margin;
            y = (y * this.tileHeight) + (y * this.spacing) + this.margin;

            this.textures.push(
                new PIXI.Texture(
                    this.baseTexture,
                    new Phaser.Rectangle(x, y, this.tileWidth, this.tileHeight)
                )
            );
        }
    }

    /**
     * The animation data for tile animations in the set
     *
     * @property tileanimations
     * @type Object
     */
    this.tileanimations = {};

    // parse extra information about the tiles
    for (var p in settings.tiles) {
        if (settings.tiles[p].animation) {
            this.tileanimations[p] = {
                rate: 1000 / settings.tiles[p].animation[0].duration,
                data: new Phaser.FrameData()
            };

            for (var a = 0; a < settings.tiles[p].animation.length; ++a) {
                var frame = this.textures[settings.tiles[p].animation[a].tileid].frame;

                this.tileanimations[p].data.addFrame(
                    new Phaser.Frame(a, frame.x, frame.y, frame.width, frame.height)
                );
            }
        }

        // image - url
        // objectgroup - collision data
    }
}

Tileset.prototype = Object.create(PIXI.Texture.prototype);
Tileset.prototype.constructor = Tileset;

module.exports = Tileset;

/**
 * Gets the tile properties for a tile based on it's ID
 *
 * @method getTileProperties
 * @param tileId {Number} The id of the tile to get the properties for
 * @return {Object} The properties of the tile
 */
Tileset.prototype.getTileProperties = function (tileId) {
    if (!tileId) {
        return null;
    }

    var flags = Tileset.FLAGS,
        flippedX = tileId & flags.FLIPPED_HORZ,
        flippedY = tileId & flags.FLIPPED_VERT,
        flippedAD = tileId & flags.FLIPPED_ANTI_DIAG;

    tileId = (tileId & ~Tileset.FLAGS.ALL) - this.firstgid;

    // if less than 0, then this id isn't in this tileset
    if (tileId < 0) {
        return null;
    }

    var props = this.tileproperties[tileId] ?
        //get this value
        this.tileproperties[tileId] :
        //set this id to default values and cache
        this.tileproperties[tileId] = {
            collides: false
        };

    props.flippedX = flippedX;
    props.flippedY = flippedY;
    props.flippedAD = flippedAD;

    return props;
};

/**
 * Gets the tile animations for a tile based on it's ID
 *
 * @method getTileProperties
 * @param tileId {Number} The id of the tile to get the animation frames for
 * @return {Phaser.FrameData} The frame data of the tile
 */
Tileset.prototype.getTileAnimations = function (tileId) {
    if (!tileId) {
        return null;
    }

    tileId = (tileId & ~Tileset.FLAGS.ALL) - this.firstgid;

    // if less than 0, then this id isn't in this tileset
    if (tileId < 0) {
        return null;
    }

    return this.tileanimations[tileId];
};

/**
 * Gets the tile texture for a tile based on it's ID
 *
 * @method getTileTexture
 * @param tileId {Number} The id of the tile to get the texture for
 * @return {Texture} The texture for the tile
 */
Tileset.prototype.getTileTexture = function (tileId) {
    if (!tileId) {
        return null;
    }

    // get the internal ID of the tile in this set (0 indexed)
    tileId = (tileId & ~Tileset.FLAGS.ALL) - this.firstgid;

    // if less than 0, then this id isn't in this tileset
    if (tileId < 0) {
        return null;
    }

    return this.textures[tileId];
};

/**
 * Returns whether or not this tileset contains the given tile guid
 *
 * @method contains
 * @param tileId {Number} The ID of the tile to check
 * @return {Boolean}
 */
Tileset.prototype.contains = function (tileId) {
    if (!tileId) {
        return false;
    }

    tileId &= ~Tileset.FLAGS.ALL;

    return (tileId >= this.firstgid && tileId <= this.lastgid);
};

/**
 * Tileset GID flags, these flags are set on a tile's ID to give it a special property
 *
 * @property FLAGS
 * @static
 */
Tileset.FLAGS = {
    FLIPPED_HORZ: 0x80000000,
    FLIPPED_VERT: 0x40000000,
    FLIPPED_ANTI_DIAG: 0x20000000
};

var mask = 0;
for(var f in Tileset.FLAGS) {
    mask |= Tileset.FLAGS[f];
}

Tileset.FLAGS.ALL = mask;
