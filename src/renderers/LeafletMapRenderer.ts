/*
 * Copyright 2023 James Lyne
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

import AbstractMapRenderer from "@/renderers/AbstractMapRenderer";
import {
    CRS,
    LatLng,
    LatLngBounds,
    Layer,
    LeafletEvent,
    LeafletEventHandlerFn,
    PanOptions,
    TileLayer,
    ZoomPanOptions
} from "leaflet";
import LiveAtlasLeafletMap from "@/leaflet/LiveAtlasLeafletMap";
import {MutationTypes} from "@/store/mutation-types";
import {computed} from "vue";
import {LiveAtlasMapLayer, LiveAtlasMapViewTarget, LiveAtlasMarkerSet, LiveAtlasMarkerSetLayer} from "@/index";
import LeafletMarkerSetLayer from "@/layers/LeafletMarkerSetLayer";
import {AbstractTileLayer} from "@/leaflet/tileLayer/AbstractTileLayer";
import LeafletMapLayer from "@/layers/LeafletMapLayer";

export default class LeafletMapRenderer extends AbstractMapRenderer {
    private leaflet: LiveAtlasLeafletMap | undefined;

    private readonly handleLoading : LeafletEventHandlerFn = (e: LeafletEvent) =>
        this.addLoadingLayer(LeafletMapRenderer.getEventId(e));
    private readonly handleLoaded : LeafletEventHandlerFn = (e: LeafletEvent) =>
        this.removeLoadingLayer(LeafletMapRenderer.getEventId(e));
    private readonly handleLayerAdd : LeafletEventHandlerFn;
    private readonly handleLayerRemove : LeafletEventHandlerFn;

    private readonly loadingLayers : Set<string> = new Set();

    constructor() {
        super();

        this.handleLayerAdd = (e: LeafletEvent) => {
            if (!(e.layer instanceof TileLayer)) {
                return;
            }

            this.updateZoom();

            try {
                if (e.layer.isLoading()) {
                    this.handleLoading(e);
                }

                e.layer.on('loading', this.handleLoading);
                e.layer.on('load', this.handleLoaded);
            } catch (exception) {
                console.warn('Failed to add event handlers to layer', e.layer, exception);
            }
        }

        this.handleLayerRemove = (e: LeafletEvent) => {
            if(!(e.layer instanceof TileLayer)) {
				return;
			}

            this.updateZoom();
			this.handleLoaded(e);

			try {
				e.layer.off('loading', this.handleLoading);
				e.layer.off('load', this.handleLoaded);
			} catch (exception) {
				console.warn('Failed to remove event handlers from layer', e.layer, exception);
			}
        }
    }
    init(element: HTMLElement): void {
        const currentMap = computed(() => this.store.state.currentMap);

        this.leaflet = new LiveAtlasLeafletMap(element, Object.freeze({
			zoom: this.store.state.configuration.defaultZoom,
			center: new LatLng(0, 0),
			fadeAnimation: false,
			zoomAnimation: true,
			preferCanvas: true,
			crs: CRS.Simple,
			worldCopyJump: false,
			// markerZoomAnimation: false,
		})) as LiveAtlasLeafletMap;

		this.leaflet.createPane('vectors');

		this.leaflet.on('moveend', () => {
			if(currentMap.value) {
				this.store.commit(MutationTypes.SET_MAP_STATE, {
                    location: currentMap.value.latLngToLocation(this.leaflet!.getCenter(), 64),
                });
			}
		});

		this.leaflet.on('zoomend', () => this.updateZoom());

        this.addLoadingListeners();
        this.updateZoom();
    }

    destroy(): void {
        super.destroy();

        if(this.leaflet) {
            this.leaflet.remove();
            this.removeLoadingListeners();

            //FIXME: Remove event handler properly
        }
    }

    focus(): void {
        if(this.leaflet) {
            this.leaflet.getContainer().focus();
        }
    }

    setView(target: LiveAtlasMapViewTarget): void {
        if(typeof target.zoom !== 'undefined') {
            this.leaflet!.setZoom(target.zoom, target.options as ZoomPanOptions);
        }

        if('min' in target.location) { // Bounds
            this.leaflet!.fitBounds(new LatLngBounds(
                //FIXME: Find a way to avoid using the map for this
                this.store.state.currentMap?.locationToLatLng(target.location.min) as LatLng,
                this.store.state.currentMap?.locationToLatLng(target.location.max) as LatLng,
            ), target.options);
        } else { // Location
            // FIXME: Find a way to avoid using the map for this
            const location = this.store.state.currentMap?.locationToLatLng(target.location) as LatLng;
            this.leaflet!.panTo(location, target.options as PanOptions);
        }
    }

    zoomIn(): void {
        if(this.leaflet) {
            this.leaflet.zoomIn();
        }
    }

    zoomOut(): void {
        if(this.leaflet) {
            this.leaflet.zoomOut();
        }
    }

    private updateZoom(): void {
        this.store.commit(MutationTypes.SET_MAP_STATE, {
            minZoom: this.leaflet?.getMinZoom(),
            maxZoom: this.leaflet?.getMaxZoom(),
            zoom: this.leaflet!.getZoom()
        });
    }

    // Loading state stuff
    private addLoadingListeners() {
        // Add listeners for begin and end of load to any layers already
        // on the map
        this.leaflet!.eachLayer((layer: Layer) => {
            if (!(layer instanceof TileLayer)) {
                return;
            }

            if (layer.isLoading()) {
                this.addLoadingLayer((layer as any)._leaflet_id);
            }

            layer.on('loading', this.handleLoading);
            layer.on('load', this.handleLoaded);
        });

        // When a layer is added to the map, add listeners for begin and
        // end of load
        this.leaflet!.on('layeradd', this.handleLayerAdd);
        this.leaflet!.on('layerremove', this.handleLayerRemove);

        // Add listeners to the map for (custom) dataloading and dataload
        // events, eg, for AJAX calls that affect the map but will not be
        // reflected in the above layer events.
        this.leaflet!.on('dataloading', this.handleLoading);
        this.leaflet!.on('dataload', this.handleLoaded);
    }

	private removeLoadingListeners () {
		// Remove listeners for begin and end of load from all layers
		this.leaflet!.eachLayer((layer: Layer) => {
			if(!(layer instanceof TileLayer)) {
				return;
			}

            this.removeLoadingLayer((layer as any)._leaflet_id);

			layer.off('loading', this.handleLoading);
			layer.off('load', this.handleLoaded);
		});

        this.leaflet!.off('layeradd', this.handleLayerAdd);
        this.leaflet!.off('layerremove', this.handleLayerRemove);

        this.leaflet!.off('dataloading', this.handleLoading);
        this.leaflet!.off('dataload', this.handleLoaded);
	}

    private addLoadingLayer(id: string): void {
        this.loadingLayers.add(id);

        if(this.loadingLayers.size == 1) {
            this.store.commit(MutationTypes.SET_MAP_STATE, {loading: true});
        }
    }

    private removeLoadingLayer(id: string): void {
        if(!this.loadingLayers.delete(id)) {
            return;
        }

        if(!this.loadingLayers.size) {
            this.store.commit(MutationTypes.SET_MAP_STATE, {loading: false});
        }
    }

    private static getEventId(e: any): string {
        if (e.id) {
            return e.id;
        } else if (e.layer) {
            return e.layer._leaflet_id;
        }
        return e.target._leaflet_id;
    }

    createMapLayer(tileLayer: AbstractTileLayer): LiveAtlasMapLayer {
        return new LeafletMapLayer(this.leaflet!, tileLayer);
    }

    createMarkerSetLayer(options: LiveAtlasMarkerSet): LiveAtlasMarkerSetLayer {
        return new LeafletMarkerSetLayer(this.leaflet!, options);
    }
}