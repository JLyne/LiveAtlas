<template>
	<Map></Map>
	<Sidebar></Sidebar>
</template>

<script lang="ts">
import {defineComponent, computed, ref, onMounted, onBeforeUnmount, watch} from 'vue';
import Map from './components/Map.vue';
import Sidebar from './components/Sidebar.vue';
import {useStore} from "./store";
import {ActionTypes} from "@/store/action-types";

export default defineComponent({
	name: 'App',
	components: {
		Map,
		Sidebar,
	},

	setup() {
		const store = useStore(),
			updateInterval = computed(() => store.state.configuration.updateInterval),
			title = computed(() => store.state.configuration.title),
			updatesEnabled = ref(false),
			updateTimeout = ref(0),

			loadConfiguration = () => {
				store.dispatch(ActionTypes.LOAD_CONFIGURATION, undefined).then(() => {
					startUpdates();
					window.hideSplash();
				});
			},

			startUpdates = () => {
				updatesEnabled.value = true;
				update();
			},

			update = () => {
				store.dispatch(ActionTypes.GET_UPDATE, undefined).then(() => {
					if(updatesEnabled.value) {
						updateTimeout.value = setTimeout(() => update(), updateInterval.value);
					}
				});
			},

			stopUpdates = () => {
				updatesEnabled.value = false;

				if (updateTimeout.value) {
					clearTimeout(updateTimeout.value);
				}

				updateTimeout.value = 0;
			};

		watch(title, (title) => document.title = title);

		onMounted(() => loadConfiguration());
		onBeforeUnmount(() => stopUpdates());
	},
});
</script>
