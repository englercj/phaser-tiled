var utils = require('../utils');

/**
 * Tiled object group is a special layer that contains entities
 *
 * @class Objectlayer
 * @extends Phaser.Group
 * @constructor
 * @param map {Tilemap} The tilemap instance that this belongs to
 * @param group {Object} All the settings for the layer
 */
function Objectlayer(game, map, layer, index) {
    Phaser.Group.call(this, game, map);

    this.index = index;

    // Non-Tiled related properties

    /**
     * The map instance this object group belongs to
     *
     * @property map
     * @type Tilemap
     */
    this.map = map;

    /**
     * The const type of this object.
     *
     * @property type
     * @type Number
     * @default
     */
    this.type = Phaser.TILEMAPLAYER;

    /**
     * The name of the group
     *
     * @property name
     * @type String
     * @default ''
     */
    this.name = layer.name || '';

    // Tiled related properties

    /**
     * The color of this group in the Tiled Editor,
     *
     * @property color
     * @type
     */
    this.color = layer.color;

    /**
     * The user-defined properties of this group. Usually defined in the TiledEditor
     *
     * @property properties
     * @type Object
     */
    this.properties = utils.parseTiledProperties(layer.properties);

    /**
     * The objects in this group that can be spawned
     *
     * @property objects
     * @type Array
     */
    this.objects = layer.objects;

    /**
     * The Tiled type of tile layer, should always be 'objectgroup'
     *
     * @property layerType
     * @type String
     * @default 'objectgroup'
     * @readOnly
     */
    this.layerType = layer.type || 'objectgroup';

    // translate some tiled properties to our inherited properties
    this.position.x = layer.x || 0;
    this.position.y = layer.y || 0;
    this.alpha = layer.opacity !== undefined ? layer.opacity : 1;
    this.visible = layer.visible !== undefined ? layer.visible : true;

    // physics bodies in this layer
    this.bodies = [];

    if (this.properties.batch) {
        this.container = this.addChild(new Phaser.SpriteBatch(game));
    } else {
        this.container = this;
    }
}

Objectlayer.prototype = Object.create(Phaser.Group.prototype);
Objectlayer.prototype.constructor = Objectlayer;

module.exports = Objectlayer;

/**
 * Spawns all the entities associated with this layer, and properly sets their attributes
 *
 * @method spawn
 * @return {Objectlayer} Returns itself.
 * @chainable
 */
