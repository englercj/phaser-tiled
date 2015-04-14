!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var n;"undefined"!=typeof window?n=window:"undefined"!=typeof global?n=global:"undefined"!=typeof self&&(n=self);var f=n;f=f.Phaser||(f.Phaser={}),f=f.Plugin||(f.Plugin={}),f.Tiled=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

Tiled.Tile          = require('./tiled/Tile');
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

/* jshint +W106 */

},{"./physics":10,"./tiled/Objectlayer":11,"./tiled/Tile":12,"./tiled/Tilelayer":13,"./tiled/Tilemap":14,"./tiled/Tileset":16,"./utils":17}],2:[function(require,module,exports){
;(function () {

  var object = typeof exports != 'undefined' ? exports : this; // #8: web workers
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

  function InvalidCharacterError(message) {
    this.message = message;
  }
  InvalidCharacterError.prototype = new Error;
  InvalidCharacterError.prototype.name = 'InvalidCharacterError';

  // encoder
  // [https://gist.github.com/999166] by [https://github.com/nignag]
  object.btoa || (
  object.btoa = function (input) {
    var str = String(input);
    for (
      // initialize result and counter
      var block, charCode, idx = 0, map = chars, output = '';
      // if the next str index does not exist:
      //   change the mapping table to "="
      //   check if d has no fractional digits
      str.charAt(idx | 0) || (map = '=', idx % 1);
      // "8 - idx % 1 * 8" generates the sequence 2, 4, 6, 8
      output += map.charAt(63 & block >> 8 - idx % 1 * 8)
    ) {
      charCode = str.charCodeAt(idx += 3/4);
      if (charCode > 0xFF) {
        throw new InvalidCharacterError("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
      }
      block = block << 8 | charCode;
    }
    return output;
  });

  // decoder
  // [https://gist.github.com/1020396] by [https://github.com/atk]
  object.atob || (
  object.atob = function (input) {
    var str = String(input).replace(/=+$/, '');
    if (str.length % 4 == 1) {
      throw new InvalidCharacterError("'atob' failed: The string to be decoded is not correctly encoded.");
    }
    for (
      // initialize result and counters
      var bc = 0, bs, buffer, idx = 0, output = '';
      // get next character
      buffer = str.charAt(idx++);
      // character found in table? initialize bit storage and add its ascii value;
      ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
        // and if not first of each 4 characters,
        // convert the first 8 bits to one ascii character
        bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
    ) {
      // try to find character in table (0-63, not found => -1)
      buffer = chars.indexOf(buffer);
    }
    return output;
  });

}());

},{}],3:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('is-array')

exports.Buffer = Buffer
exports.SlowBuffer = Buffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192 // not used by this implementation

var kMaxLength = 0x3fffffff

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Note:
 *
 * - Implementation must support adding new properties to `Uint8Array` instances.
 *   Firefox 4-29 lacked support, fixed in Firefox 30+.
 *   See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *  - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *  - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *    incorrect length in some situations.
 *
 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they will
 * get the Object implementation, which is slower but will work correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = (function () {
  try {
    var buf = new ArrayBuffer(0)
    var arr = new Uint8Array(buf)
    arr.foo = function () { return 42 }
    return 42 === arr.foo() && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        new Uint8Array(1).subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
})()

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (subject, encoding, noZero) {
  if (!(this instanceof Buffer))
    return new Buffer(subject, encoding, noZero)

  var type = typeof subject

  // Find the length
  var length
  if (type === 'number')
    length = subject > 0 ? subject >>> 0 : 0
  else if (type === 'string') {
    if (encoding === 'base64')
      subject = base64clean(subject)
    length = Buffer.byteLength(subject, encoding)
  } else if (type === 'object' && subject !== null) { // assume object is array-like
    if (subject.type === 'Buffer' && isArray(subject.data))
      subject = subject.data
    length = +subject.length > 0 ? Math.floor(+subject.length) : 0
  } else
    throw new TypeError('must start with number, buffer, array or string')

  if (this.length > kMaxLength)
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
      'size: 0x' + kMaxLength.toString(16) + ' bytes')

  var buf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Preferred: Return an augmented `Uint8Array` instance for best performance
    buf = Buffer._augment(new Uint8Array(length))
  } else {
    // Fallback: Return THIS instance of Buffer (created by `new`)
    buf = this
    buf.length = length
    buf._isBuffer = true
  }

  var i
  if (Buffer.TYPED_ARRAY_SUPPORT && typeof subject.byteLength === 'number') {
    // Speed optimization -- use set if we're copying from a typed array
    buf._set(subject)
  } else if (isArrayish(subject)) {
    // Treat array-ish objects as a byte array
    if (Buffer.isBuffer(subject)) {
      for (i = 0; i < length; i++)
        buf[i] = subject.readUInt8(i)
    } else {
      for (i = 0; i < length; i++)
        buf[i] = ((subject[i] % 256) + 256) % 256
    }
  } else if (type === 'string') {
    buf.write(subject, 0, encoding)
  } else if (type === 'number' && !Buffer.TYPED_ARRAY_SUPPORT && !noZero) {
    for (i = 0; i < length; i++) {
      buf[i] = 0
    }
  }

  return buf
}

