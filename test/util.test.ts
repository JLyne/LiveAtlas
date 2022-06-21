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

import {parseUrl} from "@/util";
import {LiveAtlasParsedUrl} from "@/index";

const validURLs: [string, URL, LiveAtlasParsedUrl][] = [
	[
		'Dynmap - complete',
		new URL('https://minecraft.rtgame.co.uk/build?worldname=world&mapname=surface&zoom=4&x=6885&y=64&z=24608'),
		{
			world: 'world',
			map: 'surface',
			location: {x: 6885, y: 64, z: 24608},
			zoom: 4,
			legacy: true
		}
	],
	[
		'Dynmap - no location',
		new URL('https://minecraft.rtgame.co.uk/build?worldname=world&mapname=surface&zoom=4'),
		{
			world: 'world',
			map: 'surface',
			location: undefined,
			zoom: 4,
			legacy: true
		}
	],
	[
		'Dynmap - no zoom',
		new URL('https://minecraft.rtgame.co.uk/build?worldname=world&mapname=surface&x=6885&y=64&z=24608'),
		{
			world: 'world',
			map: 'surface',
			location: {x: 6885, y: 64, z: 24608},
			zoom: undefined,
			legacy: true
		}
	],
	[
		'Dynmap - no zoom or location',
		new URL('https://minecraft.rtgame.co.uk/build?worldname=world&mapname=surface'),
		{
			world: 'world',
			map: 'surface',
			location: undefined,
			zoom: undefined,
			legacy: true
		}
	],
	[
		'Dynmap - no map, zoom or location',
		new URL('https://minecraft.rtgame.co.uk/build?worldname=world'),
		{
			world: 'world',
			map: undefined,
			location: undefined,
			zoom: undefined,
			legacy: true
		}
	],
	[
		'Pl3xmap - complete',
		new URL('https://minecraft.rtgame.co.uk/build?world=world&zoom=4&x=6885&y=64&z=24608'),
		{
			world: 'world',
			map: undefined,
			location: {x: 6885, y: 64, z: 24608},
			zoom: 4,
			legacy: true
		}
	],
	[
		'Pl3xmap - no location',
		new URL('https://minecraft.rtgame.co.uk/build?world=world&zoom=4'),
		{
			world: 'world',
			map: undefined,
			location: undefined,
			zoom: 4,
			legacy: true
		}
	],
	[
		'Pl3xmap - no zoom',
		new URL('https://minecraft.rtgame.co.uk/build?world=world&x=6885&y=64&z=24608'),
		{
			world: 'world',
			map: undefined,
			location: {x: 6885, y: 64, z: 24608},
			zoom: undefined,
			legacy: true
		}
	],
	[
		'Pl3xmap - no zoom or location',
		new URL('https://minecraft.rtgame.co.uk/build?world=world'),
		{
			world: 'world',
			map: undefined,
			location: undefined,
			zoom: undefined,
			legacy: true
		}
	],
	[
		'LiveAtlas - complete',
		new URL('https://minecraft.rtgame.co.uk/map/survival#world;flat;168,64,1914;2'),
		{
			world: 'world',
			map: 'flat',
			location: {x: 168, y: 64, z: 1914},
			zoom: 2,
			legacy: false
		}
	],
	[
		'LiveAtlas - no zoom',
		new URL('https://minecraft.rtgame.co.uk/map/survival#world;flat;168,64,1914'),
		{
			world: 'world',
			map: 'flat',
			location: {x: 168, y: 64, z: 1914},
			zoom: undefined,
			legacy: false
		}
	],
	[
		'LiveAtlas - no location or zoom',
		new URL('https://minecraft.rtgame.co.uk/map/survival#world;flat'),
		{
			world: 'world',
			map: 'flat',
			location: undefined,
			zoom: undefined,
			legacy: false
		}
	],
	[
		'LiveAtlas - no map, location or zoom',
		new URL('https://minecraft.rtgame.co.uk/map/survival#world'),
		{
			world: 'world',
			map: undefined,
			location: undefined,
			zoom: undefined,
			legacy: false
		}
	]
]

