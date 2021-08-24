/*
Portions of this file are taken from Leaflet.loading:

Copyright (c) 2013 Eric Brelsford

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

import {
	Control,
	ControlOptions,
	DomUtil,
	Layer,
	LeafletEvent,
	Map, TileLayer,
} from 'leaflet';
import '@/assets/icons/loading.svg';
import {useStore} from "@/store";

export interface LoadingControlOptions extends ControlOptions {
	delayIndicator?: number;
}

export class LoadingControl extends Control {
	// @ts-ignore
	options: LoadingControlOptions;

	_dataLoaders: Set<number> = new Set();
	_loadingIndicator: HTMLDivElement;
	_delayIndicatorTimeout?: number;

	constructor(options: LoadingControlOptions) {
		super(options);

		this._loadingIndicator = DomUtil.create('div',
			'leaflet-control-button leaflet-control-loading') as HTMLDivElement;
	}

	onAdd(map: Map) {
		this._loadingIndicator.title = useStore().state.messages.loadingTitle;
		this._loadingIndicator.hidden = true;
		this._loadingIndicator.innerHTML = `
		<svg class="svg-icon">
		  <use xlink:href="#icon--loading" />
		</svg>`;

		this._addLayerListeners(map);
		this._addMapListeners(map);

		return this._loadingIndicator;
	}

	onRemove(map: Map) {
		this._removeLayerListeners(map);
		this._removeMapListeners(map);
	}

	addLoader(id: number) {
		this._dataLoaders.add(id);

		if (this.options.delayIndicator && !this._delayIndicatorTimeout) {
			// If we are delaying showing the indicator and we're not
			// already waiting for that delay, set up a timeout.
			this._delayIndicatorTimeout = setTimeout(() => {
				this.updateIndicator();
				this._delayIndicatorTimeout = undefined;
			}, this.options.delayIndicator);
		} else {
			// Otherwise show the indicator immediately
			this.updateIndicator();
		}
	}

	removeLoader(id: number) {
		this._dataLoaders.delete(id);
		this.updateIndicator();

		// If removing this loader means we're in no danger of loading,
		// clear the timeout. This prevents old delays from instantly
		// triggering the indicator.
		if (this.options.delayIndicator && this._delayIndicatorTimeout && !this.isLoading()) {
			clearTimeout(this._delayIndicatorTimeout);
			this._delayIndicatorTimeout = undefined;
		}
	}

	updateIndicator() {
		if (this.isLoading()) {
			this._showIndicator();
		}
		else {
			this._hideIndicator();
		}
	}

	isLoading() {
		return this._countLoaders() > 0;
	}

	_countLoaders() {
		return this._dataLoaders.size;
	}

	_showIndicator() {
		this._loadingIndicator.hidden = false;
	}

	_hideIndicator() {
		this._loadingIndicator.hidden = true;
	}

	_handleLoading(e: LeafletEvent) {
		this.addLoader(this.getEventId(e));
	}

	_handleBaseLayerChange (e: LeafletEvent) {
		// Check for a target 'layer' that contains multiple layers, such as
		// L.LayerGroup. This will happen if you have an L.LayerGroup in an
		// L.Control.Layers.
		if (e.layer && e.layer.eachLayer && typeof e.layer.eachLayer === 'function') {
			e.layer.eachLayer((layer: Layer) => {
				this._handleBaseLayerChange({ layer: layer } as LeafletEvent);
			});
		}
	}

	_handleLoad(e: LeafletEvent) {
		this.removeLoader(this.getEventId(e));
	}

	getEventId(e: any) {
		if (e.id) {
			return e.id;
		} else if (e.layer) {
			return e.layer._leaflet_id;
		}
		return e.target._leaflet_id;
	}

	_layerAdd(e: LeafletEvent) {
		if(!(e.layer instanceof TileLayer)) {
			return;
		}

		try {
			if(e.layer.isLoading()) {
				this.addLoader((e.layer as any)._leaflet_id);
			}

			e.layer.on('loading', this._handleLoading, this);
			e.layer.on('load', this._handleLoad, this);
		} catch (exception) {
			console.warn('L.Control.Loading: Tried and failed to add ' +
				' event handlers to layer', e.layer);
			console.warn('L.Control.Loading: Full details', exception);
		}
	}

	_layerRemove(e: LeafletEvent) {
		if(!(e.layer instanceof TileLayer)) {
			return;
		}

		try {
			e.layer.off('loading', this._handleLoading, this);
			e.layer.off('load', this._handleLoad, this);
		} catch (exception) {
			console.warn('L.Control.Loading: Tried and failed to remove ' +
				'event handlers from layer', e.layer);
			console.warn('L.Control.Loading: Full details', exception);
		}
	}

	_addLayerListeners(map: Map) {
		// Add listeners for begin and end of load to any layers already
		// on the map
		map.eachLayer((layer: Layer) => {
			if(!(layer instanceof TileLayer)) {
				return;
			}

			if(layer.isLoading()) {
				this.addLoader((layer as any)._leaflet_id);
			}

			layer.on('loading', this._handleLoading, this);
			layer.on('load', this._handleLoad, this);
		});

		// When a layer is added to the map, add listeners for begin and
		// end of load
		map.on('layeradd', this._layerAdd, this);
		map.on('layerremove', this._layerRemove, this);
	}

	_removeLayerListeners(map: Map) {
		// Remove listeners for begin and end of load from all layers
		map.eachLayer((layer: Layer) => {
			if(!(layer instanceof TileLayer)) {
				return;
			}

			this.removeLoader((layer as any)._leaflet_id);

			layer.off('loading', this._handleLoading, this);
			layer.off('load', this._handleLoad, this);
		});

		// Remove layeradd/layerremove listener from map
		map.off('layeradd', this._layerAdd, this);
		map.off('layerremove', this._layerRemove, this);
	}

	_addMapListeners(map: Map) {
		// Add listeners to the map for (custom) dataloading and dataload
		// events, eg, for AJAX calls that affect the map but will not be
		// reflected in the above layer events.
		map.on('baselayerchange', this._handleBaseLayerChange, this);
		map.on('dataloading', this._handleLoading, this);
		map.on('dataload', this._handleLoad, this);
		map.on('layerremove', this._handleLoad, this);
	}

	_removeMapListeners(map: Map) {
		map.off('baselayerchange', this._handleBaseLayerChange, this);
		map.off('dataloading', this._handleLoading, this);
		map.off('dataload', this._handleLoad, this);
		map.off('layerremove', this._handleLoad, this);
	}
}
