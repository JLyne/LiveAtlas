/*
 * Copyright 2020 James Lyne
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

import { createApp } from 'vue'
import App from './App.vue';
import {store} from "@/store";

import 'leaflet/dist/leaflet.css';
import 'normalize-scss/sass/normalize/_import-now.scss';
import '@/scss/style.scss';

import 'focus-visible';
import {MutationTypes} from "@/store/mutation-types";
import {validateConfiguration} from "@/util/config";
import {showSplashError} from "@/util/splash";
import { VueClipboard } from '@soerenmartius/vue3-clipboard';
import Notifications from '@kyvg/vue3-notification'

const splash = document.getElementById('splash'),
	svgs = import.meta.globEager('/assets/icons/*.svg');

if(splash) {
	splash.addEventListener('transitionend', e => {
		if(e.target === splash && splash.style.opacity === '0') {
			splash.hidden = true;
		}
	});
}

console.info(`LiveAtlas version ${store.state.version} - https://github.com/JLyne/LiveAtlas`);

try {
	const config = validateConfiguration();

	store.commit(MutationTypes.SET_SERVERS, config);

	if(config.size > 1) {
		const lastSegment = window.location.pathname.split('/').pop(),
			serverName = lastSegment && config.has(lastSegment) ? lastSegment : config.keys().next().value;

		//Update url if server doesn't exist
		if(serverName !== lastSegment) {
			window.history.replaceState({}, '', serverName + window.location.hash);
		}

		store.commit(MutationTypes.SET_CURRENT_SERVER, serverName);
	} else {
		store.commit(MutationTypes.SET_CURRENT_SERVER, config.keys().next().value);
	}

	const app = createApp(App)
		.use(store)
		.use(Notifications)
		.use(VueClipboard);

	// app.config.performance = true;
	app.mount('#app');
} catch(e) {
	console.error('LiveAtlas configuration is invalid: ', e);
	showSplashError('LiveAtlas configuration is invalid\n' + e, true);
}
