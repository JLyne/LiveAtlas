/*
 * Copyright 2021 James Lyne
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import LiveAtlasMapDefinition from "@/model/LiveAtlasMapDefinition";
import {Coords, DomUtil, DoneCallback, TileLayer, TileLayerOptions, Util} from "leaflet";
import {LiveAtlasTile, LiveAtlasTileElement} from "@/index";
import falseFn = Util.falseFn;

export interface LiveAtlasTileLayerOptions extends TileLayerOptions {
	mapSettings: LiveAtlasMapDefinition;
	errorTileUrl: string;
}

// noinspection JSUnusedGlobalSymbols
export abstract class LiveAtlasTileLayer extends TileLayer {
	declare options: LiveAtlasTileLayerOptions;

	protected _mapSettings: LiveAtlasMapDefinition;
	private readonly tileTemplate: LiveAtlasTileElement;
	protected readonly loadQueue: LiveAtlasTileElement[] = [];
	private readonly loadingTiles: Set<LiveAtlasTileElement> = Object.seal(new Set());

	private static genericLoadError = new Error('Tile failed to load');

	protected constructor(url: string, options: LiveAtlasTileLayerOptions) {
		super(url, options);

		this._mapSettings = options.mapSettings;
		this.tileTemplate = DomUtil.create('img', 'leaflet-tile') as LiveAtlasTileElement;
		this.tileTemplate.style.width = this.tileTemplate.style.height = this.options.tileSize + 'px';
		this.tileTemplate.alt = '';
		this.tileTemplate.tileName = '';
		this.tileTemplate.callback = falseFn;
		this.tileTemplate.setAttribute('role', 'presentation');

		if(this.options.crossOrigin || this.options.crossOrigin === '') {
			this.tileTemplate.crossOrigin = this.options.crossOrigin === true ? '' : this.options.crossOrigin;
		}

		Object.seal(this.tileTemplate);

		options.maxZoom = this._mapSettings.nativeZoomLevels + this._mapSettings.extraZoomLevels;
		options.maxNativeZoom = this._mapSettings.nativeZoomLevels;
		options.zoomReverse = true;
		options.tileSize = 128;
		options.minZoom = 0;

		Util.setOptions(this, options);

		if (options.mapSettings === null) {
			throw new TypeError("mapSettings missing");
		}
	}

	// @method createTile(coords: Object, done?: Function): HTMLElement
	// Called only internally, overrides GridLayer's [`createTile()`](#gridlayer-createtile)
	// to return an `<img>` HTML element with the appropriate image URL given `coords`. The `done`
	// callback is called when the tile has been loaded.
	createTile(coords: Coords, done: DoneCallback) {
		const tile = this.tileTemplate.cloneNode(false) as LiveAtlasTileElement;
		this.loadQueue.push(tile);

		tile.onload = () => {
			URL.revokeObjectURL(tile.src); //Revoke the object URL as we don't need it anymore

			this._tileOnLoad(done, tile);
			this.loadingTiles.delete(tile);
			this.tickLoadQueue();
		};

		tile.onerror = () => {
			this._tileOnError(done, tile, LiveAtlasTileLayer.genericLoadError);
			this.loadingTiles.delete(tile);
			this.tickLoadQueue();
		};

		tile.url = this.getTileUrl(coords);
		tile.callback = done;

		this.tickLoadQueue();

		return tile;
	}

	private async fetchTile(tile: LiveAtlasTileElement) {
		if(tile.abortController && !tile.abortController.signal.aborted) {
			tile.abortController.abort();
		}

		tile.abortController = new AbortController();

		try {
			//Retrieve image via a fetch instead of just setting the src
			//This works around the fact that browsers usually don't make a request for an image that was previously loaded,
			//without resorting to changing the URL (which would break caching).
			const response = await fetch(tile.url, {signal: tile.abortController.signal});

			//Call leaflet's error handler if request fails for some reason
			if (!response.ok) {
				this._tileOnError(tile.callback, tile, new Error('Response was not ok'));
				return;
			}

			//Get image data and convert into object URL so it can be used as a src
			//The tile onload listener will take it from here
			const blob = await response.blob();
			tile.src = URL.createObjectURL(blob);
		} catch(e) {
			if (e instanceof DOMException && e.name === 'AbortError') {
				return;
			}

			console.error(e);

			this._tileOnError(tile.callback, tile, e);
		}
	}

	protected tickLoadQueue() {
		if (this.loadingTiles.size > 6) {
			return;
		}

		const tile = this.loadQueue.shift();

		if (!tile) {
			return;
		}

		this.loadingTiles.add(tile);
		this.fetchTile(tile);
	}

	refresh() {
		for (const i in this._tiles) {
			if (!Object.prototype.hasOwnProperty.call(this._tiles, i)) {
				continue;
			}

			const tile = this._tiles[i] as LiveAtlasTile;

			if(tile.loaded) {
				this.loadQueue.push(tile.el);
			}
		}

		this.tickLoadQueue();
	}

	_abortLoading() {
		let tile;

		for (const i in this._tiles) {
			if (!Object.prototype.hasOwnProperty.call(this._tiles, i)) {
				continue;
			}

			tile = this._tiles[i] as LiveAtlasTile;

			if (tile.coords.z !== this._tileZoom) {
				if (!tile.loaded && tile.el && tile.el.abortController) {
					tile.el.abortController.abort();
				}

				if(this.loadQueue.includes(tile.el)) {
					this.loadQueue.splice(this.loadQueue.indexOf(tile.el), 1);
				}

				this.loadingTiles.delete(tile.el);
			}
		}

		super._abortLoading.call(this);
	}

	_removeTile(key: string) {
		const tile = this._tiles[key] as LiveAtlasTile;

		if (!tile) {
			return;
		}

		this.loadingTiles.delete(tile.el);

		if(this.loadQueue.includes(tile.el)) {
			this.loadQueue.splice(this.loadQueue.indexOf(tile.el), 1);
		}

		tile.el.onerror = null;
		tile.el.onload = null;

		if(!tile.loaded && tile.el.abortController) {
			tile.el.abortController.abort();
		}

		// @ts-ignore
		super._removeTile(key);
	}
}
