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
import {LiveAtlasDynmapServerDefinition, LiveAtlasServerDefinition} from "@/index";
import ConfigurationError from "@/errors/ConfigurationError";

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


const validateLiveAtlasConfiguration = (config: any): Map<string, LiveAtlasServerDefinition> => {
	const check = '\nCheck your server configuration in index.html is correct.',
		result = new Map<string, LiveAtlasServerDefinition>();

	if (!Object.keys(config).length) {
		throw new ConfigurationError(`No servers defined. ${check}`);
	}

	for (const server in config) {
		if (!Object.hasOwnProperty.call(config, server)) {
			continue;
		}

		const serverConfig = config[server];

		if (!serverConfig || serverConfig.constructor !== Object || !Object.keys(serverConfig).length) {
			throw new ConfigurationError(`Server '${server}': Configuration missing. ${check}`);
		}

		serverConfig.id = server;
		serverConfig.type = serverConfig.type || 'dynmap';

		switch(serverConfig.type) {
			case 'dynmap':
				if (!serverConfig.dynmap || serverConfig.dynmap.constructor !== Object) {
					throw new ConfigurationError(`Server '${server}': Dynmap configuration object missing. ${check}`);
				}

				if (!serverConfig.dynmap.configuration) {
					throw new ConfigurationError(`Server '${server}': Dynmap configuration URL missing. ${check}`);
				}

				if (!serverConfig.dynmap.update) {
					throw new ConfigurationError(`Server '${server}': Dynmap update URL missing. ${check}`);
				}

				if (!serverConfig.dynmap.markers) {
					throw new ConfigurationError(`Server '${server}': Dynmap markers URL missing. ${check}`);
				}

				if (!serverConfig.dynmap.tiles) {
					throw new ConfigurationError(`Server '${server}': Dynmap tiles URL missing. ${check}`);
				}

				if (!serverConfig.dynmap.sendmessage) {
					throw new ConfigurationError(`Server '${server}': Dynmap sendmessage URL missing. ${check}`);
				}
				break;

			case 'pl3xmap':
			case 'plexmap':
				if (!serverConfig.plexmap || serverConfig.plexmap.constructor !== Object) {
					throw new ConfigurationError(`Server '${server}': Pl3xmap configuration object missing. ${check}`);
				}
		}

		result.set(server, serverConfig);
	}

	return result;
};

const validateDynmapConfiguration = (config: DynmapUrlConfig): Map<string, LiveAtlasDynmapServerDefinition> => {
	const check = '\nCheck your standalone/config.js file exists and is being loaded correctly.';

	if (!config) {
		throw new ConfigurationError(`Dynmap configuration is missing. ${check}`);
	}

	if (!config.configuration) {
		throw new ConfigurationError(`Dynmap configuration URL is missing. ${check}`);
	}

	if (!config.update) {
		throw new ConfigurationError(`Dynmap update URL is missing. ${check}`);
	}

	if (!config.markers) {
		throw new ConfigurationError(`Dynmap markers URL is missing. ${check}`);
	}

	if (!config.tiles) {
		throw new ConfigurationError(`Dynmap tiles URL is missing. ${check}`);
	}

	if (!config.sendmessage) {
		throw new ConfigurationError(`Dynmap sendmessage URL is missing. ${check}`);
	}

	const result = new Map<string, LiveAtlasDynmapServerDefinition>();
	result.set('dynmap', {
		id: 'dynmap',
		label: 'dynmap',
		type: 'dynmap',
		dynmap: config
	});

	return result;
};

export const validateConfiguration = (): Map<string, LiveAtlasServerDefinition> => {
	if (!window.liveAtlasConfig) {
		throw new ConfigurationError(`Configuration object is missing`);
	}

	if (typeof window.liveAtlasConfig.servers !== 'undefined') {
		return validateLiveAtlasConfiguration(window.liveAtlasConfig.servers || {});
	}

	return validateDynmapConfiguration(window.config?.url || null);
};
