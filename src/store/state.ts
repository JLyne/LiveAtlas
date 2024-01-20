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
	Coordinate,
	LiveAtlasWorldState,
	LiveAtlasServerDefinition,
	LiveAtlasSidebarSection,
	LiveAtlasSortedPlayers,
	LiveAtlasUIElement,
	LiveAtlasWorldDefinition,
	LiveAtlasParsedUrl,
	LiveAtlasMessageConfig,
	LiveAtlasMapProvider,
	LiveAtlasPlayer,
	LiveAtlasMarkerSet,
	LiveAtlasComponentConfig,
	LiveAtlasServerConfig,
	LiveAtlasChat,
	LiveAtlasUIModal,
	LiveAtlasSidebarSectionState,
	LiveAtlasMarker, LiveAtlasMapViewTarget
} from "@/index";
import {
	DynmapMarkerUpdate,
	DynmapTileUpdate
} from "@/dynmap";
import LiveAtlasMapDefinition from "@/model/LiveAtlasMapDefinition";
import {getMessages} from "@/util";
import {getDefaultPlayerImage} from "@/util/images";

export type State = {
	version: string;
	firstLoad: boolean;
	initialTitle: string;

	servers: Map<string, LiveAtlasServerDefinition>;
	configuration: LiveAtlasServerConfig;
	configurationHash: number | undefined;
	messages: LiveAtlasMessageConfig;
	components: LiveAtlasComponentConfig;

	loggedIn: boolean;
	loginRequired: boolean;

	worlds: Map<string, LiveAtlasWorldDefinition>;
	maps: Map<string, LiveAtlasMapDefinition>;
	players: Map<string, LiveAtlasPlayer>;
	sortedPlayers: LiveAtlasSortedPlayers;
	maxPlayers: number;
	markerSets: Map<string, LiveAtlasMarkerSet>;

	chat: {
		unread: number;
		messages: LiveAtlasChat[];
	};

	pendingMarkerUpdates: DynmapMarkerUpdate[];
	pendingTileUpdates: Array<DynmapTileUpdate>;

	followTarget?: LiveAtlasPlayer;
	viewTarget?: LiveAtlasMapViewTarget;

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
		compactPlayerMarkers: boolean;
		disableContextMenu: boolean;
		disableMarkerUI: boolean;
		customLoginUrl: string | null;

		screenWidth: number;
		screenHeight: number;
		smallScreen: boolean;
		visibleElements: Set<LiveAtlasUIElement>;
		visibleModal?: LiveAtlasUIModal;
		previouslyVisibleElements: Set<LiveAtlasUIElement>;

		sidebar: {
			[K in LiveAtlasSidebarSection]: LiveAtlasSidebarSectionState
		};
	};

	parsedUrl?: LiveAtlasParsedUrl;
}

export const state: State = {
	version: (process.env.VITE_APP_VERSION || 'Unknown') as string,
	firstLoad: true,
	initialTitle: document.title,

	servers: new Map(),

	configuration: {
		defaultMap: '',
		defaultWorld: '',
		defaultZoom: 0,
		followMap: '',
		followZoom: 0,
		title: '',
		expandUI: false,
		singleMapWorlds: false,
	},
	configurationHash: undefined,

	messages: getMessages(),

	loggedIn: false,
	loginRequired: false,

	worlds: new Map(), //Defined (loaded) worlds with maps from configuration.json
	maps: new Map(), //Defined maps from configuration.json
	players: new Map(), //Online players from world.json
	sortedPlayers: [] as LiveAtlasSortedPlayers, //Online players from world.json, sorted by their sort property then alphabetically
	maxPlayers: 0,

	chat: {
		unread: 0,
		messages: [],
	},

	markerSets: new Map(), //Marker sets from world_markers.json, doesn't include the markers themselves for performance reasons

	pendingMarkerUpdates: [],  //Pending updates to markers/areas/etc
	pendingTileUpdates: [], //Pending updates to map tiles

	// Map plugin provided settings for various parts of LiveAtlas
	components: {
		// Settings for markers
		// (markers component in Dynmap)
		markers: {
			showLabels: false,
		},
		nightDay: {
			mode: "night_day",
			value: -1
		},
		// Settings for player related UI elements and markers
		players: {
			// Settings for online player markers
			// (playermarkers component in Dynmap, world-settings.x.player-tracker in squaremap)
			// If not present, player markers will be disabled
			markers: undefined,

			grayHiddenPlayers: true,

			// ("showplayerfacesinmenu" setting in dynmap)
			showImages: false,

			// (world-settings.x.player-tracker.heads-url in squaremap)
			imageUrl: getDefaultPlayerImage,
		},

		// Settings for coordinates control
		// ("coords" component in dynmap, settings.ui.coordinates in squaremap)
		// Adds control showing coordinates on map mouseover
		coordinatesControl: undefined,

		// Settings for world time/weather clock
		// ("digitalclock"/"timeofdayclock" components in dynmap)
		clockControl: undefined,

		// Settings for copy URL button
		// ("link" component in dynmap, settings.ui.link in squaremap)
		linkControl: false,

		// Enabled state of map layer control
		// ("showlayercontrol" setting in dynmap)
		layerControl: false,

		// Settings for additional controls containing arbitrary text, images and links
		// ("logo" components in dynmap)
		logoControls: [],

		// Settings for chat message sending functionality
		// ("chat" component in dynmap)
		chatSending: undefined,

		// Settings for chat box
		// ("chatbox" component in dynmap)
		chatBox: undefined,

		// Enabled state of player chat balloons
		// ("chatballoon" component in dynmap)
		chatBalloons: false,

		// Enabled state of login/registration functionality
		// ("login-enabled" setting in dynmap)
		login: false,
	},

	followTarget: undefined,
	viewTarget: undefined,

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
		compactPlayerMarkers: false,
		disableContextMenu: false,
		disableMarkerUI: false,
		customLoginUrl: null,

		screenWidth: window.innerWidth,
		screenHeight: window.innerHeight,
		smallScreen: false,
		visibleElements: new Set(),
		visibleModal: undefined,
		previouslyVisibleElements: new Set(),

		sidebar: {
			servers: {},
			players: {},
			maps: {},
			markers: {},
		},
	}
};

export const nonReactiveState = Object.freeze({
	markers: new Map<string, Map<string, LiveAtlasMarker>>(),
});