Buffer.isBuffer = function (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b))
    throw new TypeError('Arguments must be Buffers')

  var x = a.length
  var y = b.length
  for (var i = 0, len = Math.min(x, y); i < len && a[i] === b[i]; i++) {}
  if (i !== len) {
    x = a[i]
    y = b[i]
  }
  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function (list, totalLength) {
  if (!isArray(list)) throw new TypeError('Usage: Buffer.concat(list[, length])')

  if (list.length === 0) {
    return new Buffer(0)
  } else if (list.length === 1) {
    return list[0]
  }

  var i
  if (totalLength === undefined) {
    totalLength = 0
    for (i = 0; i < list.length; i++) {
      totalLength += list[i].length
    }
  }

  var buf = new Buffer(totalLength)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

Buffer.byteLength = function (str, encoding) {
  var ret
  str = str + ''
  switch (encoding || 'utf8') {
    case 'ascii':
    case 'binary':
    case 'raw':
      ret = str.length
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = str.length * 2
      break
    case 'hex':
      ret = str.length >>> 1
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8ToBytes(str).length
      break
    case 'base64':
      ret = base64ToBytes(str).length
      break
    default:
      ret = str.length
  }
  return ret
}

// pre-set for values that may exist in the future
Buffer.prototype.length = undefined
Buffer.prototype.parent = undefined

// toString(encoding, start=0, end=buffer.length)
Buffer.prototype.toString = function (encoding, start, end) {
  var loweredCase = false

  start = start >>> 0
  end = end === undefined || end === Infinity ? this.length : end >>> 0

  if (!encoding) encoding = 'utf8'
  if (start < 0) start = 0
  if (end > this.length) end = this.length
  if (end <= start) return ''

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'binary':
        return binarySlice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase)
          throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.equals = function (b) {
  if(!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max)
      str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  return Buffer.compare(this, b)
}

// `get` will be removed in Node 0.13+
Buffer.prototype.get = function (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` will be removed in Node 0.13+
Buffer.prototype.set = function (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var byte = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(byte)) throw new Error('Invalid hex string')
    buf[offset + i] = byte
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  var charsWritten = blitBuffer(utf8ToBytes(string), buf, offset, length)
  return charsWritten
}

function asciiWrite (buf, string, offset, length) {
  var charsWritten = blitBuffer(asciiToBytes(string), buf, offset, length)
  return charsWritten
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  var charsWritten = blitBuffer(base64ToBytes(string), buf, offset, length)
  return charsWritten
}

function utf16leWrite (buf, string, offset, length) {
  var charsWritten = blitBuffer(utf16leToBytes(string), buf, offset, length)
  return charsWritten
}

Buffer.prototype.write = function (string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length
      length = undefined
    }
  } else {  // legacy
    var swap = encoding
    encoding = offset
    offset = length
    length = swap
  }

  offset = Number(offset) || 0
  var remaining = this.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase()

  var ret
  switch (encoding) {
    case 'hex':
      ret = hexWrite(this, string, offset, length)
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8Write(this, string, offset, length)
      break
    case 'ascii':
      ret = asciiWrite(this, string, offset, length)
      break
    case 'binary':
      ret = binaryWrite(this, string, offset, length)
      break
    case 'base64':
      ret = base64Write(this, string, offset, length)
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = utf16leWrite(this, string, offset, length)
      break
    default:
      throw new TypeError('Unknown encoding: ' + encoding)
  }
  return ret
}

Buffer.prototype.toJSON = function () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  var res = ''
  var tmp = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    if (buf[i] <= 0x7F) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i])
      tmp = ''
    } else {
      tmp += '%' + buf[i].toString(16)
    }
  }

  return res + decodeUtf8Char(tmp)
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function binarySlice (buf, start, end) {
  return asciiSlice(buf, start, end)
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len;
    if (start < 0)
      start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0)
      end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start)
    end = start

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    return Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    var newBuf = new Buffer(sliceLen, undefined, true)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
    return newBuf
  }
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0)
    throw new RangeError('offset is not uint')
  if (offset + ext > length)
    throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUInt8 = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
      ((this[offset + 1] << 16) |
      (this[offset + 2] << 8) |
      this[offset + 3])
}

Buffer.prototype.readInt8 = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80))
    return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)

  return (this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16) |
      (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
      (this[offset + 1] << 16) |
      (this[offset + 2] << 8) |
      (this[offset + 3])
}

Buffer.prototype.readFloatLE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
  if (value > max || value < min) throw new TypeError('value is out of bounds')
  if (offset + ext > buf.length) throw new TypeError('index out of range')
}

Buffer.prototype.writeUInt8 = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = value
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
  } else objectWriteUInt16(this, value, offset, true)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = value
  } else objectWriteUInt16(this, value, offset, false)
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = value
  } else objectWriteUInt32(this, value, offset, true)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = value
  } else objectWriteUInt32(this, value, offset, false)
  return offset + 4
}

Buffer.prototype.writeInt8 = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = value
  return offset + 1
}

Buffer.prototype.writeInt16LE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
  } else objectWriteUInt16(this, value, offset, true)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = value
  } else objectWriteUInt16(this, value, offset, false)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else objectWriteUInt32(this, value, offset, true)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = value
  } else objectWriteUInt32(this, value, offset, false)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (value > max || value < min) throw new TypeError('value is out of bounds')
  if (offset + ext > buf.length) throw new TypeError('index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert)
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert)
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function (target, target_start, start, end) {
  var source = this

  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (!target_start) target_start = 0

  // Copy 0 bytes; we're done
  if (end === start) return
  if (target.length === 0 || source.length === 0) return

  // Fatal error conditions
  if (end < start) throw new TypeError('sourceEnd < sourceStart')
  if (target_start < 0 || target_start >= target.length)
    throw new TypeError('targetStart out of bounds')
  if (start < 0 || start >= source.length) throw new TypeError('sourceStart out of bounds')
  if (end < 0 || end > source.length) throw new TypeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length)
    end = this.length
  if (target.length - target_start < end - start)
    end = target.length - target_start + start

  var len = end - start

  if (len < 100 || !Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < len; i++) {
      target[i + target_start] = this[i + start]
    }
  } else {
    target._set(this.subarray(start, start + len), target_start)
  }
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (end < start) throw new TypeError('end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  if (start < 0 || start >= this.length) throw new TypeError('start out of bounds')
  if (end < 0 || end > this.length) throw new TypeError('end out of bounds')

  var i
  if (typeof value === 'number') {
    for (i = start; i < end; i++) {
      this[i] = value
    }
  } else {
    var bytes = utf8ToBytes(value.toString())
    var len = bytes.length
    for (i = start; i < end; i++) {
      this[i] = bytes[i % len]
    }
  }

  return this
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1) {
        buf[i] = this[i]
      }
      return buf.buffer
    }
  } else {
    throw new TypeError('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function (arr) {
  arr._isBuffer = true

  // save reference to original Uint8Array get/set methods before overwriting
  arr._get = arr.get
  arr._set = arr.set

  // deprecated, will be removed in node 0.13+
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.equals = BP.equals
  arr.compare = BP.compare
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

var INVALID_BASE64_RE = /[^+\/0-9A-z]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function isArrayish (subject) {
  return isArray(subject) || Buffer.isBuffer(subject) ||
      subject && typeof subject === 'object' &&
      typeof subject.length === 'number'
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    var b = str.charCodeAt(i)
    if (b <= 0x7F) {
      byteArray.push(b)
    } else {
      var start = i
      if (b >= 0xD800 && b <= 0xDFFF) i++
      var h = encodeURIComponent(str.slice(start, i+1)).substr(1).split('%')
      for (var j = 0; j < h.length; j++) {
        byteArray.push(parseInt(h[j], 16))
      }
    }
  }
  return byteArray
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(str)
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length))
      break
    dst[i + offset] = src[i]
  }
  return i
}

function decodeUtf8Char (str) {
  try {
    return decodeURIComponent(str)
  } catch (err) {
    return String.fromCharCode(0xFFFD) // UTF 8 invalid char
  }
}

},{"base64-js":4,"ieee754":5,"is-array":6}],4:[function(require,module,exports){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS)
			return 62 // '+'
		if (code === SLASH)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

},{}],5:[function(require,module,exports){
exports.read = function(buffer, offset, isLE, mLen, nBytes) {
  var e, m,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      nBits = -7,
      i = isLE ? (nBytes - 1) : 0,
      d = isLE ? -1 : 1,
      s = buffer[offset + i];

  i += d;

  e = s & ((1 << (-nBits)) - 1);
  s >>= (-nBits);
  nBits += eLen;
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8);

  m = e & ((1 << (-nBits)) - 1);
  e >>= (-nBits);
  nBits += mLen;
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8);

  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity);
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
};

exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0),
      i = isLE ? 0 : (nBytes - 1),
      d = isLE ? 1 : -1,
      s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

  value = Math.abs(value);

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }
    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }
    if (value * c >= 2) {
      e++;
      c /= 2;
    }

    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8);

  e = (e << mLen) | m;
  eLen += mLen;
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8);

  buffer[offset + i - d] |= s * 128;
};

},{}],6:[function(require,module,exports){

/**
 * isArray
 */

var isArray = Array.isArray;

/**
 * toString
 */

var str = Object.prototype.toString;

/**
 * Whether or not the given `val`
 * is an array.
 *
 * example:
 *
 *        isArray([]);
 *        // > true
 *        isArray(arguments);
 *        // > false
 *        isArray('');
 *        // > false
 *
 * @param {mixed} val
 * @return {bool}
 */

module.exports = isArray || function (val) {
  return !! val && '[object Array]' == str.call(val);
};

},{}],7:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],8:[function(require,module,exports){
(function (process,Buffer){
/** @license zlib.js 2012 - imaya [ https://github.com/imaya/zlib.js ] The MIT License */(function() {'use strict';function q(b){throw b;}var t=void 0,v=!0;var A="undefined"!==typeof Uint8Array&&"undefined"!==typeof Uint16Array&&"undefined"!==typeof Uint32Array&&"undefined"!==typeof DataView;function E(b,a){this.index="number"===typeof a?a:0;this.m=0;this.buffer=b instanceof(A?Uint8Array:Array)?b:new (A?Uint8Array:Array)(32768);2*this.buffer.length<=this.index&&q(Error("invalid index"));this.buffer.length<=this.index&&this.f()}E.prototype.f=function(){var b=this.buffer,a,c=b.length,d=new (A?Uint8Array:Array)(c<<1);if(A)d.set(b);else for(a=0;a<c;++a)d[a]=b[a];return this.buffer=d};
E.prototype.d=function(b,a,c){var d=this.buffer,e=this.index,f=this.m,g=d[e],k;c&&1<a&&(b=8<a?(G[b&255]<<24|G[b>>>8&255]<<16|G[b>>>16&255]<<8|G[b>>>24&255])>>32-a:G[b]>>8-a);if(8>a+f)g=g<<a|b,f+=a;else for(k=0;k<a;++k)g=g<<1|b>>a-k-1&1,8===++f&&(f=0,d[e++]=G[g],g=0,e===d.length&&(d=this.f()));d[e]=g;this.buffer=d;this.m=f;this.index=e};E.prototype.finish=function(){var b=this.buffer,a=this.index,c;0<this.m&&(b[a]<<=8-this.m,b[a]=G[b[a]],a++);A?c=b.subarray(0,a):(b.length=a,c=b);return c};
var aa=new (A?Uint8Array:Array)(256),J;for(J=0;256>J;++J){for(var N=J,Q=N,ba=7,N=N>>>1;N;N>>>=1)Q<<=1,Q|=N&1,--ba;aa[J]=(Q<<ba&255)>>>0}var G=aa;function R(b,a,c){var d,e="number"===typeof a?a:a=0,f="number"===typeof c?c:b.length;d=-1;for(e=f&7;e--;++a)d=d>>>8^S[(d^b[a])&255];for(e=f>>3;e--;a+=8)d=d>>>8^S[(d^b[a])&255],d=d>>>8^S[(d^b[a+1])&255],d=d>>>8^S[(d^b[a+2])&255],d=d>>>8^S[(d^b[a+3])&255],d=d>>>8^S[(d^b[a+4])&255],d=d>>>8^S[(d^b[a+5])&255],d=d>>>8^S[(d^b[a+6])&255],d=d>>>8^S[(d^b[a+7])&255];return(d^4294967295)>>>0}
var ga=[0,1996959894,3993919788,2567524794,124634137,1886057615,3915621685,2657392035,249268274,2044508324,3772115230,2547177864,162941995,2125561021,3887607047,2428444049,498536548,1789927666,4089016648,2227061214,450548861,1843258603,4107580753,2211677639,325883990,1684777152,4251122042,2321926636,335633487,1661365465,4195302755,2366115317,997073096,1281953886,3579855332,2724688242,1006888145,1258607687,3524101629,2768942443,901097722,1119000684,3686517206,2898065728,853044451,1172266101,3705015759,
2882616665,651767980,1373503546,3369554304,3218104598,565507253,1454621731,3485111705,3099436303,671266974,1594198024,3322730930,2970347812,795835527,1483230225,3244367275,3060149565,1994146192,31158534,2563907772,4023717930,1907459465,112637215,2680153253,3904427059,2013776290,251722036,2517215374,3775830040,2137656763,141376813,2439277719,3865271297,1802195444,476864866,2238001368,4066508878,1812370925,453092731,2181625025,4111451223,1706088902,314042704,2344532202,4240017532,1658658271,366619977,
2362670323,4224994405,1303535960,984961486,2747007092,3569037538,1256170817,1037604311,2765210733,3554079995,1131014506,879679996,2909243462,3663771856,1141124467,855842277,2852801631,3708648649,1342533948,654459306,3188396048,3373015174,1466479909,544179635,3110523913,3462522015,1591671054,702138776,2966460450,3352799412,1504918807,783551873,3082640443,3233442989,3988292384,2596254646,62317068,1957810842,3939845945,2647816111,81470997,1943803523,3814918930,2489596804,225274430,2053790376,3826175755,
2466906013,167816743,2097651377,4027552580,2265490386,503444072,1762050814,4150417245,2154129355,426522225,1852507879,4275313526,2312317920,282753626,1742555852,4189708143,2394877945,397917763,1622183637,3604390888,2714866558,953729732,1340076626,3518719985,2797360999,1068828381,1219638859,3624741850,2936675148,906185462,1090812512,3747672003,2825379669,829329135,1181335161,3412177804,3160834842,628085408,1382605366,3423369109,3138078467,570562233,1426400815,3317316542,2998733608,733239954,1555261956,
3268935591,3050360625,752459403,1541320221,2607071920,3965973030,1969922972,40735498,2617837225,3943577151,1913087877,83908371,2512341634,3803740692,2075208622,213261112,2463272603,3855990285,2094854071,198958881,2262029012,4057260610,1759359992,534414190,2176718541,4139329115,1873836001,414664567,2282248934,4279200368,1711684554,285281116,2405801727,4167216745,1634467795,376229701,2685067896,3608007406,1308918612,956543938,2808555105,3495958263,1231636301,1047427035,2932959818,3654703836,1088359270,
936918E3,2847714899,3736837829,1202900863,817233897,3183342108,3401237130,1404277552,615818150,3134207493,3453421203,1423857449,601450431,3009837614,3294710456,1567103746,711928724,3020668471,3272380065,1510334235,755167117],S=A?new Uint32Array(ga):ga;function ha(){};function ia(b){this.buffer=new (A?Uint16Array:Array)(2*b);this.length=0}ia.prototype.getParent=function(b){return 2*((b-2)/4|0)};ia.prototype.push=function(b,a){var c,d,e=this.buffer,f;c=this.length;e[this.length++]=a;for(e[this.length++]=b;0<c;)if(d=this.getParent(c),e[c]>e[d])f=e[c],e[c]=e[d],e[d]=f,f=e[c+1],e[c+1]=e[d+1],e[d+1]=f,c=d;else break;return this.length};
ia.prototype.pop=function(){var b,a,c=this.buffer,d,e,f;a=c[0];b=c[1];this.length-=2;c[0]=c[this.length];c[1]=c[this.length+1];for(f=0;;){e=2*f+2;if(e>=this.length)break;e+2<this.length&&c[e+2]>c[e]&&(e+=2);if(c[e]>c[f])d=c[f],c[f]=c[e],c[e]=d,d=c[f+1],c[f+1]=c[e+1],c[e+1]=d;else break;f=e}return{index:b,value:a,length:this.length}};function ja(b){var a=b.length,c=0,d=Number.POSITIVE_INFINITY,e,f,g,k,h,l,s,p,m,n;for(p=0;p<a;++p)b[p]>c&&(c=b[p]),b[p]<d&&(d=b[p]);e=1<<c;f=new (A?Uint32Array:Array)(e);g=1;k=0;for(h=2;g<=c;){for(p=0;p<a;++p)if(b[p]===g){l=0;s=k;for(m=0;m<g;++m)l=l<<1|s&1,s>>=1;n=g<<16|p;for(m=l;m<e;m+=h)f[m]=n;++k}++g;k<<=1;h<<=1}return[f,c,d]};function ma(b,a){this.k=na;this.F=0;this.input=A&&b instanceof Array?new Uint8Array(b):b;this.b=0;a&&(a.lazy&&(this.F=a.lazy),"number"===typeof a.compressionType&&(this.k=a.compressionType),a.outputBuffer&&(this.a=A&&a.outputBuffer instanceof Array?new Uint8Array(a.outputBuffer):a.outputBuffer),"number"===typeof a.outputIndex&&(this.b=a.outputIndex));this.a||(this.a=new (A?Uint8Array:Array)(32768))}var na=2,oa={NONE:0,M:1,t:na,Y:3},pa=[],T;
for(T=0;288>T;T++)switch(v){case 143>=T:pa.push([T+48,8]);break;case 255>=T:pa.push([T-144+400,9]);break;case 279>=T:pa.push([T-256+0,7]);break;case 287>=T:pa.push([T-280+192,8]);break;default:q("invalid literal: "+T)}
ma.prototype.h=function(){var b,a,c,d,e=this.input;switch(this.k){case 0:c=0;for(d=e.length;c<d;){a=A?e.subarray(c,c+65535):e.slice(c,c+65535);c+=a.length;var f=a,g=c===d,k=t,h=t,l=t,s=t,p=t,m=this.a,n=this.b;if(A){for(m=new Uint8Array(this.a.buffer);m.length<=n+f.length+5;)m=new Uint8Array(m.length<<1);m.set(this.a)}k=g?1:0;m[n++]=k|0;h=f.length;l=~h+65536&65535;m[n++]=h&255;m[n++]=h>>>8&255;m[n++]=l&255;m[n++]=l>>>8&255;if(A)m.set(f,n),n+=f.length,m=m.subarray(0,n);else{s=0;for(p=f.length;s<p;++s)m[n++]=
f[s];m.length=n}this.b=n;this.a=m}break;case 1:var r=new E(A?new Uint8Array(this.a.buffer):this.a,this.b);r.d(1,1,v);r.d(1,2,v);var u=qa(this,e),x,O,y;x=0;for(O=u.length;x<O;x++)if(y=u[x],E.prototype.d.apply(r,pa[y]),256<y)r.d(u[++x],u[++x],v),r.d(u[++x],5),r.d(u[++x],u[++x],v);else if(256===y)break;this.a=r.finish();this.b=this.a.length;break;case na:var D=new E(A?new Uint8Array(this.a.buffer):this.a,this.b),Ea,P,U,V,W,qb=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15],ca,Fa,da,Ga,ka,sa=Array(19),
Ha,X,la,B,Ia;Ea=na;D.d(1,1,v);D.d(Ea,2,v);P=qa(this,e);ca=ra(this.V,15);Fa=ta(ca);da=ra(this.U,7);Ga=ta(da);for(U=286;257<U&&0===ca[U-1];U--);for(V=30;1<V&&0===da[V-1];V--);var Ja=U,Ka=V,I=new (A?Uint32Array:Array)(Ja+Ka),w,K,z,ea,H=new (A?Uint32Array:Array)(316),F,C,L=new (A?Uint8Array:Array)(19);for(w=K=0;w<Ja;w++)I[K++]=ca[w];for(w=0;w<Ka;w++)I[K++]=da[w];if(!A){w=0;for(ea=L.length;w<ea;++w)L[w]=0}w=F=0;for(ea=I.length;w<ea;w+=K){for(K=1;w+K<ea&&I[w+K]===I[w];++K);z=K;if(0===I[w])if(3>z)for(;0<
z--;)H[F++]=0,L[0]++;else for(;0<z;)C=138>z?z:138,C>z-3&&C<z&&(C=z-3),10>=C?(H[F++]=17,H[F++]=C-3,L[17]++):(H[F++]=18,H[F++]=C-11,L[18]++),z-=C;else if(H[F++]=I[w],L[I[w]]++,z--,3>z)for(;0<z--;)H[F++]=I[w],L[I[w]]++;else for(;0<z;)C=6>z?z:6,C>z-3&&C<z&&(C=z-3),H[F++]=16,H[F++]=C-3,L[16]++,z-=C}b=A?H.subarray(0,F):H.slice(0,F);ka=ra(L,7);for(B=0;19>B;B++)sa[B]=ka[qb[B]];for(W=19;4<W&&0===sa[W-1];W--);Ha=ta(ka);D.d(U-257,5,v);D.d(V-1,5,v);D.d(W-4,4,v);for(B=0;B<W;B++)D.d(sa[B],3,v);B=0;for(Ia=b.length;B<
Ia;B++)if(X=b[B],D.d(Ha[X],ka[X],v),16<=X){B++;switch(X){case 16:la=2;break;case 17:la=3;break;case 18:la=7;break;default:q("invalid code: "+X)}D.d(b[B],la,v)}var La=[Fa,ca],Ma=[Ga,da],M,Na,fa,va,Oa,Pa,Qa,Ra;Oa=La[0];Pa=La[1];Qa=Ma[0];Ra=Ma[1];M=0;for(Na=P.length;M<Na;++M)if(fa=P[M],D.d(Oa[fa],Pa[fa],v),256<fa)D.d(P[++M],P[++M],v),va=P[++M],D.d(Qa[va],Ra[va],v),D.d(P[++M],P[++M],v);else if(256===fa)break;this.a=D.finish();this.b=this.a.length;break;default:q("invalid compression type")}return this.a};
function ua(b,a){this.length=b;this.O=a}
var wa=function(){function b(a){switch(v){case 3===a:return[257,a-3,0];case 4===a:return[258,a-4,0];case 5===a:return[259,a-5,0];case 6===a:return[260,a-6,0];case 7===a:return[261,a-7,0];case 8===a:return[262,a-8,0];case 9===a:return[263,a-9,0];case 10===a:return[264,a-10,0];case 12>=a:return[265,a-11,1];case 14>=a:return[266,a-13,1];case 16>=a:return[267,a-15,1];case 18>=a:return[268,a-17,1];case 22>=a:return[269,a-19,2];case 26>=a:return[270,a-23,2];case 30>=a:return[271,a-27,2];case 34>=a:return[272,
a-31,2];case 42>=a:return[273,a-35,3];case 50>=a:return[274,a-43,3];case 58>=a:return[275,a-51,3];case 66>=a:return[276,a-59,3];case 82>=a:return[277,a-67,4];case 98>=a:return[278,a-83,4];case 114>=a:return[279,a-99,4];case 130>=a:return[280,a-115,4];case 162>=a:return[281,a-131,5];case 194>=a:return[282,a-163,5];case 226>=a:return[283,a-195,5];case 257>=a:return[284,a-227,5];case 258===a:return[285,a-258,0];default:q("invalid length: "+a)}}var a=[],c,d;for(c=3;258>=c;c++)d=b(c),a[c]=d[2]<<24|d[1]<<
16|d[0];return a}(),xa=A?new Uint32Array(wa):wa;
function qa(b,a){function c(a,c){var b=a.O,d=[],f=0,e;e=xa[a.length];d[f++]=e&65535;d[f++]=e>>16&255;d[f++]=e>>24;var g;switch(v){case 1===b:g=[0,b-1,0];break;case 2===b:g=[1,b-2,0];break;case 3===b:g=[2,b-3,0];break;case 4===b:g=[3,b-4,0];break;case 6>=b:g=[4,b-5,1];break;case 8>=b:g=[5,b-7,1];break;case 12>=b:g=[6,b-9,2];break;case 16>=b:g=[7,b-13,2];break;case 24>=b:g=[8,b-17,3];break;case 32>=b:g=[9,b-25,3];break;case 48>=b:g=[10,b-33,4];break;case 64>=b:g=[11,b-49,4];break;case 96>=b:g=[12,b-
65,5];break;case 128>=b:g=[13,b-97,5];break;case 192>=b:g=[14,b-129,6];break;case 256>=b:g=[15,b-193,6];break;case 384>=b:g=[16,b-257,7];break;case 512>=b:g=[17,b-385,7];break;case 768>=b:g=[18,b-513,8];break;case 1024>=b:g=[19,b-769,8];break;case 1536>=b:g=[20,b-1025,9];break;case 2048>=b:g=[21,b-1537,9];break;case 3072>=b:g=[22,b-2049,10];break;case 4096>=b:g=[23,b-3073,10];break;case 6144>=b:g=[24,b-4097,11];break;case 8192>=b:g=[25,b-6145,11];break;case 12288>=b:g=[26,b-8193,12];break;case 16384>=
b:g=[27,b-12289,12];break;case 24576>=b:g=[28,b-16385,13];break;case 32768>=b:g=[29,b-24577,13];break;default:q("invalid distance")}e=g;d[f++]=e[0];d[f++]=e[1];d[f++]=e[2];var h,k;h=0;for(k=d.length;h<k;++h)m[n++]=d[h];u[d[0]]++;x[d[3]]++;r=a.length+c-1;p=null}var d,e,f,g,k,h={},l,s,p,m=A?new Uint16Array(2*a.length):[],n=0,r=0,u=new (A?Uint32Array:Array)(286),x=new (A?Uint32Array:Array)(30),O=b.F,y;if(!A){for(f=0;285>=f;)u[f++]=0;for(f=0;29>=f;)x[f++]=0}u[256]=1;d=0;for(e=a.length;d<e;++d){f=k=0;
for(g=3;f<g&&d+f!==e;++f)k=k<<8|a[d+f];h[k]===t&&(h[k]=[]);l=h[k];if(!(0<r--)){for(;0<l.length&&32768<d-l[0];)l.shift();if(d+3>=e){p&&c(p,-1);f=0;for(g=e-d;f<g;++f)y=a[d+f],m[n++]=y,++u[y];break}0<l.length?(s=ya(a,d,l),p?p.length<s.length?(y=a[d-1],m[n++]=y,++u[y],c(s,0)):c(p,-1):s.length<O?p=s:c(s,0)):p?c(p,-1):(y=a[d],m[n++]=y,++u[y])}l.push(d)}m[n++]=256;u[256]++;b.V=u;b.U=x;return A?m.subarray(0,n):m}
function ya(b,a,c){var d,e,f=0,g,k,h,l,s=b.length;k=0;l=c.length;a:for(;k<l;k++){d=c[l-k-1];g=3;if(3<f){for(h=f;3<h;h--)if(b[d+h-1]!==b[a+h-1])continue a;g=f}for(;258>g&&a+g<s&&b[d+g]===b[a+g];)++g;g>f&&(e=d,f=g);if(258===g)break}return new ua(f,a-e)}
function ra(b,a){var c=b.length,d=new ia(572),e=new (A?Uint8Array:Array)(c),f,g,k,h,l;if(!A)for(h=0;h<c;h++)e[h]=0;for(h=0;h<c;++h)0<b[h]&&d.push(h,b[h]);f=Array(d.length/2);g=new (A?Uint32Array:Array)(d.length/2);if(1===f.length)return e[d.pop().index]=1,e;h=0;for(l=d.length/2;h<l;++h)f[h]=d.pop(),g[h]=f[h].value;k=za(g,g.length,a);h=0;for(l=f.length;h<l;++h)e[f[h].index]=k[h];return e}
function za(b,a,c){function d(b){var c=h[b][l[b]];c===a?(d(b+1),d(b+1)):--g[c];++l[b]}var e=new (A?Uint16Array:Array)(c),f=new (A?Uint8Array:Array)(c),g=new (A?Uint8Array:Array)(a),k=Array(c),h=Array(c),l=Array(c),s=(1<<c)-a,p=1<<c-1,m,n,r,u,x;e[c-1]=a;for(n=0;n<c;++n)s<p?f[n]=0:(f[n]=1,s-=p),s<<=1,e[c-2-n]=(e[c-1-n]/2|0)+a;e[0]=f[0];k[0]=Array(e[0]);h[0]=Array(e[0]);for(n=1;n<c;++n)e[n]>2*e[n-1]+f[n]&&(e[n]=2*e[n-1]+f[n]),k[n]=Array(e[n]),h[n]=Array(e[n]);for(m=0;m<a;++m)g[m]=c;for(r=0;r<e[c-1];++r)k[c-
1][r]=b[r],h[c-1][r]=r;for(m=0;m<c;++m)l[m]=0;1===f[c-1]&&(--g[0],++l[c-1]);for(n=c-2;0<=n;--n){u=m=0;x=l[n+1];for(r=0;r<e[n];r++)u=k[n+1][x]+k[n+1][x+1],u>b[m]?(k[n][r]=u,h[n][r]=a,x+=2):(k[n][r]=b[m],h[n][r]=m,++m);l[n]=0;1===f[n]&&d(n)}return g}
function ta(b){var a=new (A?Uint16Array:Array)(b.length),c=[],d=[],e=0,f,g,k,h;f=0;for(g=b.length;f<g;f++)c[b[f]]=(c[b[f]]|0)+1;f=1;for(g=16;f<=g;f++)d[f]=e,e+=c[f]|0,e<<=1;f=0;for(g=b.length;f<g;f++){e=d[b[f]];d[b[f]]+=1;k=a[f]=0;for(h=b[f];k<h;k++)a[f]=a[f]<<1|e&1,e>>>=1}return a};function Aa(b,a){this.input=b;this.b=this.c=0;this.g={};a&&(a.flags&&(this.g=a.flags),"string"===typeof a.filename&&(this.filename=a.filename),"string"===typeof a.comment&&(this.w=a.comment),a.deflateOptions&&(this.l=a.deflateOptions));this.l||(this.l={})}
Aa.prototype.h=function(){var b,a,c,d,e,f,g,k,h=new (A?Uint8Array:Array)(32768),l=0,s=this.input,p=this.c,m=this.filename,n=this.w;h[l++]=31;h[l++]=139;h[l++]=8;b=0;this.g.fname&&(b|=Ba);this.g.fcomment&&(b|=Ca);this.g.fhcrc&&(b|=Da);h[l++]=b;a=(Date.now?Date.now():+new Date)/1E3|0;h[l++]=a&255;h[l++]=a>>>8&255;h[l++]=a>>>16&255;h[l++]=a>>>24&255;h[l++]=0;h[l++]=Sa;if(this.g.fname!==t){g=0;for(k=m.length;g<k;++g)f=m.charCodeAt(g),255<f&&(h[l++]=f>>>8&255),h[l++]=f&255;h[l++]=0}if(this.g.comment){g=
0;for(k=n.length;g<k;++g)f=n.charCodeAt(g),255<f&&(h[l++]=f>>>8&255),h[l++]=f&255;h[l++]=0}this.g.fhcrc&&(c=R(h,0,l)&65535,h[l++]=c&255,h[l++]=c>>>8&255);this.l.outputBuffer=h;this.l.outputIndex=l;e=new ma(s,this.l);h=e.h();l=e.b;A&&(l+8>h.buffer.byteLength?(this.a=new Uint8Array(l+8),this.a.set(new Uint8Array(h.buffer)),h=this.a):h=new Uint8Array(h.buffer));d=R(s,t,t);h[l++]=d&255;h[l++]=d>>>8&255;h[l++]=d>>>16&255;h[l++]=d>>>24&255;k=s.length;h[l++]=k&255;h[l++]=k>>>8&255;h[l++]=k>>>16&255;h[l++]=
k>>>24&255;this.c=p;A&&l<h.length&&(this.a=h=h.subarray(0,l));return h};var Sa=255,Da=2,Ba=8,Ca=16;function Y(b,a){this.o=[];this.p=32768;this.e=this.j=this.c=this.s=0;this.input=A?new Uint8Array(b):b;this.u=!1;this.q=Ta;this.L=!1;if(a||!(a={}))a.index&&(this.c=a.index),a.bufferSize&&(this.p=a.bufferSize),a.bufferType&&(this.q=a.bufferType),a.resize&&(this.L=a.resize);switch(this.q){case Ua:this.b=32768;this.a=new (A?Uint8Array:Array)(32768+this.p+258);break;case Ta:this.b=0;this.a=new (A?Uint8Array:Array)(this.p);this.f=this.T;this.z=this.P;this.r=this.R;break;default:q(Error("invalid inflate mode"))}}
var Ua=0,Ta=1;
Y.prototype.i=function(){for(;!this.u;){var b=Z(this,3);b&1&&(this.u=v);b>>>=1;switch(b){case 0:var a=this.input,c=this.c,d=this.a,e=this.b,f=a.length,g=t,k=t,h=d.length,l=t;this.e=this.j=0;c+1>=f&&q(Error("invalid uncompressed block header: LEN"));g=a[c++]|a[c++]<<8;c+1>=f&&q(Error("invalid uncompressed block header: NLEN"));k=a[c++]|a[c++]<<8;g===~k&&q(Error("invalid uncompressed block header: length verify"));c+g>a.length&&q(Error("input buffer is broken"));switch(this.q){case Ua:for(;e+g>d.length;){l=
h-e;g-=l;if(A)d.set(a.subarray(c,c+l),e),e+=l,c+=l;else for(;l--;)d[e++]=a[c++];this.b=e;d=this.f();e=this.b}break;case Ta:for(;e+g>d.length;)d=this.f({B:2});break;default:q(Error("invalid inflate mode"))}if(A)d.set(a.subarray(c,c+g),e),e+=g,c+=g;else for(;g--;)d[e++]=a[c++];this.c=c;this.b=e;this.a=d;break;case 1:this.r(Va,Wa);break;case 2:Xa(this);break;default:q(Error("unknown BTYPE: "+b))}}return this.z()};
var Ya=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15],Za=A?new Uint16Array(Ya):Ya,$a=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258,258,258],ab=A?new Uint16Array($a):$a,bb=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0,0,0],cb=A?new Uint8Array(bb):bb,db=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577],eb=A?new Uint16Array(db):db,fb=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,
10,11,11,12,12,13,13],gb=A?new Uint8Array(fb):fb,hb=new (A?Uint8Array:Array)(288),$,ib;$=0;for(ib=hb.length;$<ib;++$)hb[$]=143>=$?8:255>=$?9:279>=$?7:8;var Va=ja(hb),jb=new (A?Uint8Array:Array)(30),kb,lb;kb=0;for(lb=jb.length;kb<lb;++kb)jb[kb]=5;var Wa=ja(jb);function Z(b,a){for(var c=b.j,d=b.e,e=b.input,f=b.c,g=e.length,k;d<a;)f>=g&&q(Error("input buffer is broken")),c|=e[f++]<<d,d+=8;k=c&(1<<a)-1;b.j=c>>>a;b.e=d-a;b.c=f;return k}
function mb(b,a){for(var c=b.j,d=b.e,e=b.input,f=b.c,g=e.length,k=a[0],h=a[1],l,s;d<h&&!(f>=g);)c|=e[f++]<<d,d+=8;l=k[c&(1<<h)-1];s=l>>>16;b.j=c>>s;b.e=d-s;b.c=f;return l&65535}
function Xa(b){function a(a,b,c){var d,e=this.I,f,g;for(g=0;g<a;)switch(d=mb(this,b),d){case 16:for(f=3+Z(this,2);f--;)c[g++]=e;break;case 17:for(f=3+Z(this,3);f--;)c[g++]=0;e=0;break;case 18:for(f=11+Z(this,7);f--;)c[g++]=0;e=0;break;default:e=c[g++]=d}this.I=e;return c}var c=Z(b,5)+257,d=Z(b,5)+1,e=Z(b,4)+4,f=new (A?Uint8Array:Array)(Za.length),g,k,h,l;for(l=0;l<e;++l)f[Za[l]]=Z(b,3);if(!A){l=e;for(e=f.length;l<e;++l)f[Za[l]]=0}g=ja(f);k=new (A?Uint8Array:Array)(c);h=new (A?Uint8Array:Array)(d);
b.I=0;b.r(ja(a.call(b,c,g,k)),ja(a.call(b,d,g,h)))}Y.prototype.r=function(b,a){var c=this.a,d=this.b;this.A=b;for(var e=c.length-258,f,g,k,h;256!==(f=mb(this,b));)if(256>f)d>=e&&(this.b=d,c=this.f(),d=this.b),c[d++]=f;else{g=f-257;h=ab[g];0<cb[g]&&(h+=Z(this,cb[g]));f=mb(this,a);k=eb[f];0<gb[f]&&(k+=Z(this,gb[f]));d>=e&&(this.b=d,c=this.f(),d=this.b);for(;h--;)c[d]=c[d++-k]}for(;8<=this.e;)this.e-=8,this.c--;this.b=d};
Y.prototype.R=function(b,a){var c=this.a,d=this.b;this.A=b;for(var e=c.length,f,g,k,h;256!==(f=mb(this,b));)if(256>f)d>=e&&(c=this.f(),e=c.length),c[d++]=f;else{g=f-257;h=ab[g];0<cb[g]&&(h+=Z(this,cb[g]));f=mb(this,a);k=eb[f];0<gb[f]&&(k+=Z(this,gb[f]));d+h>e&&(c=this.f(),e=c.length);for(;h--;)c[d]=c[d++-k]}for(;8<=this.e;)this.e-=8,this.c--;this.b=d};
Y.prototype.f=function(){var b=new (A?Uint8Array:Array)(this.b-32768),a=this.b-32768,c,d,e=this.a;if(A)b.set(e.subarray(32768,b.length));else{c=0;for(d=b.length;c<d;++c)b[c]=e[c+32768]}this.o.push(b);this.s+=b.length;if(A)e.set(e.subarray(a,a+32768));else for(c=0;32768>c;++c)e[c]=e[a+c];this.b=32768;return e};
Y.prototype.T=function(b){var a,c=this.input.length/this.c+1|0,d,e,f,g=this.input,k=this.a;b&&("number"===typeof b.B&&(c=b.B),"number"===typeof b.N&&(c+=b.N));2>c?(d=(g.length-this.c)/this.A[2],f=258*(d/2)|0,e=f<k.length?k.length+f:k.length<<1):e=k.length*c;A?(a=new Uint8Array(e),a.set(k)):a=k;return this.a=a};
Y.prototype.z=function(){var b=0,a=this.a,c=this.o,d,e=new (A?Uint8Array:Array)(this.s+(this.b-32768)),f,g,k,h;if(0===c.length)return A?this.a.subarray(32768,this.b):this.a.slice(32768,this.b);f=0;for(g=c.length;f<g;++f){d=c[f];k=0;for(h=d.length;k<h;++k)e[b++]=d[k]}f=32768;for(g=this.b;f<g;++f)e[b++]=a[f];this.o=[];return this.buffer=e};
Y.prototype.P=function(){var b,a=this.b;A?this.L?(b=new Uint8Array(a),b.set(this.a.subarray(0,a))):b=this.a.subarray(0,a):(this.a.length>a&&(this.a.length=a),b=this.a);return this.buffer=b};function nb(b){this.input=b;this.c=0;this.G=[];this.S=!1}
nb.prototype.i=function(){for(var b=this.input.length;this.c<b;){var a=new ha,c=t,d=t,e=t,f=t,g=t,k=t,h=t,l=t,s=t,p=this.input,m=this.c;a.C=p[m++];a.D=p[m++];(31!==a.C||139!==a.D)&&q(Error("invalid file signature:"+a.C+","+a.D));a.v=p[m++];switch(a.v){case 8:break;default:q(Error("unknown compression method: "+a.v))}a.n=p[m++];l=p[m++]|p[m++]<<8|p[m++]<<16|p[m++]<<24;a.aa=new Date(1E3*l);a.ca=p[m++];a.ba=p[m++];0<(a.n&4)&&(a.X=p[m++]|p[m++]<<8,m+=a.X);if(0<(a.n&Ba)){h=[];for(k=0;0<(g=p[m++]);)h[k++]=
String.fromCharCode(g);a.name=h.join("")}if(0<(a.n&Ca)){h=[];for(k=0;0<(g=p[m++]);)h[k++]=String.fromCharCode(g);a.w=h.join("")}0<(a.n&Da)&&(a.Q=R(p,0,m)&65535,a.Q!==(p[m++]|p[m++]<<8)&&q(Error("invalid header crc16")));c=p[p.length-4]|p[p.length-3]<<8|p[p.length-2]<<16|p[p.length-1]<<24;p.length-m-4-4<512*c&&(f=c);d=new Y(p,{index:m,bufferSize:f});a.data=e=d.i();m=d.c;a.Z=s=(p[m++]|p[m++]<<8|p[m++]<<16|p[m++]<<24)>>>0;R(e,t,t)!==s&&q(Error("invalid CRC-32 checksum: 0x"+R(e,t,t).toString(16)+" / 0x"+
s.toString(16)));a.$=c=(p[m++]|p[m++]<<8|p[m++]<<16|p[m++]<<24)>>>0;(e.length&4294967295)!==c&&q(Error("invalid input size: "+(e.length&4294967295)+" / "+c));this.G.push(a);this.c=m}this.S=v;var n=this.G,r,u,x=0,O=0,y;r=0;for(u=n.length;r<u;++r)O+=n[r].data.length;if(A){y=new Uint8Array(O);for(r=0;r<u;++r)y.set(n[r].data,x),x+=n[r].data.length}else{y=[];for(r=0;r<u;++r)y[r]=n[r].data;y=Array.prototype.concat.apply([],y)}return y};function ob(b){if("string"===typeof b){var a=b.split(""),c,d;c=0;for(d=a.length;c<d;c++)a[c]=(a[c].charCodeAt(0)&255)>>>0;b=a}for(var e=1,f=0,g=b.length,k,h=0;0<g;){k=1024<g?1024:g;g-=k;do e+=b[h++],f+=e;while(--k);e%=65521;f%=65521}return(f<<16|e)>>>0};function pb(b,a){var c,d;this.input=b;this.c=0;if(a||!(a={}))a.index&&(this.c=a.index),a.verify&&(this.W=a.verify);c=b[this.c++];d=b[this.c++];switch(c&15){case rb:this.method=rb;break;default:q(Error("unsupported compression method"))}0!==((c<<8)+d)%31&&q(Error("invalid fcheck flag:"+((c<<8)+d)%31));d&32&&q(Error("fdict flag is not supported"));this.K=new Y(b,{index:this.c,bufferSize:a.bufferSize,bufferType:a.bufferType,resize:a.resize})}
pb.prototype.i=function(){var b=this.input,a,c;a=this.K.i();this.c=this.K.c;this.W&&(c=(b[this.c++]<<24|b[this.c++]<<16|b[this.c++]<<8|b[this.c++])>>>0,c!==ob(a)&&q(Error("invalid adler-32 checksum")));return a};var rb=8;function sb(b,a){this.input=b;this.a=new (A?Uint8Array:Array)(32768);this.k=tb.t;var c={},d;if((a||!(a={}))&&"number"===typeof a.compressionType)this.k=a.compressionType;for(d in a)c[d]=a[d];c.outputBuffer=this.a;this.J=new ma(this.input,c)}var tb=oa;
sb.prototype.h=function(){var b,a,c,d,e,f,g,k=0;g=this.a;b=rb;switch(b){case rb:a=Math.LOG2E*Math.log(32768)-8;break;default:q(Error("invalid compression method"))}c=a<<4|b;g[k++]=c;switch(b){case rb:switch(this.k){case tb.NONE:e=0;break;case tb.M:e=1;break;case tb.t:e=2;break;default:q(Error("unsupported compression type"))}break;default:q(Error("invalid compression method"))}d=e<<6|0;g[k++]=d|31-(256*c+d)%31;f=ob(this.input);this.J.b=k;g=this.J.h();k=g.length;A&&(g=new Uint8Array(g.buffer),g.length<=
k+4&&(this.a=new Uint8Array(g.length+4),this.a.set(g),g=this.a),g=g.subarray(0,k+4));g[k++]=f>>24&255;g[k++]=f>>16&255;g[k++]=f>>8&255;g[k++]=f&255;return g};exports.deflate=ub;exports.deflateSync=vb;exports.inflate=wb;exports.inflateSync=xb;exports.gzip=yb;exports.gzipSync=zb;exports.gunzip=Ab;exports.gunzipSync=Bb;function ub(b,a,c){process.nextTick(function(){var d,e;try{e=vb(b,c)}catch(f){d=f}a(d,e)})}function vb(b,a){var c;c=(new sb(b)).h();a||(a={});return a.H?c:Cb(c)}function wb(b,a,c){process.nextTick(function(){var d,e;try{e=xb(b,c)}catch(f){d=f}a(d,e)})}
function xb(b,a){var c;b.subarray=b.slice;c=(new pb(b)).i();a||(a={});return a.noBuffer?c:Cb(c)}function yb(b,a,c){process.nextTick(function(){var d,e;try{e=zb(b,c)}catch(f){d=f}a(d,e)})}function zb(b,a){var c;b.subarray=b.slice;c=(new Aa(b)).h();a||(a={});return a.H?c:Cb(c)}function Ab(b,a,c){process.nextTick(function(){var d,e;try{e=Bb(b,c)}catch(f){d=f}a(d,e)})}function Bb(b,a){var c;b.subarray=b.slice;c=(new nb(b)).i();a||(a={});return a.H?c:Cb(c)}
function Cb(b){var a=new Buffer(b.length),c,d;c=0;for(d=b.length;c<d;++c)a[c]=b[c];return a};}).call(this); //@ sourceMappingURL=node-zlib.js.map

}).call(this,require('_process'),require("buffer").Buffer)
},{"_process":7,"buffer":3}],9:[function(require,module,exports){
module.exports = {
    /**
     * @property CSV
     * @type {Number}
     * @static
     * @final
     */
    CSV: 0,

    /**
     * @property CSV
     * @type {Number}
     * @static
     * @final
     */
    TILED_JSON: 1,

    /**
     * @property CSV
     * @type {Number}
     * @static
     * @final
     */
    TILED_XML: 2,

    /**
     * @property CSV
     * @type {Number}
     * @static
     * @final
     */
    NORTH: 0,

    /**
     * @property CSV
     * @type {Number}
     * @static
     * @final
     */
    EAST: 1,

    /**
     * @property CSV
     * @type {Number}
     * @static
     * @final
     */
    SOUTH: 2,

    /**
     * @property CSV
     * @type {Number}
     * @static
     * @final
     */
    WEST: 3
};

},{}],10:[function(require,module,exports){
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
        convertTiledmap: function (map, layer, addToWorld, optimize) {

            if (typeof addToWorld === 'undefined') { addToWorld = true; }
            if (typeof optimize === 'undefined') { optimize = true; }
            if (typeof layer === 'undefined') { layer = map.currentLayer; }

            layer = map.getTilelayer(layer);

            if (!layer) {
                return;
            }

            //  If the bodies array is already populated we need to nuke it
            this.clearTilemapLayerBodies(map, layer.index);

            var width = 0,
                sx = 0,
                sy = 0,
                tile, body, right;

            for (var y = 0, h = layer.size.y; y < h; y++)
            {
                width = 0;

                for (var x = 0, w = layer.size.x; x < w; x++)
                {
                    if (!layer.tiles[y]) {
                        continue;
                    }

                    tile = layer.tiles[y][x];

                    if (tile && tile.collides)
                    {
                        if (optimize)
                        {
                            right = map.getTileRight(layer.index, x, y);

                            if (width === 0)
                            {
                                sx = tile.x;
                                sy = tile.y;
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

                                layer.bodies.push(body);

                                width = 0;
                            }
                        }
                        else
                        {
                            body = this.createBody(tile.x, tile.y, 0, false);

                            body.clearShapes();
                            body.addRectangle(tile.width, tile.height, tile.width / 2, tile.height / 2, tile.rotation);

                            if (addToWorld)
                            {
                                this.addBody(body);
                            }

                            layer.bodies.push(body);
                        }
                    }
                }
            }

            return layer.bodies;

        },
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

                body.data.shapes[0].sensor = !!(object.properties && object.properties.sensor);

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
        convertTiledmap: function (map, layer, slopeMap) {

            layer = map.getTilelayer(layer);

            if (!layer) {
                return;
            }

            //  If the bodies array is already populated we need to nuke it
            this.clearTilemapLayerBodies(map, layer);

            for (var y = 0, h = layer.size.y; y < h; y++)
            {
                if (!layer.tiles[y]) {
                    continue;
                }

                for (var x = 0, w = layer.size.x; x < w; x++)
                {
                    var tile = layer.tiles[y][x],
                        index = (y * layer.size.x) + x;

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

                        layer.bodies.push(body);
                    }
                }
            }

            return layer.bodies;

        }
    }
};

function mapPointToArray(obj) {
    return [obj.x, obj.y];
}

},{}],11:[function(require,module,exports){
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

    for (var i = 0; i < this.objects.length; ++i) {
        utils.parseTiledProperties(this.objects[i].properties);
    }

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
 * @chainable
 * @param [physicsBodyType=Phaser.Physics.ARCADE] {number} The physics system to create stuff on.
 * @param [spawnCallback] {function} A function to call for each object spawned.
 * @return {Objectlayer} Returns itself.
 */
Objectlayer.prototype.spawn = function (physicsBodyType, spawnCallback) {
    // we go through these backwards so that things that are higher in the
    // list of object gets rendered on top.
    for(var i = this.objects.length - 1; i >= 0; --i) {
        var o = this.objects[i],
            props = o.properties,
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
            }
        }

        o.name = o.name || props.name || props.tileprops.name || '';
        o.type = o.type || props.type || props.tileprops.type || '';

        // a manually specified string texture
        if (typeof props.texture === 'string') {
            props.texture = PIXI.TextureCache[props.texture];
        }

        // when props.texture is empty it will just create an empty sprite.
        obj = this.game.add.sprite(o.x, o.y, props.texture, null, this.container);

        // setup the properties of the sprite
        obj.name = o.name;
        obj.rotation = o.rotation;
        obj.objectType = o.type;

        if (!obj.texture) {
            obj.width = o.width;
            obj.height = o.height;
        }

        obj.blendMode = (props.blendMode || this.properties.blendMode) ?
            PIXI.blendModes[(props.blendMode || this.properties.blendMode)] : PIXI.blendModes.NORMAL;

        // create physics if this body is physical.
        if (props.collides || props.tileprops.collides) {
            this.game.physics.enable(obj, physicsBodyType, props.debug || props.tileprops.debug);

            obj.body.setRectangle(obj.width, obj.height, obj.width / 2, -obj.height / 2, obj.rotation);

            obj.body[props.bodyType || props.tileprops.bodyType || 'static'] = true;

            if (props.sensor) {
                obj.body.data.shapes[0].sensor = true;
            }
        }

        var a = props.anchor || props.tileprops.anchor;
        obj.anchor.x = a ? a[0] : 0;
        obj.anchor.y = a ? a[1] : 1;

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

        if (props.animation && obj.animations) {
            obj.animations.copyFrameData(props.animation.data, 0);
            obj.animations.add('tile', null, props.animation.rate, true).play();
            // obj.animations.play(props.animation || props.tileprops.animation);
        }

        if (typeof o.rotation === 'number') {
            obj.rotation = o.rotation;
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

    // destroy bodies
    for (var i = 0; i < this.bodies.length; ++i) {
        this.bodies[i].destroy();
    }

    this.bodies = null;

    this.map = null;
    this.properties = null;
    this.objects = null;
};

},{"../utils":17}],12:[function(require,module,exports){
/**
 * Base Tile implementation, a tile is a single tile in a tilemap layer
 *
 * @class Tile
 * @extends Phaser.Sprite
 * @constructor
 */
function Tile(game, x, y, tileId, tileset, layer) {
    Phaser.Sprite.call(this,
        game,
        (x * tileset.tileWidth) + tileset.tileoffset.x,
        (y * tileset.tileHeight) + tileset.tileoffset.y,
        tileset.getTileTexture(tileId)
    );

    this.type = Phaser.TILESPRITE;

    /**
    * @property {object} layer - The layer in the Tilemap data that this tile belongs to.
    */
    this.layer = layer;

    /**
    * @property {object} tileset - The tileset that this tile's texture is from.
    */
    this.tileset = tileset;

    /**
    * @property {Phaser.Point} tilePosition - The position of the tile in 'tile coords'
    */
    this.tilePosition = new Phaser.Point(x, y);

    /**
    * @property {number} centerX - The center of the tile.
    */
    this.centerX = Math.abs(tileset.tileWidth / 2);

    /**
    * @property {number} centerY - The height of the tile in pixels.
    */
    this.centerY = Math.abs(tileset.tileHeight / 2);

    /**
    * @property {object} properties - Tile specific properties.
    */
    this.properties = tileset.getTileProperties(tileId);

    /**
    * @property {boolean} scanned - Has this tile been walked / turned into a poly?
    */
    this.scanned = false;

    /**
    * @property {boolean} faceTop - Is the top of this tile an interesting edge?
    */
    this.faceTop = false;

    /**
    * @property {boolean} faceBottom - Is the bottom of this tile an interesting edge?
    */
    this.faceBottom = false;

    /**
    * @property {boolean} faceLeft - Is the left of this tile an interesting edge?
    */
    this.faceLeft = false;

    /**
    * @property {boolean} faceRight - Is the right of this tile an interesting edge?
    */
    this.faceRight = false;

    /**
    * @property {boolean} collideLeft - Indicating collide with any object on the left.
    * @default
    */
    this.collideLeft = this.properties.collideLeft !== undefined ?
        this.properties.collideLeft : (this.properties.collides || false);

    /**
    * @property {boolean} collideRight - Indicating collide with any object on the right.
    * @default
    */
    this.collideRight = this.properties.collideRight !== undefined ?
        this.properties.collideRight : (this.properties.collides || false);

    /**
    * @property {boolean} collideUp - Indicating collide with any object on the top.
    * @default
    */
    this.collideUp = this.properties.collideUp !== undefined ?
        this.properties.collideUp : (this.properties.collides || false);

    /**
    * @property {boolean} collideDown - Indicating collide with any object on the bottom.
    * @default
    */
    this.collideDown = this.properties.collideDown !== undefined ?
        this.properties.collideDown : (this.properties.collides || false);

    /**
    * @property {function} collisionCallback - Tile collision callback.
    * @default
    */
    this.collisionCallback = null;

    /**
    * @property {object} collisionCallbackContext - The context in which the collision callback will be called.
    * @default
    */
    this.collisionCallbackContext = this;

    // load animation data
    var animData = tileset.getTileAnimations(tileId);
    if (animData) {
        this.animations.copyFrameData(animData.data, 0);
        this.animations.add('tile', null, animData.rate, true).play();
    }

    // set the blend mode
    this.blendMode = (this.properties.blendMode || layer.properties.blendMode) ?
        Phaser.blendModes[(this.properties.blendMode || layer.properties.blendMode)] : Phaser.blendModes.NORMAL;

    // setup the flipped states
    if (this.properties.flippedX) {
        this.scale.x = -1;
        this.position.x += tileset.tileWidth;
    }

    if (this.properties.flippedY) {
        this.scale.y = -1;
        this.position.y += tileset.tileHeight;
    }

    // from Tiled Editor:
    // https://github.com/bjorn/tiled/blob/b059a13b2864ea029fb741a90780d31cf5b67043/src/libtiled/maprenderer.cpp#L135-L145
    if (this.properties.flippedAD) {
        this.rotation = this.game.math.degToRad(90);
        this.scale.x *= -1;

        var sx = this.scale.x;
        this.scale.x = this.scale.y;
        this.scale.y = sx;

        var halfDiff = Math.abs(this.height / 2) - Math.abs(this.width / 2);
        this.position.y += halfDiff;
        this.position.x += halfDiff;
    }
}

Tile.prototype = Object.create(Phaser.Sprite.prototype);
Tile.prototype.constructor = Tile;

module.exports = Tile;

/**
* Check if the given x and y world coordinates are within this Tile.
*
* @method Phaser.Tile#containsPoint
* @param {number} x - The x coordinate to test.
* @param {number} y - The y coordinate to test.
* @return {boolean} True if the coordinates are within this Tile, otherwise false.
*/
Tile.prototype.containsPoint = function (x, y) {

    return !(x < this.worldX || y < this.worldY || x > this.right || y > this.bottom);

};

/**
* Check for intersection with this tile.
*
* @method Phaser.Tile#intersects
* @param {number} x - The x axis in pixels.
* @param {number} y - The y axis in pixels.
* @param {number} right - The right point.
* @param {number} bottom - The bottom point.
* @return {boolean} True if the coordinates are within this Tile, otherwise false.
*/
Tile.prototype.intersects = function (x, y, right, bottom) {

    if (right <= this.worldX)
    {
        return false;
    }

    if (bottom <= this.worldY)
    {
        return false;
    }

    if (x >= this.worldX + this.width)
    {
        return false;
    }

    if (y >= this.worldY + this.height)
    {
        return false;
    }

    return true;

};

/**
* Set a callback to be called when this tile is hit by an object.
* The callback must true true for collision processing to take place.
*
* @method Phaser.Tile#setCollisionCallback
* @param {function} callback - Callback function.
* @param {object} context - Callback will be called within this context.
*/
Tile.prototype.setCollisionCallback = function (callback, context) {

    this.collisionCallback = callback;
    this.collisionCallbackContext = context;

};

/**
* Clean up memory.
*
* @method Phaser.Tile#destroy
*/
Tile.prototype.destroy = function () {
    Phaser.Sprite.prototype.destroy.apply(this, arguments);

    this.layer = null;
    this.tileset = null;
    this.tilePosition = null;

    this.properties = null;

    this.collisionCallback = null;

    this.collisionCallbackContext = null;
};

/**
* Sets the collision flags for each side of this tile and updates the interesting faces list.
*
* @method Phaser.Tile#setCollision
* @param {boolean} left - Indicating collide with any object on the left.
* @param {boolean} right - Indicating collide with any object on the right.
* @param {boolean} up - Indicating collide with any object on the top.
* @param {boolean} down - Indicating collide with any object on the bottom.
*/
Tile.prototype.setCollision = function (left, right, up, down) {

    this.collideLeft = left;
    this.collideRight = right;
    this.collideUp = up;
    this.collideDown = down;

    this.faceLeft = left;
    this.faceRight = right;
    this.faceTop = up;
    this.faceBottom = down;

};

/**
* Reset collision status flags.
*
* @method Phaser.Tile#resetCollision
*/
Tile.prototype.resetCollision = function () {

    this.collideLeft = false;
    this.collideRight = false;
    this.collideUp = false;
    this.collideDown = false;

    this.faceLeft = false;
    this.faceRight = false;
    this.faceTop = false;
    this.faceBottom = false;

};

/**
* Is this tile interesting?
*
* @method Phaser.Tile#isInteresting
* @param {boolean} collides - If true will check any collides value.
* @param {boolean} faces - If true will check any face value.
* @return {boolean} True if the Tile is interesting, otherwise false.
*/
Tile.prototype.isInteresting = function (collides, faces) {

    if (collides && faces)
    {
        //  Does this tile have any collide flags OR interesting face?
        return (this.collideLeft || this.collideRight || this.collideUp || this.collideDown ||
            this.faceTop || this.faceBottom || this.faceLeft || this.faceRight || this.collisionCallback);
    }
    else if (collides)
    {
        //  Does this tile collide?
        return (this.collideLeft || this.collideRight || this.collideUp || this.collideDown);
    }
    else if (faces)
    {
        //  Does this tile have an interesting face?
        return (this.faceTop || this.faceBottom || this.faceLeft || this.faceRight);
    }

    return false;

};

/**
* Copies the tile data and properties from the given tile to this tile.
*
* @method Phaser.Tile#copy
* @param {Phaser.Tile} tile - The tile to copy from.
*/
Tile.prototype.copy = function (tile) {

    this.index = tile.index;
    this.alpha = tile.alpha;
    this.properties = tile.properties;

    this.collideUp = tile.collideUp;
    this.collideDown = tile.collideDown;
    this.collideLeft = tile.collideLeft;
    this.collideRight = tile.collideRight;

    this.collisionCallback = tile.collisionCallback;
    this.collisionCallbackContext = tile.collisionCallbackContext;

};

Object.defineProperty(Tile.prototype, 'worldX', {
    get: function () {
        return this.position.x;
    },
    set: function (val) {
        this.position.x = val;
    }
});

Object.defineProperty(Tile.prototype, 'worldY', {
    get: function () {
        return this.position.y;
    },
    set: function (val) {
        this.position.y = val;
    }
});

/**
* @name Phaser.Tile#collides
* @property {boolean} collides - True if this tile can collide on any of its faces.
* @readonly
*/
Object.defineProperty(Tile.prototype, 'collides', {

    get: function () {
        return (this.collideLeft || this.collideRight || this.collideUp || this.collideDown);
    }

});

/**
* @name Phaser.Tile#canCollide
* @property {boolean} canCollide - True if this tile can collide on any of its faces or has a collision callback set.
* @readonly
*/
Object.defineProperty(Tile.prototype, 'canCollide', {

    get: function () {
        return (this.collideLeft || this.collideRight || this.collideUp || this.collideDown || this.collisionCallback);
    }

});

/**
* @name Phaser.Tile#left
* @property {number} left - The x value in pixels.
* @readonly
*/
Object.defineProperty(Tile.prototype, 'left', {

    get: function () {
        return this.worldX;
    }

});

/**
* @name Phaser.Tile#right
* @property {number} right - The sum of the x and width properties.
* @readonly
*/
Object.defineProperty(Tile.prototype, 'right', {

    get: function () {
        return this.worldX + this.width;
    }

});

/**
* @name Phaser.Tile#top
* @property {number} top - The y value.
* @readonly
*/
Object.defineProperty(Tile.prototype, 'top', {

    get: function () {
        return this.worldY;
    }

});

/**
* @name Phaser.Tile#bottom
* @property {number} bottom - The sum of the y and height properties.
* @readonly
*/
Object.defineProperty(Tile.prototype, 'bottom', {

    get: function () {
        return this.worldY + this.height;
    }

});

},{}],13:[function(require,module,exports){
var Tile = require('./Tile'),
    utils = require('../utils');

/**
 * The Tilelayer is the visual tiled layer that actually displays on the screen
 *
 * This class will be created by the Tilemap.
 *
 * @class Tilelayer
 * @extends Group
 * @constructor
 * @param game {Phaser.Game} The game instance this belongs to
 * @param map {Tilemap} The tilemap instance that this belongs to
 * @param index {Number} The index of the layer in the tilemap
 * @param width {Number} The width of the renderable area of the layer
 * @param height {Number} The height of the renderable area of the layer
 */
//
// TODO: Add chunk prerendering?
//
// for discussions about this implementation:
//   see: https://github.com/GoodBoyDigital/pixi.js/issues/48
//   and: https://github.com/photonstorm/phaser/issues/1145
function Tilelayer(game, map, layer, index) {
    Phaser.Group.call(this, game, map);

    this.index = index;

    // Non-Tiled related properties

    /**
     * The map instance this tilelayer belongs to
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
    * An object that is fixed to the camera ignores the position of any ancestors in the display list
    * and uses its x/y coordinates as offsets from the top left of the camera.
    *
    * @property {boolean} fixedToCamera - Fixes this object to the Camera.
    * @default
    */
    this.fixedToCamera = false;

    /**
    * @property {Phaser.Point} cameraOffset - If this object is fixed to the camera then use this Point
    * to specify how far away from the Camera x/y it's rendered.
    */
    this.cameraOffset = new Phaser.Point(0, 0);

    /**
     * All the tiles this layer has
     *
     * @property tiles
     * @type Object
     */
    this.tiles = {};

    /**
     * The scroll speed of the layer relative to the camera
     * (e.g. a scrollFactor of 0.5 scrolls half as quickly as the
     * 'normal' layers do)
     *
     * @property scroll
     * @type Phaser.Point
     * @default new Phaser.Point(1, 1)
     */
    // TODO: This doesn't actually work yet!
    this.scrollFactor = new Phaser.Point(1, 1);

    // Tiled related properties

    /**
     * The name of the layer
     *
     * @property name
     * @type String
     * @default ''
     */
    this.name = layer.name || '';

    /**
     * The size of the layer
     *
     * @property size
     * @type Phaser.Point
     * @default new Phaser.Point(1, 1)
     */
    this.size = new Phaser.Point(layer.width || 0, layer.height || 0);

    /**
     * The tile IDs of the tilemap
     *
     * @property tileIds
     * @type Uint32Array|Array
     */
    this.tileIds = Phaser.devicetypedArray ? new Uint32Array(layer.data) : layer.data;

    /**
     * The user-defined properties of this group. Usually defined in the TiledEditor
     *
     * @property properties
     * @type Object
     */
    this.properties = utils.parseTiledProperties(layer.properties);

    /**
     * The Tiled type of tile layer, should always be 'tilelayer'
     *
     * @property layerType
     * @type String
     * @default 'tilelayer'
     * @readOnly
     */
    this.layerType = layer.type || 'tilelayer';

    /**
    * @property {number} rayStepRate - When ray-casting against tiles this is the number of steps it will jump.
    * For larger tile sizes you can increase this to improve performance.
    * @default
    */
    this.rayStepRate = 4;

    // translate some tiled properties to our inherited properties
    this.x = layer.x || 0;
    this.y = layer.y || 0;
    this.alpha = layer.opacity !== undefined ? layer.opacity : 1;
    this.visible = layer.visible !== undefined ? layer.visible : true;

    // physics bodies in this layer
    this.bodies = [];

    // some private trackers
    this._buffered = { left: false, right: false, top: false, bottom: false };
    this._scroll = new Phaser.Point(); // the current scroll position
    this._scrollDelta = new Phaser.Point(); // the current delta of scroll since the last sprite move
    this._renderArea = new Phaser.Rectangle(); // the area to render in tiles

    /**
    * @property {object} _mc - Local map data and calculation cache.
    * @private
    */
    this._mc = {
        cw: map.tileWidth,
        ch: map.tileHeight,
        tx: 0,
        ty: 0,
        tw: 0,
        th: 0
    };

    // should we clear and rerender all the tiles
    this.dirty = true;

    // if batch is true, store children in a spritebatch
    if (this.properties.batch) {
        this.container = this.addChild(new Phaser.SpriteBatch(game));
    } else {
        this.container = this;
    }

    for (var i = 0; i < this.tileIds.length; ++i) {
        var x = i % this.size.x,
            y = (i - x) / this.size.x,
            tileId = this.tileIds[i],
            set = this.map.getTileset(tileId);

        // if no tileset, return
        if (!set) {
            continue;
        }

        if (!this.tiles[y]) {
            this.tiles[y] = {};
        }

        this.tiles[y][x] = new Tile(this.game, x, y, tileId, set, this);
    }
}

Tilelayer.prototype = Object.create(Phaser.Group.prototype);
Tilelayer.prototype.constructor = Tilelayer;

module.exports = Tilelayer;

Tilelayer.prototype.setupRenderArea = function () {
    // calculate the X/Y start of the render area as the tile location of the top-left of the camera view.
    this._renderArea.x = this.game.math.clampBottom(this.game.math.floor(this._scroll.x / this.map.scaledTileWidth), 0);
    this._renderArea.y = this.game.math.clampBottom(this.game.math.floor(this._scroll.y / this.map.scaledTileHeight), 0);

    // the width of the render area is the camera view width in tiles
    this._renderArea.width = this.game.math.ceil(this.game.camera.view.width / this.map.scaledTileWidth);

    // ensure we don't go outside the map width
    this._renderArea.width = (this._renderArea.x + this._renderArea.width > this.map.size.x) ?
        (this.map.size.x - this._renderArea.x) : this._renderArea.width;

    // the height of the render area is the camera view height in tiles
    this._renderArea.height = this.game.math.ceil(this.game.camera.view.height / this.map.scaledTileHeight);

    // ensure we don't go outside the map height
    this._renderArea.height = (this._renderArea.y + this._renderArea.height > this.map.size.y) ?
        (this.map.size.y - this._renderArea.y) : this._renderArea.height;
};

/**
 * Sets the world size to match the size of this layer.
 *
 * @method resizeWorld
 */
Tilelayer.prototype.resizeWorld = function () {
    this.game.world.setBounds(0, 0, this.widthInPixels, this.heightInPixels);
};

/**
 * Automatically called by Tilemap.postUpdate. Handles scrolling the layer and updating the scale
 *
 * @method postUpdate
 */
Tilelayer.prototype.postUpdate = function () {
    Phaser.Group.prototype.postUpdate.call(this);

    if (this.fixedToCamera) {
        this.position.x = (this.game.camera.view.x + this.cameraOffset.x) / this.game.camera.scale.x;
        this.position.y = (this.game.camera.view.y + this.cameraOffset.y) / this.game.camera.scale.y;
    }

    // TODO: this seems to not work properly when scale changes on the fly. Look into that...
    if (this.dirty || this.map.dirty) {
        // no longer dirty
        this.dirty = false;

        // setup the render area, and scaled tilesize
        this.setupRenderArea();

        // resize the world to the new size
        // TODO: Seems dangerous to do this here, may break if user wants to manually set bounds
        // and this reset it each time scale changes.
        this.resizeWorld();

        // render the tiles on the screen
        this.setupTiles();

        return this;
    }

    this.scrollX = this.game.camera.x;
    this.scrollY = this.game.camera.y;

    this.updatePan();
};

/**
 * Clears the current tiles and sets up the render area
 *
 * @method setupTiles
 * @private
 */
Tilelayer.prototype.setupTiles = function () {
    // clear all the tiles
    this.clearTiles();

    // setup a tile for each location in the renderArea
    for (var x = this._renderArea.x; x < this._renderArea.right; ++x) {
        for (var y = this._renderArea.y; y < this._renderArea.bottom; ++y) {
            this.moveTileSprite(-1, -1, x, y);
        }
    }

    // reset buffered status
    this._buffered.left = this._buffered.right = this._buffered.top = this._buffered.bottom = false;

    // reset scroll delta
    this._scrollDelta.x = this._scroll.x % this.map.scaledTileWidth;
    this._scrollDelta.y = this._scroll.y % this.map.scaledTileHeight;
};

/**
 * Clears all the tiles currently used to render the layer
 *
 * @method clearTiles
 * @return {Tilelayer} Returns itself.
 * @chainable
 */
Tilelayer.prototype.clearTiles = function () {
    for (var c = this.container.children.length - 1; c > -1; --c) {
        if (this.container.children[c].type === Phaser.TILESPRITE) {
            this.clearTile(this.container.children[c]);
        }
    }

    return this;
};

Tilelayer.prototype.clearTile = function (tile) {
    if (!tile || tile.parent !== this.container) {
        return;
    }

    this.container.removeChild(tile);
};

/**
 * Moves a tile sprite from one position to another, and creates a new tile
 * if the old position didn't have a sprite
 *
 * @method moveTileSprite
 * @param fromTileX {Number} The x coord of the tile in units of tiles (not pixels) to move from
 * @param fromTileY {Number} The y coord of the tile in units of tiles (not pixels) to move from
 * @param toTileX {Number} The x coord of the tile in units of tiles (not pixels) to move to
 * @param toTileY {Number} The y coord of the tile in units of tiles (not pixels) to move to
 * @return {Tile} The sprite to display
 */
Tilelayer.prototype.moveTileSprite = function (fromTileX, fromTileY, toTileX, toTileY) {
    // remove the old tile that is no longer needed to be shown
    this.clearTile(this.tiles[fromTileY] && this.tiles[fromTileY][fromTileX]);

    // add the tile we need to show
    if (this.tiles[toTileY] && this.tiles[toTileY][toTileX]) {
        this.container.addChild(this.tiles[toTileY][toTileX]);
    }
};

/**
 * Pans the layer around, rendering stuff if necessary
 *
 * @method updatePan
 * @return {Tilelayer} Returns itself.
 * @chainable
 */
Tilelayer.prototype.updatePan = function () {
    // First, check if we need to build a buffer around the viewport
    // usually this happens on the first pan after a full render
    // caused by a viewport resize. We do this buffering here instead
    // of in the initial render because in the initial render, the buffer
    // may try to go negative which has no tiles. Plus doing it here
    // reduces the number of tiles that need to be created initially.

    // moving world right, so left will be exposed
    if (this._scrollDelta.x > 0 && !this._buffered.left) {
        this._buffered.left = true;
        this._renderLeft(true);
    }
    // moving world left, so right will be exposed
    else if (this._scrollDelta.x < 0 && !this._buffered.right) {
        this._buffered.right = true;
        this._renderRight(true);
    }

    // moving world down, so top will be exposed
    if (this._scrollDelta.y > 0 && !this._buffered.top) {
        this._buffered.top = true;
        this._renderUp(true);
    }
    // moving world up, so bottom will be exposed
    else if (this._scrollDelta.y < 0 && !this._buffered.bottom) {
        this._buffered.bottom = true;
        this._renderDown(true);
    }

    // Here is where the actual panning gets done, we check if the pan
    // delta is greater than a scaled tile and if so pan that direction.
    // The reason we do it in a while loop is because the delta can be
    // large than 1 scaled tile and may require multiple render pans
    // (this can happen if you can .pan(x, y) with large values)

    // moved position right, so render left
    while (this._scrollDelta.x >= this.map.scaledTileWidth) {
        this._renderLeft();
        this._scrollDelta.x -= this.map.scaledTileWidth;
    }

    // moved position left, so render right
    while (this._scrollDelta.x <= -this.map.scaledTileWidth) {
        this._renderRight();
        this._scrollDelta.x += this.map.scaledTileWidth;
    }

    // moved position down, so render up
    while (this._scrollDelta.y >= this.map.scaledTileHeight) {
        this._renderUp();
        this._scrollDelta.y -= this.map.scaledTileHeight;
    }

    // moved position up, so render down
    while (this._scrollDelta.y <= -this.map.scaledTileHeight) {
        this._renderDown();
        this._scrollDelta.y += this.map.scaledTileHeight;
    }
};

/**
* Gets all tiles that intersect with the given line.
*
* @method Phaser.TilemapLayer#getRayCastTiles
* @memberof Phaser.TilemapLayer
* @param {Phaser.Line} line - The line used to determine which tiles to return.
* @param {number} [stepRate] - How many steps through the ray will we check? If undefined or
*       null it uses TilemapLayer.rayStepRate.
* @param {boolean} [collides=false] - If true only return tiles that collide on one or more faces.
* @param {boolean} [interestingFace=false] - If true only return tiles that have interesting faces.
* @return {array<Phaser.Tile>} An array of Phaser.Tiles.
*/
Tilelayer.prototype.getRayCastTiles = function (line, stepRate, collides, interestingFace) {

    if (typeof stepRate === 'undefined' || stepRate === null) { stepRate = this.rayStepRate; }
    if (typeof collides === 'undefined') { collides = false; }
    if (typeof interestingFace === 'undefined') { interestingFace = false; }

    //  First get all tiles that touch the bounds of the line
    var tiles = this.getTiles(line.x, line.y, line.width, line.height, collides, interestingFace);

    if (tiles.length === 0)
    {
        return tiles;
    }

    //  Now we only want the tiles that intersect with the points on this line
    var coords = line.coordinatesOnLine(stepRate);
    var total = coords.length;
    var results = [];

    for (var i = 0; i < tiles.length; i++)
    {
        for (var t = 0; t < total; t++)
        {
            if (tiles[i].containsPoint(coords[t][0], coords[t][1]))
            {
                results.push(tiles[i]);
                break;
            }
        }
    }

    return results;

};

/**
* Get all tiles that exist within the given area, defined by the top-left corner, width and height.
* Values given are in pixels, not tiles.
* @method Phaser.TilemapLayer#getTiles
* @memberof Phaser.TilemapLayer
* @param {number} x - X position of the top left corner.
* @param {number} y - Y position of the top left corner.
* @param {number} width - Width of the area to get.
* @param {number} height - Height of the area to get.
* @param {boolean} [collides=false] - If true only return tiles that collide on one or more faces.
* @param {boolean} [interestingFace=false] - If true only return tiles that have interesting faces.
* @return {array<Phaser.Tile>} An array of Phaser.Tiles.
*/
Tilelayer.prototype.getTiles = function (x, y, width, height, collides, interestingFace) {

    //  Should we only get tiles that have at least one of their collision flags set?
    // (true = yes, false = no just get them all)
    if (typeof collides === 'undefined') { collides = false; }
    if (typeof interestingFace === 'undefined') { interestingFace = false; }

    // adjust the x,y coordinates for scrollFactor
    // x = this._fixX(x);
    // y = this._fixY(y);

    if (width > this.widthInPixels)
    {
        width = this.widthInPixels;
    }

    if (height > this.heightInPixels)
    {
        height = this.heightInPixels;
    }

    //  Convert the pixel values into tile coordinates
    this._mc.tx = this.game.math.snapToFloor(x, this._mc.cw) / this._mc.cw;
    this._mc.ty = this.game.math.snapToFloor(y, this._mc.ch) / this._mc.ch;
    this._mc.tw = (this.game.math.snapToCeil(width, this._mc.cw) + this._mc.cw) / this._mc.cw;
    this._mc.th = (this.game.math.snapToCeil(height, this._mc.ch) + this._mc.ch) / this._mc.ch;

    //  This should apply the layer x/y here
    var results = [],
        tile = null;

    for (var wy = this._mc.ty; wy < this._mc.ty + this._mc.th; wy++)
    {
        for (var wx = this._mc.tx; wx < this._mc.tx + this._mc.tw; wx++)
        {
            tile = this.getTile(wx, wy);
            if (tile)
            {
                if ((!collides && !interestingFace) || tile.isInteresting(collides, interestingFace))
                {
                    results.push(tile);
                }
            }
        }
    }

    return results;

};

Tilelayer.prototype.getTile = function (x, y) {
    return this.tiles[y] && this.tiles[y][x];
};

/**
 * Renders tiles to the left, pulling from the far right
 *
 * @method _renderLeft
 * @param [forceNew=false] {Boolean} If set to true, new tiles are created instead of trying to recycle
 * @private
 */
Tilelayer.prototype._renderLeft = function (forceNew) {
    this._renderArea.x--;

    //move all the far right tiles to the left side
    for (var i = 0; i < this._renderArea.height; ++i) {
        this.moveTileSprite(
            forceNew ? -1 : this._renderArea.right,
            forceNew ? -1 : this._renderArea.top + i,
            this._renderArea.left,
            this._renderArea.top + i
        );
    }

    if (forceNew) {
        this._renderArea.width++;
    }
};

/**
 * Renders tiles to the right, pulling from the far left
 *
 * @method _renderRight
 * @param [forceNew=false] {Boolean} If set to true, new tiles are created instead of trying to recycle
 * @private
 */
Tilelayer.prototype._renderRight = function (forceNew) {
    //move all the far left tiles to the right side
    for (var i = 0; i < this._renderArea.height; ++i) {
        this.moveTileSprite(
            forceNew ? -1 : this._renderArea.left,
            forceNew ? -1 : this._renderArea.top + i,
            this._renderArea.right,
            this._renderArea.top + i
        );
    }

    if (!forceNew) {
        this._renderArea.x++;
    }

    if (forceNew) {
        this._renderArea.width++;
    }
};

/**
 * Renders tiles to the top, pulling from the far bottom
 *
 * @method _renderUp
 * @param [forceNew=false] {Boolean} If set to true, new tiles are created instead of trying to recycle
 * @private
 */
Tilelayer.prototype._renderUp = function (forceNew) {
    this._renderArea.y--;

    //move all the far bottom tiles to the top side
    for (var i = 0; i < this._renderArea.width; ++i) {
        this.moveTileSprite(
            forceNew ? -1 : this._renderArea.left + i,
            forceNew ? -1 : this._renderArea.bottom,
            this._renderArea.left + i,
            this._renderArea.top
        );
    }

    if (forceNew) {
        this._renderArea.height++;
    }
};

/**
 * Renders tiles to the bottom, pulling from the far top
 *
 * @method _renderDown
 * @param [forceNew=false] {Boolean} If set to true, new tiles are created instead of trying to recycle
 * @private
 */
Tilelayer.prototype._renderDown = function (forceNew) {
    //move all the far top tiles to the bottom side
    for (var i = 0; i < this._renderArea.width; ++i) {
        this.moveTileSprite(
            forceNew ? -1 : this._renderArea.left + i,
            forceNew ? -1 : this._renderArea.top,
            this._renderArea.left + i,
            this._renderArea.bottom
        );
    }

    if (!forceNew) {
        this._renderArea.y++;
    }

    if (forceNew) {
        this._renderArea.height++;
    }
};

/**
 * Destroys the tile layer completely
 *
 * @method destroy
 */
Tilelayer.prototype.destroy = function () {
    Phaser.Group.prototype.destroy.apply(this, arguments);

    // destroy tiles
    for (var i = 0; i < this.tileIds.length; ++i) {
        var x = i % this.size.x,
            y = (i - x) / this.size.x;

        if (!this.tiles[y] || !this.tiles[y][x]) {
            continue;
        }

        this.tiles[y][x].destroy();
        this.tiles[y][x] = null;
    }

    this.bodies = null;
    this.tiles = null;

    this.map = null;
    this.cameraOffset = null;
    this.scrollFactor = null;

    this.size = null;
    this.tileIds = null;
    this.properties = null;

    this._buffered = null;
    this._scroll = null;
    this._scrollDelta = null;
    this._renderArea = null;
    this._mc = null;

    this.container = null;
};

Object.defineProperty(Tilelayer.prototype, 'scrollX', {
    get: function () {
        return this._scroll.x;
    },
    set: function (value) {
        if (value !== this._scroll.x) {
            this._scrollDelta.x -= value - this._scroll.x;
            this._scroll.x = value;
        }
    }
});

Object.defineProperty(Tilelayer.prototype, 'scrollY', {
    get: function () {
        return this._scroll.y;
    },
    set: function (value) {
        if (value !== this._scroll.y) {
            this._scrollDelta.y -= value - this._scroll.y;
            this._scroll.y = value;
        }
    }
});

Object.defineProperty(Tilelayer.prototype, 'widthInPixels', {
    get: function () {
        return this.size.x * this.map.scaledTileWidth;
    }
});

Object.defineProperty(Tilelayer.prototype, 'heightInPixels', {
    get: function () {
        return this.size.y * this.map.scaledTileHeight;
    }
});

/**
* @name Phaser.TilemapLayer#collisionWidth
* @property {number} collisionWidth - The width of the collision tiles.
*/
Object.defineProperty(Tilelayer.prototype, 'collisionWidth', {

    get: function () {
        return this._mc.cw;
    },

    set: function (value) {

        this._mc.cw = value;

        // this.dirty = true;

    }

});

/**
* @name Phaser.TilemapLayer#collisionHeight
* @property {number} collisionHeight - The height of the collision tiles.
*/
Object.defineProperty(Tilelayer.prototype, 'collisionHeight', {

    get: function () {
        return this._mc.ch;
    },

    set: function (value) {

        this._mc.ch = value;

        // this.dirty = true;

    }

});

},{"../utils":17,"./Tile":12}],14:[function(require,module,exports){
var Tilelayer = require('./Tilelayer'),
    Objectlayer = require('./Objectlayer'),
    Tile = require('./Tile'),
    Tileset = require('./Tileset'),
    TilemapParser = require('./TilemapParser'),
    utils = require('../utils'),
    C = require('../constants');

/**
 * Tiled map that represents an entire tile map with multiple layers or object groups.
 * Often it is easier to create a tilemap using the object factor on a world, rather
 * than doing it manually yourself.
 *
 * @class Tilemap
 * @constructor
 * @param {Phaser.Game} game - Game reference to the currently running game.
 * @param {string} [key] - The name of the tiledmap, this is usually the filename without the extension.
 * @param {Phaser.Group|Phaser.SpriteBatch} [group] - Group to add the tilemap to.
 */
function Tilemap(game, key, group) {
    Phaser.Group.call(this, game, group, key);

    var data = TilemapParser.parse(game, key);

    this.type = Phaser.TILEMAP;

    /**
     * The key of this map data in the Phaser.Cache.
     *
     * @property key
     * @type String
     */
    this.key = key;

    if (data === null) {
        return;
    }

    this.size = new Phaser.Point(data.width, data.height);

    /**
     * @property {number} tileWidth - The base width of the tiles in the map (in pixels).
     */
    this.tileWidth = data.tilewidth;

    /**
     * @property {number} tileHeight - The base height of the tiles in the map (in pixels).
     */
    this.tileHeight = data.tileheight;

    /**
     * @property {number} scaledTileWidth - The scaled width of the tiles in the map (in pixels).
     */
    this.scaledTileWidth = this.tileWidth;

    /**
     * @property {number} scaledTileHeight - The scaled height of the tiles in the map (in pixels).
     */
    this.scaledTileHeight = this.tileHeight;

    /**
     * @property {string} orientation - The orientation of the map data (as specified in Tiled), usually 'orthogonal'.
     */
    this.orientation = data.orientation;

    /**
     * @property {number} format - The format of the map data, either Phaser.Tilemap.CSV or Phaser.Tilemap.TILED_JSON.
     */
    this.format = data.format;

    /**
     * @property {number} version - The version of the map data (as specified in Tiled, usually 1).
     */
    this.version = data.version;

    /**
     * @property {object} properties - Map specific properties as specified in Tiled.
     */
    this.properties = utils.parseTiledProperties(data.properties);

    /**
     * @property {number} widthInPixels - The width of the map in pixels based on width * tileWidth.
     */
    this.widthInPixels = data.width * data.tilewidth;

    /**
     * @property {number} heightInPixels - The height of the map in pixels based on height * tileHeight.
     */
    this.heightInPixels = data.height * data.tileheight;

    /**
     * @property {array} layers - An array of Tilemap layer data.
     */
    this.layers = [];

    /**
     * @property {array} tilesets - An array of Tilesets.
     */
    this.tilesets = [];

    /**
     * @property {array} objects - An array of Tiled Object Layers.
     */
    this.objects = [];

    /**
     * @property {array} images - An array of Tiled Image Layers.
     */
    this.images = [];

    /**
     * @property {array} collideIndexes - An array of tile indexes that collide.
     */
    this.collideIndexes = [];

    /**
     * @property {array} collision - An array of collision data (polylines, etc).
     */
    // this.collision = data.collision;

    /**
     * @property {number} currentLayer - The current layer.
     */
    this.currentLayer = 0;

    /**
     * @property {array} debugMap - Map data used for debug values only.
     */
    this.debugMap = [];

    this.preventingRecalculate = false;
    this.needToRecalculate = null;

    // tell when camera scale is modified
    this._camScaleX = 0;
    this._camScaleY = 0;

    // should all layers do a full rerender?
    this.dirty = true;

    // update the world bounds
    this.game.world.setBounds(0, 0, this.widthInPixels, this.heightInPixels);

    // create each tileset
    for(var t = 0, tl = data.tilesets.length; t < tl; ++t) {
        var ts = data.tilesets[t];
        this.tilesets.push(new Tileset(game, key, ts));
    }

    // create each layer
    for(var i = 0, il = data.layers.length; i < il; ++i) {
        var lyr,
            ldata = data.layers[i];

        switch(ldata.type) {
            case 'tilelayer':
                lyr = new Tilelayer(game, this, ldata, this.layers.length);
                this.layers.push(lyr);

                // calculate the tile faces
                this.calculateFaces(this.layers.length - 1);
                break;

            case 'objectgroup':
                lyr = new Objectlayer(game, this, ldata, this.objects.length);
                this.objects.push(lyr);
                break;

            case 'imagelayer':
                lyr = game.add.sprite(ldata.x, ldata.y, utils.cacheKey(key, 'layer', ldata.name), null, this);

                lyr.visible = ldata.visible;
                lyr.apha = ldata.opacity;

                this.images.push(lyr);
                break;
        }
    }
}

Tilemap.prototype = Object.create(Phaser.Group.prototype);
Tilemap.prototype.constructor = Tilemap;

module.exports = Tilemap;

/**
 * Sets the base tile size for the map.
 *
 * @method setTileSize
 * @param {number} tileWidth - The width of the tiles the map uses for calculations.
 * @param {number} tileHeight - The height of the tiles the map uses for calculations.
 */
Tilemap.prototype.setTileSize = function (tileWidth, tileHeight) {
    this.tileWidth = tileWidth;
    this.tileHeight = tileHeight;

    this.scaledTileWidth = tileWidth * this.game.camera.scale.x;
    this.scaledTileHeight = tileHeight * this.game.camera.scale.y;

    this.widthInPixels = this.width * tileWidth;
    this.heightInPixels = this.height * tileWidth;

    // update the world bounds
    this.game.world.setBounds(0, 0, this.width * this.game.camera.scale.x, this.height * this.game.camera.scale.y);
};

/**
* Gets the layer index based on the layers name.
*
* @method Phaser.Tilemap#getIndex
* @protected
* @param {array} location - The local array to search.
* @param {number|string|object} name - The name of the array element to get.
* @return {number} The index of the element in the array, or null if not found.
*/
Tilemap.prototype.getIndex = function (location, name) {

    if (typeof name === 'string') {
        for (var i = 0; i < location.length; i++)
        {
            if (location[i].name === name)
            {
                return i;
            }
        }
    }
    else if (typeof name === 'object') {
        return name.index;
    }
    else if (typeof name === 'number') {
        return name;
    }

    return -1;

};

/**
* Gets the layer index based on its name.
*
* @method Phaser.Tilemap#getTilelayerIndex
* @param {number|string|object} name - The name of the layer to get.
* @return {number} The index of the layer in this tilemap, or null if not found.
*/
Tilemap.prototype.getTilelayerIndex = Tilemap.prototype.getLayer = function (name) {

    return this.getIndex(this.layers, name);

};

/**
* Gets the tileset index based on its name.
*
* @method Phaser.Tilemap#getTilesetIndex
* @param {number|string|object} name - The name of the tileset to get.
* @return {number} The index of the tileset in this tilemap, or null if not found.
*/
Tilemap.prototype.getTilesetIndex = function (name) {

    return this.getIndex(this.tilesets, name);

};

/**
* Gets the image index based on its name.
*
* @method Phaser.Tilemap#getImagelayer
* @param {number|string|object} name - The name of the image to get.
* @return {number} The index of the image in this tilemap, or null if not found.
*/
Tilemap.prototype.getImagelayerIndex = function (name) {

    return this.getIndex(this.images, name);

};

/**
* Gets the object index based on its name.
*
* @method Phaser.Tilemap#getObjectlayerIndex
* @param {number|string|object} name - The name of the object to get.
* @return {number} The index of the object in this tilemap, or null if not found.
*/
Tilemap.prototype.getObjectlayerIndex = function (name) {

    return this.getIndex(this.objects, name);

};


/**
* Gets the layer based on its name.
*
* @method Phaser.Tilemap#getTilelayer
* @param {number|string|object} name - The name of the layer to get.
* @return {Tilelayer} The index of the layer in this tilemap, or null if not found.
*/
Tilemap.prototype.getTilelayer = function (name) {

    return this.layers[this.getTilelayerIndex(name)];

};

/**
* Gets the tileset index based on its name.
*
* @method Phaser.Tilemap#getTileset
* @param {number|string|object} name - The name of the tileset to get.
* @return {Tileset} The index of the tileset in this tilemap, or null if not found.
*/
Tilemap.prototype.getTileset = function (name) {

    return this.tilesets[this.getTilesetIndex(name)];

};

/**
* Gets the image index based on its name.
*
* @method Phaser.Tilemap#getImagelayer
* @param {number|string|object} name - The name of the image to get.
* @return {Image} The index of the image in this tilemap, or null if not found.
*/
Tilemap.prototype.getImagelayer = function (name) {

    return this.images[this.getImagelayerIndex(name)];

};

/**
* Gets the object index based on its name.
*
* @method Phaser.Tilemap#getObjectlayer
* @param {number|string|object} name - The name of the object to get.
* @return {Objectlayer} The index of the object in this tilemap, or null if not found.
*/
Tilemap.prototype.getObjectlayer = function (name) {

    return this.objects[this.getObjectlayerIndex(name)];

};

/**
* Turn off/on the recalculation of faces for tile or collission updates.
* setPreventRecalculate(true) puts recalculation on hold while
* setPreventRecalculate(false) recalculates all the changed layers.
*
* @method Phaser.Tilemap#setPreventRecalculate
* @param {boolean} if true it will put the recalculation on hold.
*/
Tilemap.prototype.setPreventRecalculate = function (value) {

    if ((value === true) && (this.preventingRecalculate !== true))
    {
        this.preventingRecalculate = true;
        this.needToRecalculate = {};
    }

    if ((value ===  false) && (this.preventingRecalculate === true))
    {
        this.preventingRecalculate = false;
        for(var i in this.needToRecalculate){
            this.calculateFaces(i);
        }
        this.needToRecalculate = false;
    }

};

/**
* Internal function.
*
* @method Phaser.Tilemap#calculateFaces
* @protected
* @param {number} layer - The index of the TilemapLayer to operate on.
*/
Tilemap.prototype.calculateFaces = function (layer) {

    if (this.preventingRecalculate)
    {
        this.needToRecalculate[layer] = true;
        return;
    }

    var above = null;
    var below = null;
    var left = null;
    var right = null;

    for (var y = 0, h = this.layers[layer].size.y; y < h; y++)
    {
        for (var x = 0, w = this.layers[layer].size.x; x < w; x++)
        {
            var tile = this.layers[layer].tiles[y] ? this.layers[layer].tiles[y][x] : null;

            if (tile)
            {
                above = this.getTileAbove(layer, x, y);
                below = this.getTileBelow(layer, x, y);
                left = this.getTileLeft(layer, x, y);
                right = this.getTileRight(layer, x, y);

                if (tile.collides)
                {
                    tile.faceTop = true;
                    tile.faceBottom = true;
                    tile.faceLeft = true;
                    tile.faceRight = true;
                }

                if (above && above.collides)
                {
                    //  There is a tile above this one that also collides,
                    // so the top of this tile is no longer interesting
                    tile.faceTop = false;
                }

                if (below && below.collides)
                {
                    //  There is a tile below this one that also collides,
                    // so the bottom of this tile is no longer interesting
                    tile.faceBottom = false;
                }

                if (left && left.collides)
                {
                    //  There is a tile left this one that also collides,
                    // so the left of this tile is no longer interesting
                    tile.faceLeft = false;
                }

                if (right && right.collides)
                {
                    //  There is a tile right this one that also collides,
                    // so the right of this tile is no longer interesting
                    tile.faceRight = false;
                }
            }
        }
    }

};

/**
* Gets the tile above the tile coordinates given.
* Mostly used as an internal function by calculateFaces.
*
* @method Phaser.Tilemap#getTileAbove
* @param {number} layer - The local layer index to get the tile from.
* @param {number} x - The x coordinate to get the tile from. In tiles, not pixels.
* @param {number} y - The y coordinate to get the tile from. In tiles, not pixels.
*/
Tilemap.prototype.getTileAbove = function (layer, x, y) {

    if (y > 0)
    {
        return this.layers[layer].tiles[y - 1] ? this.layers[layer].tiles[y - 1][x] : null;
    }

    return null;

};

/**
* Gets the tile below the tile coordinates given.
* Mostly used as an internal function by calculateFaces.
*
* @method Phaser.Tilemap#getTileBelow
* @param {number} layer - The local layer index to get the tile from.
* @param {number} x - The x coordinate to get the tile from. In tiles, not pixels.
* @param {number} y - The y coordinate to get the tile from. In tiles, not pixels.
*/
Tilemap.prototype.getTileBelow = function (layer, x, y) {

    if (y < this.layers[layer].height - 1)
    {
        return this.layers[layer].tiles[y + 1] ? this.layers[layer].tiles[y + 1][x] : null;
    }

    return null;

};

/**
* Gets the tile to the left of the tile coordinates given.
* Mostly used as an internal function by calculateFaces.
*
* @method Phaser.Tilemap#getTileLeft
* @param {number} layer - The local layer index to get the tile from.
* @param {number} x - The x coordinate to get the tile from. In tiles, not pixels.
* @param {number} y - The y coordinate to get the tile from. In tiles, not pixels.
*/
Tilemap.prototype.getTileLeft = function (layer, x, y) {

    if (x > 0)
    {
        return this.layers[layer].tiles[y] ? this.layers[layer].tiles[y][x - 1] : null;
    }

    return null;

};

/**
* Gets the tile to the right of the tile coordinates given.
* Mostly used as an internal function by calculateFaces.
*
* @method Phaser.Tilemap#getTileRight
* @param {number} layer - The local layer index to get the tile from.
* @param {number} x - The x coordinate to get the tile from. In tiles, not pixels.
* @param {number} y - The y coordinate to get the tile from. In tiles, not pixels.
*/
Tilemap.prototype.getTileRight = function (layer, x, y) {

    if (x < this.layers[layer].size.x - 1)
    {
        return this.layers[layer].tiles[y] ? this.layers[layer].tiles[y][x + 1] : null;
    }

    return null;

};

/**
* Sets the current layer to the given index.
*
* @method Phaser.Tilemap#setLayer
* @param {number|string|Phaser.TilemapLayer} layer - The layer to set as current.
*/
Tilemap.prototype.setLayer = function (layer) {

    layer = this.getTilelayerIndex(layer);

    if (this.layers[layer])
    {
        this.currentLayer = layer;
    }

};

/**
* Checks if there is a tile at the given location.
*
* @method Phaser.Tilemap#hasTile
* @param {number} x - X position to check if a tile exists at (given in tile units, not pixels)
* @param {number} y - Y position to check if a tile exists at (given in tile units, not pixels)
* @param {number|string|Phaser.TilemapLayer} layer - The layer to set as current.
* @return {boolean} True if there is a tile at the given location, otherwise false.
*/
Tilemap.prototype.hasTile = function (x, y, layer) {

    layer = this.getTilelayerIndex(layer);

    return !!(this.layers[layer].tiles[y] ? this.layers[layer].tiles[y][x] : false);

};

/**
* Removes the tile located at the given coordinates and updates the collision data.
*
* @method Phaser.Tilemap#removeTile
* @param {number} x - X position to place the tile (given in tile units, not pixels)
* @param {number} y - Y position to place the tile (given in tile units, not pixels)
* @param {number|string|Phaser.TilemapLayer} [layer] - The layer to modify.
* @return {Phaser.Tile} The Tile object that was removed from this map.
*/
Tilemap.prototype.removeTile = function (x, y, layer) {

    layer = this.getTilelayerIndex(layer);

    if (x >= 0 && x < this.layers[layer].size.x && y >= 0 && y < this.layers[layer].size.y)
    {
        if (this.hasTile(x, y, layer))
        {
            var tile = this.layers[layer].tiles[y][x];

            this.layers[layer].tiles[y][x] = null;
            this.layers[layer].dirty = true;

            this.calculateFaces(layer);

            return tile;
        }
    }

};

/**
* Removes the tile located at the given coordinates and updates the collision data.
* The coordinates are given in pixel values.
*
* @method Phaser.Tilemap#removeTileWorldXY
* @param {number} x - X position to remove the tile (given in pixels)
* @param {number} y - Y position to remove the tile (given in pixels)
* @param {number} tileWidth - The width of the tile in pixels.
* @param {number} tileHeight - The height of the tile in pixels.
* @param {number|string|Phaser.TilemapLayer} [layer] - The layer to modify.
* @return {Phaser.Tile} The Tile object that was removed from this map.
*/
Tilemap.prototype.removeTileWorldXY = function (x, y, tileWidth, tileHeight, layer) {

    x = this.game.math.snapToFloor(x, tileWidth) / tileWidth;
    y = this.game.math.snapToFloor(y, tileHeight) / tileHeight;

    return this.removeTile(x, y, layer);

};

/**
* Puts a tile of the given index value at the coordinate specified.
* If you pass `null` as the tile it will pass your call over to Tilemap.removeTile instead.
*
* @method Phaser.Tilemap#putTile
* @param {Phaser.Tile|number|null} tile - The index of this tile to set or a Phaser.Tile object,
*       null means to remove the tile.
* @param {number} x - X position to place the tile (given in tile units, not pixels)
* @param {number} y - Y position to place the tile (given in tile units, not pixels)
* @param {number|string|Phaser.TilemapLayer} [layer] - The layer to modify.
* @return {Phaser.Tile} The Tile object that was created or added to this map.
*/
Tilemap.prototype.putTile = function (tile, x, y, layer) {

    if (tile === null)
    {
        return this.removeTile(x, y, layer);
    }

    layer = this.getTilelayerIndex(layer);

    var tileId,
        tileset;

    if (x >= 0 && x < this.layers[layer].size.x && y >= 0 && y < this.layers[layer].size.y)
    {
        if (!this.layers[layer].tiles[y]) {
            this.layers[layer].tiles[y] = {};
        }

        if (tile instanceof Phaser.Tile)
        {
            var idx = (y * this.layers[layer].size.x) + x;

            tileId = this.layers[layer].tileIds[idx];
            tileset = this.getTileset(tileId);

            if (this.hasTile(x, y, layer))
            {
                this.layers[layer].tiles[y][x].copy(tile);
            }
            else
            {
                this.layers[layer].tiles[y][x] = new Tile(this.game, x, y, tileId, tileset, this.layers[layer]);
            }
        }
        else
        {
            tileId = this.layers[layer].tileIds[tile];
            tileset = this.getTileset(tileId);

            this.layers[layer].tiles[y][x] = null;
            this.layers[layer].tiles[y][x] = new Tile(this.game, x, y, tileId, tileset, this.layers[layer]);
        }

        // if (this.collideIndexes.indexOf(index) > -1)
        // {
        //     this.layers[layer].tiles[y][x].setCollision(true, true, true, true);
        // }
        // else
        // {
        //     this.layers[layer].tiles[y][x].resetCollision();
        // }

        this.layers[layer].dirty = true;

        this.calculateFaces(layer);

        return this.layers[layer].tiles[y][x];
    }

    return null;

};

/**
* Puts a tile into the Tilemap layer. The coordinates are given in pixel values.
*
* @method Phaser.Tilemap#putTileWorldXY
* @param {Phaser.Tile|number} tile - The index of this tile to set or a Phaser.Tile object.
* @param {number} x - X position to insert the tile (given in pixels)
* @param {number} y - Y position to insert the tile (given in pixels)
* @param {number} tileWidth - The width of the tile in pixels.
* @param {number} tileHeight - The height of the tile in pixels.
* @param {number|string|Phaser.TilemapLayer} [layer] - The layer to modify.
* @return {Phaser.Tile} The Tile object that was created or added to this map.
*/
Tilemap.prototype.putTileWorldXY = function (tile, x, y, tileWidth, tileHeight, layer) {

    x = this.game.math.snapToFloor(x, tileWidth) / tileWidth;
    y = this.game.math.snapToFloor(y, tileHeight) / tileHeight;

    return this.putTile(tile, x, y, layer);

};

/**
* Gets a tile from the Tilemap Layer. The coordinates are given in tile values.
*
* @method Phaser.Tilemap#getTile
* @param {number} x - X position to get the tile from (given in tile units, not pixels)
* @param {number} y - Y position to get the tile from (given in tile units, not pixels)
* @param {number|string|Phaser.TilemapLayer} [layer] - The layer to get the tile from.
* @param {boolean} [nonNull=false] - If true getTile won't return null for empty tiles,
*       but a Tile object with an index of -1.
* @return {Phaser.Tile} The tile at the given coordinates or null if no tile was found or the coordinates were invalid.
*/
Tilemap.prototype.getTile = function (x, y, layer, nonNull) {

    if (typeof nonNull === 'undefined') { nonNull = false; }

    layer = this.getTilelayerIndex(layer);

    if (x >= 0 && x < this.layers[layer].size.x && y >= 0 && y < this.layers[layer].size.y)
    {
        return this.layers[layer].tiles[y] ? this.layers[layer].tiles[y][x] : null;
    }
    else
    {
        return null;
    }

};

/**
* Gets a tile from the Tilemap layer. The coordinates are given in pixel values.
*
* @method Phaser.Tilemap#getTileWorldXY
* @param {number} x - X position to get the tile from (given in pixels)
* @param {number} y - Y position to get the tile from (given in pixels)
* @param {number} [tileWidth] - The width of the tiles. If not given the map default is used.
* @param {number} [tileHeight] - The height of the tiles. If not given the map default is used.
* @param {number|string|Phaser.TilemapLayer} [layer] - The layer to get the tile from.
* @return {Phaser.Tile} The tile at the given coordinates.
*/
Tilemap.prototype.getTileWorldXY = function (x, y, tileWidth, tileHeight, layer) {

    if (typeof tileWidth === 'undefined') { tileWidth = this.tileWidth; }
    if (typeof tileHeight === 'undefined') { tileHeight = this.tileHeight; }

    x = this.game.math.snapToFloor(x, tileWidth) / tileWidth;
    y = this.game.math.snapToFloor(y, tileHeight) / tileHeight;

    return this.getTile(x, y, layer);

};

/**
* Removes all layers from this tile map.
*
* @method Phaser.Tilemap#removeAllLayers
*/
Tilemap.prototype.removeAllLayers = function () {

    this.layers.length = 0;
    this.currentLayer = 0;

};

/**
* Dumps the tilemap data out to the console.
*
* @method Phaser.Tilemap#dump
*/
Tilemap.prototype.dump = function () {

    var txt = '';
    var args = [''];

    for (var y = 0; y < this.layers[this.currentLayer].size.y; y++)
    {
        for (var x = 0; x < this.layers[this.currentLayer].size.x; x++)
        {
            txt += '%c  ';

            if (this.layers[this.currentLayer].tiles[y] && this.layers[this.currentLayer].tiles[y][x])
            {
                if (this.debugMap[this.layers[this.currentLayer].tiles[y][x]])
                {
                    args.push('background: ' + this.debugMap[this.layers[this.currentLayer].tiles[y][x]]);
                }
                else
                {
                    args.push('background: #ffffff');
                }
            }
            else
            {
                args.push('background: rgb(0, 0, 0)');
            }
        }

        txt += '\n';
    }

    args[0] = txt;
    console.log.apply(console, args);

};

/**
 * Gets the tileset that an ID is associated with
 *
 * @method getTileset
 * @param tileId {Number} The id of the tile to find the tileset for
 * @return {TiledTileset} Returns the tileset if found, undefined if not
 */
Tilemap.prototype.getTileset = function (tileId) {
    for(var i = 0, il = this.tilesets.length; i < il; ++i) {
        if (this.tilesets[i].contains(tileId)) {
            return this.tilesets[i];
        }
    }
};

Tilemap.prototype.postUpdate = function () {
    if (this._camScaleX !== this.game.camera.scale.x || this._camScaleY !== this.game.camera.scale.y) {
        this._camScaleX = this.game.camera.scale.x;
        this._camScaleY = this.game.camera.scale.y;

        this.setTileSize(this.tileWidth, this.tileHeight);

        this.dirty = true;
    }

    Phaser.Group.prototype.postUpdate.apply(this, arguments);

    this.dirty = false;
};

/**
 * Spawns all the objects in the ObjectGroups of this map
 *
 * @method spawnObjects
 * @return {Tilemap} Returns itself.
 * @chainable
 */
Tilemap.prototype.spawnObjects = function (spawnCallback) {
    for(var i = 0, il = this.objects.length; i < il; ++i) {
        this.objects[i].spawn(spawnCallback);
    }

    return this;
};

/**
 * Spawns all the objects in the ObjectGroups of this map
 *
 * @method despawnObjects
 * @return {Tilemap} Returns itself.
 * @chainable
 */
Tilemap.prototype.despawnObjects = function () {
    for(var i = 0, il = this.objects.length; i < il; ++i) {
        this.objects[i].despawn();
    }

    return this;
};

/**
 * Clears all the tiles that are currently used on all tile layers
 *
 * @method clearTiles
 * @return {Tilemap} Returns itself.
 * @chainable
 */
Tilemap.prototype.clearTiles = function () {
    for(var i = 0, il = this.layers.length; i < il; ++i) {
        this.layers[i].clearTiles();
    }

    return this;
};

/**
 * Destroys the tilemap instance
 *
 * @method destroy
 */
Tilemap.prototype.destroy = function () {
    Phaser.Group.prototype.destroy.apply(this, arguments);

    for (var i = 0; i < this.tilesets.length; ++i) {
        this.tilesets[i].destroy();
    }

    this.key = null;
    this.size = null;
    this.tileWidth = null;
    this.tileHeight = null;
    this.scaledTileWidth = null;
    this.scaledTileHeight = null;
    this.orientation = null;
    this.format = null;
    this.version = null;
    this.properties = null;
    this.widthInPixels = null;
    this.heightInPixels = null;

    this.layers = null;

    this.tilesets = null;

    this.objects = null;

    this.images = null;

    this.collideIndexes = null;

    this.debugMap = null;

    this.currentLayer = null;
    this.preventingRecalculate = null;
    this.needToRecalculate = null;
    this._camScaleX = null;
    this._camScaleY = null;
    this.dirty = null;
};

/**
* @name Phaser.Tilemap#layer
* @property {number|string|Phaser.TilemapLayer} layer - The current layer object.
*/
Object.defineProperty(Tilemap.prototype, 'layer', {

    get: function () {

        return this.layers[this.currentLayer];

    },

    set: function (value) {

        if (value !== this.currentLayer)
        {
            this.setLayer(value);
        }

    }

});

for (var key in C) {
    Tilemap[key] = C[key];
}

},{"../constants":9,"../utils":17,"./Objectlayer":11,"./Tile":12,"./Tilelayer":13,"./TilemapParser":15,"./Tileset":16}],15:[function(require,module,exports){
/* jshint maxlen:200 */
var utils = require('../utils'),
    C = require('../constants');

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
        var mapElement = data.getElementsByTagName('map')[0],
            map = {
                version: parseFloat(mapElement.attributes.getNamedItem('version').value, 10),
                width: parseInt(mapElement.attributes.getNamedItem('width').value, 10),
                height: parseInt(mapElement.attributes.getNamedItem('height').value, 10),
                tilewidth: parseInt(mapElement.attributes.getNamedItem('tilewidth').value, 10),
                tileheight: parseInt(mapElement.attributes.getNamedItem('tileheight').value, 10),
                orientation: mapElement.attributes.getNamedItem('orientation').value,
                format: Phaser.Tilemap.TILED_XML,
                properties: {},
                layers: [],
                tilesets: []
            },
            i = 0,
            il = 0;

        //add the properties
        var mapprops = mapElement.getElementsByTagName('properties');
        for(i = 0, il = mapprops.length; i < il; ++i) {
            if(mapprops[i].parentNode === mapElement) {
                mapprops = mapprops[i].getElementsByTagName('property');

                for(var mp = 0; mp < mapprops.length; ++mp) {
                    map.properties[mapprops[mp].attributes.getNamedItem('name').value] = mapprops[mp].attributes.getNamedItem('value').value;
                }

                break;
            }
        }

        //add the layers
        var layers = mapElement.childNodes;//getElementsByTagName('layer');

        for(i = 0, il = layers.length; i < il; ++i) {
            var node = layers[i];

            if(node.nodeName === 'layer') {
                var lyr = node,
                    layer = {
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

                //set encoding
                var dataElement = lyr.getElementsByTagName('data')[0];
                layer.encoding = dataElement.attributes.getNamedItem('encoding').value;

                //set data from the text node of the element
                layer.rawData = dataElement.firstChild.nodeValue.trim();

                //set compression
                if(dataElement.attributes.getNamedItem('compression')) {
                    layer.compression = dataElement.attributes.getNamedItem('compression').value;
                }

                var decomp = utils.decompressBase64Data(layer.rawData, layer.encoding, layer.compression);

                layer.data = new Uint32Array(decomp.buffer, 0, decomp.length / 4);

                map.layers.push(layer);
            } else if(node.nodeName === 'objectgroup') {
                var grp = node,
                    group = {
                        type: 'objectgroup',
                        draworder: 'topdown', //TODO: support custom draworders
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
                for(var oj = 0; oj < objects.length; ++oj) {
                    var obj = objects[oj],
                        object = {
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
                        },
                        poly;

                    if(object.gid === null) {
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
                    if(props.length) {
                        props = props[0].getElementsByTagName('property');
                        for(var pr = 0; pr < props.length; ++pr) {
                            object.properties[props[pr].attributes.getNamedItem('name').value] = props[pr].attributes.getNamedItem('value').value;
                        }
                    }

                    group.objects.push(object);
                }

                map.layers.push(group);
            } else if(node.nodeName === 'imagelayer') {
                var ilyr = node,
                    imglayer = {
                        type: 'imagelayer',
                        image: ilyr.getElementsByTagName('image')[0].attributes.getNamedItem('source').value,
                        name: ilyr.attributes.getNamedItem('name').value,
                        width: 0, //always 0 for imagelayers
                        height: 0, //always 0 for imagelayers
                        visible: ilyr.attributes.getNamedItem('visible') ? ilyr.attributes.getNamedItem('visible').value === '1' : true,
                        opacity: ilyr.attributes.getNamedItem('opacity') ? parseFloat(ilyr.attributes.getNamedItem('opacity').value, 10) : 1,
                        x: ilyr.attributes.getNamedItem('x') ? parseInt(ilyr.attributes.getNamedItem('x').value, 10) : 0,
                        y: ilyr.attributes.getNamedItem('y') ? parseInt(ilyr.attributes.getNamedItem('y').value, 10) : 0,
                        properties: {}
                    };

                var iprops = ilyr.getElementsByTagName('properties');
                if(iprops.length) {
                    iprops = iprops[0].getElementsByTagName('property');
                    for(var ip = 0; ip < iprops.length; ++ip) {
                        imglayer.properties[iprops[ip].attributes.getNamedItem('name').value] = iprops[ip].attributes.getNamedItem('value').value;
                    }
                }

                map.layers.push(imglayer);
            }
        }

        //add the tilesets
        var tilesets = mapElement.getElementsByTagName('tileset');

        for(i = 0, il = tilesets.length; i < il; ++i) {
            var tset = tilesets[i],
                tiles = tset.getElementsByTagName('tile'),
                tileset = {
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

            //add spacing / margin attributes if exist
            var spacing = tset.attributes.getNamedItem('spacing');
            if(spacing) {
                tileset.spacing = parseInt(spacing.value, 10);
            }

            var margin = tset.attributes.getNamedItem('margin');
            if(margin) {
                tileset.margin = parseInt(margin.value, 10);
            }

            //add .properties if element exists
            var tsetprops = tset.getElementsByTagName('properties');
            for(var tsp = 0; tsp < tsetprops.length; ++tsp) {
                if(tsetprops[tsp].parentNode === tset) {
                    tsetprops = tsetprops[tsp].getElementsByTagName('property');

                    if(tsetprops.length) {
                        for(var p = 0; p < tsetprops.length; ++p) {
                            var tsetprop = tsetprops[p];

                            tileset.properties[tsetprop.attributes.getNamedItem('name').value] = tsetprop.attributes.getNamedItem('value').value;
                        }
                    }

                    break;
                }
            }

            //add .tiles if there are tile-specific properties
            for(var t = 0; t < tiles.length; ++t) {
                var tile = tiles[t],
                    id = tile.attributes.getNamedItem('id').value,
                    img = tile.getElementsByTagName('image');

                tileset.tiles[id] = {};

                //add attributes into the object
                for(var ta = 0; ta < tile.attributes.length; ++ta) {
                    var tileatr = tile.attributes[ta];

                    if(tileatr.name === 'id') {
                        continue;
                    }

                    switch(tileatr.name) {
                        case 'terrain':
                            tileset.tiles[id].terrain = tileatr.value.sply(',');
                            break;

                        case 'probability':
                            tileset.tiles[id].probability = parseFloat(tileatr.value, 10);
                            break;
                    }
                }

                //check if it has an image child
                if(img.length) {
                    tileset.tiles[id] = tileset.tiles[id] || {};
                    tileset.tiles[id].image = img[0].attributes.getNamedItem('source').value;
                }

                //add all the tile properties
                var tileprops = tile.getElementsByTagName('properties');
                if(tileprops.length) {
                    tileset.tileproperties[id] = {};
                    tileprops = tileprops[0].getElementsByTagName('property');
                    for(var tp = 0; tp < tileprops.length; ++tp) {
                        var tileprop = tileprops[tp];
                        tileset.tileproperties[id][tileprop.attributes.getNamedItem('name').value] = tileprop.attributes.getNamedItem('value').value;
                    }
                }

                //add all the tile animations
                var tileanims = tile.getElementsByTagName('animation');
                if (tileanims.length) {
                    tileset.tiles[id].animation = [];
                    tileanims = tileanims[0].getElementsByTagName('frame');
                    for(var tn = 0; tn < tileanims.length; ++tn) {
                        var tileanim = tileanims[tn].attributes,
                            animObj = {};
                        for (var tna = 0; tna < tileanim.length; ++tna) {
                            animObj[tileanim[tna].name] = tileanim[tna].value;
                        }

                        tileset.tiles[id].animation.push(animObj);
                    }
                }
            }

            //check for terraintypes and add those
            var terrains = tset.getElementsByTagName('terraintypes');
            if(terrains.length) {
                terrains = terrains[0].getElementsByTagName('terrain');
                for(var tr = 0; tr < terrains.length; ++tr) {
                    tileset.terrains.push({
                        name: terrains[tr].attributes.getNamedItem('name').value,
                        tile: parseInt(terrains[tr].attributes.getNamedItem('tile').value, 10)
                    });
                }
            }

            //check for tileoffset and add that
            var offset = tset.getElementsByTagName('tileoffset');
            if(offset.length) {
                tileset.tileoffset.x = parseInt(offset[0].attributes.getNamedItem('x').value, 10);
                tileset.tileoffset.y = parseInt(offset[0].attributes.getNamedItem('y').value, 10);
            }

            //add image, imagewidth, imageheight
            var image = tset.getElementsByTagName('image');
            if(image.length === 1 && image[0].parentNode === tset) {
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

},{"../constants":9,"../utils":17}],16:[function(require,module,exports){
var utils = require('../utils');

/**
 * This object represents a tileset used by a Tilemap.
 * There can be multiple Tilesets in a map
 *
 * @class Tileset
 * @extends Texture
 * @constructor
 * @param game {Phaser.Game} Phaser game this belongs to.
 * @param key {string} The name of the tiledmap, this is usually the filename without the extension.
 * @param settings {Object} All the settings for the tileset
 * @param settings.tilewidth {Number} The width of a single tile in the set
 * @param settings.tileheight {Number} The height of a single tile in the set
 * @param [settings.firstgid=1] {Number} The id of the first tile in the set, defaults to 1
 * @param [settings.spacing=0] {Number} The spacing around tiles in the tileset (in pixels)
 * @param [settings.margin=0] {Number} The margin around a tile in the tileset (in pixels)
 * @param [settings.tileoffset] {Object} The offset to apply to a tile rendered from this tileset
 * @param [settings.tileoffset.x=0] {Number} The X offset to apply to the tile
 * @param [settings.tileoffset.y=0] {Number} The Y offset to apply to the tile
 * @param [settings.properties] {Object} User-defined, custom properties that apply to the tileset
 * @param [settings.tileproperties] {Object} User-defined, custom properties that apply to tiles in the tileset.
 *          The keys of this object should the tile id of the properties
 * @param [settings.tiles] {Object} Extra metadata about specific tiles
 * @param [settings.imagewidth] {Number} An override for the image width
 * @param [settings.imageheight] {Number} An override for the image height
 */
//TODO: Support external tilesets (TSX files) via the "source" attribute
//see: https://github.com/bjorn/tiled/wiki/TMX-Map-Format#tileset
function Tileset(game, key, settings) {
    var txkey = utils.cacheKey(key, 'tileset', settings.name),
        tx = PIXI.BaseTextureCache[txkey],
        ids,
        ttxkey,
        ttx,
        tileTextures;

    // if no main texture, check if multi-image tileset
    if (!tx && settings.tiles) {
        // need to sort because order matters here, and can't guarantee that the object's keys will be ordered.
        // We need a custom comparator because .sort() is lexagraphic, not numeric.
        ids = Object.keys(settings.tiles).sort(function (a, b) { return parseInt(a, 10) - parseInt(b, 10); });

        for (var i = 0; i < ids.length; ++i) {
            if (settings.tiles[ids[i]].image) {
                // this is a multi-image tileset
                tileTextures = tileTextures || [];

                ttxkey = utils.cacheKey(key, 'tileset_image_' + ids[i], settings.name);
                ttx = PIXI.TextureCache[ttxkey];

                if (!ttx) {
                    console.warn(
                        'Tileset "' + settings.name + '" unable to find texture cached by key "' +
                        ttxkey + '", using blank texture.'
                    );
                    ttx = PIXI.Texture.emptyTexture;
                }

                tileTextures.push(ttx);
            }
        }
    }

    // if no main texture, and we didn't find any image tiles then warn about blank tileset
    if (!tx && !tileTextures) {
        console.warn(
            'Tileset "' + settings.name + '" unable to find texture cached by key "' +
            txkey +  '", using blank texture.'
        );
    }

    PIXI.Texture.call(this, tx || PIXI.Texture.emptyTexture.baseTexture);

    this.game = game;

    this.multiImage = !!tileTextures;

    //Tiled Editor properties

    /**
     * The first tileId in the tileset
     *
     * @property firstgid
     * @type Number
     */
    this.firstgid = settings.firstgid || 1;

    /**
     * The name of the tileset
     *
     * @property name
     * @type String
     */
    this.name = settings.name;

    /**
     * The width of a tile in the tileset
     *
     * @property tileWidth
     * @type Number
     */
    this.tileWidth = settings.tilewidth;

    /**
     * The height of a tile in the tileset
     *
     * @property tileHeight
     * @type Number
     */
    this.tileHeight = settings.tileheight;

    /**
     * The spacing around a tile in the tileset
     *
     * @property spacing
     * @type Number
     */
    this.spacing = settings.spacing || 0;

    /**
     * The margin around a tile in the tileset
     *
     * @property margin
     * @type Number
     */
    this.margin = settings.margin || 0;

    /**
     * The offset of tile positions when rendered
     *
     * @property tileoffset
     * @type Phaser.Point
     */
    this.tileoffset = new Phaser.Point(
        settings.tileoffset ? settings.tileoffset.x : 0,
        settings.tileoffset ? settings.tileoffset.y : 0
    );

    //TODO: Support for "terraintypes," "image"
    //see: https://github.com/bjorn/tiled/wiki/TMX-Map-Format#tileset

    //Custom/Optional properties

    /**
     * The number of tiles calculated based on size, margin, and spacing
     *
     * @property numTiles
     * @type Vector
     */
    this.numTiles = this.multiImage ? tileTextures.length : new Phaser.Point(
        Phaser.Math.floor((this.baseTexture.width - this.margin) / (this.tileWidth - this.spacing)),
        Phaser.Math.floor((this.baseTexture.height - this.margin) / (this.tileHeight - this.spacing))
    );

    /**
     * The last tileId in the tileset
     *
     * @property lastgid
     * @type Number
     */
    this.lastgid = this.firstgid + (this.multiImage ? tileTextures.length : ((this.numTiles.x * this.numTiles.y) || 1)) - 1;

    /**
     * The properties of the tileset
     *
     * @property properties
     * @type Object
     */
    this.properties = utils.parseTiledProperties(settings.properties);

    /**
     * The properties of the tiles in the tileset
     *
     * @property tileproperties
     * @type Object
     */
    this.tileproperties = {};

    // massage tile tileproperties
    for (var k in settings.tileproperties) {
        this.tileproperties[k] = utils.parseTiledProperties(settings.tileproperties[k]);
    }

    /**
     * The size of the tileset
     *
     * @property size
     * @type Vector
     */
    this.size = this.multiImage ? new Phaser.Point(0, 0) : new Phaser.Point(
        settings.imagewidth || this.baseTexture.width,
        settings.imageheight || this.baseTexture.height
    );

    /**
     * The texture instances for each tile in the set
     *
     * @property textures
     * @type Array
     */
    this.textures = this.multiImage ? tileTextures : [];

    // generate tile textures for single image tileset
    if (!this.multiImage) {
        for(var t = 0, tl = this.lastgid - this.firstgid + 1; t < tl; ++t) {
            // convert the tileId to x,y coords of the tile in the Texture
            var y = Phaser.Math.floor(t / this.numTiles.x),
                x = (t - (y * this.numTiles.x));

            // get location in pixels
            x = (x * this.tileWidth) + (x * this.spacing) + this.margin;
            y = (y * this.tileHeight) + (y * this.spacing) + this.margin;

            this.textures.push(
                new PIXI.Texture(
                    this.baseTexture,
                    new Phaser.Rectangle(x, y, this.tileWidth, this.tileHeight)
                )
            );
        }
    }

    /**
     * The animation data for tile animations in the set
     *
     * @property tileanimations
     * @type Object
     */
    this.tileanimations = {};

    // parse extra information about the tiles
    for (var p in settings.tiles) {
        if (settings.tiles[p].animation) {
            this.tileanimations[p] = {
                rate: 1000 / settings.tiles[p].animation[0].duration,
                data: new Phaser.FrameData()
            };

            for (var a = 0; a < settings.tiles[p].animation.length; ++a) {
                var frame = this.textures[settings.tiles[p].animation[a].tileid].frame;

                this.tileanimations[p].data.addFrame(
                    new Phaser.Frame(a, frame.x, frame.y, frame.width, frame.height)
                );
            }
        }

        // image - url
        // objectgroup - collision data
    }
}

Tileset.prototype = Object.create(PIXI.Texture.prototype);
Tileset.prototype.constructor = Tileset;

module.exports = Tileset;

/**
 * Gets the tile properties for a tile based on it's ID
 *
 * @method getTileProperties
 * @param tileId {Number} The id of the tile to get the properties for
 * @return {Object} The properties of the tile
 */
Tileset.prototype.getTileProperties = function (tileId) {
    if (!tileId) {
        return null;
    }

    var flags = Tileset.FLAGS,
        flippedX = tileId & flags.FLIPPED_HORZ,
        flippedY = tileId & flags.FLIPPED_VERT,
        flippedAD = tileId & flags.FLIPPED_ANTI_DIAG;

    tileId = (tileId & ~Tileset.FLAGS.ALL) - this.firstgid;

    // if less than 0, then this id isn't in this tileset
    if (tileId < 0) {
        return null;
    }

    var props = this.tileproperties[tileId] ?
        //get this value
        this.tileproperties[tileId] :
        //set this id to default values and cache
        this.tileproperties[tileId] = {
            collides: false
        };

    props.flippedX = flippedX;
    props.flippedY = flippedY;
    props.flippedAD = flippedAD;

    return props;
};

/**
 * Gets the tile animations for a tile based on it's ID
 *
 * @method getTileProperties
 * @param tileId {Number} The id of the tile to get the animation frames for
 * @return {Phaser.FrameData} The frame data of the tile
 */
Tileset.prototype.getTileAnimations = function (tileId) {
    if (!tileId) {
        return null;
    }

    tileId = (tileId & ~Tileset.FLAGS.ALL) - this.firstgid;

    // if less than 0, then this id isn't in this tileset
    if (tileId < 0) {
        return null;
    }

    return this.tileanimations[tileId];
};

/**
 * Gets the tile texture for a tile based on it's ID
 *
 * @method getTileTexture
 * @param tileId {Number} The id of the tile to get the texture for
 * @return {Texture} The texture for the tile
 */
Tileset.prototype.getTileTexture = function (tileId) {
    if (!tileId) {
        return null;
    }

    // get the internal ID of the tile in this set (0 indexed)
    tileId = (tileId & ~Tileset.FLAGS.ALL) - this.firstgid;

    // if less than 0, then this id isn't in this tileset
    if (tileId < 0) {
        return null;
    }

    return this.textures[tileId];
};

/**
 * Returns whether or not this tileset contains the given tile guid
 *
 * @method contains
 * @param tileId {Number} The ID of the tile to check
 * @return {Boolean}
 */
Tileset.prototype.contains = function (tileId) {
    if (!tileId) {
        return false;
    }

    tileId &= ~Tileset.FLAGS.ALL;

    return (tileId >= this.firstgid && tileId <= this.lastgid);
};

Tileset.prototype.destroy = function () {
    PIXI.Texture.prototype.destroy.apply(this, arguments);

    // destroy sub tile textures
    for (var i = 0; i < this.textures.length; ++i) {
        this.textures[i].destroy();
    }

    this.tileoffset = null;
    this.numTiles = null;
    this.properties = null;
    this.tileproperties = null;
    this.size = null;
    this.textures = null;
    this.tileanimations = null;
};

/**
 * Tileset GID flags, these flags are set on a tile's ID to give it a special property
 *
 * @property FLAGS
 * @static
 */
Tileset.FLAGS = {
    FLIPPED_HORZ: 0x80000000,
    FLIPPED_VERT: 0x40000000,
    FLIPPED_ANTI_DIAG: 0x20000000
};

var mask = 0;
for(var f in Tileset.FLAGS) {
    mask |= Tileset.FLAGS[f];
}

Tileset.FLAGS.ALL = mask;

},{"../utils":17}],17:[function(require,module,exports){
/* jshint maxlen:200 */

var zlib = require('zlibjs'),
    Buffer = require('buffer').Buffer,
    decodeB64 = (typeof window !== 'undefined' && window.atob) || require('Base64').atob;

var utils = module.exports = {};

utils.stringToBuffer = function (str) {
    var len = str.length,
        buf = new Buffer(len);

    for(var i = 0; i < len; i++) {
        buf[i] = str.charCodeAt(i);
    }

    return buf;
};

utils.cacheKey = function (key, type, name) {
    return key + '_' + type + (name ? '_' + name : '');
};

utils.decompressBase64Data = function (raw, encoding, compression) {
    //TODO: This assumes base64 encoding, need to check encoding param
    var str = decodeB64(raw),
        buf = utils.stringToBuffer(str);

    //decompress
    if (compression === 'gzip') {
        return zlib.gunzipSync(buf);
    }
    else if (compression === 'zlib') {
        return zlib.inflateSync(buf);
    }

    return buf;
};

/**
 * Parses an array of numbers that represent a hitArea into the actual shape.
 *
 * For example: `[1, 1, 15]` is a Circle (`[x, y, radius]`); `[1, 1, 15, 15]` is a Rectangle
 * (`[x, y, width, height]`); and any length >= 5 is a polygon in the form `[x1, y1, x2, y2, ..., xN, yN]`.
 *
 * @method parseHitArea
 * @param value {Array<Number>} The array to parse
 * @return {Circle|Rectangle|Polygon} The parsed out shape
 */
utils.parseHitArea = function (hv) {
    var shape;

    //odd number of values
    if (hv.length % 2 !== 0 && hv.length !== 3) {
        throw new RangeError(
            'Strange number of values for hitArea! Should be a flat array of values, like: ' +
            '[cx,cy,di] for a circle, [x,y,w,h] for a rectangle, or [x,y,x,y,...] for other polygons.'
        );
    }

    //a circle x,y,r
    if (hv.length === 3) {
        shape = new Phaser.Circle(hv[0], hv[1], hv[2]);
    }
    //a rectangle x,y,w,h
    else if (hv.length === 4) {
        shape = new Phaser.Rectangle(hv[0], hv[1], hv[2], hv[3]);
    }
    //generic polygon
    else {
        shape = new Phaser.Polygon(hv);
    }

    return shape;
};

/**
 * Parses an object of string properties into potential javascript types. First it attempts to
 * convert to a number, if that fails it checks for the string 'true' or 'false' and changes it
 * to the actual Boolean value, then it attempts to parse a string as JSON.
 *
 * @method parseTiledProperties
 * @param value {Array<Number>} The array to parse
 * @return {Circle|Rectangle|Polygon} The parsed out shape
 */
utils.parseTiledProperties = function (obj) {
    obj = obj || {};

    if (!obj || obj.__tiledparsed) {
        return obj;
    }

    for(var k in obj) {
        var v = obj[k],
            n = parseFloat(v, 10);

        // try to massage numbers
        if (n === 0 || n) {
            obj[k] = n;
        }
        // true values
        else if (v === 'true') {
            obj[k] = true;
        }
        // false values
        else if (v === 'false') {
            obj[k] = false;
        }
        // anything else is either a string or json
        else {
            try{
                v = JSON.parse(v);
                obj[k] = v;
            } catch(e) {}
        }
    }

    if (obj.hitArea) {
        obj.hitArea = utils.parseHitArea(obj.hitArea);
    }

    if (obj.body === 'static' || obj.sensor) {
        obj.mass = Infinity;
        obj.inertia = Infinity;
    }

    obj.__tiledparsed = true;

    return obj;
};

},{"Base64":2,"buffer":3,"zlibjs":8}]},{},[1])(1)
});