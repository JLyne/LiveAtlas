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

import {Layer, Map as LeafletMap, LayerGroup, LayerOptions, Util, Marker, Path} from "leaflet";

export interface DynmapLayerGroupOptions extends LayerOptions {
	id: string; //Added to the name of layer group panes
	showLabels: boolean;
	priority: number; //Added to the z-index of layer group panes

	//Zoom limits for the whole group, can be overridden by layers
	minZoom?: number;
	maxZoom?: number;
}

export default class DynmapLayerGroup extends LayerGroup {
	// @ts-ignore
	options: DynmapLayerGroupOptions;
	_zoomLimitedLayers: Set<Layer>; //Layers which are zoom limited and should be checked on zoom
	_layers: any;
	_markerPane?: HTMLElement;
	_vectorPane?: HTMLElement;

	_zoomEndCallback = () => this._updateLayerVisibility();

	constructor(options: DynmapLayerGroupOptions) {
		super([], options);
		Util.setOptions(this, options);

		this._zoomLimitedLayers = new Set();
	}

	onAdd(map: LeafletMap) {
		map.on('zoomend', this._zoomEndCallback, this);

		this._map = map;
		this._markerPane = map.createPane(`${this.options.id}-markers`);
		this._vectorPane = map.createPane(`${this.options.id}-vectors`);

		this._markerPane.classList.toggle('leaflet-pane--show-labels', this.options.showLabels);

		this._markerPane.style.zIndex = (401 + this.options.priority).toString();
		this._vectorPane.style.zIndex = (400 + this.options.priority).toString();

		this._updateLayerVisibility(true);

		return this;
	}

	onRemove(map: LeafletMap) {
		super.onRemove(map);
		map.off('zoomend', this._zoomEndCallback, this);

		return this;
	}

	clearLayers(): this {
		this._zoomLimitedLayers.clear();
		return super.clearLayers();
	}

	addLayer(layer: Layer) {
		const id = this.getLayerId(layer);

		this._layers[id] = layer;

		if (layer instanceof Marker) {
			layer.options.pane = `${this.options.id}-markers`;
		} else if (layer instanceof Path) {
			layer.options.pane = `${this.options.id}-vectors`;
		}

		const zoomLimited = this._isLayerZoomLimited(layer);

		if (zoomLimited) {
			this._zoomLimitedLayers.add(layer);
		}

		if (this._map) {
			//If layer is zoom limited, only add to map if it should be visible
			if (zoomLimited) {
				if (this._isLayerVisible(layer, this._map.getZoom())) {
					this._map.addLayer(layer);
				}
			} else {
				this._map.addLayer(layer);
			}
		}

		return this;
	}

	removeLayer(layer: Layer): this {
		this._zoomLimitedLayers.delete(layer);
		return super.addLayer(layer);
	}

	update(options: DynmapLayerGroupOptions) {
		this.options.showLabels = options.showLabels;

		if(this._markerPane) {
			this._markerPane.classList.toggle('leaflet-pane--show-labels', options.showLabels);
		}

		if(options.minZoom !== this.options.minZoom || options.maxZoom !== this.options.maxZoom) {
			this.options.minZoom = options.minZoom;
			this.options.maxZoom = options.maxZoom;

			this._updateLayerVisibility();
		}

		if(options.priority !== this.options.priority) {
			this.options.priority = options.priority;

			if(this._markerPane) {
				this._markerPane.style.zIndex = (401 + this.options.priority).toString();
				this._vectorPane!.style.zIndex = (400 + this.options.priority).toString();
			}
		}
	}

	_updateLayerVisibility(onAdd?: boolean) {
		if(!this._map) {
			return;
		}

		const zoom = this._map.getZoom();

		//The whole group is zoom limited
		if(this._isZoomLimited()) {
			const visible = zoom >= (this.options.minZoom || -Infinity) && zoom <= (this.options.maxZoom || Infinity);

			this.eachLayer((layer) => {
				//Per marker zoom limits take precedence, if present
				if(this._zoomLimitedLayers.has(layer)) {
					this._isLayerVisible(layer, zoom) ? this._map.addLayer(layer) : this._map.removeLayer(layer);
				} else { //Otherwise apply group zoom limit
					visible ? this._map.addLayer(layer) : this._map.removeLayer(layer);
				}
			}, this);
		//Group isn't zoom limited, but some individual markers are
		} else if(this._zoomLimitedLayers.size) {
			this._zoomLimitedLayers.forEach((layer) => {
				this._isLayerVisible(layer, zoom) ? this._map.addLayer(layer) : this._map.removeLayer(layer);
			});
		//Nothing is zoom limited, but we've just been added to the map
		} else if(onAdd) {
			this.eachLayer(this._map.addLayer, this._map);
		}
	}

	//Returns if this layer group has zoom limits defined
	_isZoomLimited() {
		return this.options.maxZoom !== undefined || this.options.minZoom !== undefined;
	}

	//Returns if the given layer has its own zoom limits defined
	_isLayerZoomLimited(layer: Layer) {
		return ((layer as any).options && (layer as any).options.minZoom !== undefined)
			&& ((layer as any).options && (layer as any).options.maxZoom !== undefined);
	}

	_isLayerVisible(layer: Layer, currentZoom: number) {
		let minZoom = -Infinity,
			maxZoom = Infinity;

		if((layer as any).options && (layer as any).options.minZoom !== undefined) {
			minZoom = (layer as any).options.minZoom;
		}

		if((layer as any).options && (layer as any).options.maxZoom !== undefined) {
			maxZoom = (layer as any).options.maxZoom;
		}

		return currentZoom >= minZoom && currentZoom <= maxZoom;
	}
}