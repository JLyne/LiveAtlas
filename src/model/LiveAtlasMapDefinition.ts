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

import {LatLng} from "leaflet";
import {ImageFormat} from "dynmap";
import {Coordinate, LiveAtlasProjection, LiveAtlasTileLayerOverlay, LiveAtlasWorldDefinition} from "@/index";
import {LiveAtlasTileLayerOptions} from "@/leaflet/tileLayer/LiveAtlasTileLayer";

export interface LiveAtlasMapDefinitionOptions extends LiveAtlasTileLayerOptions {
	world: LiveAtlasWorldDefinition;
	appendedWorld?: LiveAtlasWorldDefinition; // append_to_world

	name: string;
	displayName?: string;
	icon?: string;

	baseUrl: string;
	tileSize: number;
	imageFormat: ImageFormat;
	projection?: LiveAtlasProjection;
	prefix?: string;

	background?: string;
	nightAndDay?: boolean;
	backgroundDay?: string;
	backgroundNight?: string;

	nativeZoomLevels: number;
	extraZoomLevels?: number;
	minZoom?: number;
	maxZoom?: number;
	defaultZoom?: number;

	tileUpdateInterval?: number;
	center?: Coordinate;
	overlays?: Map<string, LiveAtlasTileLayerOverlay>;
}

export default class LiveAtlasMapDefinition implements LiveAtlasTileLayerOptions {
	readonly world: LiveAtlasWorldDefinition;
	readonly appendedWorld?: LiveAtlasWorldDefinition;

	readonly name: string;
	readonly displayName: string;
	readonly icon?: string;

	readonly baseUrl: string;
	readonly imageFormat: ImageFormat;
	readonly tileSize: number;
	readonly projection?: LiveAtlasProjection;
	readonly prefix: string;

	readonly background: string;
	readonly nightAndDay: boolean;
	readonly backgroundDay: string;
	readonly backgroundNight: string;

	readonly nativeZoomLevels: number;
	readonly extraZoomLevels: number;
	readonly minZoom: number;
	readonly maxZoom?: number;
	readonly defaultZoom?: number;

	readonly tileUpdateInterval?: number;
	readonly center?: Coordinate;
	readonly overlays: Map<string, LiveAtlasTileLayerOverlay>;

	readonly scale: number;

	constructor(options: LiveAtlasMapDefinitionOptions) {
		this.world = options.world;
		this.appendedWorld = options.appendedWorld; // append_to_world

		this.name = options.name;
		this.displayName = options.displayName || '';
		this.icon = options.icon || undefined;

		this.background = options.background || '#000000';
		this.nightAndDay = options.nightAndDay || false;
		this.backgroundDay = options.backgroundDay || '#000000';
		this.backgroundNight = options.backgroundNight || '#000000';

		this.baseUrl = options.baseUrl;
		this.imageFormat = options.imageFormat;
		this.tileSize = options.tileSize;
		this.projection = options.projection || undefined;
		this.prefix = options.prefix || '';

		this.nativeZoomLevels = options.nativeZoomLevels || 1;
		this.extraZoomLevels = options.extraZoomLevels || 0;
		this.minZoom = options.minZoom || 0;
		this.maxZoom = options.maxZoom || undefined;
		this.defaultZoom = options.defaultZoom || undefined;

		this.tileUpdateInterval = options.tileUpdateInterval || undefined;
		this.center = options.center || undefined;

		this.overlays = options.overlays || new Map();

		this.scale = (1 / Math.pow(2, this.nativeZoomLevels));
	}

	locationToLatLng(location: Coordinate): LatLng {
		return this.projection ? this.projection.locationToLatLng(location)
			: new LatLng(-location.z * this.scale, location.x * this.scale);
	}

	latLngToLocation(latLng: LatLng, y: number): Coordinate {
		return this.projection ? this.projection.latLngToLocation(latLng, y)
			: {x: latLng.lng / this.scale, y: y, z: -latLng.lat / this.scale};
	}

	hasCustomIcon(): boolean {
		return !!this.icon && !this.icon.startsWith('liveatlas_');
	}

	getIcon(): string {
		let worldType: string,
			mapType: string;

		if(this.icon) {
			if(this.icon.startsWith('liveatlas_')) {
				return this.icon.replace('liveatlas_', '');
			}

			return this.icon;
		}

		const mapName = this.name.split(/[^a-zA-Z\d]/, 1)[0];

		// list of map types, which have the same icon in every dimension
		let fixMapTypes = ['biome'];
		if (fixMapTypes.includes(mapName)) {
			worldType = 'world';
			mapType   = mapName;
		} else {
			switch (this.world.dimension) {
				case 'nether':
					worldType = 'nether';
					mapType   = ['surface', 'nether'].includes(mapName) ? 'surface' : 'flat';
					break;

				case 'end':
					worldType = 'the_end';
					mapType   = ['surface', 'the_end'].includes(mapName) ? 'surface' : 'flat';
					break;

				case 'overworld':
				default:
					worldType = 'world';
					mapType   = ['surface', 'flat', 'cave'].includes(mapName) ? mapName : 'flat';
					break;
			}
		}

		return `block_${worldType}_${mapType}`;
	}
}
