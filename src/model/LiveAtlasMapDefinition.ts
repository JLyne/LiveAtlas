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
import {Coordinate, LiveAtlasProjection, LiveAtlasOverlay, LiveAtlasWorldDefinition} from "@/index";

export interface LiveAtlasMapDefinitionOptions {
	world: LiveAtlasWorldDefinition;
	appendedWorld?: LiveAtlasWorldDefinition; // append_to_world

	name: string;
	displayName?: string;
	icon?: string;

	//FIXME: Try and remove these
	background?: string;
	nightAndDay?: boolean;
	backgroundDay?: string;
	backgroundNight?: string;
	projection?: LiveAtlasProjection;

	defaultZoom?: number;
	center?: Coordinate;
	overlays?: Map<string, LiveAtlasOverlay>;
}

export default class LiveAtlasMapDefinition implements LiveAtlasMapDefinitionOptions {
	readonly world: LiveAtlasWorldDefinition;
	readonly appendedWorld?: LiveAtlasWorldDefinition;

	readonly name: string;
	readonly displayName: string;
	readonly icon?: string;

	//FIXME: Try and remove these
	readonly background: string;
	readonly nightAndDay: boolean;
	readonly backgroundDay: string;
	readonly backgroundNight: string;

	readonly projection?: LiveAtlasProjection;
	readonly scale: number;

	readonly defaultZoom?: number;
	readonly center?: Coordinate;
	readonly overlays: Map<string, LiveAtlasOverlay>;


	constructor(options: LiveAtlasMapDefinitionOptions) {
		this.world = options.world;
		this.appendedWorld = options.appendedWorld; // append_to_world

		this.name = options.name;
		this.displayName = options.displayName || '';
		this.icon = options.icon || undefined;

		//FIXME: Try and remove these
		this.background = options.background || '#000000';
		this.nightAndDay = options.nightAndDay || false;
		this.backgroundDay = options.backgroundDay || '#000000';
		this.backgroundNight = options.backgroundNight || '#000000';
		this.projection = options.projection || undefined;
		this.scale = 1; //FIXME

		this.defaultZoom = options.defaultZoom || undefined;
		this.center = options.center || undefined;
		this.overlays = options.overlays || new Map();
	}

	//FIXME: Remove this
	locationToLatLng(location: Coordinate): LatLng {
		return this.projection ? this.projection.locationToLatLng(location)
			: new LatLng(-location.z * this.scale, location.x * this.scale);
	}

	//FIXME: Remove this
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
