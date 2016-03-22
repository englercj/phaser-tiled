/// <reference path="../../phaser/typescript/phaser.d.ts" />

declare module Phaser {
    module Plugin {
        class Tiled implements Phaser.Plugin {

            constructor(game: Phaser.Game, parent: PIXI.DisplayObject);

            active: boolean;
            game: Phaser.Game;
            hasPostRender: boolean;
            hasPostUpdate: boolean;
            hasPreUpdate: boolean;
            hasRender: boolean;
            hasUpdate: boolean;
            parent: PIXI.DisplayObject;
            visible: boolean;

            destroy(): void;
            postRender(): void;
            preUpdate(): void;
            render(): void;
            update(): void;
        }

        module Tiled {
            interface ITiledObject {
                id: number;
                name: string;
                type: string;
                x: number;
                y: number;
                width: number;
                height: number;
                rotation: number;
                gid: number;
                visible: boolean;
                properties: any;
            }

            interface ITileAnimation {
                rate: number;
                data: Phaser.FrameData;
            }

            class Tile extends Phaser.Sprite {
                constructor(game: Phaser.Game, x: number, y: number, tileId: number, tileset: Tileset, layer: Tilelayer);

                layer: Tilelayer;
                tileset: Tileset;
                tilePosition: Phaser.Point;
                centerX: number;
                centerY: number;
                properties: any;
                scanned: boolean;
                faceTop: boolean;
                faceBottom: boolean;
                faceLeft: boolean;
                faceRight: boolean;
                collideLeft: boolean;
                collideRight: boolean;
                collideUp: boolean;
                collideDown: boolean;
                collisionCallback: () => any;
                collisionCallbackContext: any;

                worldX: number;
                worldY: number;
                collides: boolean;
                canCollide: boolean;
                left: number;
                right: number;
                top: number;
                bottom: number;

                containsPoint(x: number, y: number): boolean;
                intersects(x: number, y: number, right: number, bottom: number): boolean;
                setCollisionCallback(callback: () => any, context?: any): void;
                setCollision(left: boolean, right: boolean, up: boolean, down: boolean): void;
                resetCollision(): void;
                isInteresting(collides: boolean, faces: boolean): boolean;
                copy(tile: Tile): void;
            }

            class Tileset extends PIXI.Texture {
                constructor(game: Phaser.Game, key: string, settings: any);

                game: Phaser.Game;
                multiImage: boolean;
                firstgid: number;
                lastgid: number;
                name: string;
                tileWidth: number;
                tileHeight: number;
                spacing: number;
                margin: number;
                tileoffset: Phaser.Point;
                numTiles: Phaser.Point;
                properties: any;
                tileproperties: any;
                size: Phaser.Point;
                textures: PIXI.Texture[];
                tileanimations: { [key: string]: ITileAnimation };

                getTileProperties(tileId: number): any;
                getTileAnimations(tileId: number): ITileAnimation;
                getTileTexture(tileId: number): PIXI.Texture;
                contains(tileId: number): boolean;
            }

            class Tilemap extends Phaser.Group {
                key: string;
                size: Phaser.Point;
                tileWidth: number;
                tileHeight: number;
                scaledTileWidth: number;
                scaledTileHeight: number;
                orientation: string;
                format: number;
                version: number;
                properties: any;
                widthInPixels: number;
                heightInPixels: number;
                layers: Tilelayer[];
                tilesets: Tileset[];
                objects: Objectlayer[];
                images: Phaser.Sprite[];
                collideIndexes: number[];
                currentLayer: number;
                preventingRecalculate: boolean;
                needToRecalculate: boolean;
                dirty: boolean;

                setTileSize(tileWidth: number, tileHeight: number): void;
                getTilelayerIndex(name: string): number;
                getTilesetIndex(name: string): number;
                getImagelayerIndex(name: string): number;
                getObjectlayerIndex(name: string): number;
                getTilelayer(name: string): Tilelayer;
                getTileset(name: string): Tileset;
                getImagelayer(name: string): Phaser.Sprite;
                getObjectlayer(name: string): Objectlayer;
            }

            class Tilelayer extends Phaser.Group {
                constructor(game: Phaser.Game, map: Tilemap, layer: any, index: number);

                map: Tilemap;
                fixedToCamera: boolean;
                cameraOffset: Phaser.Point;
                tiles: any;
                scrollFactor: Phaser.Point;
                name: string;
                size: Phaser.Point;
                tileIds: number[];
                properties: any;
                layerType: string;
                rayStepRate: number;
                bodies: any[];
                dirty: boolean;

                scrollX: number;
                scrollY: number;
                widthInPixels: number;
                heightInPixels: number;
                collisionWidth: number;
                collisionHeight: number;

                setupRenderArea(): void;
                resizeWorld(): void;
                private setupTiles(): void;
                clearTiles(): Tilelayer;
                clearTile(tile: Tile): void;
                moveTileSprite(fromTileX: number, fromTileY: number, toTileX: number, toTileY: number): void;
                updatePan(): void;
                getRayCastTiles(line: Phaser.Line, stepRate?: number, collides?: boolean, interestingFace?: boolean): Tile[];
                getTiles(x: number, y: number, width: number, height: number, collides?: boolean, interestingFace?: boolean): Tile[];
            }

            class Objectlayer extends Phaser.Group {
                constructor(game: Phaser.Game, map: Tilemap, layer: any, index: number);

                index: number;
                map: Tilemap;
                name: string;
                color: string;
                properties: any;
                objects: ITiledObject[];
                layerType: string;
                bodies: any[];

                spawn(physicsBodyType?: number, spawnCallback?: () => void): Objectlayer;
                despawn(destroy?: boolean): Objectlayer;
                getObject(name: string): ITiledObject;
            }

            class utils {
                static stringToBuffer(str: string): any;
                static cacheKey(key: string, type: string, name?: string): string;
                static decompressBase64Data(raw: string, encoding: string, compression: string): any;
                static parseHitArea(value: number[]): (Phaser.Circle|Phaser.Rectangle|Phaser.Polygon);
                static parseTiledProperties(obj: any): any;
            }
        }
    }
}
