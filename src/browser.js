var utils = require('./utils');
var physics = require('./physics');

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

// Tiled.Tile          = require('./tiled/Tile');
Tiled.Tileset       = require('./tiled/Tileset');
Tiled.Tilemap       = require('./tiled/Tilemap');
Tiled.Tilelayer     = require('./tiled/Tilelayer');
Tiled.Objectlayer   = require('./tiled/Objectlayer');
Tiled.utils         = utils;

var originals = {
    gameObjectFactory: {
        tiledmap: Phaser.GameObjectFactory.prototype.tiledmap
    },
    loader: {
        tiledmap: Phaser.Loader.prototype.tiledmap,
        loadFile: Phaser.Loader.prototype.loadFile,
        jsonLoadComplete: Phaser.Loader.prototype.jsonLoadComplete,
        xmlLoadComplete: Phaser.Loader.prototype.xmlLoadComplete,
        processPack: Phaser.Loader.prototype.processPack
    },
    physics: {
        p2: {
            convertTiledmap: Phaser.Physics.P2 ? Phaser.Physics.P2.prototype.convertTiledmap : null,
            convertTiledCollisionObjects: Phaser.Physics.P2 ? Phaser.Physics.P2.prototype.convertTiledCollisionObjects : null
        },
        ninja: {
            convertTiledmap: Phaser.Physics.Ninja ? Phaser.Physics.Ninja.prototype.convertTiledmap : null
        }
    }
};

Tiled.prototype.init = function () {
    Phaser.GameObjectFactory.prototype.tiledmap = GameObjectFactory_tiledmap;
    Phaser.Loader.prototype.tiledmap = Loader_tiledmap;
    Phaser.Loader.prototype.loadFile = Loader_loadFile;
    Phaser.Loader.prototype.jsonLoadComplete = Loader_jsonLoadComplete;
    Phaser.Loader.prototype.xmlLoadComplete = Loader_xmlLoadComplete;
    Phaser.Loader.prototype.processPack = Loader_processPack;

    if (Phaser.Physics.P2) {
        Phaser.Physics.P2.prototype.convertTiledmap = physics.p2.convertTiledmap;
        Phaser.Physics.P2.prototype.convertTiledCollisionObjects = physics.p2.convertTiledCollisionObjects;
    }

    if (Phaser.Physics.Ninja) {
        Phaser.Physics.Ninja.prototype.convertTiledmap = physics.ninja.convertTiledmap;
    }
};

Tiled.prototype.destroy = function () {
    Phaser.Plugin.prototype.destroy.apply(this, arguments);

    Phaser.GameObjectFactory.prototype.tiledmap = originals.gameObjectFactory.tiledmap;
    Phaser.Loader.prototype.tiledmap = originals.loader.tiledmap;
    Phaser.Loader.prototype.loadFile = originals.loader.loadFile;
    Phaser.Loader.prototype.jsonLoadComplete = originals.loader.jsonLoadComplete;
    Phaser.Loader.prototype.xmlLoadComplete = originals.loader.xmlLoadComplete;
    Phaser.Loader.prototype.processPack = originals.loader.processPack;

    if (originals.physics.p2.convertTiledmap) {
        Phaser.Physics.P2.prototype.convertTiledmap = originals.physics.p2.convertTiledmap;
        Phaser.Physics.P2.prototype.convertTiledCollisionObjects = originals.physics.p2.convertTiledCollisionObjects;
    }

    if (originals.physics.ninja.convertTiledmap) {
        Phaser.Physics.Ninja.prototype.convertTiledmap = originals.physics.ninja.convertTiledmap;
    }
};

function GameObjectFactory_tiledmap(key, group) {
    return new Tiled.Tilemap(this.game, key, group);
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

    /*eslint-disable no-eq-null, eqeqeq */
    if (url == null && data == null) {
        console.warn('Phaser.Loader.tiledmap - Both url and data are null. One must be set.');

        return this;
    }
    /*eslint-enable no-eq-null, eqeqeq */

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

function Loader_loadFile(file) {
    originals.loader.loadFile.apply(this, arguments);

    if (file.type === 'tiledmap') {
        if (file.format === Tiled.Tilemap.TILED_JSON) {
            this.xhrLoad(file, this.transformUrl(file.url, file), 'text', this.jsonLoadComplete);
        }
        else if (file.format === Tiled.Tilemap.CSV) {
            this.xhrLoad(file, this.transformUrl(file.url, file), 'text', this.csvLoadComplete);
        }
        else if (file.format === Tiled.Tilemap.TILED_XML) {
            this.xhrLoad(file, this.transformUrl(file.url, file), 'text', this.xmlLoadComplete);
        }
        else {
            this.asyncComplete(file, 'invalid Tilemap format: ' + file.format);
        }
    }
}

/**
 * Successfully loaded a JSON file.
 *
 * @method Phaser.Loader#jsonLoadComplete
 * @param {object} file - File associated with this request
 * @param {XMLHttpRequest} xhr
 */
function Loader_jsonLoadComplete(file, xhr) {
    var data = JSON.parse(xhr.responseText);

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

    this.asyncComplete(file);
}

/**
 * Successfully loaded an XML file.
 *
 * @method Phaser.Loader#xmlLoadComplete
 * @param {object} file - File associated with this request
 * @param {XMLHttpRequest} xhr
 */
function Loader_xmlLoadComplete(file, xhr) {
    // Always try parsing the content as XML, regardless of actually response type
    var data = xhr.responseText;
    var xml = this.parseXml(data);

    if (!xml)
    {
        var responseType = xhr.responseType || xhr.contentType; // contentType for MS-XDomainRequest
        console.warn('Phaser.Loader - ' + file.key + ': invalid XML (' + responseType + ')');
        this.asyncComplete(file, 'invalid XML');
        return;
    }

    if (file.type === 'tilemap' || file.type === 'tiledmap') {
        this.game.cache.addTilemap(file.key, file.url, xml, file.format);
    }
    else if (file.type === 'bitmapfont')
    {
        this.game.cache.addBitmapFont(file.key, file.url, file.data, xml, file.xSpacing, file.ySpacing);
    }
    else if (file.type === 'textureatlas')
    {
        this.game.cache.addTextureAtlas(file.key, file.url, file.data, xml, file.format);
    }
    else if (file.type === 'xml')
    {
        this.game.cache.addXML(file.key, file.url, xml);
    }

    this.asyncComplete(file);

}

// the same as the core one, but we add 'tiledmap'
function Loader_processPack(pack) {
    var packData = pack.data[pack.key];

    if (!packData)
    {
        console.warn('Phaser.Loader - ' + pack.key + ': pack has data, but not for pack key');
        return;
    }

    for (var i = 0; i < packData.length; i++)
    {
        var file = packData[i];

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
                this.script(file.key, file.url, file.callback, pack.callbackContext || this);
                break;

            case 'binary':
                this.binary(file.key, file.url, file.callback, pack.callbackContext || this);
                break;

            case 'spritesheet':
                this.spritesheet(file.key, file.url, file.frameWidth, file.frameHeight,
                        file.frameMax, file.margin, file.spacing);
                break;

            case 'audio':
                this.audio(file.key, file.urls, file.autoDecode);
                break;

            case 'audiosprite':
                this.audio(file.key, file.urls, file.jsonURL);
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
