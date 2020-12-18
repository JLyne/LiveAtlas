/*
 * Copyright 2020 James Lyne
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

import {DynmapPlayer} from "@/dynmap";
import {useStore} from "@/store";

const headCache = new Map<DynmapPlayer, HTMLImageElement>();

export default {
	getMinecraftTime(serverTime: number) {
		const day = serverTime >= 0 && serverTime < 13700;

		return {
			serverTime: serverTime,
			days: Math.floor((serverTime + 8000) / 24000),

			// Assuming it is day at 6:00
			hours: (Math.floor(serverTime / 1000) + 6) % 24,
			minutes: Math.floor(((serverTime / 1000) % 1) * 60),
			seconds: Math.floor(((((serverTime / 1000) % 1) * 60) % 1) * 60),

			day: day,
			night: !day
		};
	},

	getMinecraftHead(player: DynmapPlayer, size: string): Promise<HTMLImageElement> {
		if(headCache.has(player)) {
			return Promise.resolve(headCache.get(player) as HTMLImageElement);
		}

		return new Promise((resolve, reject) => {
			const faceImage = new Image();

			faceImage.onload = function() {
				headCache.set(player, faceImage);
				resolve(faceImage);
			};

			faceImage.onerror = function() {
				console.warn('Failed to retrieve face of "', player, '" with size "', size, '"!');
				reject();
			};

			const src = (size === 'body') ? `faces/body/${player.name}.png` :`faces/${size}x${size}/${player.name}.png`;
			faceImage.src = this.concatURL(window.config.url.markers, src);
		});
	},

	concatURL(base: string, addition: string) {
		if(base.indexOf('?') >= 0) {
			return base + escape(addition);
		}

		return base + addition;
	},

	getPointConverter() {
		const projection = useStore().state.currentProjection;

		return (x: number, y: number, z: number) => {
			return projection.locationToLatLng({x, y, z});
		};
	},

	parseMapHash(hash: string) {
		const parts = hash.replace('#', '').split(';');

		if(parts.length < 3) {
			throw new TypeError('Not enough parts');
		}

		const world = parts[0],
			map = parts[1],
			location = parts[2].split(',').map(item => parseFloat(item)),
			zoom = parts[3] ? parseInt(parts[3]) : undefined;

		if(location.length !== 3) {
			throw new TypeError('Location should contain exactly 3 numbers');
		}

		if(location.filter(item => isNaN(item) || !isFinite(item)).length) {
			throw new TypeError('Invalid value in location');
		}

		if(typeof zoom !== 'undefined' && (isNaN(zoom) || zoom < 0 || !isFinite(zoom))) {
			throw new TypeError('Invalid value for zoom');
		}

		return {
			world,
			map,
			location: {
				x: location[0],
				y: location[1],
				z: location[2],
			},
			zoom,
		}
	}
}