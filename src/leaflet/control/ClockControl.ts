import {ControlOptions, DomUtil, Util, Map, Control} from 'leaflet';
import Utils from '@/util';
import {DynmapWorldState} from "@/dynmap";

export interface ClockControlOptions extends ControlOptions {
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
	private _weather?: HTMLElement;

	constructor(options: ClockControlOptions) {
		super(Object.assign(options, {position: 'topcenter'}));

		Util.setOptions(this, options);
	}

	onAdd(map: Map) {
		this._container = DomUtil.create('div', 'largeclock timeofday');
		this._sun = DomUtil.create('div', 'timeofday sun', this._container);
		this._moon = DomUtil.create('div', 'timeofday moon', this._sun);

		this._sun.style.backgroundPosition = (-150) + 'px ' + (-150) + 'px';
		this._moon.style.backgroundPosition = (-150) + 'px ' + (-150) + 'px';

		if (this.options.showDigitalClock) {
			this._clock = DomUtil.create('div', 'timeofday digitalclock', this._container)
		}

		if (this.options.showWeather) {
			this._weather = DomUtil.create('div', 'weather', this._container)
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
			this._sun!.style.backgroundPosition = (-50 * Math.cos(sunAngle)) + 'px ' + (-50 * Math.sin(sunAngle)) + 'px';
			this._moon!.style.backgroundPosition = (-50 * Math.cos(moonAngle)) + 'px ' + (-50 * Math.sin(moonAngle)) + 'px';
		} else {
			this._sun!.style.backgroundPosition = '-150px -150px';
			this._moon!.style.backgroundPosition = '-150px -150px';
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

		if(this.options.showWeather) {
			const dayNight = (timeOfDay > 23100 || timeOfDay < 12900) ? "day" : "night";
			let className = 'sunny';

			if (worldState.raining) {
				className = 'stormy';

				if (worldState.thundering) {
					className = 'thunder';
				}
			}

			this._weather?.classList.remove('stormy_day', 'stormy_night', 'sunny_day', 'sunny_night', 'thunder_day', 'thunder_night');
			this._weather?.classList.add(`${className}_${dayNight}`);
		}
	}
}