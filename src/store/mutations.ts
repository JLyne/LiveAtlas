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

import {MutationTree} from "vuex";
import {MutationTypes} from "@/store/mutation-types";
import {State} from "@/store/state";
import {
	DynmapArea,
	DynmapAreaUpdate,
	DynmapCircle,
	DynmapCircleUpdate,
	DynmapComponentConfig,
	DynmapLine,
	DynmapLineUpdate, Coordinate,
	DynmapMarker,
	DynmapMarkerSet,
	DynmapMarkerSetUpdates,
	DynmapMarkerUpdate,
	DynmapMessageConfig,
	DynmapPlayer,
	DynmapServerConfig, DynmapTileUpdate,
	DynmapWorld,
	DynmapWorldState, DynmapParsedUrl
} from "@/dynmap";
import {DynmapProjection} from "@/leaflet/projection/DynmapProjection";

export type CurrentMapPayload = {
	worldName: string;
	mapName: string;
}

export type Mutations<S = State> = {
	[MutationTypes.SET_CONFIGURATION](state: S, config: DynmapServerConfig): void
	[MutationTypes.SET_MESSAGES](state: S, messages: DynmapMessageConfig): void
	[MutationTypes.SET_WORLDS](state: S, worlds: Array<DynmapWorld>): void
	[MutationTypes.SET_COMPONENTS](state: S, worlds: DynmapComponentConfig): void
	[MutationTypes.SET_MARKER_SETS](state: S, worlds: Map<string, DynmapMarkerSet>): void
	[MutationTypes.ADD_WORLD](state: S, world: DynmapWorld): void
	[MutationTypes.SET_WORLD_STATE](state: S, worldState: DynmapWorldState): void
	[MutationTypes.SET_UPDATE_TIMESTAMP](state: S, time: Date): void
	[MutationTypes.ADD_MARKER_SET_UPDATES](state: S, updates: Map<string, DynmapMarkerSetUpdates>): void
	[MutationTypes.ADD_TILE_UPDATES](state: S, updates: Array<DynmapTileUpdate>): void

	[MutationTypes.POP_MARKER_UPDATES](state: S, payload: {markerSet: string, amount: number}): Array<DynmapMarkerUpdate>
	[MutationTypes.POP_AREA_UPDATES](state: S, payload: {markerSet: string, amount: number}): Array<DynmapAreaUpdate>
	[MutationTypes.POP_CIRCLE_UPDATES](state: S, payload: {markerSet: string, amount: number}): Array<DynmapCircleUpdate>
	[MutationTypes.POP_LINE_UPDATES](state: S, payload: {markerSet: string, amount: number}): Array<DynmapLineUpdate>
	[MutationTypes.POP_TILE_UPDATES](state: S, amount: number): Array<DynmapTileUpdate>

	[MutationTypes.INCREMENT_REQUEST_ID](state: S): void
	[MutationTypes.SET_PLAYERS_ASYNC](state: S, players: Set<DynmapPlayer>): Set<DynmapPlayer>
	[MutationTypes.SYNC_PLAYERS](state: S, keep: Set<string>): void
	[MutationTypes.SET_CURRENT_MAP](state: S, payload: CurrentMapPayload): void
	[MutationTypes.SET_CURRENT_PROJECTION](state: S, payload: DynmapProjection): void
	[MutationTypes.SET_CURRENT_LOCATION](state: S, payload: Coordinate): void
	[MutationTypes.SET_CURRENT_ZOOM](state: S, payload: number): void
	[MutationTypes.SET_PARSED_URL](state: S, payload: DynmapParsedUrl): void
	[MutationTypes.FOLLOW_PLAYER](state: S, payload: DynmapPlayer): void
	[MutationTypes.CLEAR_FOLLOW](state: S, a?: void): void
}

