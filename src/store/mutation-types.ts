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

export enum MutationTypes {
	SET_UI_CONFIGURATION ='setUIConfiguration',
	SET_MESSAGES ='setMessages',
	SET_SERVERS = 'setServers',

	SET_SERVER_CONFIGURATION = 'setServerConfiguration',
	SET_SERVER_CONFIGURATION_HASH = 'setServerConfigurationHash',
	SET_WORLDS = 'setWorlds',
	SET_COMPONENTS = 'setComponents',
	SET_MARKER_SETS = 'setMarkerSets',
	SET_MARKERS = 'setMarkers',
	SET_WORLD_STATE = 'setWorldState',
	ADD_MARKER_SET_UPDATES = 'addMarkerSetUpdates',
	ADD_MARKER_UPDATES = 'addMarkerUpdates',
	ADD_TILE_UPDATES = 'addTileUpdates',
	ADD_CHAT = 'addChat',
	POP_LAYER_UPDATES = 'popLayerUpdates',
	POP_MARKER_UPDATES = 'popMarkerUpdates',
	POP_TILE_UPDATES = 'popTileUpdates',
	SET_MAX_PLAYERS = 'setMaxPlayers',
	SET_PLAYERS_ASYNC = 'setPlayersAsync',
	SYNC_PLAYERS = 'syncPlayers',
	ADD_LAYER = 'addLayer',
	UPDATE_LAYER = 'updateLayer',
	REMOVE_LAYER = 'removeLayer',
	SET_LOADED = 'setLoaded',

	SET_CURRENT_SERVER = 'setCurrentServer',
	SET_CURRENT_MAP = 'setCurrentMap',
	SET_CURRENT_LOCATION = 'setCurrentLocation',
	SET_CURRENT_ZOOM = 'setCurrentZoom',
	SET_PARSED_URL = 'setParsedUrl',
	CLEAR_PARSED_URL = 'clearParsedUrl',

	SET_FOLLOW_TARGET = 'setFollowTarget',
	SET_VIEW_TARGET = 'setViewTarget',

	CLEAR_FOLLOW_TARGET = 'clearFollow',
	CLEAR_VIEW_TARGET = 'clearViewTarget',

	SET_SCREEN_SIZE = 'setScreenSize',
	TOGGLE_UI_ELEMENT_VISIBILITY = 'toggleUIElementVisibility',
	SET_UI_ELEMENT_VISIBILITY = 'setUIElementVisibility',
	SHOW_UI_MODAL = 'showUIModal',
	HIDE_UI_MODAL = 'hideUIModal',

	TOGGLE_SIDEBAR_SECTION_COLLAPSED_STATE = 'toggleSidebarSectionCollapsedState',

	SET_LOGGED_IN = 'setLoggedIn',
	SET_LOGIN_REQUIRED = 'setLoginRequired',
	RESET = 'reset'
}
