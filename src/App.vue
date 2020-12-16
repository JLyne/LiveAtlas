<!--
  - Copyright 2020 James Lyne
  -
  -    Licensed under the Apache License, Version 2.0 (the "License");
  -    you may not use this file except in compliance with the License.
  -    You may obtain a copy of the License at
  -
  -      http://www.apache.org/licenses/LICENSE-2.0
  -
  -    Unless required by applicable law or agreed to in writing, software
  -    distributed under the License is distributed on an "AS IS" BASIS,
  -    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  -    See the License for the specific language governing permissions and
  -    limitations under the License.
  -->

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
import Util from '@/util';
import {MutationTypes} from "@/store/mutation-types";

export default defineComponent({
	name: 'App',
	components: {
		Map,
		Sidebar,
	},

	setup() {
		const initialUrl = window.location.hash.replace('#', ''),
			store = useStore(),
			updateInterval = computed(() => store.state.configuration.updateInterval),
			title = computed(() => store.state.configuration.title),
			currentUrl = computed(() => store.getters.url),
			updatesEnabled = ref(false),
			updateTimeout = ref(0),
			configAttempts = ref(0),

			loadConfiguration = () => {
				store.dispatch(ActionTypes.LOAD_CONFIGURATION, undefined).then(() => {
					startUpdates();
					window.hideSplash();
				}).catch(e => {
					console.error('Failed to load server configuration: ', e);
					window.showSplashError(++configAttempts.value);

					setTimeout(() => loadConfiguration(), 1000);
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
			},

			parseUrl = () => {
				if(!initialUrl) {
					return;
				}

				try {
					const result = Util.parseMapHash(initialUrl);
					store.commit(MutationTypes.SET_PARSED_URL, result);
				} catch(e) {
					console.warn('Ignoring invalid url ' + e);
				}
			};

		watch(title, (title) => document.title = title);
		watch(currentUrl, (url) => window.history.replaceState({}, '', url));

		onMounted(() => loadConfiguration());
		onBeforeUnmount(() => stopUpdates());

		parseUrl();
	},
});
</script>
