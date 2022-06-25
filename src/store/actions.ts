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

import {nextTick} from "vue";
import {ActionContext, ActionTree} from "vuex";
import {LiveAtlasGlobalConfig, LiveAtlasMarkerSet, LiveAtlasPlayer, LiveAtlasWorldDefinition} from "@/index";
import {DynmapMarkerUpdate, DynmapTileUpdate} from "@/dynmap";
import {MutationTypes} from "@/store/mutation-types";
import {State} from "@/store/state";
import {ActionTypes} from "@/store/action-types";
import {Mutations} from "@/store/mutations";
import {startUpdateHandling, stopUpdateHandling} from "@/util/markers";
import {Layer} from "leaflet";

type AugmentedActionContext = {
	commit<K extends keyof Mutations>(
		key: K,
		payload: Parameters<Mutations[K]>[1]
		):ReturnType<Mutations[K]>;
} & Omit<ActionContext<State, State>, "commit">

export interface Actions {
	[ActionTypes.INIT](
		{commit}: AugmentedActionContext,
		payload: LiveAtlasGlobalConfig,
	):Promise<void>
	[ActionTypes.LOAD_CONFIGURATION](
		{commit}: AugmentedActionContext,
	):Promise<void>
	[ActionTypes.START_UPDATES](
		{commit}: AugmentedActionContext,
	):Promise<void>
	[ActionTypes.STOP_UPDATES](
		{commit}: AugmentedActionContext,
	):Promise<void>
	[ActionTypes.SET_PLAYERS](
		{commit}: AugmentedActionContext,
		payload: Set<LiveAtlasPlayer>
	):Promise<Map<string, LiveAtlasMarkerSet>>
	[ActionTypes.POP_LAYER_UPDATES](
		{commit}: AugmentedActionContext,
	):Promise<[Layer, boolean][]>
	[ActionTypes.POP_MARKER_UPDATES](
		{commit}: AugmentedActionContext,
		amount: number
	): Promise<DynmapMarkerUpdate[]>
	[ActionTypes.POP_TILE_UPDATES](
		{commit}: AugmentedActionContext,
		payload: number
	): Promise<DynmapTileUpdate[]>
	[ActionTypes.SEND_CHAT_MESSAGE](
		{commit}: AugmentedActionContext,
		payload: string
	): Promise<void>
	[ActionTypes.LOGIN](
		{commit}: AugmentedActionContext,
		payload: any
	): Promise<void>
	[ActionTypes.LOGOUT](
		{commit}: AugmentedActionContext
	): Promise<void>
	[ActionTypes.REGISTER](
		{commit}: AugmentedActionContext,
		payload: any
	): Promise<void>
}

