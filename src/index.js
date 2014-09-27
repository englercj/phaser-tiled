/* jshint -W106 */
var utils = require('./utils');

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
Tiled.Objectlayer  = require('./tiled/Objectlayer');

var originals = {
    gameObjectFactory: {
        tiledmap: Phaser.GameObjectFactory.prototype.tiledmap
    },
    loader: {
        tiledmap: Phaser.Loader.prototype.tiledmap,
        loadFile: Phaser.Loader.prototype.loadFile,
        xmlLoadComplete: Phaser.Loader.prototype.xmlLoadComplete
    }
};

Tiled.prototype.init = function () {
    Phaser.GameObjectFactory.prototype.tiledmap = GameObjectFactory_tiledmap;
    Phaser.Loader.prototype.tiledmap = Loader_tiledmap;
    Phaser.Loader.prototype.loadFile = Loader_loadFile;
    Phaser.Loader.prototype.xmlLoadComplete = Loader_xmlLoadComplete;
};

Tiled.prototype.destroy = function () {
    Phaser.Plugin.prototype.destroy.apply(this, arguments);

    Phaser.GameObjectFactory.prototype.tiledmap = originals.gameObjectFactory.tiledmap;
    Phaser.Loader.prototype.tiledmap = originals.loader.tiledmap;
    Phaser.Loader.prototype.loadFile = originals.loader.loadFile;
    Phaser.Loader.prototype.xmlLoadComplete = originals.loader.xmlLoadComplete;
};

function GameObjectFactory_tiledmap(key, tilesetKeyMap, group) {
    return new Tiled.Tilemap(this.game, key, tilesetKeyMap, group);
}

/**
 * Add a new tilemap loading request.
 *
 * @method Phaser.Loader#tilemap
 * @param {string} key - Unique asset key of the tilemap data.
 * @param {string} [url] - The url of the map data file (csv/json)
 * @param {object} [data] - An optional JSON data object. If given then the url is ignored and this JSON
 *      object is used for map data instead.
 * @param {number} [format=Phaser.Tilemap.CSV] - The format of the map data. Either Phaser.Tilemap.CSV
 *      or Phaser.Tilemap.TILED_JSON.
 * @return {Phaser.Loader} This Loader instance.
 */
function Loader_tiledmap(key, url, data, format) {
    if (typeof format === 'undefined') { format = Phaser.Tilemap.CSV; }

    /* jshint -W116 */
    if (url == null && data == null) {
        console.warn('Phaser.Loader.tiledmap - Both url and data are null. One must be set.');

        return this;
    }
    /* jshint +W116 */

    //  A map data object has been given
    if (data) {
        switch (format) {
            //  A csv string or object has been given
            case Phaser.Tilemap.CSV:
                break;

            //  A json string or object has been given
            case Phaser.Tilemap.TILED_JSON:
                if (typeof data === 'string') {
                    data = JSON.parse(data);
                }
                break;

            //  An xml string or document has been given
            case Phaser.Tilemap.TILED_XML:
                if (typeof data === 'string') {
                    data = utils.parseXML(data);
                }
                break;
        }

        this.game.cache.addTilemap(key, null, data, format);
    }
    else {
        this.addToFileList('tiledmap', key, url, { format: format });
    }

    return this;
}

function Loader_loadFile() {
    originals.loader.loadFile.apply(this, arguments);

    var file = this._fileList[this._fileIndex];

    if (file.type === 'tiledmap') {
        if (file.format === Phaser.Tilemap.TILED_JSON) {
            this.xhrLoad(this._fileIndex, this.baseURL + file.url, 'text', 'jsonLoadComplete', 'dataLoadError');
        }
        else if (file.format === Phaser.Tilemap.CSV) {
            this.xhrLoad(this._fileIndex, this.baseURL + file.url, 'text', 'csvLoadComplete', 'dataLoadError');
        }
        else if (file.format === Phaser.Tilemap.TILED_XML) {
            this.xhrLoad(this._fileIndex, this.baseURL + file.url, 'text', 'xmlLoadComplete', 'dataLoadError');
        }
        else {
            throw new Error('Phaser.Loader. Invalid Tiledmap format: ' + file.format);
        }
    }
}

/**
 * Successfully loaded a JSON file.
 *
 * @method Phaser.Loader#jsonLoadComplete
 * @param {number} index - The index of the file in the file queue that loaded.
 */
function Loader_xmlLoadComplete(index) {
    if (!this._fileList[index]) {
        console.warn('Phaser.Loader xmlLoadComplete invalid index ' + index);
        return;
    }

    var file = this._fileList[index],
        data;

    if (this._ajax && this._ajax.responseText) {
        data = utils.parseXML(this._ajax.responseText);
    }
    else {
        data = utils.parseXML(this._xhr.responseText);
    }

    file.loaded = true;

    if (file.type === 'tilemap') {
        this.game.cache.addTilemap(file.key, file.url, data, file.format);
    }

    this.nextFile(index, true);

}

/* jshint +W106 */
