/*
 * Copyright 2022 James Lyne
 *
 * Some portions of this file were taken from https://github.com/webbukkit/dynmap.
 * These portions are Copyright 2020 Dynmap Contributors.
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

import {ControlOptions, LeafletMouseEvent, Control, Map, DomUtil, Util} from 'leaflet';
import {Coordinate} from "@/index";
import {useStore} from "@/store";

const store = useStore();

export interface CoordinatesControlOptions extends ControlOptions {
	showY: boolean;
	showRegion: boolean;
	showChunk: boolean;
	label: string;
}

/**
 * Leaflet map control which displays in-game block coordinates when hovering over or tapping the map
 */
export class CoordinatesControl extends Control {
	declare options: CoordinatesControlOptions;
	declare _map ?: Map;

	private _location?: Coordinate;
	private _locationChanged: boolean = false;
	private readonly _coordsContainer: HTMLSpanElement;
	private readonly _regionContainer: HTMLSpanElement;
	private readonly _chunkContainer: HTMLSpanElement;

	constructor(options: CoordinatesControlOptions) {
		super(options);

		this._coordsContainer = DomUtil.create('span', 'value coordinates');
		this._chunkContainer = DomUtil.create('span', 'value chunk');
		this._regionContainer = DomUtil.create('span', 'value region');

		options.position = 'bottomleft';
		Util.setOptions(this, options);
	}

	onAdd(map: Map) {
		const container = DomUtil.create('div', 'leaflet-control-coordinates');

		this._coordsContainer.textContent = this.options.showY ? '-----, ---, -----' : '-----, -----';
		this._coordsContainer.dataset.label = this.options.label;
		container.appendChild(this._coordsContainer);

		if (this.options.showRegion) {
			this._regionContainer.textContent = '--------------';
			this._regionContainer.dataset.label = store.state.messages.locationRegion;
			container.appendChild(this._regionContainer);
		}

		if (this.options.showChunk) {
			this._chunkContainer.textContent = '----, ----';
			this._chunkContainer.dataset.label = store.state.messages.locationChunk;
			container.appendChild(this._chunkContainer);
		}

		map.on('mousemove', this._onMouseMove, this);
		map.on('mouseout', this._onMouseOut, this);

		return container;
	}

	remove() {
		if (!this._map) {
			return this;
		}

		this._map.off('mousemove', this._onMouseMove, this);
		this._map.off('mouseout', this._onMouseOut, this);
		super.remove();

		return this;
	}

	_onMouseMove(event: LeafletMouseEvent) {
		if (!this._map || !store.state.currentMap) {
			return;
		}

		this._location = store.state.currentMap.latLngToLocation(event.latlng, store.state.currentWorld!.seaLevel + 1);

		if(!this._locationChanged) {
			this._locationChanged = true;
			requestAnimationFrame(() => this._update());
		}
	}

	_onMouseOut() {
		if (!this._map) {
			return;
		}

		this._location = undefined;

		if(!this._locationChanged) {
			this._locationChanged = true;
			requestAnimationFrame(() => this._update());
		}
	}

	_update() {
		if (!this._map || !store.state.currentWorld || !this._locationChanged) {
			return;
		}

		this._locationChanged = false;

		if(!this._location) {
			if (this.options.showY) {
				this._coordsContainer.textContent = '-----, ---, -----';
			} else {
				this._coordsContainer.textContent = '-----, -----';
			}

			if (this.options.showRegion) {
				this._regionContainer.textContent = '--------------';
			}

			if (this.options.showChunk) {
				this._chunkContainer.textContent = '----, ----';
			}

			return;
		}

		const x = Math.round(this._location.x).toString().padStart(5, ' '),
			y = this._location.y.toString().padStart(3, ' '),
			z = Math.round(this._location.z).toString().padStart(5, ' '),
			regionX = Math.floor(this._location.x / 512).toString().padStart(3, ' '),
			regionZ = Math.floor(this._location.z / 512).toString().padStart(3, ' '),
			chunkX = Math.floor(this._location.x / 16).toString().padStart(4, ' '),
			chunkZ = Math.floor(this._location.z / 16).toString().padStart(4, ' ');

		if (this.options.showY) {
			this._coordsContainer.textContent = `${x}, ${y}, ${z}`;
		} else {
			this._coordsContainer.textContent = `${x}, ${z}`;
		}

		if (this.options.showRegion) {
			this._regionContainer.textContent = `r.${regionX}, ${regionZ}.mca`;
		}

		if (this.options.showChunk) {
			this._chunkContainer.textContent = `${chunkX}, ${chunkZ}`;
		}
	}
}