const invalidURLs: [string, URL, LiveAtlasParsedUrl|null][] = [
	[
		'LiveAtlas - negative zoom',
		new URL('https://minecraft.rtgame.co.uk/map/survival#world;flat;168,64,1914;-2'),
		{
			world: 'world',
			map: 'flat',
			location: {x: 168, y: 64, z: 1914},
			zoom: undefined,
			legacy: false
		}
	],
	[
		'LiveAtlas - NaN zoom',
		new URL('https://minecraft.rtgame.co.uk/map/survival#world;flat;168,64,1914;ewsjtuiewshfoes'),
		{
			world: 'world',
			map: 'flat',
			location: {x: 168, y: 64, z: 1914},
			zoom: undefined,
			legacy: false
		}
	],
	[
		'LiveAtlas - missing z coordinate',
		new URL('https://minecraft.rtgame.co.uk/map/survival#world;flat;168,64;2'),
		{
			world: 'world',
			map: 'flat',
			location: undefined,
			zoom: 2,
			legacy: false
		}
	],
	[
		'LiveAtlas - NaN z coordinate',
		new URL('https://minecraft.rtgame.co.uk/map/survival#world;flat;168,64,j;2'),
		{
			world: 'world',
			map: 'flat',
			location: undefined,
			zoom: 2,
			legacy: false
		}
	],
	[
		'LiveAtlas - missing y and z coordinates',
		new URL('https://minecraft.rtgame.co.uk/map/survival#world;flat;168;2'),
		{
			world: 'world',
			map: 'flat',
			location: undefined,
			zoom: 2,
			legacy: false
		}
	],
	[
		'LiveAtlas - invalid location',
		new URL('https://minecraft.rtgame.co.uk/map/survival#world;flat;23wteyuisezujsezr'),
		{
			world: 'world',
			map: 'flat',
			location: undefined,
			zoom: undefined,
			legacy: false
		}
	],
	[
		'Dynmap - Negative zoom',
		new URL('https://minecraft.rtgame.co.uk/map/survival?worldname=world&mapname=surface&zoom=-2&x=6885&y=64&z=24608'),
		{
			world: 'world',
			map: 'surface',
			location: {x: 6885, y: 64, z: 24608},
			zoom: undefined,
			legacy: true
		}
	],
	[
		'Dynmap - NaN zoom',
		new URL('https://minecraft.rtgame.co.uk/map/survival?worldname=world&mapname=surface&zoom=fsghrtdrh&x=6885&y=64&z=24608'),
		{
			world: 'world',
			map: 'surface',
			location: {x: 6885, y: 64, z: 24608},
			zoom: undefined,
			legacy: true
		}
	],
	[
		'Dynmap - Missing z coordinate',
		new URL('https://minecraft.rtgame.co.uk/map/survival?worldname=world&mapname=surface&zoom=2&x=6885&y=64'),
		{
			world: 'world',
			map: 'surface',
			location: undefined,
			zoom: 2,
			legacy: true
		}
	],
	[
		'Dynmap - NaN z coordinate',
		new URL('https://minecraft.rtgame.co.uk/map/survival?worldname=world&mapname=surface&zoom=2&x=6885&y=64&z=j'),
		{
			world: 'world',
			map: 'surface',
			location: undefined,
			zoom: 2,
			legacy: true
		}
	],
	[
		'Dynmap - Missing y and z coordinates',
		new URL('https://minecraft.rtgame.co.uk/map/survival?worldname=world&mapname=surface&zoom=2&x=6885'),
		{
			world: 'world',
			map: 'surface',
			location: undefined,
			zoom: 2,
			legacy: true
		}
	],
	[
		'Dynmap - Invalid/missing coordinates',
		new URL('https://minecraft.rtgame.co.uk/map/survival?worldname=world&mapname=surface&x=3wresfsg'),
		{
			world: 'world',
			map: 'surface',
			location: undefined,
			zoom: undefined,
			legacy: true
		}
	],
	[
		'Dynmap - Missing world',
		new URL('https://minecraft.rtgame.co.uk/map/survival?mapname=surface&x=3wresfsg'),
		null
	],
	[
		'empty hash',
		new URL('https://minecraft.rtgame.co.uk/map/survival#'),
		null
	],
	[
		'empty query',
		new URL('https://minecraft.rtgame.co.uk/map/survival?'),
		null
	],
];

describe("parseURL", () => {
	test.each(validURLs)("Valid URL - %s", (name: string, url: URL, expected: LiveAtlasParsedUrl) => {
		expect(parseUrl(url)).toEqual(expected);
	});
	test.each(invalidURLs)("Invalid or incomplete URL - %s", (name: string, url: URL, expected: LiveAtlasParsedUrl|null) => {
		expect(parseUrl(url)).toEqual(expected);
	});
});
