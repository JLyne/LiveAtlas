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

const headCache = new Map<DynmapPlayer, HTMLImageElement>(),
	headUnresolvedCache = new Map<DynmapPlayer, Promise<HTMLImageElement>>();

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

		if(headUnresolvedCache.has(player)) {
			return headUnresolvedCache.get(player) as Promise<HTMLImageElement>;
		}

		const promise = new Promise((resolve, reject) => {
			const faceImage = new Image();

			faceImage.onload = function() {
				headCache.set(player, faceImage);
				resolve(faceImage);
			};

			faceImage.onerror = function(e) {
				console.warn(`Failed to retrieve face of ${player.account} with size ${size}!`);
				reject(e);
			};

			const src = (size === 'body') ? `faces/body/${player.account}.png` :`faces/${size}x${size}/${player.account}.png`;
			faceImage.src = this.concatURL(window.config.url.markers, src);
		}).finally(() => headUnresolvedCache.delete(player)) as Promise<HTMLImageElement>;

		headUnresolvedCache.set(player, promise);

		return promise;
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

	parseUrl() {
		const query = new URLSearchParams(window.location.search),
			hash = window.location.hash.replace('#', '');

		if(hash) {
			try {
				return this.parseMapHash(hash);
			} catch (e) {
				console.warn('Ignoring invalid url ' + e);
			}
		}

		try {
			return this.parseMapSearchParams(query);
		} catch(e) {
			console.warn('Ignoring invalid legacy url ' + e);
		}

		return null;
	},

	parseMapHash(hash: string) {
		const parts = hash.replace('#', '').split(';');

		const world = parts[0] || undefined,
			map = parts[1] || undefined,
			location = (parts[2] || '').split(',')
				.map(item => parseFloat(item))
				.filter(item => !isNaN(item) && isFinite(item)),
			zoom = typeof parts[3] !== 'undefined' ? parseInt(parts[3]) : undefined;

		if(location.length && location.length !== 3) {
			throw new TypeError('Location should contain exactly 3 valid numbers');
		}

		if(typeof zoom !== 'undefined' && (isNaN(zoom) || zoom < 0 || !isFinite(zoom))) {
			throw new TypeError('Invalid value for zoom');
		}

		return {
			world,
			map,
			location: location.length ? {
				x: location[0],
				y: location[1],
				z: location[2],
			} : undefined,
			zoom,
			legacy: false,
		}
	},

	parseMapSearchParams(query: URLSearchParams) {
		const world = query.get('worldname') || undefined,
			map = query.get('mapname') || undefined,
			location = [
				query.get('x') || '',
				query.get('y') || '',
				query.get('z') || ''
			].map(item => parseFloat(item)).filter(item => !isNaN(item) && isFinite(item)),
			zoom = query.has('zoom') ? parseInt(query.get('zoom') as string) : undefined;

		if(location.length && location.length !== 3) {
			throw new TypeError('Location should contain exactly 3 valid numbers');
		}

		if(typeof zoom !== 'undefined' && (isNaN(zoom) || zoom < 0 || !isFinite(zoom))) {
			throw new TypeError('Invalid value for zoom');
		}

		return {
			world,
			map,
			location: location.length ? {
				x: location[0],
				y: location[1],
				z: location[2],
			} : undefined,
			zoom,
			legacy: true,
		}
	}
}