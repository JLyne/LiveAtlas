/*
 * Copyright 2021 James Lyne
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

import {Layer, Map as LeafletMap, LayerGroup, LayerOptions, Util, Marker, Path} from "leaflet";
import {GenericMarker} from "@/leaflet/marker/GenericMarker";

export interface LiveAtlasLayerGroupOptions extends LayerOptions {
	id: string; //Added to the name of layer group panes
	showLabels: boolean;
	priority: number; //Added to the z-index of layer group panes

	//Zoom limits for the whole group, can be overridden by layers
	minZoom?: number;
	maxZoom?: number;
}

export default class LiveAtlasLayerGroup extends LayerGroup {
	// @ts-ignore
	options: LiveAtlasLayerGroupOptions;
	private _zoomLimitedLayers: Set<Layer>; //Layers which are zoom limited and should be checked on zoom
	_layers: any;
	_markerPane?: HTMLElement;

	private _zoomEndCallback = () => this._updateLayerVisibility();

	constructor(options: LiveAtlasLayerGroupOptions) {
		super([], options);
		Util.setOptions(this, options);

		this._zoomLimitedLayers = new Set();
	}

	onAdd(map: LeafletMap) {
		map.on('zoomend', this._zoomEndCallback, this);

		this._map = map;
		this._markerPane = map.getPane(`${this.options.id}-markers`) || map.createPane(`${this.options.id}-markers`);

		this._markerPane.classList.toggle('leaflet-pane--show-labels', this.options.showLabels);

		this._markerPane.style.zIndex = (401 + this.options.priority).toString();

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
			layer.options.pane = `vectors`;
		}

		const zoomLimited = LiveAtlasLayerGroup._isLayerZoomLimited(layer);

		if (zoomLimited) {
			this._zoomLimitedLayers.add(layer);
		}

		if (this._map) {
			//If layer is zoom limited, only add to map if it should be visible
			if (zoomLimited) {
				if (LiveAtlasLayerGroup._isLayerVisible(layer, this._map.getZoom())) {
					this._addToMap(layer);
				}
			} else {
				this._addToMap(layer);
			}
		}

		return this;
	}

	removeLayer(layer: Layer): this {
		this._zoomLimitedLayers.delete(layer);
		return super.removeLayer(layer);
	}

	update(options: LiveAtlasLayerGroupOptions) {
		if(this.options.showLabels !== options.showLabels) {
			//Create labels if they are now always visible
			//TODO: This will be slow when many markers exist. Is it worth doing?
			if(options.showLabels) {
				this.eachLayer((layer) => {
					if(layer instanceof GenericMarker) {
						(layer as GenericMarker).createLabel();
					}
				});
			}

			this.options.showLabels = options.showLabels;
		}

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
			}
		}
	}

	private _updateLayerVisibility(onAdd?: boolean) {
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
					LiveAtlasLayerGroup._isLayerVisible(layer, zoom) ? this._addToMap(layer) : this._removeFromMap(layer);
				} else { //Otherwise apply group zoom limit
					visible ? this._addToMap(layer) : this._removeFromMap(layer);
				}
			}, this);
		//Group isn't zoom limited, but some individual markers are
		} else if(this._zoomLimitedLayers.size) {
			this._zoomLimitedLayers.forEach((layer) => {
				LiveAtlasLayerGroup._isLayerVisible(layer, zoom) ? this._addToMap(layer) : this._removeFromMap(layer);
			});
		//Nothing is zoom limited, but we've just been added to the map
		} else if(onAdd) {
			this.eachLayer((layer: Layer) => this._addToMap(layer), this._map);
		}
	}

	//Returns if this layer group has zoom limits defined
	private _isZoomLimited() {
		return this.options.maxZoom !== undefined || this.options.minZoom !== undefined;
	}

	//Returns if the given layer has its own zoom limits defined
	private static _isLayerZoomLimited(layer: Layer) {
		return ((layer as any).options && (layer as any).options.minZoom !== undefined)
			&& ((layer as any).options && (layer as any).options.maxZoom !== undefined);
	}

	private static _isLayerVisible(layer: Layer, currentZoom: number) {
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

	private _addToMap(layer: Layer) {
		this._map.addLayer(layer)

		//Create marker label immediately if labels are visible by default
		if(layer instanceof GenericMarker && this.options.showLabels) {
			(layer as GenericMarker).createLabel();
		}
	}

	private _removeFromMap(layer: Layer) {
		this._map.removeLayer(layer)
	}
}
