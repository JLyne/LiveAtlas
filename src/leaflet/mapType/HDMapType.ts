import L from 'leaflet';
import HDProjection from "@/leaflet/projection/HDProjection";
import {Coordinate} from "@/dynmap";
import {DynmapTileLayer, DynmapTileLayerOptions} from "@/leaflet/tileLayer/DynmapTileLayer";

export interface HDMapTypeOptions extends DynmapTileLayerOptions {}

export interface HDMapType extends DynmapTileLayer {
}

export class HDMapType extends DynmapTileLayer {
	constructor(options: DynmapTileLayerOptions) {
		super(options);

		options.maxZoom = this._mapSettings.nativeZoomLevels + this._mapSettings.extraZoomLevels;
		options.maxNativeZoom = this._mapSettings.nativeZoomLevels;
		options.zoomReverse = true;
		options.tileSize = 128;
		options.minZoom = 0;

		L.Util.setOptions(this, options);
		this._projection = Object.freeze(new HDProjection({
			mapToWorld: this._mapSettings.mapToWorld,
			worldToMap: this._mapSettings.worldToMap,
			nativeZoomLevels: this._mapSettings.nativeZoomLevels,
		}));
	}

	getTileName(coords: Coordinate) {
		const info = super.getTileInfo(coords);
		// Y is inverted for HD-map.
		info.y = -info.y;
		info.scaledy = info.y >> 5;
		return `${info.prefix}${info.nightday}/${info.scaledx}_${info.scaledy}/${info.zoom}${info.x}_${info.y}.${info.fmt}`;
	}

	zoomprefix(amount: number) {
		// amount == 0 -> ''
		// amount == 1 -> 'z_'
		// amount == 2 -> 'zz_'
		return 'z'.repeat(amount) + (amount === 0 ? '' : '_');
	}
}
