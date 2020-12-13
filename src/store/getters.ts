import {GetterTree} from "vuex";
import {State} from "@/store/state";
import Util from "@/util";

export type Getters = {
	playerMarkersEnabled(state: State): boolean;
	coordinatesControlEnabled(state: State): boolean;
	clockControlEnabled(state: State): boolean;
	night(state: State): boolean;
	mapBackground(state: State, getters: GetterTree<State, State> & Getters): string;
	url(state: State, getters: GetterTree<State, State> & Getters): string;
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
		return Util.getMinecraftTime(state.currentWorldState.timeOfDay).night;
	},

	mapBackground(state: State): string {
		if(!state.currentMap) {
			return 'transparent';
		}

		if(state.currentMap.nightAndDay) {
			if(Util.getMinecraftTime(state.currentWorldState.timeOfDay).night) {
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
	}
}