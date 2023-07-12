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
    PanOptions,
    ZoomPanOptions
} from "leaflet";
import LiveAtlasLeafletMap from "@/leaflet/LiveAtlasLeafletMap";
import {MutationTypes} from "@/store/mutation-types";
import {computed} from "vue";
import {LiveAtlasMapViewTarget} from "@/index";

export default class LeafletMapRenderer extends AbstractMapRenderer {
    private leaflet: LiveAtlasLeafletMap | undefined;

    constructor() {
        super();
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

		this.leaflet.on('zoomend', () => {
			this.store.commit(MutationTypes.SET_MAP_STATE, {
                zoom: this.leaflet!.getZoom()
            });
		});
    }

    destroy(): void {
        super.destroy();

        if(this.leaflet) {
            this.leaflet.remove();

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
                this.store.state.currentMap?.locationToLatLng(target.location.min) as LatLng,
                this.store.state.currentMap?.locationToLatLng(target.location.max) as LatLng,
            ), target.options);
        } else { // Location
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
}