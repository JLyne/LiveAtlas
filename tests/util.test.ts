/*
 * Copyright 2021 James Lyne
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

import {parseUrl} from "@/util";
import {LiveAtlasParsedUrl} from "@/index";

describe("parseURL", () => {
	const testUrls = (urls: Map<URL, LiveAtlasParsedUrl>) => {
		urls.forEach((value, key) => {
			// @ts-ignore
			process.stdout.write(key.toString() + '\n');
			expect(parseUrl(key)).toEqual(value);
		});
	};

	test('parses valid Dynmap URLs', () => {
		const tests = new Map<URL, LiveAtlasParsedUrl>();

		// Complete URL
		tests.set(new URL('https://minecraft.rtgame.co.uk/build?worldname=world&mapname=surface&zoom=4&x=6885&y=64&z=24608'), {
			world: 'world',
			map: 'surface',
			location: { x: 6885, y: 64, z: 24608 },
			zoom: 4,
			legacy: true
		});

		// No location
		tests.set(new URL('https://minecraft.rtgame.co.uk/build?worldname=world&mapname=surface&zoom=4'), {
			world: 'world',
			map: 'surface',
			location: undefined,
			zoom: 4,
			legacy: true
		});

		// No zoom
		tests.set(new URL('https://minecraft.rtgame.co.uk/build?worldname=world&mapname=surface&x=6885&y=64&z=24608'), {
			world: 'world',
			map: 'surface',
			location: { x: 6885, y: 64, z: 24608 },
			zoom: undefined,
			legacy: true
		});

		// No zoom or location
		tests.set(new URL('https://minecraft.rtgame.co.uk/build?worldname=world&mapname=surface'), {
			world: 'world',
			map: 'surface',
			location: undefined,
			zoom: undefined,
			legacy: true
		});

		// No zoom, location or map
		tests.set(new URL('https://minecraft.rtgame.co.uk/build?worldname=world'), {
			world: 'world',
			map: undefined,
			location: undefined,
			zoom: undefined,
			legacy: true
		});

		testUrls(tests);
	});

	test('parses valid Pl3xmap URLs', () => {
		const tests = new Map<URL, LiveAtlasParsedUrl>();

		// Complete URL
		tests.set(new URL('https://minecraft.rtgame.co.uk/build?world=world&zoom=4&x=6885&z=24608'), {
			world: 'world',
			map: undefined,
			location: { x: 6885, y: 64, z: 24608 },
			zoom: 4,
			legacy: true
		});

		// No location
		tests.set(new URL('https://minecraft.rtgame.co.uk/build?world=world&zoom=4'), {
			world: 'world',
			map: undefined,
			location: undefined,
			zoom: 4,
			legacy: true
		});

		// No zoom
		tests.set(new URL('https://minecraft.rtgame.co.uk/build?world=world&x=6885&z=24608'), {
			world: 'world',
			map: undefined,
			location: { x: 6885, y: 64, z: 24608 },
			zoom: undefined,
			legacy: true
		});

		// No zoom or location
		tests.set(new URL('https://minecraft.rtgame.co.uk/build?world=world'), {
			world: 'world',
			map: undefined,
			location: undefined,
			zoom: undefined,
			legacy: true
		});

		testUrls(tests);
	});

	test('parses valid LiveAtlas URL', () => {
		const tests = new Map<URL, LiveAtlasParsedUrl>();

		// Complete URL
		tests.set(new URL('https://minecraft.rtgame.co.uk/map/survival#world;flat;168,64,1914;2'), {
			world: 'world',
			map: 'flat',
			location: { x: 168, y: 64, z: 1914 },
			zoom: 2,
			legacy: false
		});

		// No zoom
		tests.set(new URL('https://minecraft.rtgame.co.uk/map/survival#world;flat;168,64,1914'), {
			world: 'world',
			map: 'flat',
			location: { x: 168, y: 64, z: 1914 },
			zoom: undefined,
			legacy: false
		});

		// No location or zoom
		tests.set(new URL('https://minecraft.rtgame.co.uk/map/survival#world;flat'), {
			world: 'world',
			map: 'flat',
			location: undefined,
			zoom: undefined,
			legacy: false
		});

		// No map, location or zoom
		tests.set(new URL('https://minecraft.rtgame.co.uk/map/survival#world'), {
			world: 'world',
			map: undefined,
			location: undefined,
			zoom: undefined,
			legacy: false
		});

		testUrls(tests);
	});

	test('handles incomplete or invalid LiveAtlas URLs', () => {
		const tests = new Map<URL, LiveAtlasParsedUrl>();

		//Negative zoom
		tests.set(new URL('https://minecraft.rtgame.co.uk/map/survival#world;flat;168,64,1914;-2'), {
			world: 'world',
			map: 'flat',
			location: { x: 168, y: 64, z: 1914 },
			zoom: undefined,
			legacy: false
		});

		//NaN zoom
		tests.set(new URL('https://minecraft.rtgame.co.uk/map/survival#world;flat;168,64,1914;ewsjtuiewshfoes'), {
			world: 'world',
			map: 'flat',
			location: { x: 168, y: 64, z: 1914 },
			zoom: undefined,
			legacy: false
		});

		//Missing z coordinate
		tests.set(new URL('https://minecraft.rtgame.co.uk/map/survival#world;flat;168,64;2'), {
			world: 'world',
			map: 'flat',
			location: undefined,
			zoom: 2,
			legacy: false
		});

		//NaN z coordinate
		tests.set(new URL('https://minecraft.rtgame.co.uk/map/survival#world;flat;168,64,j;2'), {
			world: 'world',
			map: 'flat',
			location: undefined,
			zoom: 2,
			legacy: false
		});

		//Missing y and z coordinates
		tests.set(new URL('https://minecraft.rtgame.co.uk/map/survival#world;flat;168;2'), {
			world: 'world',
			map: 'flat',
			location: undefined,
			zoom: 2,
			legacy: false
		});

		//Invalid location
		tests.set(new URL('https://minecraft.rtgame.co.uk/map/survival#world;flat;23wteyuisezujsezr'), {
			world: 'world',
			map: 'flat',
			location: undefined,
			zoom: undefined,
			legacy: false
		});

		testUrls(tests);
	});

	test('handles incomplete or invalid Dynmap URLs', () => {
		const tests = new Map<URL, LiveAtlasParsedUrl>();

		//Negative zoom
		tests.set(new URL('https://minecraft.rtgame.co.uk/map/survival?worldname=world&mapname=surface&zoom=-2&x=6885&y=64&z=24608'), {
			world: 'world',
			map: 'surface',
			location: { x: 6885, y: 64, z: 24608 },
			zoom: undefined,
			legacy: true
		});

		//NaN zoom
		tests.set(new URL('https://minecraft.rtgame.co.uk/map/survival?worldname=world&mapname=surface&zoom=fsghrtdrh&x=6885&y=64&z=24608'), {
			world: 'world',
			map: 'surface',
			location: { x: 6885, y: 64, z: 24608 },
			zoom: undefined,
			legacy: true
		});

		//Missing z coordinate
		tests.set(new URL('https://minecraft.rtgame.co.uk/map/survival?worldname=world&mapname=surface&zoom=2&x=6885&y=64'), {
			world: 'world',
			map: 'surface',
			location: undefined,
			zoom: 2,
			legacy: true
		});

		//NaN z coordinate
		tests.set(new URL('https://minecraft.rtgame.co.uk/map/survival?worldname=world&mapname=surface&zoom=2&x=6885&y=64&z=j'), {
			world: 'world',
			map: 'surface',
			location: undefined,
			zoom: 2,
			legacy: true
		});

		//Missing y and z coordinates
		tests.set(new URL('https://minecraft.rtgame.co.uk/map/survival?worldname=world&mapname=surface&zoom=2&x=6885'), {
			world: 'world',
			map: 'surface',
			location: undefined,
			zoom: 2,
			legacy: true
		});

		//Invalid/missing coordinates
		tests.set(new URL('https://minecraft.rtgame.co.uk/map/survival?worldname=world&mapname=surface&x=3wresfsg'), {
			world: 'world',
			map: 'surface',
			location: undefined,
			zoom: undefined,
			legacy: true
		});

		testUrls(tests);
	});
});
