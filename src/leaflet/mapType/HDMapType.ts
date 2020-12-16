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

import {Util} from 'leaflet';
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

		Util.setOptions(this, options);
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
