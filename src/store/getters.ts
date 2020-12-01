import {GetterTree} from "vuex";
import {State} from "@/store/state";

export type Getters = {
	playerMarkersEnabled(state: State): boolean;
	coordinatesControlEnabled(state: State): boolean;
	clockControlEnabled(state: State): boolean;
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
	}
}