export const mutations: MutationTree<State> & Mutations = {
	// Sets configuration options from the initial config fetch
	[MutationTypes.SET_CONFIGURATION](state: State, config: DynmapServerConfig) {
		state.configuration = Object.assign(state.configuration, config);
	},

	//Set messsages from the initial config fetch
	[MutationTypes.SET_MESSAGES](state: State, messages: DynmapMessageConfig) {
		state.messages = Object.assign(state.messages, messages);
	},

	//Sets the list of worlds, and their settings, from the initial config fetch
	[MutationTypes.SET_WORLDS](state: State, worlds: Array<DynmapWorld>) {
		state.worlds.clear();
		state.maps.clear();

		state.currentMap = undefined;
		state.currentWorld = undefined;
		state.following = undefined;

		state.currentWorldState.timeOfDay = 0;
		state.currentWorldState.raining = false;
		state.currentWorldState.thundering = false;

		worlds.forEach(world => {
			state.worlds.set(world.name, world);
			world.maps.forEach(map => state.maps.set([world.name, map.name].join('_'), map));
		});
	},

	//Sets the state and settings of optional compontents, from the initial config fetch
	[MutationTypes.SET_COMPONENTS](state: State, components: DynmapComponentConfig) {
		state.components = components;
	},

	//Sets the existing marker sets from the last marker fetch
	[MutationTypes.SET_MARKER_SETS](state: State, markerSets: Map<string, DynmapMarkerSet>) {
		state.markerSets = markerSets;
		state.pendingSetUpdates.clear();

		for(const entry of markerSets) {
			state.pendingSetUpdates.set(entry[0], {
				markerUpdates: [],
				areaUpdates: [],
				circleUpdates: [],
				lineUpdates: [],
			});
		}
	},

	[MutationTypes.ADD_WORLD](state: State, world: DynmapWorld) {
		state.worlds.set(world.name, world);
	},

	//Sets the current world state from the last update fetch
	[MutationTypes.SET_WORLD_STATE](state: State, worldState: DynmapWorldState) {
		state.currentWorldState = Object.assign(state.currentWorldState, worldState);
	},

	//Sets the timestamp of the last update fetch
	[MutationTypes.SET_UPDATE_TIMESTAMP](state: State, timestamp: Date) {
		state.updateTimestamp = timestamp;
	},

	//Sets the timestamp of the last update fetch
	[MutationTypes.ADD_MARKER_SET_UPDATES](state: State, updates: Map<string, DynmapMarkerSetUpdates>) {
		for(const entry of updates) {
			if(!state.markerSets.has(entry[0])) {
				console.log(`Marker set ${entry[0]} doesn't exist`);
				continue;
			}

			const set = state.markerSets.get(entry[0]) as DynmapMarkerSet,
				setUpdates = state.pendingSetUpdates.get(entry[0]) as DynmapMarkerSetUpdates;

			//Update non-reactive lists
			for(const update of entry[1].markerUpdates) {
				if(update.removed) {
					set.markers.delete(update.id);
				} else {
					set.markers.set(update.id, update.payload as DynmapMarker);
				}
			}

			for(const update of entry[1].areaUpdates) {
				if(update.removed) {
					set.areas.delete(update.id);
				} else {
					set.areas.set(update.id, update.payload as DynmapArea);
				}
			}

			for(const update of entry[1].circleUpdates) {
				if(update.removed) {
					set.circles.delete(update.id);
				} else {
					set.circles.set(update.id, update.payload as DynmapCircle);
				}
			}

			for(const update of entry[1].lineUpdates) {
				if(update.removed) {
					set.lines.delete(update.id);
				} else {
					set.lines.set(update.id, update.payload as DynmapLine);
				}
			}

			//Add to reactive pending updates lists
			setUpdates.markerUpdates = setUpdates.markerUpdates.concat(entry[1].markerUpdates);
			setUpdates.areaUpdates = setUpdates.areaUpdates.concat(entry[1].areaUpdates);
			setUpdates.circleUpdates = setUpdates.circleUpdates.concat(entry[1].circleUpdates);
			setUpdates.lineUpdates = setUpdates.lineUpdates.concat(entry[1].lineUpdates);
		}
	},

	[MutationTypes.ADD_TILE_UPDATES](state: State, updates: Array<DynmapTileUpdate>) {
		state.pendingTileUpdates = state.pendingTileUpdates.concat(updates);
	},

	[MutationTypes.POP_MARKER_UPDATES](state: State, {markerSet, amount}): Array<DynmapMarkerUpdate> {
		if(!state.markerSets.has(markerSet)) {
			console.log(`Marker set ${markerSet} doesn't exist`);
			return [];
		}

		return state.pendingSetUpdates.get(markerSet)!.markerUpdates.splice(0, amount);
	},

	[MutationTypes.POP_AREA_UPDATES](state: State, {markerSet, amount}): Array<DynmapAreaUpdate> {
		if(!state.markerSets.has(markerSet)) {
			console.log(`Marker set ${markerSet} doesn't exist`);
			return [];
		}

		return state.pendingSetUpdates.get(markerSet)!.areaUpdates.splice(0, amount);
	},

	[MutationTypes.POP_CIRCLE_UPDATES](state: State, {markerSet, amount}): Array<DynmapCircleUpdate> {
		if(!state.markerSets.has(markerSet)) {
			console.log(`Marker set ${markerSet} doesn't exist`);
			return [];
		}

		return state.pendingSetUpdates.get(markerSet)!.circleUpdates.splice(0, amount);
	},

	[MutationTypes.POP_LINE_UPDATES](state: State, {markerSet, amount}): Array<DynmapLineUpdate>  {
		if(!state.markerSets.has(markerSet)) {
			console.log(`Marker set ${markerSet} doesn't exist`);
			return [];
		}

		return state.pendingSetUpdates.get(markerSet)!.lineUpdates.splice(0, amount);
	},

	[MutationTypes.POP_TILE_UPDATES](state: State, amount: number): Array<DynmapTileUpdate> {
		return state.pendingTileUpdates.splice(0, amount);
	},

	//Increments the request id for the next update fetch
	[MutationTypes.INCREMENT_REQUEST_ID](state: State) {
		state.updateRequestId++;
	},

	// Set up to 10 players at once
	[MutationTypes.SET_PLAYERS_ASYNC](state: State, players: Set<DynmapPlayer>): Set<DynmapPlayer> {
		let count = 0;

		for(const player of players) {
			if(state.players.has(player.account)) {
				const existing = state.players.get(player.account);

				existing!.health = player.health;
				existing!.armor = player.armor;
				existing!.location = Object.assign(existing!.location, player.location);
				existing!.name = player.name;
				existing!.sort = player.sort;
			} else {
				state.players.set(player.account, {
					account: player.account,
					health: player.health,
					armor: player.armor,
					location: player.location,
					name: player.name,
					sort: player.sort,
				});
			}

			players.delete(player);

			if(++count >= 10) {
				break;
			}
		}

		return players;
	},

	//Removes all players not found in the provided keep set
	[MutationTypes.SYNC_PLAYERS](state: State, keep: Set<string>) {
		for(const [key, player] of state.players) {
			if(!keep.has(player.account)) {
				state.players.delete(key);
			}
		}
	},

	[MutationTypes.SET_CURRENT_MAP](state: State, {worldName, mapName}) {
		mapName = [worldName, mapName].join('_');

		if(!state.worlds.has(worldName)) {
			throw new RangeError(`Unknown world ${worldName}`);
		}

		if(!state.maps.has(mapName)) {
			throw new RangeError(`Unknown map ${mapName}`);
		}

		const newWorld = state.worlds.get(worldName);

		if(state.currentWorld !== newWorld) {
			state.currentWorld = state.worlds.get(worldName);
			state.markerSets.clear();
			state.pendingSetUpdates.clear();
			state.pendingTileUpdates = [];
		}

		state.currentMap = state.maps.get(mapName);
	},

	[MutationTypes.SET_CURRENT_PROJECTION](state: State, projection) {
		state.currentProjection = projection;
	},

	[MutationTypes.SET_CURRENT_LOCATION](state: State, payload: Coordinate) {
		state.currentLocation = payload;
	},

	[MutationTypes.SET_CURRENT_ZOOM](state: State, payload: number) {
		state.currentZoom = payload;
	},

	[MutationTypes.SET_PARSED_URL](state: State, payload: DynmapParsedUrl) {
		state.parsedUrl = payload;
	},

	[MutationTypes.FOLLOW_PLAYER](state: State, player: DynmapPlayer) {
		state.following = player;
	},

	[MutationTypes.CLEAR_FOLLOW](state: State) {
		state.following = undefined;
	}
}