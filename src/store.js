import {createStore} from 'vuex'

const store = createStore({
	state() {
		return {
			servers: [],
			worlds: [],
			maps: [],
			players: [],

			following: null,

			currentServer: null,
			currentWorld: null,
			currentMap: null,
		}
	}
});

export default store;