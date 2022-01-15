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

import {
	LiveAtlasAreaMarker,
	LiveAtlasCircleMarker,
	LiveAtlasLineMarker,
	LiveAtlasMarker, LiveAtlasMarkerType,
	LiveAtlasPointMarker
} from "@/index";

declare global {
	// noinspection JSUnusedGlobalSymbols
	interface Window {
		config: { url: DynmapUrlConfig };
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

interface DynmapPointUpdate extends DynmapMarkerUpdate {
	payload?: LiveAtlasPointMarker
}

interface DynmapAreaUpdate extends DynmapMarkerUpdate {
	payload?: LiveAtlasAreaMarker
}

interface DynmapCircleUpdate extends DynmapMarkerUpdate {
	payload?: LiveAtlasCircleMarker
}

interface DynmapLineUpdate extends DynmapMarkerUpdate {
	payload?: LiveAtlasLineMarker
}

interface DynmapTileUpdate {
	name: string
	timestamp: number
}
