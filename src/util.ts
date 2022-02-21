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

import defaultImage from '@/assets/images/player_face.png';
import {useStore} from "@/store";
import LiveAtlasMapDefinition from "@/model/LiveAtlasMapDefinition";
import {
	Coordinate,
	HeadQueueEntry,
	LiveAtlasBounds,
	LiveAtlasGlobalMessageConfig,
	LiveAtlasLocation,
	LiveAtlasMessageConfig,
	LiveAtlasPlayer,
	LiveAtlasPlayerImageSize,
} from "@/index";
import {notify} from "@kyvg/vue3-notification";
import {globalMessages, serverMessages} from "../messages";

const documentRange = document.createRange(),
	brToSpaceRegex = /<br \/>/g,
	headCache = new Map<string, HTMLImageElement>(),
	headUnresolvedCache = new Map<string, Promise<HTMLImageElement>>(),
	headsLoading = new Set<string>(),

	headQueue: HeadQueueEntry[] = [];

export const titleColoursRegex = /§[0-9a-f]/ig;
export const netherWorldNameRegex = /_?nether(_|$)/i;
export const endWorldNameRegex = /(^|_)end(_|$)/i;

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

export const getImagePixelSize = (imageSize: LiveAtlasPlayerImageSize) => {
	switch(imageSize) {
		case 'large':
		case 'body':
			return 32;

		case 'small':
		default:
			return 16;
	}
}

export const getMinecraftHead = (player: LiveAtlasPlayer | string, size: LiveAtlasPlayerImageSize): Promise<HTMLImageElement> => {
	const account = typeof  player === 'string' ? player : player.name,
		uuid = typeof  player === 'string' ? undefined : player.uuid,
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
			name: account,
			uuid,
			size,
			cacheKey,
			image: faceImage,
		});
	}).finally(() => headUnresolvedCache.delete(cacheKey)) as Promise<HTMLImageElement>;

	headUnresolvedCache.set(cacheKey, promise);
	tickHeadQueue();

	return promise;
}

export const getDefaultMinecraftHead = () => {
	return defaultImage;
}

const tickHeadQueue = () => {
	if(headsLoading.size > 8 || !headQueue.length) {
		return;
	}

	const head = headQueue.pop() as HeadQueueEntry;

	headsLoading.add(head.cacheKey);
	head.image.src = useStore().state.components.players.imageUrl(head);

	tickHeadQueue();
}

export const clearHeadCache = () => {
	headCache.clear();
}

export const parseUrl = (url: URL) => {
	const query = new URLSearchParams(url.search),
		hash = url.hash.replace('#', '');

	return hash ? parseMapHash(hash) : parseMapSearchParams(query);
}

export const parseMapHash = (hash: string) => {
	const parts = hash.replace('#', '').split(';');

	const world = parts[0] || undefined,
		map = parts[1] || undefined,
		location = (parts[2] || '').split(',')
			.map(item => parseFloat(item))
			.filter(item => !isNaN(item) && isFinite(item)),
		zoom = typeof parts[3] !== 'undefined' ? parseInt(parts[3]) : undefined;

	return validateParsedUrl({
		world,
		map,
		location: location.length === 3 ? {
			x: location[0],
			y: location[1],
			z: location[2],
		} : undefined,
		zoom,
		legacy: false,
	});
}

export const parseMapSearchParams = (query: URLSearchParams) => {
	const world = query.get('worldname') /* Dynmap */ || query.get('world') /* Pl3xmap */ || undefined,
		map = query.has('worldname') ? query.get('mapname') || undefined : undefined, //Dynmap only
		location = [
			query.get('x') || '',
			query.get('y') || '64',
			query.get('z') || ''
		].map(item => parseFloat(item)).filter(item => !isNaN(item) && isFinite(item)),
		zoom = query.has('zoom') ? parseInt(query.get('zoom') as string) : undefined;

	return validateParsedUrl({
		world,
		map,
		location: location.length === 3 ? {
			x: location[0],
			y: location[1],
			z: location[2],
		} : undefined,
		zoom,
		legacy: true,
	});
}

const validateParsedUrl = (parsed: any) => {
	if(typeof parsed.zoom !== 'undefined' && (isNaN(parsed.zoom) || parsed.zoom < 0 || !isFinite(parsed.zoom))) {
		parsed.zoom = undefined;
	}

	if(!parsed.world) {
		return null;
	}

	return parsed;
}

export const getUrlForLocation = (map: LiveAtlasMapDefinition, location: Coordinate, zoom: number): string => {
	const x = Math.round(location.x),
			y = Math.round(location.y),
			z = Math.round(location.z),
			locationString = `${x},${y},${z}`;

		if(!map) {
			return '';
		}

		return `#${map.world.name};${map.name};${locationString};${zoom}`;
}

