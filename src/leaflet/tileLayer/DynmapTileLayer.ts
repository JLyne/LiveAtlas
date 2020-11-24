import L, {Coords, DoneCallback, TileLayerOptions} from 'leaflet';
import {DynmapProjection} from "@/leaflet/projection/DynmapProjection";
import {Coordinate, DynmapMap} from "@/dynmap";

export interface DynmapTileLayerOptions extends TileLayerOptions {
	mapSettings: DynmapMap;
	errorTileUrl: string;
}

export interface DynmapTileLayer extends L.TileLayer {
	options: DynmapTileLayerOptions;
	_projection: any;
	_mapSettings: any;
	_cachedTileUrls: any;
	_namedTiles: any;

	locationToLatLng(location: Coordinate): L.LatLng;

	latLngToLocation(latLng: L.LatLng): Coordinate;
}

export interface DynmapTile extends HTMLImageElement {
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

export class DynmapTileLayer extends L.TileLayer {
	constructor(options: DynmapTileLayerOptions) {
		super('', options);

		if (options.mapSettings === null) {
			throw new TypeError("mapSettings missing");
		}

		this._projection = new DynmapProjection({});
		this._mapSettings = options.mapSettings;
		this._cachedTileUrls = {};
		this._namedTiles = {};
		L.Util.setOptions(this, options);
	}

	getTileName(coords: Coordinate): string {
		throw "getTileName not implemented";
	}

	getTileUrl(coords: Coordinate) {
		const tileName = this.getTileName(coords);
		let url = this._cachedTileUrls[tileName];

		if (!url) {
			const path = escape(`${this._mapSettings.world.name}/${tileName}`);
			url = `${window.config.url.tiles}${path}`;
			this._cachedTileUrls[tileName] = url;
		}

		return url;
	}

	updateNamedTile(name: string) {
		const tile = this._namedTiles[name];
		delete this._cachedTileUrls[name];

		if (tile) {
			//tile.src = this._cachedTileUrls[name] = this.getTileUrl(name);
		}
	}

	createTile(coords: Coords, done: DoneCallback) {
		const tile = super.createTile.call(this, coords, done) as DynmapTile,
			name = this.getTileName(coords);

		tile.tileName = name;

		// console.log("Adding " + tile.tileName);
		this._namedTiles[name] = tile;

		return tile;
	}

	// stops loading all tiles in the background layer
	_abortLoading() {
		let tile;
		for (const i in this._tiles) {
			if (!Object.prototype.hasOwnProperty.call(this._tiles, i)) {
				continue;
			}

			tile = this._tiles[i];

			if (tile.coords.z !== this._tileZoom) {
				if (tile.loaded && tile.el && (tile.el as DynmapTile).tileName) {
					// console.log("Aborting " + (tile.el as DynmapTile).tileName);
					delete this._namedTiles[(tile.el as DynmapTile).tileName];
				}
			}
		}

		super._abortLoading.call(this);
	}

	_removeTile(key: string) {
		const tile = this._tiles[key];

		if (!tile) {
			return;
		}

		const tileName = (tile.el as DynmapTile).tileName;

		if (tileName) {
			// console.log("Removing " + tileName);
			delete this._namedTiles[tileName];
			delete this._cachedTileUrls[tileName];
		}

		// @ts-ignore
		super._removeTile.call(this, key);
	}

	// Some helper functions.
	zoomprefix(amount: number) {
		return 'z'.repeat(amount);
	}

	getTileInfo(coords: Coordinate): TileInfo {
		// zoom: max zoomed in = this.options.maxZoom, max zoomed out = 0
		// izoom: max zoomed in = 0, max zoomed out = this.options.maxZoom
		// zoomoutlevel: izoom < mapzoomin -> 0, else -> izoom - mapzoomin (which ranges from 0 till mapzoomout)
		const izoom = this._getZoomForUrl(),
			zoomoutlevel = Math.max(0, izoom - this._mapSettings.extraZoomLevels),
			scale = 1 << zoomoutlevel,
			x = scale * coords.x,
			y = scale * coords.y;

		return {
			prefix: this._mapSettings.prefix,
			nightday: /*(this._mapSettings.nightAndDay && this.options.dynmap.serverday) ? '_day' :*/ '',
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
}
