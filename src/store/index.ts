import {
	createStore,
	Store as VuexStore,
	createLogger,
	MutationTree,
	ActionContext, ActionTree, GetterTree, CommitOptions, DispatchOptions,
} from 'vuex';
import API from './../api';
import {
	DynmapConfigurationResponse,
	DynmapMap,
	DynmapMessageConfig,
	DynmapPlayer,
	DynmapServerConfig,
	DynmapUpdateResponse,
	DynmapWorld
} from "@/dynmap";

// Mutations
export enum MutationTypes {
	SET_CONFIGURATION = 'setConfiguration',
	SET_MESSAGES = 'setMessages',
	SET_WORLDS = 'setWorlds',
	ADD_WORLD = 'addWorld',
	SET_TIME_OF_DAY = 'setTimeOfDay',
	SET_RAINING = 'setRaining',
	SET_THUNDERING = 'setThundering',
	SET_UPDATE_TIMESTAMP = 'setUpdateTimestamp',
	INCREMENT_REQUEST_ID = 'incrementRequestId',
	SET_PLAYERS = 'setPlayers',
	SET_CURRENT_MAP = 'setCurrentMap',
}

export enum ActionTypes {
	LOAD_CONFIGRUATION = "loadConfiguration",
	GET_UPDATE = "getUpdate",
}

export type CurrentMapPayload = {
	world: string
	map: string
}

export type Mutations<S = State> = {
	[MutationTypes.SET_CONFIGURATION](state: S, config: DynmapServerConfig): void
	[MutationTypes.SET_MESSAGES](state: S, messages: DynmapMessageConfig): void
	[MutationTypes.SET_WORLDS](state: S, worlds: Array<DynmapWorld>): void
	[MutationTypes.ADD_WORLD](state: S, world: DynmapWorld): void
	[MutationTypes.SET_TIME_OF_DAY](state: S, time: number): void
	[MutationTypes.SET_RAINING](state: S, raining: boolean): void
	[MutationTypes.SET_THUNDERING](state: S, thundering: boolean): void
	[MutationTypes.SET_UPDATE_TIMESTAMP](state: S, time: Date): void
	[MutationTypes.INCREMENT_REQUEST_ID](state: S): void
	[MutationTypes.SET_PLAYERS](state: S, players: Array<DynmapPlayer>): void
	[MutationTypes.SET_CURRENT_MAP](state: S, payload: CurrentMapPayload): void
}

const mutations: MutationTree<State> & Mutations = {
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
				existing!.location = player.location;
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

type AugmentedActionContext = {
	commit<K extends keyof Mutations>(
		key: K,
		payload: Parameters<Mutations[K]>[1]
		):ReturnType<Mutations[K]>;
} & Omit<ActionContext<State, State>, "commit">

export interface Actions {
	[ActionTypes.LOAD_CONFIGRUATION](
		{commit}: AugmentedActionContext,
	):Promise<DynmapConfigurationResponse>
	[ActionTypes.GET_UPDATE](
		{commit}: AugmentedActionContext,
	):Promise<DynmapUpdateResponse>
}

export const actions: ActionTree<State, State> & Actions = {
	[ActionTypes.LOAD_CONFIGRUATION]({commit}) {
		return API.getConfiguration().then(config => {
			commit(MutationTypes.SET_CONFIGURATION, config.config);
			commit(MutationTypes.SET_MESSAGES, config.messages);
			commit(MutationTypes.SET_WORLDS, config.worlds);

			if(config.config.defaultWorld && config.config.defaultMap) {
				commit(MutationTypes.SET_CURRENT_MAP, {
					world: config.config.defaultWorld,
					map: config.config.defaultMap
				});
			}

			return config;
		});
	},
	[ActionTypes.GET_UPDATE]({commit}) {
		if(!state.currentWorld) {
			return Promise.reject("No current world");
		}

		return API.getUpdate(state.updateRequestId, state.currentWorld.name, state.updateTimestamp.getUTCMilliseconds()).then(update => {
			commit(MutationTypes.SET_PLAYERS, update.players);
			commit(MutationTypes.SET_TIME_OF_DAY, update.timeOfDay);
			commit(MutationTypes.SET_RAINING, update.raining);
			commit(MutationTypes.SET_THUNDERING, update.thundering);
			commit(MutationTypes.SET_UPDATE_TIMESTAMP, new Date(update.timestamp));
			commit(MutationTypes.INCREMENT_REQUEST_ID, undefined);

			return update;
		});
	}
}

export type State = {
	configuration: DynmapServerConfig;
	messages: DynmapMessageConfig;
	worlds: Map<string, DynmapWorld>;
	maps: Map<string, DynmapMap>;
	players: Map<string, DynmapPlayer>;

	following?: DynmapPlayer;

	// currentServer?: string;
	currentWorld?: DynmapWorld;
	currentMap?: DynmapMap;

	raining: boolean;
	thundering: boolean;
	timeOfDay: number;

	updateRequestId: number;
	updateTimestamp: Date;
}

export type Getters = {

}

export const getters: GetterTree<State, State> & Getters = {

}

export type Store = Omit<
	VuexStore<State>,
	"commit" | "getters" | "dispatch"
	> & {
	commit<K extends keyof Mutations, P extends Parameters<Mutations[K]>[1]>(
		key: K,
		payload: P,
		options?: CommitOptions,
	):ReturnType<Mutations[K]>;
} & {
	getters: {
		[K in keyof Getters]: ReturnType<Getters[K]>
	};
} & {
	dispatch<K extends keyof Actions>(
		key: K,
		payload: Parameters<Actions[K]>[1],
		options?: DispatchOptions
	):ReturnType<Actions[K]>;
};

const state: State = {
	configuration: {
		version: '',
		allowChat: false,
		chatRequiresLogin: false,
		chatInterval: 5000,
		defaultMap: '',
		defaultWorld: '',
		defaultZoom: 0,
		followMap: '',
		followZoom: 0,
		updateInterval: 3000,
		showLayerControl: true,
		title: '',
		loginEnabled: false,
		loginRequired: false,
		maxPlayers: 0,
		hash: 0,
	},
	messages: {
		chatNotAllowed: '',
		chatRequiresLogin: '',
		chatCooldown: '',
		mapTypes: '',
		players: '',
		playerJoin: '',
		playerQuit: '',
		anonymousJoin: '',
		anonymousQuit: '',
	},
	worlds: new Map(),
	maps: new Map(),
	players: new Map(),

	raining: false,
	thundering: false,
	timeOfDay: 0,

	following: undefined,

	// currentServer: undefined,
	currentWorld: undefined,
	currentMap: undefined,

	updateRequestId: 0,
	updateTimestamp: new Date(),
};

export const store = createStore({
	state,
	mutations,
	getters,
	actions,
	// plugins: [createLogger()],
});

// define your own `useStore` composition function
export function useStore() {
  return store as Store;
}