export const actions: ActionTree<State, State> & Actions = {
	async [ActionTypes.INIT]({commit}, config: LiveAtlasGlobalConfig): Promise<void> {
		commit(MutationTypes.SET_UI_CONFIGURATION, config?.ui || {})
		commit(MutationTypes.SET_MESSAGES, config?.messages || {})
		commit(MutationTypes.SET_SERVERS, config.servers)
	},

	async [ActionTypes.LOAD_CONFIGURATION]({commit, state, dispatch}): Promise<void> {
		await dispatch(ActionTypes.STOP_UPDATES, undefined);
		commit(MutationTypes.RESET, undefined);

		if(!state.currentServer) {
			console.warn('No current server');
			return;
		}

		await state.currentMapProvider!.loadServerConfiguration();

		//Skip default map/ui visibility logic if we already have a map selected (i.e config reload after hash change)
		if(state.currentMap) {
			return;
		}

		//Make UI visible if configured, there's enough space to do so, and this is the first config load
		if(!state.ui.visibleElements.size && state.configuration.expandUI && !state.ui.smallScreen) {
			commit(MutationTypes.SET_UI_ELEMENT_VISIBILITY, {element: 'players', state: true});
			commit(MutationTypes.SET_UI_ELEMENT_VISIBILITY, {element: 'maps', state: true});

			if(!state.ui.disableMarkerUI) {
				commit(MutationTypes.SET_UI_ELEMENT_VISIBILITY, {element: 'markers', state: true});
			}
		}

		let worldName, mapName;

		// Use config default world if it exists
		if(state.configuration.defaultWorld && state.worlds.has(state.configuration.defaultWorld)) {
			worldName = state.configuration.defaultWorld;
		}

		// Prefer world from parsed url if present and it exists
		if(state.parsedUrl?.world && state.worlds.has(state.parsedUrl.world)) {
			worldName = state.parsedUrl.world;
		}

		// Use first world, if any, if neither of the above exist
		if(!worldName) {
			worldName = state.worlds.size ? state.worlds.entries().next().value[1].name : undefined;
		}

		if(worldName) {
			// Use config default map if it exists
			if(state.configuration.defaultMap && state.maps.has(`${worldName}_${state.configuration.defaultMap}`)) {
				mapName = state.configuration.defaultMap;
			}

			// Prefer map from parsed url if present and it exists
			if(state.parsedUrl?.map && state.maps.has(`${worldName}_${state.parsedUrl.map}`)) {
				mapName = state.parsedUrl.map;
			}

			// Use first map, if any, if neither of the above exist
			if(!mapName) {
				const world = state.worlds.get(worldName) as LiveAtlasWorldDefinition;
				mapName = world.maps.size ? world.maps.values().next().value.name : undefined;
			}
		}

		if(worldName && mapName) {
			commit(MutationTypes.SET_CURRENT_MAP, {
				worldName, mapName
			});
		}

		await nextTick(() => commit(MutationTypes.SET_LOADED, undefined));
	},

	async [ActionTypes.START_UPDATES]({state}) {
		if(!state.currentWorld) {
			return Promise.reject("No current world");
		}

		state.currentMapProvider!.startUpdates();
		startUpdateHandling();
	},

	async [ActionTypes.STOP_UPDATES]({state}) {
		state.currentMapProvider!.stopUpdates();
		stopUpdateHandling();
	},

	[ActionTypes.SET_PLAYERS]({commit}, players: Set<LiveAtlasPlayer>) {
		const keep: Set<string> = new Set();

		for(const player of players) {
			keep.add(player.name);
		}

		//Remove any players that aren't in the set
		commit(MutationTypes.SYNC_PLAYERS, keep);

		const processQueue = (players: Set<LiveAtlasPlayer>, resolve: Function) => {
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

	async [ActionTypes.POP_LAYER_UPDATES]({commit, state}): Promise<[Layer, boolean][]> {
		const updates = Array.from(state.pendingLayerUpdates.entries());

		commit(MutationTypes.POP_LAYER_UPDATES, undefined);

		return updates;
	},

	async [ActionTypes.POP_MARKER_UPDATES]({commit, state}, amount: number): Promise<DynmapMarkerUpdate[]> {
		const updates = state.pendingMarkerUpdates.slice(0, amount);

		commit(MutationTypes.POP_MARKER_UPDATES, amount);

		return updates;
	},

	async [ActionTypes.POP_TILE_UPDATES]({commit, state}, amount: number): Promise<Array<DynmapTileUpdate>> {
		const updates = state.pendingTileUpdates.slice(0, amount);

		commit(MutationTypes.POP_TILE_UPDATES, amount);

		return updates;
	},

	async [ActionTypes.SEND_CHAT_MESSAGE]({state}, message: string): Promise<void> {
		await state.currentMapProvider!.sendChatMessage(message);
	},

	async [ActionTypes.LOGIN]({state, commit}, data: any): Promise<void> {
		if(data) {
			await state.currentMapProvider!.login(data);
		} else {
			if(state.ui.customLoginUrl) {
				window.location.href = state.ui.customLoginUrl;
			} else {
				commit(MutationTypes.SHOW_UI_MODAL, 'login');
			}
		}
	},

	async [ActionTypes.LOGOUT]({state}): Promise<void> {
		await state.currentMapProvider!.logout();
	},

	async [ActionTypes.REGISTER]({state}, data: any): Promise<void> {
		await state.currentMapProvider!.register(data);
	},
}
