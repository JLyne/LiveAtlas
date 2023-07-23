/*
 * Copyright 2022 James Lyne
 *
 * Some portions of this file were taken from https://github.com/webbukkit/dynmap.
 * These portions are Copyright 2020 Dynmap Contributors.
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

import {LatLng} from 'leaflet';
import {Coordinate, LiveAtlasProjection} from "@/index";

export class SimpleProjection implements LiveAtlasProjection {
	private readonly scale: number;

	constructor(nativeZoomLevels: number) {
		this.scale = (1 / Math.pow(2, nativeZoomLevels));
	}

	locationToLatLng(location: Coordinate): LatLng {
		return new LatLng(-location.z * this.scale, location.x * this.scale);
	}

	latLngToLocation(latLng: LatLng, y: number): Coordinate {
		return {x: latLng.lng / this.scale, y: y, z: -latLng.lat / this.scale};
	}
}
