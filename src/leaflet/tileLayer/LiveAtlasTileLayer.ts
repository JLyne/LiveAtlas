/*
 * Copyright 2022 James Lyne
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

import {Map as LeafletMap, Coords, DomUtil, DoneCallback, TileLayer, TileLayerOptions, Util} from "leaflet";
import {LiveAtlasInternalTiles, LiveAtlasTileElement} from "@/index";
import falseFn = Util.falseFn;
import {ImageFormat} from "dynmap";

export interface LiveAtlasTileLayerOptions {
	baseUrl: string;
	tileSize: number;
	imageFormat: ImageFormat;
	prefix?: string;
	nightAndDay?: boolean;
	nativeZoomLevels: number;
	extraZoomLevels?: number;
	minZoom?: number;
	maxZoom?: number;
	tileUpdateInterval?: number;
}

export interface LiveAtlasTileLayerInternalOptions extends TileLayerOptions {
	baseUrl: string;
	imageFormat: ImageFormat;
	prefix: string;
	nightAndDay: boolean;
	extraZoomLevels: number;
	tileUpdateInterval?: number;
}

// noinspection JSUnusedGlobalSymbols
export abstract class LiveAtlasTileLayer extends TileLayer {
	declare options: LiveAtlasTileLayerInternalOptions;
	declare _tiles: LiveAtlasInternalTiles;
	declare _url: string;

	protected readonly tileTemplate: LiveAtlasTileElement;
	protected readonly loadQueue: LiveAtlasTileElement[] = [];
	protected readonly loadingTiles: Set<LiveAtlasTileElement> = Object.seal(new Set());
	protected refreshTimeout?: ReturnType<typeof setTimeout>;

	protected static genericLoadError = new Error('Tile failed to load');

	protected constructor(options: LiveAtlasTileLayerOptions) {
		super('', {
			errorTileUrl: 'images/blank.png',
			zoomReverse: true,
			tileSize: options.tileSize,
			maxNativeZoom: options.nativeZoomLevels,
			minZoom: options.minZoom,
			maxZoom: options.maxZoom || options.nativeZoomLevels + (options.extraZoomLevels || 0),
		});

		Util.setOptions(this, {
			imageFormat: options.imageFormat,
			baseUrl: options.baseUrl,
			tileUpdateInterval: options.tileUpdateInterval,
			nightAndDay: !!options.nightAndDay,
			prefix: options.prefix || '',
			extraZoomLevels: options.extraZoomLevels || 0,
			nativeZoomLevels: options.nativeZoomLevels,
		});

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
		} catch(e: any) {
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

			const tile = this._tiles[i];

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

			tile = this._tiles[i];

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
		const tile = this._tiles[key];

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

	onAdd(map: LeafletMap): this {
		if(this.options.tileUpdateInterval) {
			this.refreshTimeout = setTimeout(() => this.handlePeriodicRefresh(), this.options.tileUpdateInterval);
		}

		return super.onAdd(map);
	}

	remove() {
		if(this.refreshTimeout) {
			clearTimeout(this.refreshTimeout);
		}

		return super.remove();
	}

	private handlePeriodicRefresh() {
		if(this._map) {
			this.refresh();
		}

		this.refreshTimeout = setTimeout(() => this.handlePeriodicRefresh(), this.options.tileUpdateInterval);
	}
}