export const focus = (selector: string) => {
	const element = document.querySelector(selector);

	if(element) {
		(element as HTMLElement).focus();
	}
}

const decodeTextarea = document.createElement('textarea');

export const decodeHTMLEntities = (text: string) => {
	decodeTextarea.innerHTML = text;
	return decodeTextarea.textContent || '';
}

export const stripHTML = (text: string) => {
	return documentRange.createContextualFragment(text.replace(brToSpaceRegex,'&nbsp;')).textContent || '';
}

export const clipboardSuccess = () => () => notify(useStore().state.messages.copyToClipboardSuccess);

export const clipboardError = () => (e: Error) => {
	notify({ type: 'error', text: useStore().state.messages.copyToClipboardError });
	console.error('Error copying to clipboard', e);
};

export const getMessages = (config: any = {}) => {
	return Object.assign(_getMessages(globalMessages, config),
		_getMessages(serverMessages, config)) as LiveAtlasMessageConfig;
}

export const getGlobalMessages = (config: any = {}) => {
	return _getMessages(globalMessages, config) as LiveAtlasGlobalMessageConfig;
}

const _getMessages = (messageKeys: any, config: any = {}) => {
	const messages: any = {};

	for(const key of messageKeys) {
		messages[key] = config[key] || `Missing message: ${key}`;
	}

	return messages as LiveAtlasGlobalMessageConfig;
}

export const getBounds = (x: number[], y: number[], z: number[]): LiveAtlasBounds => {
	return {
		min: {x: Math.min.apply(null, x), y: Math.min.apply(null, y), z: Math.min.apply(null, z)},
		max: {x: Math.max.apply(null, x), y: Math.max.apply(null, y), z: Math.max.apply(null, z)},
	};
}

export const getBoundsFromPoints = (points: Coordinate[]): LiveAtlasBounds => {
	const bounds = {
		max: {x: -Infinity, y: -Infinity, z: -Infinity},
		min: {x: Infinity, y: Infinity, z: Infinity},
	}

	const handlePoint = (point: any) => {
		if(Array.isArray(point)) {
			point.map(handlePoint);
		} else {
			bounds.max.x = Math.max(point.x, bounds.max.x);
			bounds.max.y = Math.max(point.y, bounds.max.y);
			bounds.max.z = Math.max(point.z, bounds.max.z);
			bounds.min.x = Math.min(point.x, bounds.min.x);
			bounds.min.y = Math.min(point.y, bounds.min.y);
			bounds.min.z = Math.min(point.z, bounds.min.z);
		}
	}

	points.map(handlePoint);

	return bounds;
}

export const getMiddle = (bounds: LiveAtlasBounds): LiveAtlasLocation => {
	return {
		x: bounds.min.x + ((bounds.max.x - bounds.min.x) / 2),
		y: bounds.min.y + ((bounds.max.y - bounds.min.y) / 2),
		z: bounds.min.z + ((bounds.max.z - bounds.min.z) / 2),
	};
}

const createIframeSandbox = () => {
	const frame = document.createElement('iframe');
	frame.hidden = true;
	frame.sandbox.add('allow-scripts');
	frame.srcdoc = `<script>window.addEventListener("message", function(e) {	
		if(!e.data?.key) {
			console.warn('Ignoring postmessage without key');
			return;
		}
		
	 	try {
			e.source.postMessage({
				key: e.data.key,
				success: true,
				result: Function('', "'use strict';" + e.data.code)(),
			}, e.origin);
	 	} catch(ex) {
			e.source.postMessage({
				key: e.data.key,
				success: false,
				error: ex
			}, e.origin);
	 	}
	})</script>`;

	window.addEventListener('message', e => {
		if(e.origin !== "null" || e.source !== frame.contentWindow) {
			console.warn('Ignoring postmessage with invalid source');
			return;
		}

		if(!e.data?.key) {
			console.warn('Ignoring postmessage without key');
			return;
		}

		if(!sandboxSuccessCallbacks.has(e.data.key)) {
			console.warn('Ignoring postmessage with invalid key');
			return;
		}

		if(e.data.success) {
			sandboxSuccessCallbacks.get(e.data.key)!.call(this, e.data.result);
		} else {
			sandboxErrorCallbacks.get(e.data.key)!.call(this, e.data.error);
		}
    });

	document.body.appendChild(frame);
	return frame.contentWindow;
}

const sandboxWindow: Window | null = createIframeSandbox();
const sandboxSuccessCallbacks: Map<number, (result?: any) => void> = new Map();
const sandboxErrorCallbacks: Map<number, (reason?: any) => void> = new Map();

export const runSandboxed = async (code: string) => {
	return new Promise((resolve, reject) => {
		const key = Math.random();

		sandboxSuccessCallbacks.set(key, resolve);
		sandboxErrorCallbacks.set(key, reject);

		sandboxWindow!.postMessage({
			key,
			code,
		}, '*');
	});
}
