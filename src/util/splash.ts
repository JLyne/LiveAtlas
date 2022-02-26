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

const app = document.getElementById('app'),
	splash = document.getElementById('splash'),
	splashSpinner = document.getElementById('splash__spinner'),
	splashError = document.getElementById('splash__error'),
	splashErrorMessage = document.getElementById('splash__error-message'),
	splashRetry = document.getElementById('splash__error-retry');

/**
 * Shows the LiveAtlas splash screen, if it isn't already visible
 * @param reset If true, any existing errors or retry counts will be removed
 */
export const showSplash = function(reset: boolean) {
	if(!splash || !app) {
		return;
	}

	if(reset) {
		if(splashError) {
			splashError.setAttribute('aria-hidden', 'true');
		}

		if(splashSpinner) {
			splashSpinner.style.visibility = 'visible';
		}

		if(splashRetry) {
			splashRetry.hidden = true;
		}
	}

	splash.hidden = false;
	app.setAttribute('aria-hidden', 'true');

	requestAnimationFrame(function() {
		splash.style.opacity = '1';
	});
};

/**
 * Hides the LiveAtlas splash screen, if it is visible
 * The splash screen is not fully hidden immediately, as it has a CSS defined fade out animation
 */
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

/**
 * Displays the given error message on the splash screen
 * If the splash screen is not currently visible {@link showSplash} should also be called
 * @see {@link showSplash}
 * @param {string} message The error message to display
 * @param {boolean} fatal If true the loading spinner will be hidden to indicate a fatal error. This does not stop any
 * ongoing processes the loading indicator was indicating
 * @param {?number} attempts Optional number of previous retry attempts that occurred before the current error. If
 * provided this will be displayed after the error message
 */
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
