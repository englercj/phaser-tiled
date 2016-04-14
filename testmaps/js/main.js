require.config({
    shim: {
        'jquery.query': {
            deps: ['jquery'],
            exports: 'jQuery.fn.query'
        }
    },
    paths: {
        jquery: 'vendor/jquery-2.1.1.min',
        'jquery.query': 'vendor/jquery.query-object'
    }
});

require([
    'jquery',
    'resources',
    'jquery.query'
], function ($, resources) {

    var $game;
    var game;
    var packDataKey = 'tiledmaps_pack_data';
    var packData;

    // when DOM is ready, create the game instance
    $(function () {
        $game = $('#game');
        window.game = game = new Phaser.Game($game.width(),
            $game.height(), Phaser.AUTO, 'game', { preload: gamePreload, create: gameSetup }, false, false);
    });

    function gamePreload() {
        game.load.json(packDataKey, 'maps/tilemap-assets.json');
    }

    function gameSetup() {

        game.add.plugin(Phaser.Plugin.Tiled);

        packData = game.cache.getJSON(packDataKey);

        var $sw = $('#switch');
        var $fullscreen = $('#fullscreen');
        var map = $.query.get('map');

        // create a game state for each of the worlds
        resources.worlds.forEach(function (w) {
            var key = w.substring(w.lastIndexOf('/') + 1);

            game.state.add(key, {
                preload: function () {
                    this.load.pack(key, null, packData);
                },
                create: function () {
                    this.add.tiledmap(key).spawnObjects(function (obj) {
                        if (obj.type !== Phaser.SPRITE) return;

                        obj.inputEnabled = true;
                        obj.input.enableDrag();
                    });
                },
                update: function () {
                    if (game.input.mousePointer.active) {
                        moveCamera(game.input.mousePointer);
                    }

                    if (game.input.pointer1.active) {
                        moveCamera(game.input.pointer1);
                    }
                }
            }, false);

            $('<option/>', {
                value: key,
                text: key,
                selected: key === map
            }).appendTo($sw);
        });

        // use url parameter 'map' as starting map, if available
        if (map && game.state.checkState(map)) {
            game.state.start(map);
        }
        else {
            game.state.start(resources.worlds[0].substring(resources.worlds[0].lastIndexOf('/') + 1));
        }

        $sw.on('change', function () {
            window.location.search = $.query.set('map', $sw.val());
            game.state.start($sw.val());
        });

        $fullscreen.on('click', function () {
            game.scale.startFullScreen();
        });
    }

    var lastPos = new Phaser.Point();
    var pan = false;

    function moveCamera(pointer) {
        if (!pointer.timeDown) return;

        if (pointer.isDown && !pointer.targetObject) {
            if (pan) {
                game.camera.x += lastPos.x - pointer.position.x;
                game.camera.y += lastPos.y - pointer.position.y;
            }

            lastPos.copyFrom(pointer.position);
            pan = true;
        }

        if (pointer.isUp) {
            pan = false;
        }
    }
});
