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