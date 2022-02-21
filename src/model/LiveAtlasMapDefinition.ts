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

import {Coordinate, LiveAtlasProjection, LiveAtlasWorldDefinition} from "@/index";
import {LatLng} from "leaflet";
import {ImageFormat} from "dynmap";

export interface LiveAtlasMapDefinitionOptions {
	world: LiveAtlasWorldDefinition;
	appendedWorld?: LiveAtlasWorldDefinition; // append_to_world
	name: string;
	displayName?: string;
	icon?: string;
	background?: string;
	nightAndDay?: boolean;
	backgroundDay?: string;
	backgroundNight?: string;
	imageFormat: ImageFormat;
	tileSize: number;
	prefix?: string;
	projection?: LiveAtlasProjection;
	nativeZoomLevels: number;
	extraZoomLevels: number;
	tileUpdateInterval?: number;
}

export default class LiveAtlasMapDefinition {
	readonly world: LiveAtlasWorldDefinition;
	readonly appendedWorld?: LiveAtlasWorldDefinition;
	readonly name: string;
	readonly icon?: string;
	readonly displayName: string;
	readonly background: string;
	readonly nightAndDay: boolean;
	readonly backgroundDay?: string;
	readonly backgroundNight?: string;
	readonly imageFormat: ImageFormat;
	readonly tileSize: number;
	readonly prefix: string;
	readonly projection?: LiveAtlasProjection;
	readonly nativeZoomLevels: number;
	readonly extraZoomLevels: number;
	readonly scale: number;
	readonly tileUpdateInterval?: number;

	constructor(options: LiveAtlasMapDefinitionOptions) {
		this.world = options.world;
		this.appendedWorld = options.appendedWorld; // append_to_world
		this.name = options.name;
		this.icon = options.icon || undefined;
		this.displayName = options.displayName || '';

		this.background = options.background || '#000000';
		this.nightAndDay = options.nightAndDay || false;
		this.backgroundDay = options.backgroundDay || '#000000';
		this.backgroundNight = options.backgroundNight || '#000000';

		this.imageFormat = options.imageFormat;
		this.tileSize = options.tileSize;
		this.prefix = options.prefix || '';
		this.projection = options.projection || undefined;

		this.nativeZoomLevels = options.nativeZoomLevels || 1;
		this.extraZoomLevels = options.extraZoomLevels || 0;
		this.scale = (1 / Math.pow(2, this.nativeZoomLevels));
		this.tileUpdateInterval = options.tileUpdateInterval || undefined;
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

		switch(this.world.dimension) {
			case 'nether':
				worldType = 'nether';
				mapType = ['surface', 'nether'].includes(this.name) ? 'surface' : 'flat';
				break;

			case 'end':
				worldType = 'the_end';
				mapType = ['surface', 'the_end'].includes(this.name) ? 'surface' : 'flat';
				break;

			case 'overworld':
			default:
				worldType = 'world';
				mapType = ['surface', 'flat', 'biome', 'cave'].includes(this.name) ? this.name : 'flat';
				break;
		}

		return `block_${worldType}_${mapType}`;
	}
}
