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

import {MutationTypes} from "@/store/mutation-types";
import {ActionContext, ActionTree} from "vuex";
import {State} from "@/store/state";
import {ActionTypes} from "@/store/action-types";
import API from '@/api';
import {Mutations} from "@/store/mutations";
import {
	DynmapAreaUpdate, DynmapCircleUpdate,
	DynmapConfigurationResponse, DynmapLineUpdate,
	DynmapMarkerSet,
	DynmapMarkerUpdate,
	DynmapPlayer, DynmapTileUpdate,
	DynmapUpdateResponse, DynmapWorld
} from "@/dynmap";

type AugmentedActionContext = {
	commit<K extends keyof Mutations>(
		key: K,
		payload: Parameters<Mutations[K]>[1]
		):ReturnType<Mutations[K]>;
} & Omit<ActionContext<State, State>, "commit">

export interface Actions {
	[ActionTypes.LOAD_CONFIGURATION](
		{commit}: AugmentedActionContext,
	):Promise<DynmapConfigurationResponse>
	[ActionTypes.GET_UPDATE](
		{commit}: AugmentedActionContext,
	):Promise<DynmapUpdateResponse>
	[ActionTypes.GET_MARKER_SETS](
		{commit}: AugmentedActionContext,
	):Promise<Map<string, DynmapMarkerSet>>
	[ActionTypes.SET_PLAYERS](
		{commit}: AugmentedActionContext,
		payload: Set<DynmapPlayer>
	):Promise<Map<string, DynmapMarkerSet>>
	[ActionTypes.POP_MARKER_UPDATES](
		{commit}: AugmentedActionContext,
		payload: {markerSet: string, amount: number}
	): Promise<DynmapMarkerUpdate[]>
	[ActionTypes.POP_AREA_UPDATES](
		{commit}: AugmentedActionContext,
		payload: {markerSet: string, amount: number}
	): Promise<DynmapAreaUpdate[]>
	[ActionTypes.POP_CIRCLE_UPDATES](
		{commit}: AugmentedActionContext,
		payload: {markerSet: string, amount: number}
	): Promise<DynmapCircleUpdate[]>
	[ActionTypes.POP_LINE_UPDATES](
		{commit}: AugmentedActionContext,
		payload: {markerSet: string, amount: number}
	): Promise<DynmapLineUpdate[]>
	[ActionTypes.POP_TILE_UPDATES](
		{commit}: AugmentedActionContext,
		payload: number
	): Promise<DynmapTileUpdate[]>
	[ActionTypes.SEND_CHAT_MESSAGE](
		{commit}: AugmentedActionContext,
		payload: string
	): Promise<void>
}

