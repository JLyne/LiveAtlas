import {MutationTree} from "vuex";
import {MutationTypes} from "@/store/mutation-types";
import {State} from "@/store/state";
import {
	DynmapComponentConfig, DynmapMarkerSet,
	DynmapMessageConfig,
	DynmapPlayer,
	DynmapServerConfig,
	DynmapWorld,
	DynmapWorldState
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
	[MutationTypes.INCREMENT_REQUEST_ID](state: S): void
	// [MutationTypes.SET_PLAYERS](state: S, players: Array<DynmapPlayer>): void
	[MutationTypes.SET_PLAYERS_ASYNC](state: S, players: Set<DynmapPlayer>): void
	[MutationTypes.SYNC_PLAYERS](state: S, keep: Set<string>): void
	[MutationTypes.SET_CURRENT_MAP](state: S, payload: CurrentMapPayload): void
	[MutationTypes.SET_CURRENT_PROJECTION](state: S, payload: DynmapProjection): void
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

	//Increments the request id for the next update fetch
	[MutationTypes.INCREMENT_REQUEST_ID](state: State) {
		state.updateRequestId++;
	},

	// [MutationTypes.SET_PLAYERS](state: State, players: Array<DynmapPlayer>) {
	// 	const existingPlayers: Set<string> = new Set();
	//
	// 	players.forEach(player => {
	// 		existingPlayers.add(player.account);
	//
	// 		if (state.players.has(player.account)) {
	// 			const existing = state.players.get(player.account);
	//
	// 			existing!.health = player.health;
	// 			existing!.armor = player.armor;
	// 			existing!.location = Object.assign(existing!.location, player.location);
	// 			existing!.name = player.name;
	// 			existing!.sort = player.sort;
	// 		} else {
	// 			state.players.set(player.account, {
	// 				account: player.account,
	// 				health: player.health,
	// 				armor: player.armor,
	// 				location: player.location,
	// 				name: player.name,
	// 				sort: player.sort,
	// 			});
	// 		}
	// 	});
	//
	// 	for (const key of state.players.keys()) {
	// 		if (!existingPlayers.has(key)) {
	// 			state.players.delete(key);
	// 		}
	// 	}
	// },

	//Set up to 10 players at once, returning the rest for future setting
	[MutationTypes.SET_PLAYERS_ASYNC](state: State, players: Set<DynmapPlayer>) {
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
				return players;
			}
		}
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
		}

		state.currentMap = state.maps.get(mapName);
	},

	[MutationTypes.SET_CURRENT_PROJECTION](state: State, projection) {
		state.currentProjection = projection;
	},

	[MutationTypes.FOLLOW_PLAYER](state: State, player: DynmapPlayer) {
		state.following = player;
	},

	[MutationTypes.CLEAR_FOLLOW](state: State) {
		state.following = undefined;
	}
}