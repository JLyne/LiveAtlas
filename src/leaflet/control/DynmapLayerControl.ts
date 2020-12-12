import {Control, Map} from 'leaflet';
import layers from '@/assets/icons/layers.svg';
import LayersObject = Control.LayersObject;
import LayersOptions = Control.LayersOptions;

export class DynmapLayerControl extends Control.Layers {
	private _layersLink?: HTMLElement;

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
}
