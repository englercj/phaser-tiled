module.exports = {
    /**
    * Goes through all tiles in the given Tilemap and TilemapLayer and converts those set to collide into physics
    * bodies. Only call this *after* you have specified all of the tiles you wish to collide with calls like
    * Tilemap.setCollisionBetween, etc. Every time you call this method it will destroy any previously created
    * bodies and remove them from the world. Therefore understand it's a very expensive operation and not to be
    * done in a core game update loop.
    *
    * @method Phaser.Physics.P2#convertTilemap
    * @param {Phaser.Tilemap} map - The Tilemap to get the map data from.
    * @param {number|string|Phaser.TilemapLayer} [layer] - The layer to operate on. If not given will default
    *       to map.currentLayer.
    * @param {boolean} [addToWorld=true] - If true it will automatically add each body to the world, otherwise
    *       it's up to you to do so.
    * @param {boolean} [optimize=true] - If true adjacent colliding tiles will be combined into a single body
    *       to save processing. However it means you cannot perform specific Tile to Body collision responses.
    * @return {array} An array of the Phaser.Physics.P2.Body objects that were created.
    */
    convertTiledmapForP2: function (map, layer, addToWorld, optimize) {

        layer = map.getLayer(layer);

        if (typeof addToWorld === 'undefined') { addToWorld = true; }
        if (typeof optimize === 'undefined') { optimize = true; }

        //  If the bodies array is already populated we need to nuke it
        this.clearTilemapLayerBodies(map, layer);

        var width = 0,
            sx = 0,
            sy = 0,
            tile, body, right;

        for (var y = 0, h = map.layers[layer].size.y; y < h; y++)
        {
            width = 0;

            for (var x = 0, w = map.layers[layer].size.x; x < w; x++)
            {
                tile = map.layers[layer].tiles[y][x];

                if (tile && tile.collides)
                {
                    if (optimize)
                    {
                        right = map.getTileRight(layer, x, y);

                        if (width === 0)
                        {
                            sx = tile.x * tile.width;
                            sy = tile.y * tile.height;
                            width = tile.width;
                        }

                        if (right && right.collides)
                        {
                            width += tile.width;
                        }
                        else
                        {
                            body = this.createBody(sx, sy, 0, false);

                            body.addRectangle(width, tile.height, width / 2, tile.height / 2, 0);

                            if (addToWorld)
                            {
                                this.addBody(body);
                            }

                            map.layers[layer].bodies.push(body);

                            width = 0;
                        }
                    }
                    else
                    {
                        body = this.createBody(tile.x * tile.width, tile.y * tile.height, 0, false);

                        body.addRectangle(tile.width, tile.height, tile.width / 2, tile.height / 2, 0);

                        if (addToWorld)
                        {
                            this.addBody(body);
                        }

                        map.layers[layer].bodies.push(body);
                    }
                }
            }
        }

        return map.layers[layer].bodies;

    },

    /**
    * Goes through all tiles in the given Tilemap and TilemapLayer and converts those set to collide into physics
    * bodies. Only call this *after* you have specified all of the tiles you wish to collide with calls like
    * Tilemap.setCollisionBetween, etc. Every time you call this method it will destroy any previously created
    * bodies and remove them from the world. Therefore understand it's a very expensive operation and not to be
    * done in a core game update loop.
    *
    * In Ninja the Tiles have an ID from 0 to 33, where 0 is 'empty', 1 is a full tile, 2 is a 45-degree slope,
    * etc. You can find the ID list either at the very bottom of `Tile.js`, or in a handy visual reference in the
    * `resources/Ninja Physics Debug Tiles` folder in the repository. The slopeMap parameter is an array that controls
    * how the indexes of the tiles in your tilemap data will map to the Ninja Tile IDs. For example if you had 6
    * tiles in your tileset: Imagine the first 4 should be converted into fully solid Tiles and the other 2 are 45-degree
    * slopes. Your slopeMap array would look like this: `[ 1, 1, 1, 1, 2, 3 ]`. Where each element of the array is
    * a tile in your tilemap and the resulting Ninja Tile it should create.
    *
    * @method Phaser.Physics.Ninja#convertTilemap
    * @param {Phaser.Tilemap} map - The Tilemap to get the map data from.
    * @param {number|string|Phaser.TilemapLayer} [layer] - The layer to operate on. Defaults to map.currentLayer.
    * @param {object} [slopeMap] - The tilemap index to Tile ID map.
    * @return {array} An array of the Phaser.Physics.Ninja.Tile objects that were created.
    */
    convertTiledmapForNinja: function (map, layer, slopeMap) {

        layer = map.getLayer(layer);

        //  If the bodies array is already populated we need to nuke it
        this.clearTilemapLayerBodies(map, layer);

        for (var y = 0, h = map.layers[layer].size.y; y < h; y++)
        {
            for (var x = 0, w = map.layers[layer].size.x; x < w; x++)
            {
                var tile = map.layers[layer].tiles[y][x],
                    index = (y * map.layers[layer].size.x) + x;

                if (tile && slopeMap.hasOwnProperty(index))
                {
                    var body = new Phaser.Physics.Ninja.Body(
                        this,
                        null,
                        3,
                        slopeMap[index],
                        0,
                        tile.worldX + tile.centerX,
                        tile.worldY + tile.centerY,
                        tile.width,
                        tile.height
                    );

                    map.layers[layer].bodies.push(body);
                }
            }
        }

        return map.layers[layer].bodies;

    },
};
