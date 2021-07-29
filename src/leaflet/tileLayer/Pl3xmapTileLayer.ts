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

import {LiveAtlasTileLayer, LiveAtlasTileLayerOptions} from "@/leaflet/tileLayer/LiveAtlasTileLayer";
import {useStore} from "@/store";
import {Util} from "leaflet";

// noinspection JSUnusedGlobalSymbols
export class Pl3xmapTileLayer extends LiveAtlasTileLayer {
	constructor(options: LiveAtlasTileLayerOptions) {
		const worldName = options.mapSettings.world.name,
			baseUrl = useStore().state.currentMapProvider!.getTilesUrl();

		super(`${baseUrl}${worldName}/{z}/{x}_{y}.png`, options);

		options.tileSize = 512;
		options.zoomReverse = false;

		Util.setOptions(this, options);
	}
}
