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

import {DynmapProjection} from "@/leaflet/projection/DynmapProjection";
import {Util, LatLng} from 'leaflet';
import {Coordinate} from "@/dynmap";

export interface HDProjectionOptions {
	mapToWorld: [number, number, number, number, number, number, number, number, number],
	worldToMap: [number, number, number, number, number, number, number, number, number],
	nativeZoomLevels: number
}

export interface HDProjection extends DynmapProjection {
	options: HDProjectionOptions
}

export class HDProjection extends DynmapProjection {
	constructor(options: HDProjectionOptions) {
		super(options);
		Util.setOptions(this, options);
	}

	locationToLatLng(location: Coordinate): LatLng {
		const wtp = this.options.worldToMap,
			lat = wtp[3] * location.x + wtp[4] * location.y + wtp[5] * location.z,
			lng = wtp[0] * location.x + wtp[1] * location.y + wtp[2] * location.z;

		return new LatLng(
			-((128 - lat) / (1 << this.options.nativeZoomLevels)),
			lng / (1 << this.options.nativeZoomLevels));
	}

	latLngToLocation(latLng: LatLng, y: number): Coordinate {
		const ptw = this.options.mapToWorld,
			lat = latLng.lng * (1 << this.options.nativeZoomLevels),
			lon = 128 + latLng.lat * (1 << this.options.nativeZoomLevels),
			x = ptw[0] * lat + ptw[1] * lon + ptw[2] * y,
			z = ptw[6] * lat + ptw[7] * lon + ptw[8] * y;

		return {x: x, y: y, z: z};
	}
}

export default HDProjection;
