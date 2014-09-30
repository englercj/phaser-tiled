/* jshint -W106 */
var utils = require('./utils'),
    physics = require('./physics');

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
        jsonLoadComplete: Phaser.Loader.prototype.jsonLoadComplete,
        xmlLoadComplete: Phaser.Loader.prototype.xmlLoadComplete,
        packLoadComplete: Phaser.Loader.prototype.packLoadComplete
    },
    physics: {
        p2: {
            convertTilemap: Phaser.Physics.P2.prototype.convertTiledmap
        }
    }
};

Tiled.prototype.init = function () {
    Phaser.GameObjectFactory.prototype.tiledmap = GameObjectFactory_tiledmap;
    Phaser.Loader.prototype.tiledmap = Loader_tiledmap;
    Phaser.Loader.prototype.loadFile = Loader_loadFile;
    Phaser.Loader.prototype.jsonLoadComplete = Loader_jsonLoadComplete;
    Phaser.Loader.prototype.xmlLoadComplete = Loader_xmlLoadComplete;
    Phaser.Loader.prototype.packLoadComplete = Loader_packLoadComplete;
    Phaser.Physics.P2.prototype.convertTiledmap = physics.convertTiledmapForP2;
};

Tiled.prototype.destroy = function () {
    Phaser.Plugin.prototype.destroy.apply(this, arguments);

    Phaser.GameObjectFactory.prototype.tiledmap = originals.gameObjectFactory.tiledmap;
    Phaser.Loader.prototype.tiledmap = originals.loader.tiledmap;
    Phaser.Loader.prototype.loadFile = originals.loader.loadFile;
    Phaser.Loader.prototype.jsonLoadComplete = originals.loader.jsonLoadComplete;
    Phaser.Loader.prototype.xmlLoadComplete = originals.loader.xmlLoadComplete;
    Phaser.Loader.prototype.packLoadComplete = originals.loader.packLoadComplete;
    Phaser.Physics.P2.prototype.convertTiledmap = originals.physics.p2.convertTiledmap;
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
 * @param {number} [format=Tiled.Tilemap.CSV] - The format of the map data. Either Tiled.Tilemap.CSV
 *      or Tiled.Tilemap.TILED_JSON.
 * @return {Phaser.Loader} This Loader instance.
 */
function Loader_tiledmap(key, url, data, format) {
    if (typeof format === 'undefined') { format = Tiled.Tilemap.CSV; }

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
            case Tiled.Tilemap.CSV:
                break;

            //  A json string or object has been given
            case Tiled.Tilemap.TILED_JSON:
                if (typeof data === 'string') {
                    data = JSON.parse(data);
                }
                break;

            //  An xml string or document has been given
            case Tiled.Tilemap.TILED_XML:
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
        if (file.format === Tiled.Tilemap.TILED_JSON) {
            this.xhrLoad(this._fileIndex, this.baseURL + file.url, 'text', 'jsonLoadComplete', 'dataLoadError');
        }
        else if (file.format === Tiled.Tilemap.CSV) {
            this.xhrLoad(this._fileIndex, this.baseURL + file.url, 'text', 'csvLoadComplete', 'dataLoadError');
        }
        else if (file.format === Tiled.Tilemap.TILED_XML) {
            this.xhrLoad(this._fileIndex, this.baseURL + file.url, 'text', 'xmlLoadComplete', 'dataLoadError');
        }
        else {
            throw new Error('Phaser.Loader. Invalid Tiledmap format: ' + file.format);
        }
    }
}

function Loader_jsonLoadComplete(index) {
    if (!this._fileList[index]) {
        console.warn('Phaser.Loader jsonLoadComplete invalid index ' + index);
        return;
    }

    var file = this._fileList[index],
        data;

    if (this._ajax && this._ajax.responseText)
    {
        data = JSON.parse(this._ajax.responseText);
    }
    else
    {
        data = JSON.parse(this._xhr.responseText);
    }

    file.loaded = true;

    if (file.type === 'tilemap' || file.type === 'tiledmap')
    {
        this.game.cache.addTilemap(file.key, file.url, data, file.format);
    }
    else if (file.type === 'json')
    {
        this.game.cache.addJSON(file.key, file.url, data);
    }
    else
    {
        this.game.cache.addTextureAtlas(file.key, file.url, file.data, data, file.format);
    }

    this.nextFile(index, true);
}

/**
 * Successfully loaded an XML file.
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

    if (file.type === 'tilemap' || file.type === 'tiledmap') {
        this.game.cache.addTilemap(file.key, file.url, data, file.format);
    }

    this.nextFile(index, true);

}

// the same as the core one, but we add 'tiledmap'
function Loader_packLoadComplete(index, parse) {

    if (typeof parse === 'undefined') { parse = true; }

    if (!this._packList[index])
    {
        console.warn('Phaser.Loader packLoadComplete invalid index ' + index);
        return;
    }

    var pack = this._packList[index],
        data;

    pack.loaded = true;

    if (parse)
    {
        data = JSON.parse(this._xhr.responseText);
    }
    else
    {
        data = this._packList[index].data;
    }

    if (data[pack.key])
    {
        var file;

        for (var i = 0; i < data[pack.key].length; i++)
        {
            file = data[pack.key][i];

            switch (file.type)
            {
                case 'image':
                    this.image(file.key, file.url, file.overwrite);
                    break;

                case 'text':
                    this.text(file.key, file.url, file.overwrite);
                    break;

                case 'json':
                    this.json(file.key, file.url, file.overwrite);
                    break;

                case 'script':
                    this.script(file.key, file.url, file.callback, pack.callbackContext);
                    break;

                case 'binary':
                    this.binary(file.key, file.url, file.callback, pack.callbackContext);
                    break;

                case 'spritesheet':
                    this.spritesheet(file.key, file.url, file.frameWidth, file.frameHeight,
                            file.frameMax, file.margin, file.spacing);
                    break;

                case 'audio':
                    this.audio(file.key, file.urls, file.autoDecode);
                    break;

                case 'tilemap':
                    this.tilemap(file.key, file.url, file.data, Phaser.Tilemap[file.format]);
                    break;

                case 'tiledmap':
                    this.tiledmap(file.key, file.url, file.data, Tiled.Tilemap[file.format]);
                    break;

                case 'physics':
                    this.physics(file.key, file.url, file.data, Phaser.Loader[file.format]);
                    break;

                case 'bitmapFont':
                    this.bitmapFont(file.key, file.textureURL, file.xmlURL, file.xmlData, file.xSpacing, file.ySpacing);
                    break;

                case 'atlasJSONArray':
                    this.atlasJSONArray(file.key, file.textureURL, file.atlasURL, file.atlasData);
                    break;

                case 'atlasJSONHash':
                    this.atlasJSONHash(file.key, file.textureURL, file.atlasURL, file.atlasData);
                    break;

                case 'atlasXML':
                    this.atlasXML(file.key, file.textureURL, file.atlasURL, file.atlasData);
                    break;

                case 'atlas':
                    this.atlas(file.key, file.textureURL, file.atlasURL, file.atlasData, Phaser.Loader[file.format]);
                    break;
            }
        }
    }

    this.nextPack(index, true);
}

/* jshint +W106 */
