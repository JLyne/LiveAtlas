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

import {Coordinate, LiveAtlasWorldDefinition} from "@/index";
import {LatLng} from "leaflet";
import {LiveAtlasProjection} from "@/model/LiveAtlasProjection";

export interface LiveAtlasMapDefinitionOptions {
	world: LiveAtlasWorldDefinition;
	name: string;
	displayName?: string;
	icon?: string;
	background?: string;
	nightAndDay?: boolean;
	backgroundDay?: string;
	backgroundNight?: string;
	imageFormat: string;
	prefix?: string;
	mapToWorld?: [number, number, number, number, number, number, number, number, number];
	worldToMap?: [number, number, number, number, number, number, number, number, number];
	nativeZoomLevels: number;
	extraZoomLevels: number;
	tileUpdateInterval?: number;
}

export default class LiveAtlasMapDefinition {
	readonly world: LiveAtlasWorldDefinition;
	readonly name: string;
	readonly icon?: string;
	readonly displayName: string;
	readonly background: string;
	readonly nightAndDay: boolean;
	readonly backgroundDay?: string;
	readonly backgroundNight?: string;
	readonly imageFormat: string;
	readonly prefix: string;
	private readonly projection?: Readonly<LiveAtlasProjection>;
	readonly nativeZoomLevels: number;
	readonly extraZoomLevels: number;
	readonly scale: number;
	readonly tileUpdateInterval?: number;

	constructor(options: LiveAtlasMapDefinitionOptions) {
		this.world = options.world; //Ignore append_to_world here otherwise things break
		this.name = options.name;
		this.icon = options.icon || undefined;
		this.displayName = options.displayName || '';

		this.background = options.background || '#000000';
		this.nightAndDay = options.nightAndDay || false;
		this.backgroundDay = options.backgroundDay || '#000000';
		this.backgroundNight = options.backgroundNight || '#000000';

		this.imageFormat = options.imageFormat;
		this.prefix = options.prefix || '';

		this.nativeZoomLevels = options.nativeZoomLevels || 1;
		this.extraZoomLevels = options.extraZoomLevels || 0;
		this.scale = (1 / Math.pow(2, this.nativeZoomLevels));
		this.tileUpdateInterval = options.tileUpdateInterval || undefined;

		if(options.mapToWorld || options.worldToMap) {
			this.projection = new LiveAtlasProjection({
				mapToWorld: options.mapToWorld || [0, 0, 0, 0, 0, 0, 0, 0, 0],
				worldToMap: options.worldToMap || [0, 0, 0, 0, 0, 0, 0, 0, 0],
				nativeZoomLevels: this.nativeZoomLevels,
			});
		}
	}

	locationToLatLng(location: Coordinate): LatLng {
		return this.projection ? this.projection.locationToLatLng(location)
			: new LatLng(-location.z * this.scale, location.x * this.scale);
	}

	latLngToLocation(latLng: LatLng, y: number): Coordinate {
		return this.projection ? this.projection.latLngToLocation(latLng, y)
			: {x: latLng.lng / this.scale, y: y, z: -latLng.lat / this.scale};
	}

	getIcon(): string {
		let worldType: string,
			mapType: string;

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
