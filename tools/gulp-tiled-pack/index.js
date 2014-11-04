var through = require('through2'),
    gutil = require('gulp-util'),
    parseXml = require('xml2js').parseString,
    path = require('path'),
    File = require('vinyl'),
    app = 'gulp-tiled-pack';

function tilemapPack(options) {
    options = options || {};
    options.baseUrl = options.baseUrl || '';
    options.useExtInKey = options.useExtInKey || false;

    var result = {
        meta: {
            generated: Date.now().toString(),
            version: '1.0',
            app: app,
            url: 'https://github.com/englercj/phaser-tiled'
        }
    };

    return through.obj(function (file, encoding, cb) {
        if (file.isNull()) {
            return cb();
        }

        if (file.isStream()) {
            this.emit('error', new gutil.PluginError(app, 'Streaming not supported'));
            return cb();
        }

        try {
            var fname = path.basename(file.path),
                relDir = file.relative.replace(fname, ''),
                ext = path.extname(file.path),
                key = path.basename(file.path, options.useExtInKey ? undefined : ext);

            if (result[key]) {
                gutil.log(app + ': Key already exists in asset pack:', key);
                return cb();
            }

            if (ext === '.tmx') {
                parseXml(file.contents.toString(), function (err, data) {
                    if (err) return this.emit('error', new gutil.PluginError(app, err));

                    process(data.map, 'xml');
                });
            }
            else {
                process(JSON.parse(file.contents.toString()), 'json');
            }

            function process(fdata, fmt) {
                var assets = [],
                    xml = fmt === 'xml',
                    tilesets = xml ? fdata.tileset : fdata.tilesets,
                    imglayers = xml ? fdata.imagelayer : fdata.layers.filter(function (l) { return l.type === 'imagelayer'; }),
                    imgsrc,
                    i;

                if (tilesets) {
                    for(i = 0; i < tilesets.length; ++i) {
                        imgsrc = xml ? tilesets[i].image[0].$.source : tilesets[i].image;

                        assets.push({
                            type: 'image',
                            subtype: 'tileset',
                            key: key + '_tileset_' + (xml ? tilesets[i].$.name : tilesets[i].name),
                            name: (xml ? tilesets[i].$.name : tilesets[i].name),
                            url: path.join(options.baseUrl, relDir, imgsrc).replace(/\\/g, '/'),
                            overwrite: false
                        });
                    }
                }

                if (imglayers) {
                    for(i = 0; i < imglayers.length; ++i) {
                        imgsrc = xml ? imglayers[i].image[0].$.source : imglayers[i].image;

                        assets.push({
                            type: 'image',
                            subtype: 'layer',
                            key: key + '_layer_' + (xml ? imglayers[i].$.name : imglayers[i].name),
                            name: (xml ? imglayers[i].$.name : imglayers[i].name),
                            url: path.join(options.baseUrl, relDir, imgsrc).replace(/\\/g, '/'),
                            overwrite: false
                        })
                    }
                }

                assets.push({
                    type: 'tiledmap',
                    key: 'tiledmap_' + key,
                    url: path.join(options.baseUrl, file.relative).replace(/\\/g, '/'),
                    format: xml ? 'TILED_XML' : 'TILED_JSON'
                });

                result[key] = assets;

                cb();
            }
        } catch (err) {
            this.emit('error', new gutil.PluginError(app, err));
            cb();
        }
    }, function (cb) {
        this.push(new File({
            path: 'tilemap-assets.json',
            contents: new Buffer(JSON.stringify(result, null, 4))
        }));

        cb();
    });
}

module.exports = tilemapPack;
