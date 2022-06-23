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

import LiveAtlasMapDefinition from "@/model/LiveAtlasMapDefinition";
import {
	Coordinate,
	LiveAtlasBounds,
	LiveAtlasDimension,
	LiveAtlasGlobalMessageConfig,
	LiveAtlasLocation,
	LiveAtlasMessageConfig, LiveAtlasParsedUrl,
} from "@/index";
import {notify} from "@kyvg/vue3-notification";
import {globalMessages, serverMessages} from "../messages";
import {Store} from "@/store";

const documentRange = document.createRange(),
	brToSpaceRegex = /<br \/>/g;

export const titleColoursRegex = /§[0-9a-f]/ig;
export const netherWorldNameRegex = /[_\s]?nether([\s_]|$)/i;
export const endWorldNameRegex = /(^|[_\s])end([\s_]|$)/i;

/**
 * Calculates 24 hour time of day and the current day from the given server time
 * @param {number} serverTime Server time in ticks
 * @returns The equivalent 24 hour time, current day and whether it is currently day or night
 */
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

/**
 * Parses the given {@link URL} into a {@link LiveAtlasParsedUrl}, if the URL matches any known URL formats
 * @param {URL} url The URL to parse
 * @returns {LiveAtlasParsedUrl | null} A LiveAtlasParsedUrl if the provided URL matched any known URL formats,
 * otherwise null
 */
export const parseUrl = (url: URL): LiveAtlasParsedUrl | null => {
	const query = new URLSearchParams(url.search),
		hash = url.hash.replace('#', '');

	return hash ? parseMapHash(hash) : parseMapSearchParams(query);
}

/**
 * Parses the given hash into a {@link LiveAtlasParsedUrl}, if the hash matches the LiveAtlas or Overviewer URL hash format
 * @param {string} hash The hash to parse
 * @returns {LiveAtlasParsedUrl | null} A LiveAtlasParsedUrl if the provided hash matched the LiveAtlas or Overviewer URL
 * hash format, otherwise null
 */
export const parseMapHash = (hash: string): LiveAtlasParsedUrl | null => {
	let world, map, location, zoom;

	hash = hash.replace('#', '');

	if(hash[0] === '/' && hash.split('/').length === 7) { //Overviewer URL format
		const parts = hash.split('/');

		zoom = undefined; //FIXME: Not sure how to handle negative values atm
		world = parts[5];
		map = parts[6];
		location = [
			parts[1],
			parts[2],
			parts[3]
		].map(item => parseFloat(item)).filter(item => !isNaN(item) && isFinite(item));
	} else { //LiveAtlas URL format
		const parts = hash.split(';');

		world = parts[0] || undefined;
		map = parts[1] || undefined;

		location = (parts[2] || '').split(',')
				.map(item => parseFloat(item))
				.filter(item => !isNaN(item) && isFinite(item));
		zoom = typeof parts[3] !== 'undefined' ? parseInt(parts[3]) : undefined;
	}

	return validateParsedUrl({
		world: world ? decodeURIComponent(world) : undefined,
		map: map ? decodeURIComponent(map) : undefined,
		location: location.length === 3 ? {
			x: location[0],
			y: location[1],
			z: location[2],
		} : undefined,
		zoom,
		legacy: false,
	});
}

/**
 * Parses the given {@link URLSearchParams} into a {@link LiveAtlasParsedUrl}, if it matches any known query string formats
 * @param {URLSearchParams} query The URLSearchParams to parse
 * @returns {LiveAtlasParsedUrl | null} A LiveAtlasParsedUrl if the provided hash matched the LiveAtlas URL
 * hash format, otherwise null
 */
