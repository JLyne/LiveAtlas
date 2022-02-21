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
import cases from 'jest-in-case';

describe("parseURL", () => {
	cases('valid Dynmap URLs', (options: any) => {
		expect(parseUrl(options.url)).toEqual(options.result);
	}, [
		{
			name: 'Complete URL',
			url: new URL('https://minecraft.rtgame.co.uk/build?worldname=world&mapname=surface&zoom=4&x=6885&y=64&z=24608'),
			result: {
				world: 'world',
				map: 'surface',
				location: {x: 6885, y: 64, z: 24608},
				zoom: 4,
				legacy: true
			}
		},
		{
			name: 'no location',
			url: new URL('https://minecraft.rtgame.co.uk/build?worldname=world&mapname=surface&zoom=4'),
			result: {
				world: 'world',
				map: 'surface',
				location: undefined,
				zoom: 4,
				legacy: true
			}
		},
		{
			name: 'no zoom',
			url: new URL('https://minecraft.rtgame.co.uk/build?worldname=world&mapname=surface&x=6885&y=64&z=24608'),
			result: {
				world: 'world',
				map: 'surface',
				location: {x: 6885, y: 64, z: 24608},
				zoom: undefined,
				legacy: true
			}
		},
		{
			name: 'no zoom or location',
			url: new URL('https://minecraft.rtgame.co.uk/build?worldname=world&mapname=surface'),
			result: {
				world: 'world',
				map: 'surface',
				location: undefined,
				zoom: undefined,
				legacy: true
			}
		},
		{
			name: 'no map, zoom or location',
			url: new URL('https://minecraft.rtgame.co.uk/build?worldname=world'),
			result: {
				world: 'world',
				map: undefined,
				location: undefined,
				zoom: undefined,
				legacy: true
			}
		}
	]);

	cases('valid Pl3xmap URLs', (options: any) => {
		expect(parseUrl(options.url)).toEqual(options.result);
	}, [
		{
			name: 'Complete URL',
			url: new URL('https://minecraft.rtgame.co.uk/build?world=world&zoom=4&x=6885&y=64&z=24608'),
			result: {
				world: 'world',
				map: undefined,
				location: {x: 6885, y: 64, z: 24608},
				zoom: 4,
				legacy: true
			}
		},
		{
			name: 'no location',
			url: new URL('https://minecraft.rtgame.co.uk/build?world=world&zoom=4'),
			result: {
				world: 'world',
				map: undefined,
				location: undefined,
				zoom: 4,
				legacy: true
			}
		},
		{
			name: 'no zoom',
			url: new URL('https://minecraft.rtgame.co.uk/build?world=world&x=6885&y=64&z=24608'),
			result: {
				world: 'world',
				map: undefined,
				location: {x: 6885, y: 64, z: 24608},
				zoom: undefined,
				legacy: true
			}
		},
		{
			name: 'no zoom or location',
			url: new URL('https://minecraft.rtgame.co.uk/build?world=world'),
			result: {
				world: 'world',
				map: undefined,
				location: undefined,
				zoom: undefined,
				legacy: true
			}
		},
		{
			name: 'nothing',
			url: new URL('https://minecraft.rtgame.co.uk/map/survival?'),
			result: null
		}
	]);

	cases('valid LiveAtlas URLs', (options: any) => {
		expect(parseUrl(options.url)).toEqual(options.result);
	}, [
		{
			name: 'Complete URL',
			url: new URL('https://minecraft.rtgame.co.uk/map/survival#world;flat;168,64,1914;2'),
			result: {
				world: 'world',
				map: 'flat',
				location: {x: 168, y: 64, z: 1914},
				zoom: 2,
				legacy: false
			}
		},
		{
			name: 'no zoom',
			url: new URL('https://minecraft.rtgame.co.uk/map/survival#world;flat;168,64,1914'),
			result: {
				world: 'world',
				map: 'flat',
				location: {x: 168, y: 64, z: 1914},
				zoom: undefined,
				legacy: false
			}
		},
		{
			name: 'no location or zoom',
			url: new URL('https://minecraft.rtgame.co.uk/map/survival#world;flat'),
			result: {
				world: 'world',
				map: 'flat',
				location: undefined,
				zoom: undefined,
				legacy: false
			}
		},
		{
			name: 'no map, location or zoom',
			url: new URL('https://minecraft.rtgame.co.uk/map/survival#world'),
			result: {
				world: 'world',
				map: undefined,
				location: undefined,
				zoom: undefined,
				legacy: false
			}
		},
		{
			name: 'nothing',
			url: new URL('https://minecraft.rtgame.co.uk/map/survival#'),
			result: null
		}
	]);

	cases('incomplete or invalid LiveAtlas URLs', (options: any) => {
		expect(parseUrl(options.url)).toEqual(options.result);
	}, [
		{
			name: 'negative zoom',
			url: new URL('https://minecraft.rtgame.co.uk/map/survival#world;flat;168,64,1914;-2'),
			result: {
				world: 'world',
				map: 'flat',
				location: {x: 168, y: 64, z: 1914},
				zoom: undefined,
				legacy: false
			}
		},
		{
			name: 'NaN zoom',
			url: new URL('https://minecraft.rtgame.co.uk/map/survival#world;flat;168,64,1914;ewsjtuiewshfoes'),
			result: {
				world: 'world',
				map: 'flat',
				location: {x: 168, y: 64, z: 1914},
				zoom: undefined,
				legacy: false
			}
		},
		{
			name: 'missing z coordinate',
			url: new URL('https://minecraft.rtgame.co.uk/map/survival#world;flat;168,64;2'),
			result: {
				world: 'world',
				map: 'flat',
				location: undefined,
				zoom: 2,
				legacy: false
			}
		},
		{
			name: 'NaN z coordinate',
			url: new URL('https://minecraft.rtgame.co.uk/map/survival#world;flat;168,64,j;2'),
			result: {
				world: 'world',
				map: 'flat',
				location: undefined,
				zoom: 2,
				legacy: false
			}
		},
		{
			name: 'missing y and z coordinates',
			url: new URL('https://minecraft.rtgame.co.uk/map/survival#world;flat;168;2'),
			result: {
				world: 'world',
				map: 'flat',
				location: undefined,
				zoom: 2,
				legacy: false
			}
		},
		{
			name: 'invalid location',
			url: new URL('https://minecraft.rtgame.co.uk/map/survival#world;flat;23wteyuisezujsezr'),
			result: {
				world: 'world',
				map: 'flat',
				location: undefined,
				zoom: undefined,
				legacy: false
			}
		}
	]);

	cases('incomplete or invalid Dynmap URLs', (options: any) => {
		expect(parseUrl(options.url)).toEqual(options.result);
	}, [
		{
			name: 'Negative zoom',
			url: new URL('https://minecraft.rtgame.co.uk/map/survival?worldname=world&mapname=surface&zoom=-2&x=6885&y=64&z=24608'),
			result: {
				world: 'world',
				map: 'surface',
				location: {x: 6885, y: 64, z: 24608},
				zoom: undefined,
				legacy: true
			}
		},
		{
			name: 'NaN zoom',
			url: new URL('https://minecraft.rtgame.co.uk/map/survival?worldname=world&mapname=surface&zoom=fsghrtdrh&x=6885&y=64&z=24608'),
			result: {
				world: 'world',
				map: 'surface',
				location: {x: 6885, y: 64, z: 24608},
				zoom: undefined,
				legacy: true
			}
		},
		{
			name: 'Missing z coordinate',
			url: new URL('https://minecraft.rtgame.co.uk/map/survival?worldname=world&mapname=surface&zoom=2&x=6885&y=64'),
			result: {
				world: 'world',
				map: 'surface',
				location: undefined,
				zoom: 2,
				legacy: true
			}
		},
		{
			name: 'NaN z coordinate',
			url: new URL('https://minecraft.rtgame.co.uk/map/survival?worldname=world&mapname=surface&zoom=2&x=6885&y=64&z=j'),
			result: {
				world: 'world',
				map: 'surface',
				location: undefined,
				zoom: 2,
				legacy: true
			}
		},
		{
			name: 'Missing y and z coordinates',
			url: new URL('https://minecraft.rtgame.co.uk/map/survival?worldname=world&mapname=surface&zoom=2&x=6885'),
			result: {
				world: 'world',
				map: 'surface',
				location: undefined,
				zoom: 2,
				legacy: true
			}
		},
		{
			name: 'Invalid/missing coordinates',
			url: new URL('https://minecraft.rtgame.co.uk/map/survival?worldname=world&mapname=surface&x=3wresfsg'),
			result: {
				world: 'world',
				map: 'surface',
				location: undefined,
				zoom: undefined,
				legacy: true
			}
		},
		{
			name: 'Missing world',
			url: new URL('https://minecraft.rtgame.co.uk/map/survival?mapname=surface&x=3wresfsg'),
			result: null
		}
	]);
});
