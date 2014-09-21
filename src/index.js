/**
 * @class Phaser.Plugin.Tiled
 * @classdesc Phaser - Tiled Plugin
 *
 * @constructor
 * @extends Phaser.Plugin
 *
 * @param {Phaser.Game} game - A reference to the currently running game.
 * @param {Any} parent - The object that owns this plugin, usually Phaser.PluginManager.
 */
function Tiled(game, parent) {
    Phaser.Plugin.call(this, game, parent);
}

//  Extends the Phaser.Plugin template, setting up values we need
Tiled.prototype = Object.create(Phaser.Plugin.prototype);
Tiled.prototype.constructor = Tiled;

module.exports = Tiled;

Tiled.Tile         = require('./tiled/Tile');
Tiled.Tileset      = require('./tiled/Tileset');
Tiled.Tilemap      = require('./tiled/Tilemap');
Tiled.Tilelayer    = require('./tiled/Tilelayer');
Tiled.ObjectGroup  = require('./tiled/ObjectGroup');

Tiled.prototype.init = function () {
    Phaser.GameObjectFactory.prototype.tiledmap = addTiledMap;
};

function addTiledMap(key, tileWidth, tileHeight, width, height) {
    return new Tiled.Tilemap(this.game, key, tileWidth, tileHeight, width, height);
}
