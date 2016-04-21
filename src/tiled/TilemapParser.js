/* jshint maxlen:200 */
var utils = require('../utils');
var C = require('../constants');

var TilemapParser = {
    /**
     * Parse tilemap data from the cache and creates a Tilemap object.
     *
     * @method parse
     * @param {Phaser.Game} game - Game reference to the currently running game.
     * @param {string} key - The key of the tilemap in the Cache.
     * @param {number} [tileWidth=32] - The pixel width of a single map tile. If using CSV data you must
     *      specify this. Not required if using Tiled map data.
     * @param {number} [tileHeight=32] - The pixel height of a single map tile. If using CSV data you must
     *      specify this. Not required if using Tiled map data.
     * @param {number} [width=10] - The width of the map in tiles. If this map is created from Tiled or
     *      CSV data you don't need to specify this.
     * @param {number} [height=10] - The height of the map in tiles. If this map is created from Tiled or
     *      CSV data you don't need to specify this.
     * @return {object} The parsed map object.
     */
    parse: function (game, key, tileWidth, tileHeight, width, height) {
        if (typeof tileWidth === 'undefined') { tileWidth = 32; }
        if (typeof tileHeight === 'undefined') { tileHeight = 32; }
        if (typeof width === 'undefined') { width = 10; }
        if (typeof height === 'undefined') { height = 10; }

        if (typeof key === 'undefined') {
            return this.getEmptyData();
        }

        if (!key) {
            return this.getEmptyData(tileWidth, tileHeight, width, height);
        }

        var map = game.cache.getTilemapData(utils.cacheKey(key, 'tiledmap'));

        if (map) {
            if (map.format === C.CSV) {
                return this.parseCSV(key, map.data, tileWidth, tileHeight);
            }
            else if (map.format === C.TILED_XML) {
                return this.parseTiledXML(map.data);
            }
            else if (!map.format || map.format === C.TILED_JSON) {
                return this.parseTiledJSON(map.data);
            }
        }
        else {
            console.warn('Phaser.TilemapParser.parse - No map data found for key ' + key);
        }
    },

    parseCSV: Phaser.TilemapParser.parseCSV,

    getEmptyData: function () {
        var map = Phaser.TilemapParser.getEmptyData.apply(this, arguments);

        map.tilewidth = map.tileWidth;
        map.tileheight = map.tileHeight;

        return map;
    },

    /**
     * Parses a Tiled JSON file into valid map data.
     *
     * @method parseTiledJSON
     * @param {object} data - The JSON map data.
     * @return {object} Generated and parsed map data.
     */
    parseTiledJSON: function (data) {
        if (data.orientation !== 'orthogonal') {
            console.warn('TilemapParser.parseTiledJSON: Only orthogonal map types are supported in this version of Phaser');
            return null;
        }

        data.format = Phaser.TILED_JSON;

        var layers = data.layers;

        // decode any encoded/compressed layers
        if (Array.isArray(layers)) {
            for (var i = 0; i < layers.length; i++) {
                var layer = layers[i];

                if (layer && layer.encoding === 'base64') {
                    var decomp = utils.decompressBase64Data(layer.data, layer.encoding, layer.compression);

                    layer.data = new Uint32Array(decomp.buffer, 0, decomp.length / 4);

                    // remove metadata as layer is no longer encoded or compressed
                    delete layer.encoding;
                    delete layer.compression;
                }
            }
        }

        return data;
    },

    /**
     * Parses a Tiled JSON file into valid map data.
     *
     * @method parseTiledXML
     * @param {object} data - The JSON map data.
     * @return {object} Generated and parsed map data.
     */
    parseTiledXML: function (data) {
        var mapElement = data.getElementsByTagName('map')[0];
        var map = {
            version: parseFloat(mapElement.attributes.getNamedItem('version').value, 10),
            width: parseInt(mapElement.attributes.getNamedItem('width').value, 10),
            height: parseInt(mapElement.attributes.getNamedItem('height').value, 10),
            tilewidth: parseInt(mapElement.attributes.getNamedItem('tilewidth').value, 10),
            tileheight: parseInt(mapElement.attributes.getNamedItem('tileheight').value, 10),
            orientation: mapElement.attributes.getNamedItem('orientation').value,
            renderorder: mapElement.attributes.getNamedItem('renderorder').value,
            format: Phaser.Tilemap.TILED_XML,
            properties: {},
            layers: [],
            tilesets: []
        };
        var i = 0;
        var il = 0;

        // add the properties
        var mapprops = mapElement.getElementsByTagName('properties');
        for (i = 0, il = mapprops.length; i < il; ++i) {
            if (mapprops[i].parentNode === mapElement) {
                mapprops = mapprops[i].getElementsByTagName('property');

                for (var mp = 0; mp < mapprops.length; ++mp) {
                    var mappropName = mapprops[mp].attributes.getNamedItem('name').value;
                    map.properties[mappropName] = mapprops[mp].attributes.getNamedItem('value').value;
                }

                break;
            }
        }

        // add the layers
        var layers = mapElement.childNodes; // getElementsByTagName('layer');

        for (i = 0, il = layers.length; i < il; ++i) {
            var node = layers[i];

            if (node.nodeName === 'layer') {
                var lyr = node;
                var layer = {
                    type: 'tilelayer',
                    name: lyr.attributes.getNamedItem('name').value,
                    width: parseInt(lyr.attributes.getNamedItem('width').value, 10) || map.width,
                    height: parseInt(lyr.attributes.getNamedItem('height').value, 10) || map.height,
                    visible: lyr.attributes.getNamedItem('visible') ? lyr.attributes.getNamedItem('visible').value === '1' : true,
                    opacity: lyr.attributes.getNamedItem('opacity') ? parseFloat(lyr.attributes.getNamedItem('opacity').value, 10) : 1,
                    encoding: 'base64',
                    compression: '',
                    rawData: '',
                    data: '',
                    x: 0,
                    y: 0
                };

                // set encoding
                var dataElement = lyr.getElementsByTagName('data')[0];
                layer.encoding = dataElement.attributes.getNamedItem('encoding').value;

                // set data from the text node of the element
                layer.rawData = dataElement.firstChild.nodeValue.trim();

                // set compression
                if (dataElement.attributes.getNamedItem('compression')) {
                    layer.compression = dataElement.attributes.getNamedItem('compression').value;
                }

                if (layer.encoding === 'base64') {
                    var decomp = utils.decompressBase64Data(layer.rawData, layer.encoding, layer.compression);

                    layer.data = new Uint32Array(decomp.buffer, 0, decomp.length / 4);
                }
                else if (layer.encoding === 'csv') {
                    layer.data = JSON.parse('[' + layer.rawData + ']');
                }

                map.layers.push(layer);
            }
            else if (node.nodeName === 'objectgroup') {
                var grp = node;
                var group = {
                    type: 'objectgroup',
                    draworder: 'topdown', // TODO: support custom draworders
                    name: grp.attributes.getNamedItem('name').value,
                    width: 0,
                    height: 0,
                    objects: [],
                    visible: grp.attributes.getNamedItem('visible') ? grp.attributes.getNamedItem('visible').value === '0' : true,
                    opacity: grp.attributes.getNamedItem('opacity') ? parseFloat(grp.attributes.getNamedItem('opacity').value, 10) : 1,
                    x: 0,
                    y: 0
                };

                var objects = grp.getElementsByTagName('object');
                for (var oj = 0; oj < objects.length; ++oj) {
                    var obj = objects[oj];
                    var object = {
                        /* jscs:disable maximumLineLength */
                        gid: obj.attributes.getNamedItem('gid') ? parseInt(obj.attributes.getNamedItem('gid').value, 10) : null,
                        name: obj.attributes.getNamedItem('name') ? obj.attributes.getNamedItem('name').value : '',
                        type: obj.attributes.getNamedItem('type') ? obj.attributes.getNamedItem('type').value : '',
                        width: obj.attributes.getNamedItem('width') ? parseFloat(obj.attributes.getNamedItem('width').value, 10) : 0,
                        height: obj.attributes.getNamedItem('height') ? parseFloat(obj.attributes.getNamedItem('height').value, 10) : 0,
                        rotation: obj.attributes.getNamedItem('rotation') ? parseFloat(obj.attributes.getNamedItem('rotation').value, 10) : 0,
                        visible: obj.attributes.getNamedItem('visible') ? obj.attributes.getNamedItem('visible').value === '1' : true,
                        x: parseFloat(obj.attributes.getNamedItem('x').value, 10),
                        y: parseFloat(obj.attributes.getNamedItem('y').value, 10),
                        properties: {}
                        /* jscs:enable maximumLineLength */
                    };
                    var poly;

                    if (object.gid === null) {
                        delete object.gid;
                    }

                    poly = obj.getElementsByTagName('polygon');
                    if (poly.length) {
                        object.polygon = poly[0].attributes.getNamedItem('points').value.split(' ').map(csvToXY);
                    }

                    poly = obj.getElementsByTagName('polyline');
                    if (poly.length) {
                        object.polyline = poly[0].attributes.getNamedItem('points').value.split(' ').map(csvToXY);
                    }

                    poly = obj.getElementsByTagName('ellipse');
                    if (poly.length) {
                        object.ellipse = true;
                    }

                    var props = obj.getElementsByTagName('properties');
                    if (props.length) {
                        props = props[0].getElementsByTagName('property');
                        for (var pr = 0; pr < props.length; ++pr) {
                            var propName = props[pr].attributes.getNamedItem('name').value;
                            object.properties[propName] = props[pr].attributes.getNamedItem('value').value;
                        }
                    }

                    group.objects.push(object);
                }

                map.layers.push(group);
            }
            else if (node.nodeName === 'imagelayer') {
                var ilyr = node;
                var imglayer = {
                    type: 'imagelayer',
                    image: ilyr.getElementsByTagName('image')[0].attributes.getNamedItem('source').value,
                    name: ilyr.attributes.getNamedItem('name').value,
                    width: 0, // always 0 for imagelayers
                    height: 0, // always 0 for imagelayers
                    visible: ilyr.attributes.getNamedItem('visible') ? ilyr.attributes.getNamedItem('visible').value === '1' : true,
                    opacity: ilyr.attributes.getNamedItem('opacity') ? parseFloat(ilyr.attributes.getNamedItem('opacity').value, 10) : 1,
                    x: ilyr.attributes.getNamedItem('x') ? parseInt(ilyr.attributes.getNamedItem('x').value, 10) : 0,
                    y: ilyr.attributes.getNamedItem('y') ? parseInt(ilyr.attributes.getNamedItem('y').value, 10) : 0,
                    properties: {}
                };

                var iprops = ilyr.getElementsByTagName('properties');
                if (iprops.length) {
                    iprops = iprops[0].getElementsByTagName('property');
                    for (var ip = 0; ip < iprops.length; ++ip) {
                        var ipropName = iprops[ip].attributes.getNamedItem('name').value;
                        imglayer.properties[ipropName] = iprops[ip].attributes.getNamedItem('value').value;
                    }
                }

                map.layers.push(imglayer);
            }
        }

        // add the tilesets
        var tilesets = mapElement.getElementsByTagName('tileset');

        for (i = 0, il = tilesets.length; i < il; ++i) {
            var tset = tilesets[i];
            var tiles = tset.getElementsByTagName('tile');
            var tileset = {
                name: tset.attributes.getNamedItem('name').value,
                firstgid: parseInt(tset.attributes.getNamedItem('firstgid').value, 10),
                tilewidth: parseInt(tset.attributes.getNamedItem('tilewidth').value, 10),
                tileheight: parseInt(tset.attributes.getNamedItem('tileheight').value, 10),
                margin: 0,
                spacing: 0,
                tileoffset: { x: 0, y: 0 },
                terrains: [],
                properties: {},
                tileproperties: {},
                tiles: {}
            };

            // add spacing / margin attributes if exist
            var spacing = tset.attributes.getNamedItem('spacing');
            if (spacing) {
                tileset.spacing = parseInt(spacing.value, 10);
            }

            var margin = tset.attributes.getNamedItem('margin');
            if (margin) {
                tileset.margin = parseInt(margin.value, 10);
            }

            // add .properties if element exists
            var tsetprops = tset.getElementsByTagName('properties');
            for (var tsp = 0; tsp < tsetprops.length; ++tsp) {
                if (tsetprops[tsp].parentNode === tset) {
                    tsetprops = tsetprops[tsp].getElementsByTagName('property');

                    if (tsetprops.length) {
                        for (var p = 0; p < tsetprops.length; ++p) {
                            var tsetprop = tsetprops[p];
                            var tsetpropName = tsetprop.attributes.getNamedItem('name').value;

                            tileset.properties[tsetpropName] = tsetprop.attributes.getNamedItem('value').value;
                        }
                    }

                    break;
                }
            }

            // add .tiles if there are tile-specific properties
            for (var t = 0; t < tiles.length; ++t) {
                var tile = tiles[t];
                var id = tile.attributes.getNamedItem('id').value;
                var img = tile.getElementsByTagName('image');

                tileset.tiles[id] = {};

                // add attributes into the object
                for (var ta = 0; ta < tile.attributes.length; ++ta) {
                    var tileatr = tile.attributes[ta];

                    if (tileatr.name === 'id') {
                        continue;
                    }

                    switch (tileatr.name) {
                        case 'terrain':
                            tileset.tiles[id].terrain = tileatr.value.sply(',');
                            break;

                        case 'probability':
                            tileset.tiles[id].probability = parseFloat(tileatr.value, 10);
                            break;
                    }
                }

                // check if it has an image child
                if (img.length) {
                    tileset.tiles[id] = tileset.tiles[id] || {};
                    tileset.tiles[id].image = img[0].attributes.getNamedItem('source').value;
                }

                // add all the tile properties
                var tileprops = tile.getElementsByTagName('properties');
                if (tileprops.length) {
                    tileset.tileproperties[id] = {};
                    tileprops = tileprops[0].getElementsByTagName('property');
                    for (var tp = 0; tp < tileprops.length; ++tp) {
                        var tileprop = tileprops[tp];
                        var tilepropName = tileprop.attributes.getNamedItem('name').value;
                        tileset.tileproperties[id][tilepropName] = tileprop.attributes.getNamedItem('value').value;
                    }
                }

                // add all the tile animations
                var tileanims = tile.getElementsByTagName('animation');
                if (tileanims.length) {
                    tileset.tiles[id].animation = [];
                    tileanims = tileanims[0].getElementsByTagName('frame');
                    for (var tn = 0; tn < tileanims.length; ++tn) {
                        var tileanim = tileanims[tn].attributes;
                        var animObj = {};

                        for (var tna = 0; tna < tileanim.length; ++tna) {
                            animObj[tileanim[tna].name] = tileanim[tna].value;
                        }

                        tileset.tiles[id].animation.push(animObj);
                    }
                }
            }

            // check for terraintypes and add those
            var terrains = tset.getElementsByTagName('terraintypes');
            if (terrains.length) {
                terrains = terrains[0].getElementsByTagName('terrain');
                for (var tr = 0; tr < terrains.length; ++tr) {
                    tileset.terrains.push({
                        name: terrains[tr].attributes.getNamedItem('name').value,
                        tile: parseInt(terrains[tr].attributes.getNamedItem('tile').value, 10)
                    });
                }
            }

            // check for tileoffset and add that
            var offset = tset.getElementsByTagName('tileoffset');
            if (offset.length) {
                tileset.tileoffset.x = parseInt(offset[0].attributes.getNamedItem('x').value, 10);
                tileset.tileoffset.y = parseInt(offset[0].attributes.getNamedItem('y').value, 10);
            }

            // add image, imagewidth, imageheight
            var image = tset.getElementsByTagName('image');
            if (image.length === 1 && image[0].parentNode === tset) {
                tileset.image = image[0].attributes.getNamedItem('source').value;
                tileset.imagewidth = parseInt(image[0].attributes.getNamedItem('width').value, 10);
                tileset.imageheight = parseInt(image[0].attributes.getNamedItem('height').value, 10);
            }

            map.tilesets.push(tileset);
        }

        return map;
    }
};

module.exports = TilemapParser;

function csvToXY(pt) {
    var points = pt.split(',');
    return {
        x: parseInt(points[0], 10),
        y: parseInt(points[1], 10)
    };
}
