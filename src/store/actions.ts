import {MutationTypes} from "@/store/mutation-types";
import {ActionContext, ActionTree} from "vuex";
import {State} from "@/store/state";
import {ActionTypes} from "@/store/action-types";
import API from '@/api';
import {Mutations} from "@/store/mutations";
import {DynmapConfigurationResponse, DynmapUpdateResponse} from "@/dynmap";

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
}

export const actions: ActionTree<State, State> & Actions = {
	[ActionTypes.LOAD_CONFIGURATION]({commit}) {
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
	[ActionTypes.GET_UPDATE]({commit, state}) {
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