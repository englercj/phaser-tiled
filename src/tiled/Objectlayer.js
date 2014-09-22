var utils = require('../utils');

/**
 * Tiled object group is a special layer that contains entities
 * TODO: This is all trash
 *
 * @class ObjectGroup
 * @extends Phaser.Group
 * @constructor
 * @param map {Tilemap} The tilemap instance that this belongs to
 * @param group {Object} All the settings for the layer
 */
function ObjectGroup(game, map, group, width, height) {
    Phaser.Group.call(this, game, map);

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
    this.name = group.name || '';

    // Tiled related properties

    /**
     * The color to display objects in this group
     *
     * @property color
     * @type
     */
    this.color = group.color;

    /**
     * The user-defined properties of this group. Usually defined in the TiledEditor
     *
     * @property properties
     * @type Object
     */
    this.properties = utils.parseTiledProperties(group.properties);

    /**
     * The objects in this group that can be spawned
     *
     * @property objects
     * @type Array
     */
    this.objects = group.objects;

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
    this.position.x = group.x || 0;
    this.position.y = group.y || 0;
    this.alpha = group.opacity !== undefined ? group.opacity : 1;
    this.visible = group.visible !== undefined ? group.visible : true;

    if (this.properties.batch) {
        this.container = this.addChild(new Phaser.SpriteBatch());
    } else {
        this.container = this;
    }
}

/**
 * Spawns all the entities associated with this layer, and properly sets their attributes
 *
 * @method spawn
 * @return {ObjectGroup} Returns itself.
 * @chainable
 */
ObjectGroup.prototype.spawn = function () {
    // we go through these backwards so that things that are higher in the
    // list of object gets rendered on top.
    for(var i = this.objects.length - 1; i >= 0; --i) {
        var o = this.objects[i],
            props = utils.parseTiledProperties(o.properties),
            set,
            interactive,
            obj;

        props.tileprops = {};

        // gid means a sprite from a tileset texture
        if (o.gid) {
            set = this.map.getTileset(o.gid);

            // if the tileset exists
            if (set) {
                props.texture = set.getTileTexture(o.gid);
                props.tileprops = set.getTileProperties(o.gid);

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
            obj = new Phaser.Group();

            obj.width = o.width;
            obj.height = o.height;
            obj.name = o.name;
            obj.rotation = o.rotation;
            obj.objectType = o.type;

            obj.position.x = o.x;
            obj.position.y = o.y;

            // these are treated as sensor bodies, so always enable physics
            obj.sensor = true;
            // obj.hitArea = props.hitArea;

            // obj.enablePhysics(this.game.physics);
        } else {
            props.width = o.width;
            props.height = o.height;

            obj = this.map.spritepool.create(o.type, props.texture, props);

            obj.name = o.name;
            obj.type = o.type;
            obj.position.x = o.x;
            obj.position.y = o.y;

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
                }

                if (props.tileprops.flippedY) {
                    obj.scale.y = -1;
                }

                // from Tiled Editor:
                // https://github.com/bjorn/tiled/blob/b059a13b2864ea029fb741a90780d31cf5b67043/src/libtiled/maprenderer.cpp#L135-L145
                if (props.tileprops.flippedAD) {
                    obj.rotation = Phaser.Math.degToRad(90);
                    obj.scale.x *= -1;

                    var sx = obj.scale.x;
                    obj.scale.x = obj.scale.y;
                    obj.scale.y = sx;

                    var halfDiff = (o.height / 2) - (o.width / 2);
                    obj.position.y += halfDiff;
                    obj.position.x += halfDiff;
                }
            }

            if (props.animation || props.tileprops.animation) {
                if (obj.animations) {
                    obj.animations.play(props.animation || props.tileprops.animation);
                }
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
        this.container.addChild(obj);
    }

    return this;
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
ObjectGroup.prototype.onObjectEvent = function (eventName, obj, data) {
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
ObjectGroup.prototype._getPolygon = function (o) {
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
ObjectGroup.prototype._getPolyline = function (o) {
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
ObjectGroup.prototype._getEllipse = function (o) {
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
ObjectGroup.prototype._getRectangle = function (o) {
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
ObjectGroup.prototype._getInteractive = function (set, props) {
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
 * @return {ObjectGroup} Returns itself.
 * @chainable
 */
ObjectGroup.prototype.despawn = function (destroy) {
    return Phaser.Group.prototype.removeAll.call(this, destroy);
};

/**
 * Destroys the group completely
 *
 * @method destroy
 */
ObjectGroup.prototype.destroy = function () {
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

module.exports = ObjectGroup;
