/*
 * Copyright 2020 James Lyne
 *
 * Some portions of this file were taken from https://github.com/webbukkit/dynmap.
 * These portions are Copyright 2020 Dynmap Contributors.
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

import {TileLayer, Coords, DoneCallback, TileLayerOptions, DomUtil, Util, LatLng} from 'leaflet';
import {DynmapProjection} from "@/leaflet/projection/DynmapProjection";
import {store} from "@/store";
import {Coordinate, LiveAtlasWorldMap} from "@/index";

export interface DynmapTileLayerOptions extends TileLayerOptions {
	mapSettings: LiveAtlasWorldMap;
	errorTileUrl: string;
	night?: boolean;
}

export interface DynmapTileLayer extends TileLayer {
	options: DynmapTileLayerOptions;
	_projection: DynmapProjection;
	_mapSettings: LiveAtlasWorldMap;
	_cachedTileUrls: Map<string, string>;
	_namedTiles: Map<string, DynmapTileElement>;
	_tileTemplate: DynmapTileElement;
	_loadQueue: DynmapTileElement[];
	_loadingTiles: Set<DynmapTileElement>;

	locationToLatLng(location: Coordinate): LatLng;

	latLngToLocation(latLng: LatLng): Coordinate;
}

export interface DynmapTile {
	active?: boolean;
	coords: Coords;
	current: boolean;
	el: DynmapTileElement;
	loaded?: Date;
	retain?: boolean;
	complete: boolean;
}

export interface DynmapTileElement extends HTMLImageElement {
	tileName: string;
}

export interface TileInfo {
	prefix: string;
	nightday: string;
	scaledx: number;
	scaledy: number;
	zoom: string;
	zoomprefix: string;
	x: number;
	y: number;
	fmt: string;
}

// noinspection JSUnusedGlobalSymbols
export class DynmapTileLayer extends TileLayer {
	constructor(options: DynmapTileLayerOptions) {
		super('', options);

		this._mapSettings = options.mapSettings;
		options.maxZoom = this._mapSettings.nativeZoomLevels + this._mapSettings.extraZoomLevels;
		options.maxNativeZoom = this._mapSettings.nativeZoomLevels;
		options.zoomReverse = true;
		options.tileSize = 128;
		options.minZoom = 0;

		Util.setOptions(this, options);

		if (options.mapSettings === null) {
			throw new TypeError("mapSettings missing");
		}

		this._projection = new DynmapProjection({
			mapToWorld: this._mapSettings.mapToWorld,
			worldToMap: this._mapSettings.worldToMap,
			nativeZoomLevels: this._mapSettings.nativeZoomLevels,
		});
		this._cachedTileUrls = Object.seal(new Map());
		this._namedTiles = Object.seal(new Map());
		this._loadQueue = [];
		this._loadingTiles = Object.seal(new Set());

		this._tileTemplate = DomUtil.create('img', 'leaflet-tile') as DynmapTileElement;
		this._tileTemplate.style.width = this._tileTemplate.style.height = this.options.tileSize + 'px';
		this._tileTemplate.alt = '';
		this._tileTemplate.tileName = '';
		this._tileTemplate.setAttribute('role', 'presentation');

		Object.seal(this._tileTemplate);

		if(this.options.crossOrigin || this.options.crossOrigin === '') {
			this._tileTemplate.crossOrigin = this.options.crossOrigin === true ? '' : this.options.crossOrigin;
		}
	}

	getTileName(coords: Coordinate) {
		const info = this.getTileInfo(coords);
		// Y is inverted for HD-map.
		info.y = -info.y;
		info.scaledy = info.y >> 5;
		return `${info.prefix}${info.nightday}/${info.scaledx}_${info.scaledy}/${info.zoom}${info.x}_${info.y}.${info.fmt}`;
	}

	getTileUrl(coords: Coordinate) {
		return this.getTileUrlFromName(this.getTileName(coords));
	}

	getTileUrlFromName(name: string, timestamp?: number) {
		let url = this._cachedTileUrls.get(name);

		if (!url) {
			const path = escape(`${this._mapSettings.world.name}/${name}`);
			url = `${store.getters.serverConfig.dynmap.tiles}${path}`;

			if(typeof timestamp !== 'undefined') {
				url += (url.indexOf('?') === -1 ? `?timestamp=${timestamp}` : `&timestamp=${timestamp}`);
			}

			this._cachedTileUrls.set(name, url);
		}

		return url;
	}

	updateNamedTile(name: string, timestamp: number) {
		const tile = this._namedTiles.get(name);
		this._cachedTileUrls.delete(name);

		if (tile) {
			tile.dataset.src = this.getTileUrlFromName(name, timestamp);
			this._loadQueue.push(tile);
			this._tickLoadQueue();
		}
	}

	createTile(coords: Coords, done: DoneCallback) {
		//Clone template image instead of creating a new one
		const tile = this._tileTemplate.cloneNode(false) as DynmapTileElement;

		tile.tileName = this.getTileName(coords);
		tile.dataset.src = this.getTileUrl(coords);

		this._namedTiles.set(tile.tileName, tile);
		this._loadQueue.push(tile);

		//Use addEventListener here
		tile.onload = () => {
			this._tileOnLoad(done, tile);
			this._loadingTiles.delete(tile);
			this._tickLoadQueue();
		};
		tile.onerror = () => {
			this._tileOnError(done, tile, {name: 'Error', message: 'Error'});
			this._loadingTiles.delete(tile);
			this._tickLoadQueue();
		};

		this._tickLoadQueue();

		return tile;
	}

	_tickLoadQueue() {
		if (this._loadingTiles.size > 6) {
			return;
		}

		const tile = this._loadQueue.shift();

		if (!tile) {
			return;
		}

		this._loadingTiles.add(tile);
		tile.src = tile.dataset.src as string;
	}

	// stops loading all tiles in the background layer
	_abortLoading() {
		let tile;

		for (const i in this._tiles) {
			if (!Object.prototype.hasOwnProperty.call(this._tiles, i)) {
				continue;
			}

			tile = this._tiles[i] as DynmapTile;

			if (tile.coords.z !== this._tileZoom) {
				if (tile.loaded && tile.el && tile.el.tileName) {
					this._namedTiles.delete(tile.el.tileName);
				}

				if(this._loadQueue.includes(tile.el)) {
					this._loadQueue.splice(this._loadQueue.indexOf(tile.el), 1);
				}

				this._loadingTiles.delete(tile.el);
			}
		}

		super._abortLoading.call(this);
	}

	_removeTile(key: string) {
		const tile = this._tiles[key] as DynmapTile;

		if (!tile) {
			return;
		}

		const tileName = tile.el.tileName as string;

		if (tileName) {
			this._namedTiles.delete(tileName);
			this._cachedTileUrls.delete(tileName);
			this._loadingTiles.delete(tile.el);

			if(this._loadQueue.includes(tile.el)) {
				this._loadQueue.splice(this._loadQueue.indexOf(tile.el), 1);
			}

			tile.el.onerror = null;
			tile.el.onload = null;
		}

		// @ts-ignore
		super._removeTile.call(this, key);
	}

	// Some helper functions.
	zoomprefix(amount: number) {
		// amount == 0 -> ''
		// amount == 1 -> 'z_'
		// amount == 2 -> 'zz_'
		return 'z'.repeat(amount) + (amount === 0 ? '' : '_');
	}

	getTileInfo(coords: Coordinate): TileInfo {
		// zoom: max zoomed in = this.options.maxZoom, max zoomed out = 0
		// izoom: max zoomed in = 0, max zoomed out = this.options.maxZoom
		// zoomoutlevel: izoom < mapzoomin -> 0, else -> izoom - mapzoomin (which ranges from 0 till mapzoomout)
		const izoom = this._getZoomForUrl(),
			zoomoutlevel = Math.max(0, izoom - this._mapSettings.extraZoomLevels),
			scale = (1 << zoomoutlevel),
			x = scale * coords.x,
			y = scale * coords.y;

		return {
			prefix: this._mapSettings.prefix,
			nightday: (this._mapSettings.nightAndDay && !this.options.night) ? '_day' : '',
			scaledx: x >> 5,
			scaledy: y >> 5,
			zoom: this.zoomprefix(zoomoutlevel),
			zoomprefix: (zoomoutlevel == 0) ? "" : (this.zoomprefix(zoomoutlevel) + "_"),
			x: x,
			y: y,
			fmt: this._mapSettings.imageFormat || 'png'
		};
	}

	getProjection(): DynmapProjection {
		return this._projection;
	}

	setNight(night: boolean) {
		if(this.options.night !== night) {
			this.options.night = night;
			this.redraw();
		}
	}
}