export const actions: ActionTree<State, State> & Actions = {
	[ActionTypes.LOAD_CONFIGURATION]({commit, state}): Promise<DynmapConfigurationResponse> {
		return API.getConfiguration().then(config => {
			commit(MutationTypes.SET_CONFIGURATION, config.config);
			commit(MutationTypes.SET_MESSAGES, config.messages);
			commit(MutationTypes.SET_WORLDS, config.worlds);
			commit(MutationTypes.SET_COMPONENTS, config.components);
			commit(MutationTypes.SET_LOGGED_IN, config.loggedIn);

			if(state.configuration.expandUI && !state.ui.smallScreen) {
				commit(MutationTypes.SET_UI_ELEMENT_VISIBILITY, {element: 'players', state: true});
				commit(MutationTypes.SET_UI_ELEMENT_VISIBILITY, {element: 'maps', state: true});
			}

			let worldName, mapName;

			// Use config default world if it exists
			if(config.config.defaultWorld && state.worlds.has(config.config.defaultWorld)) {
				worldName = config.config.defaultWorld;
			}

			// Prefer world from parsed url if present and it exists
			if(state.parsedUrl.world && state.worlds.has(state.parsedUrl.world)) {
				worldName = state.parsedUrl.world;
			}

			// Use first world, if any, if neither of the above exist
			if(!worldName) {
				worldName = state.worlds.size ? state.worlds.entries().next().value[1].name : undefined;
			}

			if(worldName) {
				const world = state.worlds.get(worldName) as DynmapWorld;

				// Use config default map if it exists
				if(config.config.defaultMap && world.maps.has(config.config.defaultMap)) {
					mapName = config.config.defaultMap;
				}

				// Prefer map from parsed url if present and it exists
				if(state.parsedUrl.map && world.maps.has(state.parsedUrl.map)) {
					mapName = state.parsedUrl.map;
				}

				// Use first map, if any, if neither of the above exist
				if(!mapName) {
					mapName = world.maps.size ? world.maps.entries().next().value[1].name : undefined;
				}
			}

			if(worldName && mapName) {
				commit(MutationTypes.SET_CURRENT_MAP, {
					worldName, mapName
				});
			}

			return config;
		});
	},
	[ActionTypes.GET_UPDATE]({commit, dispatch, state}) {
		if(!state.currentWorld) {
			return Promise.reject("No current world");
		}

		return API.getUpdate(state.updateRequestId, state.currentWorld.name, state.updateTimestamp.valueOf()).then(update => {
			commit(MutationTypes.SET_WORLD_STATE, update.worldState);
			commit(MutationTypes.SET_UPDATE_TIMESTAMP, new Date(update.timestamp));
			commit(MutationTypes.INCREMENT_REQUEST_ID, undefined);
			commit(MutationTypes.ADD_MARKER_SET_UPDATES, update.updates.markerSets);
			commit(MutationTypes.ADD_TILE_UPDATES, update.updates.tiles);
			commit(MutationTypes.ADD_CHAT, update.updates.chat);

			return dispatch(ActionTypes.SET_PLAYERS, update.players).then(() => {
				return update;
			});
		});
	},
	[ActionTypes.SET_PLAYERS]({commit, state}, players: Set<DynmapPlayer>) {
		const keep: Set<string> = new Set();

		for(const player of players) {
			keep.add(player.account);
		}

		//Remove any players that aren't in the set
		commit(MutationTypes.SYNC_PLAYERS, keep);

		const processQueue = (players: Set<DynmapPlayer>, resolve: Function) => {
			commit(MutationTypes.SET_PLAYERS_ASYNC, players);

			if(!players.size) {
				resolve();
			} else {
				requestAnimationFrame(() => processQueue(players, resolve));
			}
		}

		//Set players every frame until done
		return new Promise((resolve) => {
			requestAnimationFrame(() => processQueue(players, resolve));
		});
	},
	[ActionTypes.GET_MARKER_SETS]({commit, state}) {
		if(!state.currentWorld) {
			return Promise.reject("No current world");
		}

		return API.getMarkerSets(state.currentWorld.name).then(markerSets => {
			commit(MutationTypes.SET_MARKER_SETS, markerSets);

			return markerSets;
		});
	},

	[ActionTypes.POP_MARKER_UPDATES]({commit, state}, {markerSet, amount}: {markerSet: string, amount: number}): Promise<DynmapMarkerUpdate[]> {
		if(!state.markerSets.has(markerSet)) {
			console.warn(`POP_MARKER_UPDATES: Marker set ${markerSet} doesn't exist`);
			return Promise.resolve([]);
		}

		const updates = state.pendingSetUpdates.get(markerSet)!.markerUpdates.slice(0, amount);

		commit(MutationTypes.POP_MARKER_UPDATES, {markerSet, amount});

		return Promise.resolve(updates);
	},

	[ActionTypes.POP_AREA_UPDATES]({commit, state}, {markerSet, amount}: {markerSet: string, amount: number}): Promise<DynmapAreaUpdate[]> {
		if(!state.markerSets.has(markerSet)) {
			console.warn(`POP_AREA_UPDATES: Marker set ${markerSet} doesn't exist`);
			return Promise.resolve([]);
		}

		const updates = state.pendingSetUpdates.get(markerSet)!.areaUpdates.slice(0, amount);

		commit(MutationTypes.POP_AREA_UPDATES, {markerSet, amount});

		return Promise.resolve(updates);
	},

	[ActionTypes.POP_CIRCLE_UPDATES]({commit, state}, {markerSet, amount}: {markerSet: string, amount: number}): Promise<DynmapCircleUpdate[]> {
		if(!state.markerSets.has(markerSet)) {
			console.warn(`POP_CIRCLE_UPDATES: Marker set ${markerSet} doesn't exist`);
			return Promise.resolve([]);
		}

		const updates = state.pendingSetUpdates.get(markerSet)!.circleUpdates.slice(0, amount);

		commit(MutationTypes.POP_CIRCLE_UPDATES, {markerSet, amount});

		return Promise.resolve(updates);
	},

	[ActionTypes.POP_LINE_UPDATES]({commit, state}, {markerSet, amount}: {markerSet: string, amount: number}): Promise<DynmapLineUpdate[]> {
		if(!state.markerSets.has(markerSet)) {
			console.warn(`POP_LINE_UPDATES: Marker set ${markerSet} doesn't exist`);
			return Promise.resolve([]);
		}

		const updates = state.pendingSetUpdates.get(markerSet)!.lineUpdates.slice(0, amount);

		commit(MutationTypes.POP_LINE_UPDATES, {markerSet, amount});

		return Promise.resolve(updates);
	},

	[ActionTypes.POP_TILE_UPDATES]({commit, state}, amount: number): Promise<Array<DynmapTileUpdate>> {
		const updates = state.pendingTileUpdates.slice(0, amount);

		commit(MutationTypes.POP_TILE_UPDATES, amount);

		return Promise.resolve(updates);
	},

	[ActionTypes.SEND_CHAT_MESSAGE]({commit, state}, message: string): Promise<void> {
		return API.sendChatMessage(message);
	},
}