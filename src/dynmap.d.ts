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

import {
	LiveAtlasMarker, LiveAtlasMarkerType,
} from "@/index";

declare global {
	// noinspection JSUnusedGlobalSymbols
	interface Window {
		config: { url: DynmapUrlConfig };
	}
}

declare module 'dynmap' {
	interface WorldMapConfiguration {
		tilescale?: number;
	}
}

type DynmapUrlConfig = {
	configuration: string;
	update: string;
	sendmessage: string;
	login: string;
	register: string;
	tiles: string;
	markers: string;
}

interface DynmapMarkerSetUpdate {
	id: string,
	removed: boolean
	payload?: {
		showLabels: boolean;
		hidden: boolean;
		minZoom: number;
		maxZoom: number;
		priority: number;
		label: string;
	}
}

interface DynmapMarkerUpdate {
	set: string,
	id: string,
	type: LiveAtlasMarkerType,
	removed: boolean,
	payload: LiveAtlasMarker,
}

interface DynmapTileUpdate {
	name: string
	timestamp: number
}
