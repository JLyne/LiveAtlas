import {MutationTree} from "vuex";
import {MutationTypes} from "@/store/mutation-types";
import {State} from "@/store/state";
import {DynmapComponentConfig, DynmapMessageConfig, DynmapPlayer, DynmapServerConfig, DynmapWorld} from "@/dynmap";

export type CurrentMapPayload = {
	world: string
	map: string
}

export type Mutations<S = State> = {
	[MutationTypes.SET_CONFIGURATION](state: S, config: DynmapServerConfig): void
	[MutationTypes.SET_MESSAGES](state: S, messages: DynmapMessageConfig): void
	[MutationTypes.SET_WORLDS](state: S, worlds: Array<DynmapWorld>): void
	[MutationTypes.SET_COMPONENTS](state: S, worlds: DynmapComponentConfig): void
	[MutationTypes.ADD_WORLD](state: S, world: DynmapWorld): void
	[MutationTypes.SET_TIME_OF_DAY](state: S, time: number): void
	[MutationTypes.SET_RAINING](state: S, raining: boolean): void
	[MutationTypes.SET_THUNDERING](state: S, thundering: boolean): void
	[MutationTypes.SET_UPDATE_TIMESTAMP](state: S, time: Date): void
	[MutationTypes.INCREMENT_REQUEST_ID](state: S): void
	[MutationTypes.SET_PLAYERS](state: S, players: Array<DynmapPlayer>): void
	[MutationTypes.SET_CURRENT_MAP](state: S, payload: CurrentMapPayload): void
}

export const mutations: MutationTree<State> & Mutations = {
	[MutationTypes.SET_CONFIGURATION](state: State, config: DynmapServerConfig) {
		state.configuration = Object.assign(state.configuration, config);
	},
	[MutationTypes.SET_MESSAGES](state: State, messages: DynmapMessageConfig) {
		state.messages = Object.assign(state.messages, messages);
	},

	[MutationTypes.SET_WORLDS](state: State, worlds: Array<DynmapWorld>) {
		state.worlds.clear();
		state.maps.clear();

		state.configuration.followMap = undefined;
		state.configuration.followZoom = undefined;
		state.configuration.defaultMap = undefined;
		state.configuration.defaultWorld = undefined;

		state.currentMap = undefined;
		state.currentWorld = undefined;
		state.following = undefined;

		state.timeOfDay = 0;
		state.raining = false;
		state.thundering = false;

		worlds.forEach(world => {
			state.worlds.set(world.name, world);
			world.maps.forEach(map => state.maps.set([world.name, map.name].join('_'), map));
		});
	},

	[MutationTypes.SET_COMPONENTS](state: State, components: DynmapComponentConfig) {
		state.components = components;
	},

	[MutationTypes.ADD_WORLD](state: State, world: DynmapWorld) {
		state.worlds.set(world.name, world);
	},

	[MutationTypes.SET_TIME_OF_DAY](state: State, time: number) {
		if (time < 0 || time > 24000) {
			throw new RangeError("Time must be between 0 and 24000");
		}

		state.timeOfDay = time;
	},

	[MutationTypes.SET_RAINING](state: State, raining: boolean) {
		state.raining = raining;
	},

	[MutationTypes.SET_THUNDERING](state: State, thundering: boolean) {
		state.thundering = thundering;
	},

	[MutationTypes.SET_UPDATE_TIMESTAMP](state: State, timestamp: Date) {
		state.updateTimestamp = timestamp;
	},

	[MutationTypes.INCREMENT_REQUEST_ID](state: State) {
		state.updateRequestId++;
	},

	[MutationTypes.SET_PLAYERS](state: State, players: Array<DynmapPlayer>) {
		const existingPlayers: Set<string> = new Set();

		players.forEach(player => {
			existingPlayers.add(player.account);

			if (state.players.has(player.account)) {
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
		});

		for (const key of state.players.keys()) {
			if (!existingPlayers.has(key)) {
				state.players.delete(key);
			}
		}
	},

	[MutationTypes.SET_CURRENT_MAP](state: State, {world, map}) {
		const mapName = [world, map].join('_');

		if(!state.worlds.has(world)) {
			throw new RangeError(`Unknown world ${world}`);
		}

		if(!state.maps.has(mapName)) {
			throw new RangeError(`Unknown map ${map}`);
		}

		state.currentWorld = state.worlds.get(world);
		state.currentMap = state.maps.get(mapName);
	},
}