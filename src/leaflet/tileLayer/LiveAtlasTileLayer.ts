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

import {TileLayer, TileLayerOptions, Util} from 'leaflet';
import LiveAtlasMapDefinition from "@/model/LiveAtlasMapDefinition";

export interface LiveAtlasTileLayerOptions extends TileLayerOptions {
	mapSettings: LiveAtlasMapDefinition;
	errorTileUrl: string;
}

// noinspection JSUnusedGlobalSymbols
export abstract class LiveAtlasTileLayer extends TileLayer {
	protected _mapSettings: LiveAtlasMapDefinition;
	declare options: LiveAtlasTileLayerOptions;

	protected constructor(url: string, options: LiveAtlasTileLayerOptions) {
		super(url, options);

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
	}
}
