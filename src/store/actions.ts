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
	DynmapPlayer,
	DynmapUpdateResponse
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
}

export const actions: ActionTree<State, State> & Actions = {
	[ActionTypes.LOAD_CONFIGURATION]({commit}) {
		return API.getConfiguration().then(config => {
			commit(MutationTypes.SET_CONFIGURATION, config.config);
			commit(MutationTypes.SET_MESSAGES, config.messages);
			commit(MutationTypes.SET_WORLDS, config.worlds);
			commit(MutationTypes.SET_COMPONENTS, config.components);

			if(config.config.defaultWorld && config.config.defaultMap) {
				commit(MutationTypes.SET_CURRENT_MAP, {
					worldName: config.config.defaultWorld,
					mapName: config.config.defaultMap
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
			console.log(`Marker set ${markerSet} doesn't exist`);
			return Promise.resolve([]);
		}

		const updates = state.pendingSetUpdates.get(markerSet)!.markerUpdates.slice(0, amount);

		commit(MutationTypes.POP_MARKER_UPDATES, {markerSet, amount});

		return Promise.resolve(updates);
	},

	[ActionTypes.POP_AREA_UPDATES]({commit, state}, {markerSet, amount}: {markerSet: string, amount: number}): Promise<DynmapAreaUpdate[]> {
		if(!state.markerSets.has(markerSet)) {
			console.log(`Marker set ${markerSet} doesn't exist`);
			return Promise.resolve([]);
		}

		const updates = state.pendingSetUpdates.get(markerSet)!.areaUpdates.slice(0, amount);

		commit(MutationTypes.POP_AREA_UPDATES, {markerSet, amount});

		return Promise.resolve(updates);
	},

	[ActionTypes.POP_CIRCLE_UPDATES]({commit, state}, {markerSet, amount}: {markerSet: string, amount: number}): Promise<DynmapCircleUpdate[]> {
		if(!state.markerSets.has(markerSet)) {
			console.log(`Marker set ${markerSet} doesn't exist`);
			return Promise.resolve([]);
		}

		const updates = state.pendingSetUpdates.get(markerSet)!.circleUpdates.slice(0, amount);

		commit(MutationTypes.POP_CIRCLE_UPDATES, {markerSet, amount});

		return Promise.resolve(updates);
	},

	[ActionTypes.POP_LINE_UPDATES]({commit, state}, {markerSet, amount}: {markerSet: string, amount: number}): Promise<DynmapLineUpdate[]> {
		if(!state.markerSets.has(markerSet)) {
			console.log(`Marker set ${markerSet} doesn't exist`);
			return Promise.resolve([]);
		}

		const updates = state.pendingSetUpdates.get(markerSet)!.lineUpdates.slice(0, amount);

		commit(MutationTypes.POP_LINE_UPDATES, {markerSet, amount});

		return Promise.resolve(updates);
	},

}