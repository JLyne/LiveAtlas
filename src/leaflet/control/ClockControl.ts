import {ControlOptions, DomUtil, Util, Map, Control} from 'leaflet';
import Utils from '@/util';
import {DynmapWorldState} from "@/dynmap";

import sun from '@/assets/icons/clock_sun.svg';
import sunRain from '@/assets/icons/clock_sun_rain.svg';
import sunStorm from '@/assets/icons/clock_sun_storm.svg';
import moon from '@/assets/icons/clock_moon.svg';
import moonRain from '@/assets/icons/clock_moon_rain.svg';
import moonStorm from '@/assets/icons/clock_moon_storm.svg';

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

	constructor(options: ClockControlOptions) {
		super(Object.assign(options, {position: 'topcenter'}));

		Util.setOptions(this, options);
	}

	onAdd(map: Map) {
		const digital = !this.options.showTimeOfDay && !this.options.showWeather && this.options.showDigitalClock;

		this._container = DomUtil.create('div', 'clock' + (digital ? ' clock--digital' : ''));
		this._sun = DomUtil.create('div', 'clock__sun', this._container);
		this._moon = DomUtil.create('div', 'clock__moon', this._container);

		this._sun.style.transform = 'translate(-150px, -150px)';
		this._moon.style.transform = 'translate(-150px, -150px)';

		console.log(sun);

		this._sun!.innerHTML = `
		<svg class="svg-icon" viewBox="${sun.viewBox}">
	  		<use xlink:href="${sun.url}" />
		</svg>`;
		this._moon!.innerHTML = `
		<svg class="svg-icon" viewBox="${moon.viewBox}">
	  		<use xlink:href="${moon.url}" />
		</svg>`;

		if (this.options.showDigitalClock) {
			this._clock = DomUtil.create('div', 'clock__time', this._container)
		}

		return this._container;
	}

	update(worldState: DynmapWorldState) {
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

		const minecraftTime = Utils.getMinecraftTime(timeOfDay);

		if(timeOfDay >= 0) {
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

		if (this.options.showWeather) {
			if (worldState.thundering) {
				this._sun!.innerHTML = `
					<svg class="svg-icon" viewBox="${sunStorm.viewBox}">
						<use xlink:href="${sunStorm.url}" />
					</svg>`;
				this._moon!.innerHTML = `
					<svg class="svg-icon" viewBox="${moonStorm.viewBox}">
						<use xlink:href="${moonStorm.url}" />
					</svg>`;
			} else if (worldState.raining) {
				this._sun!.innerHTML = `
					<svg class="svg-icon" viewBox="${sunRain.viewBox}">
						<use xlink:href="${sunRain.url}" />
					</svg>`;
				this._moon!.innerHTML = `
					<svg class="svg-icon" viewBox="${moonRain.viewBox}">
						<use xlink:href="${moonRain.url}" />
					</svg>`;
			} else {
				this._sun!.innerHTML = `
					<svg class="svg-icon" viewBox="${sun.viewBox}">
						<use xlink:href="${sun.url}" />
					</svg>`;
				this._moon!.innerHTML = `
					<svg class="svg-icon" viewBox="${moon.viewBox}">
						<use xlink:href="${moon.url}" />
					</svg>`;
			}
		}
	}
}