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

import {Util, Control, DomEvent, LeafletEvent, Map, Layer} from 'leaflet';
import layers from '@/assets/icons/layers.svg';
import LayersObject = Control.LayersObject;
import LayersOptions = Control.LayersOptions;
import Layers = Control.Layers;

import checkbox from '@/assets/icons/checkbox.svg';

export class DynmapLayerControl extends Control.Layers {
	private _layersLink?: HTMLElement;
	private _map ?: Map;
	private _overlaysList?: HTMLElement;
	private _baseLayersList?: HTMLElement;
	private _layerControlInputs?: HTMLElement[];

	constructor(baseLayers?: LayersObject, overlays?: LayersObject, options?: LayersOptions) {
		super(baseLayers, overlays, options);
	}

	onAdd(map: Map) {
		// @ts-ignore
		const element = super.onAdd(map);

		this._layersLink!.innerHTML = `
		<svg class="svg-icon" viewBox="${layers.viewBox}">
		  <use xlink:href="${layers.url}" />
		</svg>`;

		return element;
	}

	hasLayer(layer: Layer): boolean {
		// @ts-ignore
		return !!super._getLayer(Util.stamp(layer));
	}

	_addItem(obj: any) {
		const container = obj.overlay ? this._overlaysList : this._baseLayersList,
			item = document.createElement('label'),
			label = document.createElement('span'),
			checked = this._map!.hasLayer(obj.layer);

		let input;

		item.className = 'layer checkbox';

		if (obj.overlay) {
			input = document.createElement('input');
			input.type = 'checkbox';
			input.className = 'leaflet-control-layers-selector';
			input.defaultChecked = checked;
		} else {
			// @ts-ignore
			input = Layers.prototype._createRadioElement.call(this, 'leaflet-base-layers_' + Util.stamp(this), checked);
		}

		input.layerId = Util.stamp(obj.layer);
		this._layerControlInputs!.push(input);
		label.textContent = obj.name;

		// @ts-ignore
		DomEvent.on(input, 'click', (e: LeafletEvent) => Layers.prototype._onInputClick.call(this, e), this);

		item.appendChild(input);
		item.insertAdjacentHTML('beforeend',  `
		<svg class="svg-icon" viewBox="${checkbox.viewBox}" aria-hidden="true">
	  		<use xlink:href="${checkbox.url}" />
		</svg>`);
		item.appendChild(label);

		container!.appendChild(item);

		// @ts-ignore
		Layers.prototype._checkDisabledLayers.call(this);
		return label;
	}
}
