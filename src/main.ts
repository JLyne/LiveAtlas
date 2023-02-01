/*
 * Copyright 2022 James Lyne
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { createApp } from 'vue'
import Notifications from '@kyvg/vue3-notification'
import { VueClipboard } from '@soerenmartius/vue3-clipboard';
import 'modern-normalize/modern-normalize.css';
import 'leaflet/dist/leaflet.css';
import '@/scss/style.scss';

import {store} from "@/store";
import {MutationTypes} from "@/store/mutation-types";
import {ActionTypes} from "@/store/action-types";

import App from './App.vue';
import {loadConfig, registerMapProvider} from "@/util/config";
import DynmapMapProvider from "@/providers/DynmapMapProvider";
import Pl3xmapMapProvider from "@/providers/Pl3xmapMapProvider";
import {showSplashError} from "@/util/splash";
import ConfigurationError from "@/errors/ConfigurationError";
import OverviewerMapProvider from "@/providers/OverviewerMapProvider";
import.meta.globEager('/assets/icons/*.svg');

const splash = document.getElementById('splash');

if(splash) {
	splash.addEventListener('transitionend', e => {
		if(e.target === splash && splash.style.opacity === '0') {
			splash.hidden = true;
		}
	});
}

console.info(`LiveAtlas version ${store.state.version} - https://github.com/JLyne/LiveAtlas`);

store.subscribe((mutation, state) => {
	if(mutation.type === 'toggleSidebarSectionCollapsedState' || mutation.type === 'setSidebarSectionCollapsedState') {
		localStorage.setItem('uiSettings', JSON.stringify({
			sidebar: state.ui.sidebar,
		}));
	}
});

registerMapProvider('dynmap', DynmapMapProvider);
registerMapProvider('pl3xmap', Pl3xmapMapProvider);
registerMapProvider('squaremap', Pl3xmapMapProvider);
registerMapProvider('overviewer', OverviewerMapProvider);

const config = window.liveAtlasConfig;
window.liveAtlasLoaded = true;

(async() => {
	try {
		config.servers = loadConfig(config);
		await store.dispatch(ActionTypes.INIT, config);

		if (store.state.servers.size > 1) {
			const lastSegment = window.location.pathname.split('/').pop(),
				serverName = lastSegment && store.state.servers.has(lastSegment) ? lastSegment : store.state.servers.keys().next().value;

			//Update url if server doesn't exist
			if (serverName !== lastSegment) {
				window.history.replaceState({}, '', serverName + window.location.hash);
			}

			store.commit(MutationTypes.SET_CURRENT_SERVER, serverName);
		} else {
			store.commit(MutationTypes.SET_CURRENT_SERVER, store.state.servers.keys().next().value);
		}

		const app = createApp(App)
			.use(store)
			.use(Notifications)
			.use(VueClipboard);

		// app.config.performance = true;
		app.mount('#app');
	} catch (e) {
		if (e instanceof ConfigurationError) {
			console.error('LiveAtlas configuration is invalid:', e);
			showSplashError('LiveAtlas configuration is invalid:\n' + e, true);
		} else {
			console.error('LiveAtlas failed to load:', e);
			showSplashError('LiveAtlas failed to load:\n' + e, true);
		}
	}
})();
