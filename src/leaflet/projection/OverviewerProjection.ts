/*
 * Copyright 2022 James Lyne
 *
 * Some portions of this file were taken from https://github.com/overviewer/Minecraft-Overviewer.
 * These portions are Copyright 2022 Minecraft Overviewer Contributors.
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

export interface OverviewerProjectionOptions {
	upperRight: number,
	lowerRight: number,
	lowerLeft: number,
	northDirection: number,
	nativeZoomLevels: number,
	tileSize: number,
}

export class OverviewerProjection implements LiveAtlasProjection {
	private readonly upperRight: number;
	private readonly lowerRight: number;
	private readonly lowerLeft: number;
	private readonly northDirection: number;
	private readonly nativeZoomLevels: number;
	private readonly tileSize: number;
	private readonly perPixel: number;

	constructor(options: OverviewerProjectionOptions) {
		this.upperRight = options.upperRight;
		this.lowerRight = options.lowerRight;
		this.lowerLeft = options.lowerLeft;
		this.northDirection = options.northDirection;
		this.nativeZoomLevels = options.nativeZoomLevels || 1;
		this.tileSize = options.tileSize;

		this.perPixel = 1.0 / (this.tileSize * Math.pow(2, this.nativeZoomLevels));
	}

	locationToLatLng(location: Coordinate): LatLng {
        let lng = 0.5 - (1.0 / Math.pow(2, this.nativeZoomLevels + 1));
        let lat = 0.5;

		if (this.northDirection === this.upperRight) {
            const temp = location.x;
            location.x = -location.z + 15;
            location.z = temp;
        } else if(this.northDirection === this.lowerRight) {
            location.x = -location.x + 15;
            location.z = -location.z + 15;
        } else if(this.northDirection === this.lowerLeft) {
            const temp = location.x;
            location.x = location.z;
            location.z = -temp + 15;
        }

        lng += 12 * location.x * this.perPixel;
        lat -= 6 * location.x * this.perPixel;

        lng += 12 * location.z * this.perPixel;
        lat += 6 * location.z * this.perPixel;

        lng += 12 * this.perPixel;
        lat += 12 * (256 - location.y) * this.perPixel;

        return new LatLng(-lat * this.tileSize, lng * this.tileSize);
	}

	latLngToLocation(latLng: LatLng, y: number): Coordinate {
        const lat = (-latLng.lat / this.tileSize) - 0.5;
        const lng = (latLng.lng / this.tileSize) - (0.5 - (1.0 / Math.pow(2, this.nativeZoomLevels + 1)));

        const x = Math.floor((lng - 2 * lat) / (24 * this.perPixel)) + (256 - y),
			z = Math.floor((lng + 2 * lat) / (24 * this.perPixel)) - (256 - y);

		if (this.northDirection == this.upperRight) {
			return {x: z, y, z: -x + 15}
		} else if (this.northDirection == this.lowerRight) {
			return {x: -x + 15, y, z: -y + 15}
		} else if (this.northDirection == this.lowerLeft) {
			return {x: -z + 15, y, z: x}
		}

        return {x, y, z};
	}
}
