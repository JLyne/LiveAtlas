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
import {MutationTypes} from "@/store/mutation-types";
import {validateConfiguration} from "@/util";
import { VueClipboard } from '@soerenmartius/vue3-clipboard'

const splash = document.getElementById('splash'),
	splashSpinner = document.getElementById('splash__spinner'),
	splashError = document.getElementById('splash__error'),
	splashErrorMessage = document.getElementById('splash__error-message'),
	splashRetry = document.getElementById('splash__error-retry'),
	svgs = import.meta.globEager('/assets/icons/*.svg');

if(splash) {
	splash.ontransitionend = function(e) {
		if(e.target === splash && splash.style.opacity === '0') {
			splash.hidden = true;
		}
	};
}

window.showSplash = function() {
	if(!splash) {
		return;
	}

	splash.hidden = false;

	requestAnimationFrame(function() {
		splash.style.opacity = '1';
	});
};

window.hideSplash = function() {
	if(!splash) {
		return;
	}

	requestAnimationFrame(function() {
		splash.style.opacity = '0';

		if(window.getComputedStyle(splash).opacity === '0') {
			splash.hidden = true;
		}
	});
};

window.showSplashError = function(message: string, fatal: boolean, attempts: number) {
	if(splashError) {
		splashError.setAttribute('aria-hidden', 'false');
	}

	if(splashErrorMessage) {
		splashErrorMessage.innerText = message || 'Unknown error';
	}

	if(splashSpinner && fatal) {
		splashSpinner.style.visibility = 'hidden';
	}

	if(splashRetry) {
		if(fatal) {
			splashRetry.hidden = true;
		} else if(attempts) {
			splashRetry.hidden = false;
			splashRetry.textContent = `Retrying... (${attempts.toString()})`;
		}
	}
};

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

	const app = createApp(App).use(store).use(VueClipboard);

	// app.config.performance = true;
	app.mount('#app');
} catch(e) {
	console.error('LiveAtlas configuration is invalid: ', e);
	window.showSplashError('LiveAtlas configuration is invalid\n' + e, true);
}