export const parseMapSearchParams = (query: URLSearchParams): LiveAtlasParsedUrl | null => {
	let world = query.get('worldname') /* Dynmap */ || query.get('world') /* Pl3xmap */ || undefined,
		map = query.has('worldname') ? query.get('mapname') || undefined : undefined; //Dynmap only

	const location = [
		query.get('x') || '',
		query.get('y') || '64',
		query.get('z') || ''
	].map(item => parseFloat(item)).filter(item => !isNaN(item) && isFinite(item)),
	zoom = query.has('zoom') ? parseInt(query.get('zoom') as string) : undefined;

	world = world ? decodeURIComponent(world) : undefined;
	map = map ? decodeURIComponent(map) : undefined;

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

/**
 * Validates the given {@link LiveAtlasParsedUrl} to ensure all required properties are present and have valid values
 * @param {LiveAtlasParsedUrl} parsed The parsed URL to validate
 * @return {LiveAtlasParsedUrl | null} The parsed URL, possibly modified to ensure validity, or null if it is invalid
 * and cannot be fixed
 * @see {@link parseMapSearchParams}
 * @see {@link parseMapHash}
 * @private
 */
const validateParsedUrl = (parsed: any) => {
	if(typeof parsed.zoom !== 'undefined' && (isNaN(parsed.zoom) || parsed.zoom < 0 || !isFinite(parsed.zoom))) {
		parsed.zoom = undefined;
	}

	if(!parsed.world) {
		return null;
	}

	return parsed;
}

/**
 * Generates a LiveAtlas formatted URL hash representing the given {@link LiveAtlasMapDefinition}map, {@link Coordinate}
 * location and zoom level
 * @param {LiveAtlasMapDefinition} map The map
 * @param {Coordinate} location The location
 * @param {number} zoom The zoom level
 * @return {string} The URL hash (including the #), or an empty string if a valid hash cannot be constructed
 */
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

/**
 * Focuses the first html element which matches the given selector, if any
 * @param {string} selector The selector string
 */
export const focus = (selector: string) => {
	const element = document.querySelector(selector);

	if(element) {
		(element as HTMLElement).focus();
	}
}

const decodeTextarea = document.createElement('textarea');

/**
 * Decodes HTML entities in the given string using a <textarea>
 * @param {string} text The text to decode HTML entities in
 * @returns {string} The given text with any HTML entities decoded
 */
export const decodeHTMLEntities = (text: string) => {
	decodeTextarea.innerHTML = text;
	return decodeTextarea.textContent || '';
}

/**
 * Strips HTML from the given string using a contextual {@link DocumentFragment} and converts <br>s to spaces
 * @param {string} text The text to strip HTML from
 * @returns {string} The given text with HTML stripped
 */
export const stripHTML = (text: string) => {
	return documentRange.createContextualFragment(text.replace(brToSpaceRegex,'&nbsp;')).textContent || '';
}

/**
 * Default success callback function for VueClipboard, will display a notification with the configured copy success
 * message
 */
export const clipboardSuccess = (store: Store) => () => notify(store.state.messages.copyToClipboardSuccess);

/**
 * Default error callback function for VueClipboard, will display a notification with the configured copy error
 * message
 */
export const clipboardError = (store: Store) => (e: Error) => {
	notify({ type: 'error', text: store.state.messages.copyToClipboardError });
	console.error('Error copying to clipboard', e);
};

/**
 * Creates a {@link LiveAtlasMessageConfig} from the provided config object. The provided object will be checked for all
 * expected LiveAtlasMessageConfig messages, with fallback "Missing message" messages being used when a message is
 * missing from the provided object.
 * @param {Object} config Config object containing messages to include in the final LiveAtlasMessageConfig. Should
 * contain a complete or subset of keys from LiveAtlasMessageConfig, additional keys will be ignored.
 */
export const getMessages = (config: any = {}) => {
	return Object.assign(_getMessages(globalMessages, config),
		_getMessages(serverMessages, config)) as LiveAtlasMessageConfig;
}

/**
 * Creates a {@link LiveAtlasGlobalMessageConfig} from the provided config object. The provided object will be checked
 * for all expected LiveAtlasGlobalMessageConfig messages, with fallback "Missing message" messages being used
 * when a message is missing from the provided object.
 * @param {Object} config Config object containing messages to include in the final LiveAtlasGlobalMessageConfig.
 * Should contain a complete or subset of keys from LiveAtlasGlobalMessageConfig, additional keys will be ignored.
 */
export const getGlobalMessages = (config: any = {}) => {
	return _getMessages(globalMessages, config) as LiveAtlasGlobalMessageConfig;
}

/**
 * Creates an object containing the keys present in the messageKeys object and the values present in the config object.
 *
 * For each key, the config object is checked for a corresponding value. A fallback "Missing message" value is used if
 * config object does not contain a value.
 * @param {Object} messageKeys The object to take the keys from
 * @param {Object} config The object to take the values from, if present
 * @see {@link getMessages}
 * @see {@link getGlobalMessages}
 * @private
 */
const _getMessages = (messageKeys: any, config: any = {}) => {
	const messages: any = {};

	for(const key of messageKeys) {
		messages[key] = typeof config[key] === 'string' && config[key] ? config[key] : `Missing message: ${key}`;
	}

	return messages as LiveAtlasGlobalMessageConfig;
}

/**
 * Determines the bounds required to enclose the given separate arrays of x, y and z coordinates
 * All arrays are expected to be the same length
 * @param {number[]} x X coordinates
 * @param {number[]} y Y coordinates
 * @param {number[]} z Z coordinates
 * @returns {LiveAtlasBounds} The calculated bounds
 */
export const getBounds = (x: number[], y: number[], z: number[]): LiveAtlasBounds => {
	return {
		min: {x: Math.min.apply(null, x), y: Math.min.apply(null, y), z: Math.min.apply(null, z)},
		max: {x: Math.max.apply(null, x), y: Math.max.apply(null, y), z: Math.max.apply(null, z)},
	};
}

/**
 * Determines the bounds required to enclose the given array of {@link Coordinate}s
 * Multiple dimension arrays are accepted and will be handled recursively
 * @param {Coordinate[]} points Points to determine the bounds for
 * @returns {LiveAtlasBounds} The calculated bounds
 */
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

/**
 * Determines the center point of the given {@link LiveAtlasBounds}
 * @param {LiveAtlasBounds} bounds The bounds to find the center point for
 * @return {LiveAtlasLocation} The center point
 */
export const getMiddle = (bounds: LiveAtlasBounds): LiveAtlasLocation => {
	return {
		x: bounds.min.x + ((bounds.max.x - bounds.min.x) / 2),
		y: bounds.min.y + ((bounds.max.y - bounds.min.y) / 2),
		z: bounds.min.z + ((bounds.max.z - bounds.min.z) / 2),
	};
}

/**
 * Creates an "allow-scripts" sandboxed <iframe>
 * @see {@link runSandboxed}
 * @returns {Window} A promise that resolves to the iframe's contentWindow
 */
const createIframeSandbox = async (): Promise<Window> => {
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

	return new Promise(resolve => {
		document.body.appendChild(frame);

		frame.onload = () => {
			resolve(frame.contentWindow as Window);
		};
	});
}

let sandboxWindow: Window | null = null;
const sandboxSuccessCallbacks: Map<number, (result?: any) => void> = new Map();
const sandboxErrorCallbacks: Map<number, (reason?: any) => void> = new Map();

/**
 * Runs the given untrusted JavaScript code inside an "allow-scripts" sandboxed <iframe>
 * The executing code cannot access or interfere with LiveAtlas state,
 * but can still make requests and access many JS APIs
 * @param {string} code The code to run
 * @returns {Promise<any>} A promise that will resolve with the return value of the executed JS,
 * or will reject with any Errors that occurred during execution.
 */
export const runSandboxed = async (code: string) => {
	if(!sandboxWindow) {
		sandboxWindow = await createIframeSandbox();
	}

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

/**
 * Attempts to guess the dimension of the given world name
 * The world name is checked against vanilla nether/end world names and regexes covering
 * common nether/end world naming conventions
 * If none of the above match, the world is assumed to be overworld
 * @param {string} worldName Name of the world to guess
 * @returns {LiveAtlasDimension} The guessed dimension
 */
export const guessWorldDimension = (worldName: string) => {
	let dimension: LiveAtlasDimension = 'overworld';

	if (netherWorldNameRegex.test(worldName) || (worldName == 'DIM-1')) {
		dimension = 'nether';
	} else if (endWorldNameRegex.test(worldName) || (worldName == 'DIM1')) {
		dimension = 'end';
	}

	return dimension;
}