Objectlayer.prototype.spawn = function (spawnCallback) {
    // we go through these backwards so that things that are higher in the
    // list of object gets rendered on top.
    for(var i = this.objects.length - 1; i >= 0; --i) {
        var o = this.objects[i],
            props = utils.parseTiledProperties(o.properties),
            set,
            // interactive,
            obj;

        props.tileprops = {};
        props.animation = null;

        // gid means a sprite from a tileset texture
        if (o.gid) {
            set = this.map.getTileset(o.gid);

            // if the tileset exists
            if (set) {
                props.texture = set.getTileTexture(o.gid);
                props.tileprops = set.getTileProperties(o.gid);
                props.animation = set.getTileAnimations(o.gid);

                // if no hitArea then use the tileset's if available
                if (!props.hitArea) {
                    if (props.tileprops.hitArea) {
                        props.hitArea = props.tileprops.hitArea;
                    }
                    else {
                        props.hitArea = set.properties.hitArea;
                    }
                }
            }
        }
        // non-sprite object (usually to define an "area" on a map)
        // else {
        //     if (!props.hitArea) {
        //         if (o.polyline) {
        //             props.hitArea = this._getPolyline(o);
        //         }
        //         else if (o.polygon) {
        //             props.hitArea = this._getPolygon(o);
        //         }
        //         else if (o.ellipse) {
        //             props.hitArea = this._getEllipse(o);
        //         }
        //         else {
        //             props.hitArea = this._getRectangle(o);
        //         }
        //     }
        // }

        o.name = o.name || props.name || props.tileprops.name || '';
        o.type = o.type || props.type || props.tileprops.type || '';

        // a manually specified string texture
        if (typeof props.texture === 'string') {
            props.texture = PIXI.TextureCache[props.texture];
        }

        // just a regular DisplayObject
        if (!props.texture) {
            obj = this.game.add.group(this.container, o.name);

            obj.width = o.width;
            obj.height = o.height;
            obj.rotation = o.rotation;
            obj.objectType = o.type;

            obj.position.x = o.x;
            obj.position.y = o.y;

            // these are treated as sensor bodies, so always enable physics
            obj.sensor = true;
            // obj.hitArea = props.hitArea;

            // obj.enablePhysics(this.game.physics);
        } else {
            obj = this.game.add.sprite(o.x, o.y, props.texture, null, this.container);

            // obj.width = o.width;
            // obj.height = o.height;

            obj.name = o.name;
            obj.objectType = o.type;

            // obj.mass = props.mass || props.tileprops.mass;
            // obj.inertia = props.inertia || props.tileprops.inertia;
            // obj.friction = props.friction || props.tileprops.friction;
            // obj.sensor = props.sensor || props.tileprops.sensor;
            // obj.hitArea = props.hitArea;
            obj.blendMode = (props.blendMode || this.properties.blendMode) ?
                PIXI.blendModes[(props.blendMode || this.properties.blendMode)] : PIXI.blendModes.NORMAL;

            var a = props.anchor || props.tileprops.anchor;
            obj.anchor.x = a ? a[0] : 0;
            obj.anchor.y = a ? a[1] : 1;

            // if (obj.mass) {
            //     obj.enablePhysics(this.game.physics);
            // }

            if (props.tileprops) {
                if (props.tileprops.flippedX) {
                    obj.scale.x = -1;
                    obj.position.x += Math.abs(obj.width);
                }

                if (props.tileprops.flippedY) {
                    obj.scale.y = -1;
                    obj.position.y += Math.abs(obj.height);
                }

                // from Tiled Editor:
                // https://github.com/bjorn/tiled/blob/b059a13b2864ea029fb741a90780d31cf5b67043/src/libtiled/maprenderer.cpp#L135-L145
                if (props.tileprops.flippedAD) {
                    obj.rotation = this.game.math.degToRad(90);
                    obj.scale.x *= -1;

                    var sx = obj.scale.x;
                    obj.scale.x = obj.scale.y;
                    obj.scale.y = sx;

                    var halfDiff = Math.abs(o.height / 2) - Math.abs(o.width / 2);
                    obj.position.y += halfDiff;
                    obj.position.x += halfDiff;
                }
            }

            if (props.animation && obj.animations) {
                obj.animations.copyFrameData(props.animation.data, 0);
                obj.animations.add('tile', null, props.animation.rate, true).play();
                // obj.animations.play(props.animation || props.tileprops.animation);
            }

            if (typeof o.rotation === 'number') {
                obj.rotation = o.rotation;
            }
        }

        //visible was recently added to Tiled, default old versions to true
        obj.visible = o.visible !== undefined ? !!o.visible : true;

        // if (this.map.orientation === 'isometric') {
        //     var toTileX = o.x / this.map.tileWidth,
        //         toTileY = o.y / this.map.tileWidth;

        //     //This cannot be the simplest form of this...
        //     o.x = (toTileX * this.map.tileWidth) - ((toTileY - 1) * (this.map.tileWidth / 2));
        //     o.y = (toTileY * this.map.tileWidth / 2) + (toTileX * this.map.tileWidth);
        // }

        // interactive = this._getInteractive(set, props);

        // //pass through all events
        // if (interactive) {
        //     obj.interactive = interactive;

        //     obj.click = this.onObjectEvent.bind(this, 'click', obj);
        //     obj.mousedown = this.onObjectEvent.bind(this, 'mousedown', obj);
        //     obj.mouseup = this.onObjectEvent.bind(this, 'mouseup', obj);
        //     obj.mousemove = this.onObjectEvent.bind(this, 'mousemove', obj);
        //     obj.mouseout = this.onObjectEvent.bind(this, 'mouseout', obj);
        //     obj.mouseover = this.onObjectEvent.bind(this, 'mouseover', obj);
        //     obj.mouseupoutside = this.onObjectEvent.bind(this, 'mouseupoutside', obj);
        // }

        //set custom properties
        obj.properties = {};
        for(var t in props.tileprops) {
            obj.properties[t] = props.tileprops[t];
        }

        for(var k in props) {
            if(k !== 'tileprops') {
                obj.properties[k] = props[k];
            }
        }

        obj._objIndex = i;

        if (spawnCallback) {
            spawnCallback(obj);
        }
    }

    return this;
};

