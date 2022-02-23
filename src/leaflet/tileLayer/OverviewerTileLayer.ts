/*
 * Copyright 2022 James Lyne
 *
 * Some portions of this file were taken from https://github.com/overviewer/Minecraft-Overviewer.
 * These portions are Copyright 2022 Minecraft Overviewer Contributors.
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

import {LiveAtlasTileLayer, LiveAtlasTileLayerOptions} from "@/leaflet/tileLayer/LiveAtlasTileLayer";
import {Coords, Util} from "leaflet";

// noinspection JSUnusedGlobalSymbols
export class OverviewerTileLayer extends LiveAtlasTileLayer {
	private readonly _baseUrl: string;

	constructor(options: LiveAtlasTileLayerOptions) {
		super('', options);

		options.zoomReverse = false;

		Util.setOptions(this, options);

		this._mapSettings = options.mapSettings;
		this._baseUrl = options.mapSettings.baseUrl;
	}

	getTileUrl(coords: Coords): string {
		let url = this._mapSettings.name;
		const zoom = coords.z,
			urlBase = this._mapSettings.prefix;

		if(coords.x < 0 || coords.x >= Math.pow(2, zoom) ||
			coords.y < 0 || coords.y >= Math.pow(2, zoom)) {
			url += '/blank';
		} else if(zoom === 0) {
			url += '/base';
		} else {
			for(let z = zoom - 1; z >= 0; --z) {
				const x = Math.floor(coords.x / Math.pow(2, z)) % 2;
				const y = Math.floor(coords.y / Math.pow(2, z)) % 2;
				url += '/' + (x + 2 * y);
			}
		}
		url = url + '.' + this._mapSettings.imageFormat;
		// if(typeof overviewerConfig.map.cacheTag !== 'undefined') {
		// 	url += '?c=' + overviewerConfig.map.cacheTag;
		// }
		return(this._baseUrl + urlBase + url);
	}
}
