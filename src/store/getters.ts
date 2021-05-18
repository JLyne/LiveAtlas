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

import {GetterTree} from "vuex";
import {State} from "@/store/state";
import {getMinecraftTime} from "@/util";
import {LiveAtlasDynmapServerDefinition} from "@/index";

export type Getters = {
	playerMarkersEnabled(state: State): boolean;
	coordinatesControlEnabled(state: State): boolean;
	clockControlEnabled(state: State): boolean;
	night(state: State): boolean;
	mapBackground(state: State, getters: GetterTree<State, State> & Getters): string;
	url(state: State, getters: GetterTree<State, State> & Getters): string;
	serverConfig(state: State, getters: GetterTree<State, State> & Getters): LiveAtlasDynmapServerDefinition;
}

export const getters: GetterTree<State, State> & Getters = {
	playerMarkersEnabled(state: State): boolean {
		return state.components.playerMarkers !== undefined;
	},

	coordinatesControlEnabled(state: State): boolean {
		return state.components.coordinatesControl !== undefined;
	},

	clockControlEnabled(state: State): boolean {
		return state.components.clockControl !== undefined;
	},

	night(state: State): boolean {
		return getMinecraftTime(state.currentWorldState.timeOfDay).night;
	},

	mapBackground(state: State): string {
		if(!state.currentMap) {
			return 'transparent';
		}

		if(state.currentMap.nightAndDay) {
			if(getMinecraftTime(state.currentWorldState.timeOfDay).night) {
				return state.currentMap.backgroundNight || state.currentMap.background || 'transparent';
			}

			return state.currentMap.backgroundDay || state.currentMap.background || 'transparent';
		}

		return state.currentMap.background || 'transparent';
	},

	url(state: State): string {
		const x = Math.round(state.currentLocation.x),
			y = Math.round(state.currentLocation.y),
			z = Math.round(state.currentLocation.z),
			locationString = `${x},${y},${z}`,
			zoom = state.currentZoom;

		if(!state.currentWorld || !state.currentMap) {
			return '';
		}

		return `#${state.currentWorld.name};${state.currentMap.name};${locationString};${zoom}`;
	},

	serverConfig(state: State): LiveAtlasDynmapServerDefinition {
		if(!state.currentServer) {
			throw RangeError("No current server");
		}

		return state.servers.get(state.currentServer) as LiveAtlasDynmapServerDefinition;
	},
}