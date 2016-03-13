module.exports = {
    p2: {
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
        // convertTiledmap: function (map, layer, addToWorld, optimize) {
        //
        //     if (typeof addToWorld === 'undefined') { addToWorld = true; }
        //     if (typeof optimize === 'undefined') { optimize = true; }
        //     if (typeof layer === 'undefined') { layer = map.currentLayer; }
        //
        //     layer = map.getTilelayer(layer);
        //
        //     if (!layer) {
        //         return;
        //     }
        //
        //     //  If the bodies array is already populated we need to nuke it
        //     this.clearTilemapLayerBodies(map, layer.index);
        //
        //     var width = 0,
        //         sx = 0,
        //         sy = 0,
        //         tile, body, right;
        //
        //     for (var y = 0, h = layer.size.y; y < h; y++)
        //     {
        //         width = 0;
        //
        //         for (var x = 0, w = layer.size.x; x < w; x++)
        //         {
        //             if (!layer.tiles[y]) {
        //                 continue;
        //             }
        //
        //             tile = layer.tiles[y][x];
        //
        //             if (tile && tile.collides)
        //             {
        //                 if (optimize)
        //                 {
        //                     right = map.getTileRight(layer.index, x, y);
        //
        //                     if (width === 0)
        //                     {
        //                         sx = tile.x;
        //                         sy = tile.y;
        //                         width = tile.width;
        //                     }
        //
        //                     if (right && right.collides)
        //                     {
        //                         width += tile.width;
        //                     }
        //                     else
        //                     {
        //                         body = this.createBody(sx, sy, 0, false);
        //
        //                         body.addRectangle(width, tile.height, width / 2, tile.height / 2, 0);
        //
        //                         if (addToWorld)
        //                         {
        //                             this.addBody(body);
        //                         }
        //
        //                         layer.bodies.push(body);
        //
        //                         width = 0;
        //                     }
        //                 }
        //                 else
        //                 {
        //                     body = this.createBody(tile.x, tile.y, 0, false);
        //
        //                     body.clearShapes();
        //                     body.addRectangle(tile.width, tile.height, tile.width / 2, tile.height / 2, tile.rotation);
        //
        //                     if (addToWorld)
        //                     {
        //                         this.addBody(body);
        //                     }
        //
        //                     layer.bodies.push(body);
        //                 }
        //             }
        //         }
        //     }
        //
        //     return layer.bodies;
        //
        // },
        /**
        * Converts all of the polylines objects inside a Tiled ObjectGroup into physics bodies that are added to the world.
        * Note that the polylines must be created in such a way that they can withstand polygon decomposition.
        *
        * @method Phaser.Physics.P2#convertCollisionObjects
        * @param {Phaser.Tilemap} map - The Tilemap to get the map data from.
        * @param {number|string|Phaser.TilemapLayer} [layer] - The layer to operate on, defaults to map.currentLayer.
        * @param {boolean} [addToWorld=true] - If true it will automatically add each body to the world.
        * @return {array} An array of the Phaser.Physics.Body objects that have been created.
        */
        convertTiledCollisionObjects: function (map, layer, addToWorld) {

            if (typeof addToWorld === 'undefined') { addToWorld = true; }
            if (typeof layer === 'undefined') { layer = map.currentLayer; }

            layer = map.getObjectlayer(layer);

            if (!layer) {
                return;
            }

            for (var i = 0, len = layer.objects.length; i < len; i++)
            {
                var object = layer.objects[i];

                var body = this.createBody(object.x, object.y, 0, false);

                // polygon defined area
                if (object.polygon || object.polyline) {
                    if (!body.addPolygon(null, (object.polygon || object.polyline).map(mapPointToArray))) {
                        console.warn('Unable to add poly collision body for object:', object);
                        continue;
                    }
                }
                // currently only circles are supported by P2, so we just use the width
                else if (object.ellipse) {
                    body.addCircle(object.width, object.width / 2, object.width / 2, object.rotation);
                }
                // no polygon, use rectangle defined by object itself
                else {
                    body.addRectangle(object.width, object.height, object.width / 2, object.height / 2, object.rotation);
                }

                if (!body.data.shapes[0]) {
                    console.warn('No shape created for object:', object);
                    continue;
                }

                body.data.shapes[0].sensor = !!(object.properties && object.properties.sensor);

                if (object.properties && typeof object.properties.collisionResponse === 'boolean') {
                    body.data.shapes[0].collisionResponse = object.properties.collisionResponse;
                }

                var bodyType = object.properties && object.properties.bodyType || 'static';

                body[bodyType] = true;

                body.tiledObject = object;

                if (addToWorld) {
                    this.addBody(body);
                }

                layer.bodies.push(body);
            }
        }
    },

    ninja: {
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
        // convertTiledmap: function (map, layer, slopeMap) {
        //
        //     layer = map.getTilelayer(layer);
        //
        //     if (!layer) {
        //         return;
        //     }
        //
        //     //  If the bodies array is already populated we need to nuke it
        //     this.clearTilemapLayerBodies(map, layer);
        //
        //     for (var y = 0, h = layer.size.y; y < h; y++)
        //     {
        //         if (!layer.tiles[y]) {
        //             continue;
        //         }
        //
        //         for (var x = 0, w = layer.size.x; x < w; x++)
        //         {
        //             var tile = layer.tiles[y][x],
        //                 index = (y * layer.size.x) + x;
        //
        //             if (tile && slopeMap.hasOwnProperty(index))
        //             {
        //                 var body = new Phaser.Physics.Ninja.Body(
        //                     this,
        //                     null,
        //                     3,
        //                     slopeMap[index],
        //                     0,
        //                     tile.worldX + tile.centerX,
        //                     tile.worldY + tile.centerY,
        //                     tile.width,
        //                     tile.height
        //                 );
        //
        //                 layer.bodies.push(body);
        //             }
        //         }
        //     }
        //
        //     return layer.bodies;
        //
        // }
    }
};

function mapPointToArray(obj) {
    return [obj.x, obj.y];
}
