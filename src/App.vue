<template>
	<Map></Map>
	<Sidebar></Sidebar>
</template>

<script lang="ts">
import {defineComponent, computed, ref} from 'vue';
import Map from './components/Map.vue';
import Sidebar from './components/Sidebar.vue';
import {useStore} from "./store";
import {ActionTypes} from "@/store/action-types";

export default defineComponent({
	name: 'WorldList',
	components: {
		Map,
		Sidebar,
	},

	setup() {
		let store = useStore(),
			updateInterval = computed(() => store.state.configuration.updateInterval),
			updatesEnabled = ref(false),
			updateTimeout = ref(0);

		return {
			store,
			updateInterval,
			updatesEnabled,
			updateTimeout
		}
	},

	mounted() {
		this.loadConfiguration();
	},

	beforeUnmount() {
		this.stopUpdates();
	},

	methods: {
		loadConfiguration() {
			useStore().dispatch(ActionTypes.LOAD_CONFIGURATION, undefined).then(() => {
				this.startUpdates();
				window.hideSplash();
			});
		},

		startUpdates() {
			this.updatesEnabled = true;
			this.update();
		},

		update() {
			useStore().dispatch(ActionTypes.GET_UPDATE, undefined).then(() => {
				if(this.updatesEnabled) {
					this.updateTimeout = setTimeout(() => this.update(), this.updateInterval);
				}
			});
		},

		stopUpdates() {
			this.updatesEnabled = false;

			if (this.updateTimeout) {
				clearTimeout(this.updateTimeout);
			}

			this.updateTimeout = 0;
		}
	}
});
</script>

<style lang="scss">

</style>
