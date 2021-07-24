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

import {
	DynmapComponentConfig, DynmapMarkerSet, DynmapMarkerSetUpdates,
	DynmapPlayer,
	DynmapServerConfig, DynmapTileUpdate,
	DynmapChat
} from "@/dynmap";
import {
	Coordinate,
	LiveAtlasWorldState,
	LiveAtlasServerDefinition,
	LiveAtlasSidebarSection,
	LiveAtlasSortedPlayers,
	LiveAtlasUIElement,
	LiveAtlasWorldDefinition,
	LiveAtlasParsedUrl,
	LiveAtlasMessageConfig, LiveAtlasMapProvider
} from "@/index";
import LiveAtlasMapDefinition from "@/model/LiveAtlasMapDefinition";

export type State = {
	version: string;
	servers: Map<string, LiveAtlasServerDefinition>;
	configuration: DynmapServerConfig;
	configurationHash: number | undefined;
	messages: LiveAtlasMessageConfig;
	components: DynmapComponentConfig;

	loggedIn: boolean;

	worlds: Map<string, LiveAtlasWorldDefinition>;
	maps: Map<string, LiveAtlasMapDefinition>;
	players: Map<string, DynmapPlayer>;
	sortedPlayers: LiveAtlasSortedPlayers;
	markerSets: Map<string, DynmapMarkerSet>;

	chat: {
		unread: number;
		messages: DynmapChat[];
	};

	pendingSetUpdates: Map<string, DynmapMarkerSetUpdates>;
	pendingTileUpdates: Array<DynmapTileUpdate>;

	followTarget?: DynmapPlayer;
	panTarget?: DynmapPlayer;

	currentMapProvider?: Readonly<LiveAtlasMapProvider>;
	currentServer?: LiveAtlasServerDefinition;
	currentWorldState: LiveAtlasWorldState;
	currentWorld?: LiveAtlasWorldDefinition;
	currentMap?: LiveAtlasMapDefinition;
	currentLocation: Coordinate;
	currentZoom: number;

	ui: {
		playersAboveMarkers: boolean;
		playersSearch: boolean;

		smallScreen: boolean;
		visibleElements: Set<LiveAtlasUIElement>;
		previouslyVisibleElements: Set<LiveAtlasUIElement>;

		sidebar: {
			collapsedSections: Set<LiveAtlasSidebarSection>;
		}
	};

	parsedUrl?: LiveAtlasParsedUrl;
}

export const state: State = {
	version: (import.meta.env.VITE_VERSION || 'Unknown') as string,
	servers: new Map(),

	configuration: {
		version: '',
		defaultMap: '',
		defaultWorld: '',
		defaultZoom: 0,
		followMap: '',
		followZoom: 0,
		showLayerControl: false,
		title: '',
		loginEnabled: false,
		maxPlayers: 0,
		grayHiddenPlayers: false,
		expandUI: false,
		hash: 0,
	},
	configurationHash: undefined,

	messages: {
		chatPlayerJoin: '',
		chatPlayerQuit: '',
		chatAnonymousJoin: '',
		chatAnonymousQuit: '',
		chatNoMessages: '',
		chatTitle: '',
		chatLogin: '',
		chatLoginLink: '',
		chatSend: '',
		chatPlaceholder: '',
		chatErrorNotAllowed: '',
		chatErrorRequiresLogin: '',
		chatErrorCooldown: '',
		chatErrorDisabled: '',
		chatErrorUnknown: '',
		serversHeading: '',
		worldsHeading: '',
		worldsSkeleton: '',
		playersSkeleton: '',
		playersHeading: '',
		playersTitle: '',
		playersTitleHidden: '',
		playersTitleOtherWorld: '',
		playersSearchPlaceholder: '',
		playersSearchSkeleton: '',
		followingHeading: '',
		followingUnfollow: '',
		followingTitleUnfollow: '',
		followingHidden: '',
		linkTitle: '',
		loadingTitle: '',
		locationRegion: '',
		locationChunk: '',
		contextMenuCopyLink: '',
		contextMenuCenterHere: '',
		toggleTitle: '',
		mapTitle: '',
		layersTitle: '',
		copyToClipboardSuccess: '',
		copyToClipboardError: '',
	},

	loggedIn: false,

	worlds: new Map(), //Defined (loaded) worlds with maps from configuration.json
	maps: new Map(), //Defined maps from configuration.json
	players: new Map(), //Online players from world.json
	sortedPlayers: [] as LiveAtlasSortedPlayers, //Online players from world.json, sorted by their sort property then alphabetically

	chat: {
		unread: 0,
		messages: [],
	},

	markerSets: new Map(), //Markers from world_markers.json. Contents of each set isn't reactive for performance reasons.
	pendingSetUpdates: new Map(), //Pending updates to markers/areas/etc for each marker set
	pendingTileUpdates: [], //Pending updates to map tiles

	//Dynmap optional components
	components: {
		// "markers" component. Only used for default showLabels settings
		markers: {
			showLabels: false,
		},

		// Optional "playermarkers" component. Settings for online player markers.
		// If not present, player markers will be disabled
		playerMarkers: undefined,

		//Optional "coords" component. Adds control showing coordinates on map mouseover
		coordinatesControl: undefined,

		//Optional clock component. Used for both "digitalclock" and "timeofdayclock". Shows world time/weather.
		clockControl: undefined,

		//Optional "link" component. Adds button to copy url for current position
		linkControl: false,

		//Optional "logo" controls.
		logoControls: [],

		//Chat message sending functionality
		chatSending: undefined,

		//Chat box
		chatBox: undefined,

		//Chat balloons showing messages above player markers
		chatBalloons: false
	},

	followTarget: undefined,
	panTarget: undefined,

	currentMapProvider: undefined,
	currentServer: undefined,
	currentWorld: undefined,
	currentMap: undefined,
	currentLocation: {
		x: 0,
		y: 0,
		z: 0,
	},
	currentZoom: 0,
	currentWorldState: {
		raining: false,
		thundering: false,
		timeOfDay: 0,
	},

	ui: {
		playersAboveMarkers: true,
		playersSearch: true,

		smallScreen: false,
		visibleElements: new Set(),
		previouslyVisibleElements: new Set(),

		sidebar: {
			collapsedSections: new Set(),
		},
	}
};
