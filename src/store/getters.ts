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

import {GetterTree} from "vuex";
import {State} from "@/store/state";
import {getMinecraftTime, getUrlForLocation} from "@/util";
import {LiveAtlasMapProvider} from "@/index";

export type Getters = {
	playerMarkersEnabled(state: State): boolean;
	markerUIEnabled(state: State): boolean;
	coordinatesControlEnabled(state: State): boolean;
	clockControlEnabled(state: State): boolean;
	loginEnabled(state: State): boolean;
	night(state: State): boolean;
	mapBackground(state: State, getters: GetterTree<State, State> & Getters): string;
	url(state: State, getters: GetterTree<State, State> & Getters): string;
	pageTitle(state: State, getters: GetterTree<State, State> & Getters): string;
	playersHeading(state: State, getters: GetterTree<State, State> & Getters): string;
	currentMapProvider(state: State): LiveAtlasMapProvider | undefined;
}

export const getters: GetterTree<State, State> & Getters = {
	playerMarkersEnabled(state: State): boolean {
		return state.components.players.markers !== undefined;
	},

	markerUIEnabled(state: State): boolean {
		return !state.ui.disableMarkerUI;
	},

	coordinatesControlEnabled(state: State): boolean {
		return state.components.coordinatesControl !== undefined;
	},

	clockControlEnabled(state: State): boolean {
		return state.components.clockControl !== undefined;
	},

	loginEnabled(state: State): boolean {
		return state.components.login || state.loginRequired;
	},

	night(state: State): boolean {
		return getMinecraftTime(state.currentWorldState.timeOfDay || 0).night;
	},

	mapBackground(state: State): string {
		if(!state.currentMap) {
			return 'transparent';
		}

		if(state.currentMap.nightAndDay) {
			if(getMinecraftTime(state.currentWorldState.timeOfDay || 0).night) {
				return state.currentMap.backgroundNight || state.currentMap.background || 'transparent';
			}

			return state.currentMap.backgroundDay || state.currentMap.background || 'transparent';
		}

		return state.currentMap.background || 'transparent';
	},

	url(state: State): string {
		if(!state.currentWorld || !state.currentMap) {
			return '';
		}

		return getUrlForLocation(state.currentMap, state.currentLocation, state.currentZoom);
	},

	pageTitle(state: State): string {
		return state.configuration.title
			.replace(/{world}/gi, state.currentWorld?.displayName || 'No world')
			.replace(/{map}/gi, state.currentMap?.displayName || 'No map');
	},

	playersHeading(state: State): string {
		return state.messages.playersHeading
					.replace('{cur}', state.players.size.toString())
					.replace('{max}', state.maxPlayers.toString());
	},

	currentMapProvider(state: State): LiveAtlasMapProvider | undefined {
		return state.currentMapProvider;
	}
}
