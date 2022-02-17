/*
 * Copyright 2021 James Lyne
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
import {Coordinate} from "@/index";

export interface LiveAtlasProjectionOptions {
	mapToWorld: [number, number, number, number, number, number, number, number, number],
	worldToMap: [number, number, number, number, number, number, number, number, number],
	nativeZoomLevels: number,
	tileSize: number,
}

export class LiveAtlasProjection {
	private readonly mapToWorld: [number, number, number, number, number, number, number, number, number];
	private readonly worldToMap: [number, number, number, number, number, number, number, number, number];
	private readonly nativeZoomLevels: number;
	private readonly tileSize: number;

	constructor(options: LiveAtlasProjectionOptions) {
		this.mapToWorld = options.mapToWorld || [0, 0, 0, 0, 0, 0, 0, 0];
		this.worldToMap = options.worldToMap || [0, 0, 0, 0, 0, 0, 0, 0];
		this.nativeZoomLevels = options.nativeZoomLevels || 1;
		this.tileSize = options.tileSize;
	}

	locationToLatLng(location: Coordinate): LatLng {
		const wtp = this.worldToMap,
			lat = wtp[3] * location.x + wtp[4] * location.y + wtp[5] * location.z,
			lng = wtp[0] * location.x + wtp[1] * location.y + wtp[2] * location.z;

		return new LatLng(
			-((this.tileSize - lat) / (1 << this.nativeZoomLevels)),
			lng / (1 << this.nativeZoomLevels));
	}

	latLngToLocation(latLng: LatLng, y: number): Coordinate {
		const ptw = this.mapToWorld,
			lon = this.tileSize + latLng.lat * (1 << this.nativeZoomLevels),
			lat = latLng.lng * (1 << this.nativeZoomLevels),
			x = ptw[0] * lon + ptw[1] * lat + ptw[2] * y,
			z = ptw[6] * lon + ptw[7] * lat + ptw[8] * y;

		return {x: x, y: y, z: z};
	}
}
