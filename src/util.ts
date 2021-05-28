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

import API from '@/api';
import {DynmapPlayer, DynmapWorld, DynmapWorldMap} from "@/dynmap";
import {useStore} from "@/store";

interface HeadQueueEntry {
	cacheKey: string;
	account: string;
	size: string;
	image: HTMLImageElement;
}

const headCache = new Map<string, HTMLImageElement>(),
	headUnresolvedCache = new Map<string, Promise<HTMLImageElement>>(),
	headsLoading = new Set<string>(),

	headQueue: HeadQueueEntry[] = [];

export const getMinecraftTime = (serverTime: number) => {
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
}

export const getMinecraftHead = (player: DynmapPlayer | string, size: string): Promise<HTMLImageElement> => {
	const account = typeof  player === 'string' ? player : player.account,
		cacheKey = `${account}-${size}`;

	if(headCache.has(cacheKey)) {
		return Promise.resolve(headCache.get(cacheKey) as HTMLImageElement);
	}

	if(headUnresolvedCache.has(cacheKey)) {
		return headUnresolvedCache.get(cacheKey) as Promise<HTMLImageElement>;
	}

	const promise = new Promise((resolve, reject) => {
		const faceImage = new Image();

		faceImage.onload = function() {
			headCache.set(cacheKey, faceImage);
			headsLoading.delete(cacheKey);
			tickHeadQueue();
			resolve(faceImage);
		};

		faceImage.onerror = function(e) {
			console.warn(`Failed to retrieve face of ${account} with size ${size}!`);
			headsLoading.delete(cacheKey);
			tickHeadQueue();
			reject(e);
		};

		headQueue.push({
			account,
			size,
			cacheKey,
			image: faceImage,
		});
	}).finally(() => headUnresolvedCache.delete(cacheKey)) as Promise<HTMLImageElement>;

	headUnresolvedCache.set(cacheKey, promise);
	tickHeadQueue();

	return promise;
}

const tickHeadQueue = () => {
	if(headsLoading.size > 8 || !headQueue.length) {
		return;
	}

	const head = headQueue.pop() as HeadQueueEntry,
		src = (head.size === 'body') ? `faces/body/${head.account}.png` :`faces/${head.size}x${head.size}/${head.account}.png`;

	headsLoading.add(head.cacheKey);
	head.image.src = concatURL(useStore().getters.serverConfig.dynmap.markers, src);

	tickHeadQueue();
}

export const concatURL = (base: string, addition: string) => {
	if(base.indexOf('?') >= 0) {
		return base + escape(addition);
	}

	return base + addition;
}

export const getPointConverter = () => {
	const projection = useStore().state.currentProjection;

	return (x: number, y: number, z: number) => {
		return projection.locationToLatLng({x, y, z});
	};
}

export const parseUrl = () => {
	const query = new URLSearchParams(window.location.search),
		hash = window.location.hash.replace('#', '');

	if(hash) {
		try {
			return parseMapHash(hash);
		} catch (e) {
			console.warn('Ignoring invalid url ' + e);
		}
	}

	try {
		return parseMapSearchParams(query);
	} catch(e) {
		console.warn('Ignoring invalid legacy url ' + e);
	}

	return null;
}

export const parseMapHash = (hash: string) => {
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
}

export const parseMapSearchParams = (query: URLSearchParams) => {
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

export const getAPI = () => {
	const store = useStore();

	if(!store.state.currentServer) {
		throw new RangeError("No current server");
	}

	return API;
}

export const getUrlForLocation = (world: DynmapWorld, map: DynmapWorldMap, location: {
	x: number,
	y: number,
	z: number }, zoom: number): string => {
	const x = Math.round(location.x),
			y = Math.round(location.y),
			z = Math.round(location.z),
			locationString = `${x},${y},${z}`;

		if(!world || !map) {
			return '';
		}

		return `#${world.name};${map.name};${locationString};${zoom}`;
}

export const focus = (selector: string) => {
	const element = document.querySelector(selector);

	if(element) {
		(element as HTMLElement).focus();
	}
}