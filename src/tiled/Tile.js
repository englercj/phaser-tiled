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
        (x * layer.map.tileWidth) + tileset.tileoffset.x,
        (y * layer.map.tileHeight) + tileset.tileoffset.y,
        tileset.getTileTexture(tileId)
    );

    this.type = Phaser.TILESPRITE;

    this.layer = layer;

    this.tileset = tileset;

    this.tilePosition = new Phaser.Point(x, y);

    this.properties = tileset.getTileProperties(tileId);

    this.blendMode = (this.properties.blendMode || layer.properties.blendMode) ?
        Phaser.blendModes[(this.properties.blendMode || layer.properties.blendMode)] : Phaser.blendModes.NORMAL;
}

Tile.prototype = Object.create(Phaser.Sprite.prototype);
Tile.prototype.constructor = Tile;

module.exports = Tile;
