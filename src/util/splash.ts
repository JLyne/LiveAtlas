/*
 * Copyright 2021 James Lyne
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

const app = document.getElementById('app'),
	splash = document.getElementById('splash'),
	splashSpinner = document.getElementById('splash__spinner'),
	splashError = document.getElementById('splash__error'),
	splashErrorMessage = document.getElementById('splash__error-message'),
	splashRetry = document.getElementById('splash__error-retry');

export const showSplash = function() {
	if(!splash || !app) {
		return;
	}

	if(splashError) {
		splashError.setAttribute('aria-hidden', 'true');
	}

	if(splashSpinner) {
		splashSpinner.style.visibility = 'visible';
	}

	if(splashRetry) {
		splashRetry.hidden = true;
	}

	splash.hidden = false;
	app.setAttribute('aria-hidden', 'true');

	requestAnimationFrame(function() {
		splash.style.opacity = '1';
	});
};

export const hideSplash = () => {
	if(!splash || !app) {
		return;
	}

	requestAnimationFrame(() => {
		splash.style.opacity = '0';
		app.removeAttribute('aria-hidden');

		if(window.getComputedStyle(splash).opacity === '0') {
			splash.hidden = true;
		}
	});
};

export const showSplashError = (message: string, fatal: boolean, attempts?: number) => {
	if(splashError) {
		splashError.setAttribute('aria-hidden', 'false');
	}

	if(splashErrorMessage && splashErrorMessage.innerText !== message) {
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
