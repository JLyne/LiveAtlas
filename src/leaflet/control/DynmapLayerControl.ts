import {Util, Control, DomEvent, LeafletEvent, Map} from 'leaflet';
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
