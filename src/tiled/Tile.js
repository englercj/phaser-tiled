/**
 * Base Tile implementation, a tile is a single tile in a tilemap layer
 *
 * @class Tile
 * @extends Phaser.Sprite
 * @constructor
 */
function Tile(game, x, y, key, frame) {
    Phaser.Sprite.call(this, game, x, y, key, frame);

    this.type = Phaser.TILESPRITE;

    this.tilePosition = new Phaser.Point();
}

Tile.prototype = Object.create(Phaser.Sprite.prototype);
Tile.prototype.constructor = Tile;

module.exports = Tile;
