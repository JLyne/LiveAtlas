/*
 * Copyright 2020 James Lyne
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

import {Layer, Map as LeafletMap, LayerGroup, LayerOptions, Util} from "leaflet";

export interface DynmapLayerGroupOptions extends LayerOptions {
	minZoom?: number;
	maxZoom?: number;
}

export default class DynmapLayerGroup extends LayerGroup {
	// @ts-ignore
	options: DynmapLayerGroupOptions;
	_layerVisibility: Map<Layer, boolean>;
	_layers: any;

	constructor(layers?: Layer[], options?: DynmapLayerGroupOptions) {
		super(layers, options);
		Util.setOptions(this, options);

		this._layerVisibility = new Map();
	}

	onAdd(map: LeafletMap) {
		map.on('zoomend', this._handleZoomChange, this);
		this._handleZoomChange();

		return this;
	}

	onRemove(map: LeafletMap) {
		super.onRemove(map);
		this._layerVisibility.clear();
		map.off('zoomend', this._handleZoomChange, this);

		return this;
	}

	clearLayers(): this {
		this._layerVisibility.clear();
		return super.clearLayers();
	}

	addLayer(layer: Layer) {
		const id = this.getLayerId(layer);

		this._layers[id] = layer;


		if(this._map) {
			const visible = this._isLayerVisible(layer, this._map.getZoom());
			this._layerVisibility.set(layer, visible);

			if(visible) {
				this._map.addLayer(layer);
			}
		} else {
			this._layerVisibility.set(layer, false);
		}

		return this;
	}

	removeLayer(layer: Layer): this {
		this._layerVisibility.delete(layer);
		return super.addLayer(layer);
	}

	_handleZoomChange() {
		if(!this._map) {
			return;
		}

		const zoom = this._map.getZoom();

		//FIXME: Keep track of layers that actually have min/max zoom, to avoid pointless checking of every layer?
		this.eachLayer((layer) => {
			const newVisibility = this._isLayerVisible(layer, zoom),
				currentVisibility = this._layerVisibility.get(layer);

				if(newVisibility) {
					if(!currentVisibility) {
						this._map.addLayer(layer);
					}
				} else if(currentVisibility) {
					this._map.removeLayer(layer);
				}

				this._layerVisibility.set(layer, newVisibility);
		}, this);
	}

	_isLayerVisible(layer: Layer, currentZoom: number) {
		let minZoom = this.options.minZoom || -Infinity,
			maxZoom = this.options.maxZoom || Infinity;

		if((layer as any).options && (layer as any).options.minZoom !== undefined) {
			minZoom = (layer as any).options.minZoom;
		}

		if((layer as any).options && (layer as any).options.maxZoom !== undefined) {
			maxZoom = (layer as any).options.maxZoom;
		}

		return currentZoom >= minZoom && currentZoom <= maxZoom;
	}
}