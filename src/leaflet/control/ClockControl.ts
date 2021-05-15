/*
 * Copyright 2020 James Lyne
 *
 * Some portions of this file were taken from https://github.com/webbukkit/dynmap.
 * These portions are Copyright 2020 Dynmap Contributors.
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

import {ControlOptions, DomUtil, Util, Map, Control} from 'leaflet';
import {getMinecraftTime} from '@/util';
import {DynmapWorldState} from "@/dynmap";

import {watch} from "@vue/runtime-core";
import {useStore} from "@/store";

import "@/assets/icons/clock_moon.svg";
import "@/assets/icons/clock_moon_rain.svg";
import "@/assets/icons/clock_moon_storm.svg";
import "@/assets/icons/clock_sun.svg";
import "@/assets/icons/clock_sun_rain.svg";
import "@/assets/icons/clock_sun_storm.svg";

export interface ClockControlOptions extends ControlOptions {
	showTimeOfDay: boolean;
	showDigitalClock: boolean;
	showWeather: boolean;
}

export class ClockControl extends Control {
	// @ts-ignore
	options: ClockControlOptions;

	private _container?: HTMLElement;
	private _sun?: HTMLElement;
	private _moon?: HTMLElement;
	private _clock?: HTMLElement;
	private _currentMoonIcon?: string;
	private _currentSunIcon?: string;
	private _unwatchHandler?: Function;

	constructor(options: ClockControlOptions) {
		super(Object.assign(options, {position: 'topcenter'}));

		Util.setOptions(this, options);
	}

	onAdd(map: Map) {
		const digital = !this.options.showTimeOfDay && !this.options.showWeather && this.options.showDigitalClock,
			worldState = useStore().state.currentWorldState;

		this._container = DomUtil.create('div', 'clock' + (digital ? ' clock--digital' : ''));
		this._sun = DomUtil.create('div', 'clock__sun', this._container);
		this._moon = DomUtil.create('div', 'clock__moon', this._container);

		this._sun.style.transform = 'translate(-150px, -150px)';
		this._moon.style.transform = 'translate(-150px, -150px)';

		this._sun!.innerHTML = `
		<svg class="svg-icon">
	  		<use xlink:href="#clock_sun" />
		</svg>`;
		this._moon!.innerHTML = `
		<svg class="svg-icon">
	  		<use xlink:href="#clock_moon" />
		</svg>`;

		if (this.options.showDigitalClock) {
			this._clock = DomUtil.create('div', 'clock__time', this._container)
		}

		this._unwatchHandler = watch(worldState, (newValue) => {
			this._update(newValue);
		}, { deep: true });

		return this._container;
	}

	onRemove(map: Map) {
		if(this._unwatchHandler) {
			this._unwatchHandler();
		}
	}

	_update(worldState: DynmapWorldState) {
		const timeOfDay = worldState.timeOfDay;
		let sunAngle;

		if (timeOfDay > 23100 || timeOfDay < 12900) {
			//day mode
			let movedTime = timeOfDay + 900;
			movedTime = (movedTime >= 24000) ? movedTime - 24000 : movedTime;
			//Now we have 0 -> 13800 for the day period
			//Divide by 13800*2=27600 instead of 24000 to compress day
			sunAngle = ((movedTime) / 27600 * 2 * Math.PI);
		} else {
			//night mode
			const movedTime = timeOfDay - 12900;
			//Now we have 0 -> 10200 for the night period
			//Divide by 10200*2=20400 instead of 24000 to expand night
			sunAngle = Math.PI + ((movedTime) / 20400 * 2 * Math.PI);
		}

		const moonAngle = sunAngle + Math.PI;

		if (timeOfDay >= 0) {
			this._sun!.style.transform = 'translate(' + Math.round(-50 * Math.cos(sunAngle)) + 'px, ' + Math.round(-50 * Math.sin(sunAngle)) + 'px)';
			this._moon!.style.transform = 'translate(' + Math.round(-50 * Math.cos(moonAngle)) + 'px, ' + Math.round(-50 * Math.sin(moonAngle)) + 'px)';
		} else {
			this._sun!.style.transform = 'translate(-150px, -150px)';
			this._moon!.style.transform = 'translate(-150px, -150px)';
		}

		const minecraftTime = getMinecraftTime(timeOfDay);

		if (this.options.showDigitalClock) {
			if (timeOfDay >= 0) {
				this._clock!.classList.remove(minecraftTime.night ? 'day' : 'night');
				this._clock!.classList.add(minecraftTime.day ? 'day' : 'night');
				this._clock!.textContent = [
					minecraftTime.hours.toString().padStart(2, '0'),
					minecraftTime.minutes.toString().padStart(2, '0')
				].join(':');
			} else {
				this._clock!.classList.remove(minecraftTime.night ? 'day' : 'night');
				this._clock!.textContent = '';
			}
		}

		if (this.options.showWeather) {
			if (worldState.thundering) {
				this._setSunIcon('clock_sun_storm');
				this._setMoonIcon('clock_moon_storm');
			} else if (worldState.raining) {
				this._setSunIcon('clock_sun_rain');
				this._setMoonIcon('clock_moon_rain');
			} else {
				this._setSunIcon('clock_sun');
				this._setMoonIcon('clock_moon');
			}
		}
	}

	_setSunIcon(icon: string) {
		if(this._sun && this._currentSunIcon !== icon) {
			this._sun!.innerHTML = `
				<svg class="svg-icon">
					<use xlink:href="#${icon}" />
				</svg>`;
			this._currentSunIcon = icon;
		}
	}

	_setMoonIcon(icon: string) {
		if(this._moon && this._currentMoonIcon !== icon) {
			this._moon!.innerHTML = `
				<svg class="svg-icon">
					<use xlink:href="#${icon}" />
				</svg>`;
			this._currentMoonIcon = icon;
		}
	}
}