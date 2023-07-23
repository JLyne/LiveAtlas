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

import {LatLng, Map, MapOptions} from 'leaflet';
import {Coordinate, LiveAtlasProjection} from "@/index";
import {SimpleProjection} from "@/leaflet/projection/SimpleProjection";

export default class LiveAtlasLeafletMap extends Map {
	private _projection: LiveAtlasProjection = new SimpleProjection(1);

	constructor(element: string | HTMLElement, options?: MapOptions) {
		super(element, options);
	}

	setProjection(projection: LiveAtlasProjection) {
		this._projection = projection;
		this.fire('projectionchange', projection);
	}

	getProjection(): LiveAtlasProjection {
		return this._projection;
	}

	locationToLatLng(location: Coordinate): LatLng {
		return this._projection.locationToLatLng(location);
	}

	latLngToLocation(latLng: LatLng, y: number): Coordinate {
		return this._projection.latLngToLocation(latLng, y);
	}
}
