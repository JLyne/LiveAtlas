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
import App from './App.vue'
import API from './api';
import {store} from "@/store";

import 'leaflet/dist/leaflet.css';
import 'normalize-scss/sass/normalize/_import-now.scss';
import '@/scss/style.scss';
import {MutationTypes} from "@/store/mutation-types";

const splash = document.getElementById('splash'),
	splashSpinner = document.getElementById('splash__spinner'),
	splashError = document.getElementById('splash__error'),
	splashErrorMessage = document.getElementById('splash__error-message'),
	splashRetry = document.getElementById('splash__error-retry'),
	splashAttempt = document.getElementById('splash__error-attempt'),
	svgs = import.meta.globEager('/assets/icons/*.svg');

window.showSplash = function() {
	if(!splash) {
		return;
	}

	splash.ontransitionend = null;
	splash.hidden = false;

	requestAnimationFrame(function() {
		if(splash) {
			splash.style.opacity = '1';
		}
	});
};

window.hideSplash = function() {
	if(!splash) {
		return;
	}

	splash.ontransitionend = function(e) {
		if(e.target === splash) {
			splash.hidden = true;
		}
	};

	requestAnimationFrame(function() {
		splash.style.opacity = '0';
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

	if(splashAttempt && splashRetry) {
		if(fatal) {
			splashAttempt.hidden = splashRetry.hidden = true;
		} else if(attempts) {
			splashAttempt.hidden = splashRetry.hidden = false;
			splashAttempt.textContent = attempts.toString();
		}
	}
};

console.info(`LiveAtlas version ${store.state.version} - https://github.com/JLyne/LiveAtlas`);

API.validateConfiguration().then((config) => {
	store.commit(MutationTypes.SET_SERVERS, config);

	if(config.size > 1) {
		const lastSegment = window.location.pathname.split('/').pop(),
			serverName = lastSegment && config.has(lastSegment) ? lastSegment : config.keys().next().value;

		store.commit(MutationTypes.SET_CURRENT_SERVER, serverName);
	} else {
		store.commit(MutationTypes.SET_CURRENT_SERVER, config.keys().next().value);
	}

	console.log(store.state.currentServer);

	const app = createApp(App).use(store);

	// app.config.performance = true;
	app.mount('#mcmap');
});