Objectlayer.prototype.getObject = function (name) {
    for (var i = 0; i < this.objects.length; ++i) {
        if (this.objects[i].name === name) {
            return this.objects[i];
        }
    }
};

/**
 * Called internally whenever an event happens on an object, used to echo to the map.
 *
 * @method onObjectEvent
 * @param eventName {String} The name of the event
 * @param obj {Container|Sprite} The object the event happened to
 * @param data {mixed} The event data that was passed along
 * @private
 */
Objectlayer.prototype.onObjectEvent = function (eventName, obj, data) {
    this.map.onObjectEvent(eventName, obj, data);
};

/**
 * Creates a polygon from the vertices in a polygon Tiled property
 *
 * @method _getPolygon
 * @param obj {Object} The polygon Tiled object
 * @return {Polygon} The polygon created
 * @private
 */
Objectlayer.prototype._getPolygon = function (o) {
    var points = [];
    for(var i = 0, il = o.polygon.length; i < il; ++i) {
        points.push(new Phaser.Point(o.polygon[i].x, o.polygon[i].y));
    }

    return new Phaser.Polygon(points);
};

/**
 * Creates a polyline from the vertices in a polyline Tiled property
 *
 * @method _getPolyline
 * @param obj {Object} The polyline Tiled object
 * @return {Polygon} The polyline created
 * @private
 */
Objectlayer.prototype._getPolyline = function (o) {
    var points = [];
    for(var i = 0, il = o.polyline.length; i < il; ++i) {
        points.push(new Phaser.Point(o.polyline[i].x, o.polyline[i].y));
    }

    return new Phaser.Polygon(points);
};

/**
 * Creates a ellipse from the vertices in a ellipse Tiled property
 *
 * @method _getEllipse
 * @param obj {Object} The ellipse Tiled object
 * @return {Ellipse} The ellipse created
 * @private
 */
Objectlayer.prototype._getEllipse = function (o) {
    return new Phaser.Ellipse(0, 0, o.width, o.height);
};

/**
 * Creates a rectangle from the vertices in a rectangle Tiled property
 *
 * @method _getRectangle
 * @param obj {Object} The rectangle Tiled object
 * @return {Rectangle} The rectangle created
 * @private
 */
Objectlayer.prototype._getRectangle = function (o) {
    return new Phaser.Rectangle(0, 0, o.width, o.height);
};

/**
 * Checks if an object should be marked as interactive
 *
 * @method _getInteractive
 * @param set {Tileset} The tileset for the object
 * @param props {Object} The Tiled properties object
 * @return {Boolean} Whether or not the item is interactive
 * @private
 */
Objectlayer.prototype._getInteractive = function (set, props) {
    //TODO: This is wrong, if 'false' is set on a lower level a higher level will override
    //first check the lowest level value (on the tile iteself)
    return props.interactive || //obj interactive
            props.tileprops.interactive || //tile object interactive
            (set && set.properties.interactive) || //tileset interactive
            this.properties.interactive || //layer interactive
            this.map.properties.interactive; //map interactive
};

/**
 * Despawns all the sprites associated with this layer
 *
 * @method despawn
 * @param destroy {Boolean} Should we destroy the children as well?
 * @return {Objectlayer} Returns itself.
 * @chainable
 */
Objectlayer.prototype.despawn = function (destroy) {
    return Phaser.Group.prototype.removeAll.call(this, destroy);
};

/**
 * Destroys the group completely
 *
 * @method destroy
 */
Objectlayer.prototype.destroy = function () {
    Phaser.Group.prototype.destroy.apply(this, arguments);

    this.map = null;
    this.game = null;
    this.state = null;
    this.name = null;
    this.color = null;
    this.properties = null;
    this.objects = null;
    this.type = null;
};
