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

import {getGlobalMessages, getMessages, getUrlForLocation, guessWorldDimension, parseUrl} from "@/util";
import {LiveAtlasDimension, LiveAtlasGlobalMessageConfig, LiveAtlasMessageConfig, LiveAtlasParsedUrl} from "@/index";
import LiveAtlasMapDefinition from "@/model/LiveAtlasMapDefinition";
import {globalMessages, serverMessages} from "../messages";

const validURLs: [string, URL, LiveAtlasParsedUrl][] = [
	[
		'Dynmap - complete',
		new URL('https://example.com/build?worldname=world&mapname=surface&zoom=4&x=6885&y=64&z=24608'),
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
		new URL('https://example.com/build?worldname=world&mapname=surface&zoom=4'),
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
		new URL('https://example.com/build?worldname=world&mapname=surface&x=6885&y=64&z=24608'),
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
		new URL('https://example.com/build?worldname=world&mapname=surface'),
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
		new URL('https://example.com/build?worldname=world'),
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
		new URL('https://example.com/build?world=world&zoom=4&x=6885&z=24608'),
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
		new URL('https://example.com/build?world=world&zoom=4'),
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
		new URL('https://example.com/build?world=world&x=6885&z=24608'),
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
		new URL('https://example.com/build?world=world'),
		{
			world: 'world',
			map: undefined,
			location: undefined,
			zoom: undefined,
			legacy: true
		}
	],
	[
		'Overviewer - complete',
		new URL('https://example.com/#/-269/64/244/-3/world/map'),
		{
			world: 'world',
			map: 'map',
			location: {x: -269, y: 64, z:244},
			zoom: undefined,
			legacy: false
		}
	],
	[
		'LiveAtlas - complete',
		new URL('https://example.com/map/survival#world;flat;168,64,1914;2'),
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
		new URL('https://example.com/map/survival#world;flat;168,64,1914'),
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
		new URL('https://example.com/map/survival#world;flat'),
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
		new URL('https://example.com/map/survival#world'),
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
		new URL('https://example.com/map/survival#world;flat;168,64,1914;-2'),
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
		new URL('https://example.com/map/survival#world;flat;168,64,1914;ewsjtuiewshfoes'),
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
		new URL('https://example.com/map/survival#world;flat;168,64;2'),
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
		new URL('https://example.com/map/survival#world;flat;168,64,j;2'),
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
		new URL('https://example.com/map/survival#world;flat;168;2'),
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
		new URL('https://example.com/map/survival#world;flat;23wteyuisezujsezr'),
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
		new URL('https://example.com/map/survival?worldname=world&mapname=surface&zoom=-2&x=6885&y=64&z=24608'),
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
		new URL('https://example.com/map/survival?worldname=world&mapname=surface&zoom=fsghrtdrh&x=6885&y=64&z=24608'),
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
		new URL('https://example.com/map/survival?worldname=world&mapname=surface&zoom=2&x=6885&y=64'),
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
		new URL('https://example.com/map/survival?worldname=world&mapname=surface&zoom=2&x=6885&y=64&z=j'),
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
		new URL('https://example.com/map/survival?worldname=world&mapname=surface&zoom=2&x=6885'),
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
		new URL('https://example.com/map/survival?worldname=world&mapname=surface&x=3wresfsg'),
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
		new URL('https://example.com/map/survival?mapname=surface&x=3wresfsg'),
		null
	],
	[
		'Pl3xmap - Negative zoom',
		new URL('https://example.com/map/survival?world=world&zoom=-2&x=6885&z=24608'),
		{
			world: 'world',
			map: undefined,
			location: {x: 6885, y: 64, z: 24608},
			zoom: undefined,
			legacy: true
		}
	],
	[
		'Pl3xmap - NaN zoom',
		new URL('https://example.com/map/survival?world=world&zoom=fsghrtdrh&x=6885&z=24608'),
		{
			world: 'world',
			map: undefined,
			location: {x: 6885, y: 64, z: 24608},
			zoom: undefined,
			legacy: true
		}
	],
	[
		'Pl3xmap - Missing z coordinate',
		new URL('https://example.com/map/survival?world=world&zoom=2&x=6885'),
		{
			world: 'world',
			map: undefined,
			location: undefined,
			zoom: 2,
			legacy: true
		}
	],
	[
		'Pl3xmap - NaN z coordinate',
		new URL('https://example.com/map/survival?worldname=world&mapname=surface&zoom=2&x=6885&z=j'),
		{
			world: 'world',
			map: 'surface',
			location: undefined,
			zoom: 2,
			legacy: true
		}
	],
	[
		'Pl3xmap - Invalid/missing coordinates',
		new URL('https://example.com/map/survival?world=world&x=3wresfsg'),
		{
			world: 'world',
			map: undefined,
			location: undefined,
			zoom: undefined,
			legacy: true
		}
	],
	[
		'empty hash',
		new URL('https://example.com/map/survival#'),
		null
	],
	[
		'empty query',
		new URL('https://example.com/map/survival?'),
		null
	],
	[
		'invalid query',
		new URL('https://example.com/map/survival?invalid=aaa&bbb=54'),
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

describe("guessWorldDimension", () => {
	const worlds: [string, LiveAtlasDimension][] = [
		['world', 'overworld'],
		['smp2022', 'overworld'],
		['DIM-1', 'nether'],
		['world_nether', 'nether'],
		['smp_nether', 'nether'],
		['smpnether', 'nether'],
		['nether_smp', 'nether'],
		['DIM1', 'end'],
		['world_the_end', 'end'],
		['end', 'end'],
		['smp_end', 'end'],
		['smpend', 'overworld'], //Would have too many false positives
		['end_smp', 'end'],
	];

	test.each(worlds)('%s -> %s', (input: string, expected: LiveAtlasDimension) =>
		expect(guessWorldDimension(input)).toBe(expected))
})


test("getUrlForLocation", () => {
	const map = new LiveAtlasMapDefinition({
		name: 'test_map',
		world: {
			name: 'test_world',
			displayName: 'Test World',
			dimension: 'overworld',
			seaLevel: 64,
			maps: new Set()
		},
		baseUrl: 'test/',
		tileSize: 128,
		imageFormat: 'png',
		nativeZoomLevels: 1
	});

	expect(getUrlForLocation(map, {x: 100, y: 68.5, z: -2300.3}, 3))
		.toEqual('#test_world;test_map;100,69,-2300;3')
});

test("getMessages", () => {
	const expectedGlobal: LiveAtlasGlobalMessageConfig = globalMessages.reduce((result: any, key) => {
		result[key] = `Missing message: ${key}`;
		return result;
	}, {});
	const expectedMessages: LiveAtlasMessageConfig = Object.assign({}, expectedGlobal, serverMessages.reduce((result: any, key) => {
		result[key] = `Missing message: ${key}`;
		return result;
	}, {}));

	const input: any = {
		extraProperty: true, //Invalid message key
		serversHeading: undefined, // Valid message key but undefined
		mapTitle: null, // Valid message key but null
		loginTitle: '', // Valid message key but empty string
		registerConfirmPasswordLabel: {invalid: true}, //Valid message key but not a string,
		chatErrorDisabled: 'test defined global message', // Valid global message
		chatPlayerQuit: 'test defined server message' // Valid server message
	};

	expectedGlobal.chatErrorDisabled = expectedMessages.chatErrorDisabled = input.chatErrorDisabled;
	expectedMessages.chatPlayerQuit = input.chatPlayerQuit;

	expect(getMessages(input)).toEqual(expectedMessages);
	expect(getGlobalMessages(input)).toEqual(expectedGlobal);
});
