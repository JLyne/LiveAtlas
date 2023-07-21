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

import {Coordinate, LiveAtlasMarker, LiveAtlasMarkerSet} from "@/index";
import LiveAtlasLayerGroup from "@/leaflet/layer/LiveAtlasLayerGroup";
import {useStore} from "vuex";
import LiveAtlasLeafletMap from "@/leaflet/LiveAtlasLeafletMap";
import {LatLng, Layer} from "leaflet";
import {
    createMarkerLayer,
    updateMarkerLayer
} from "@/leaflet/util/markers";
import {DynmapMarkerUpdate} from "@/dynmap";
import {computed, watch, WatchStopHandle} from "vue";
import AbstractMarkerSetLayer from "@/layers/AbstractMarkerSetLayer";
import {nonReactiveState} from "@/store/state";

export default class LeafletMarkerSetLayer extends AbstractMarkerSetLayer {
    private readonly leaflet: LiveAtlasLeafletMap;
    private readonly layerGroup: LiveAtlasLayerGroup;

    private readonly layers: Map<string, Layer> = Object.freeze(new Map());
    private converter: (location: Coordinate) => LatLng;
    private readonly _currentMapUnwatch: WatchStopHandle;

    constructor(leaflet: LiveAtlasLeafletMap, markerSet: LiveAtlasMarkerSet) {
        super(markerSet);

        const store = useStore(),
            currentMap = computed(() => store.state.currentMap);

        this.leaflet = leaflet;
        this.layerGroup = new LiveAtlasLayerGroup({
			id: markerSet.id,
			minZoom: markerSet.minZoom,
			maxZoom: markerSet.maxZoom,
			showLabels: markerSet.showLabels || store.state.components.markers.showLabels,
			priority: markerSet.priority,
        });

        this.converter = store.state.currentMap.locationToLatLng.bind(store.state.currentMap);
        this.addAllMarkers();

        //FIXME: Could this go somewhere else?
        this._currentMapUnwatch = watch(currentMap, (newValue) => {
            //Prevent error if this marker set has just been removed due to the map change
            if(newValue && nonReactiveState.markers.has(this.markerSet.id)) {
                this.converter = newValue.locationToLatLng.bind(newValue);

                for (const [id, area] of nonReactiveState.markers.get(this.markerSet.id)!) {
                    updateMarkerLayer(this.layers.get(id), area, this.converter);
                }
            }
        });
    }

    enable() {
        super.enable()
        this.leaflet.addLayer(this.layerGroup);
    }

    toggle() {
        this.leaflet.hasLayer(this.layerGroup) ? this.disable() : this.enable();
    }

    disable() {
        this._currentMapUnwatch();
        super.disable()
        this.leaflet.removeLayer(this.layerGroup);
    }

    addMarker(marker: LiveAtlasMarker): void {
        const layer = createMarkerLayer(marker, this.converter);

        this.layers.set(marker.id, layer);
        this.layerGroup.addLayer(layer);
    }

    removeMarker(id: string): void {
        const marker = this.layers.get(id);

		if(!marker) {
			return;
		}

		this.layerGroup.removeLayer(marker);
		this.layers.delete(id);
    }

    updateMarker(update: DynmapMarkerUpdate): void {
        if(update.removed) {
            this.removeMarker(update.id);
        } else {
            const layer = updateMarkerLayer(this.layers.get(update.id), update.payload, this.converter);

            if(!this.layers.has(update.id)) {
                this.layerGroup.addLayer(layer);
            }

            this.layers.set(update.id, layer);
        }
    }

    update(update: LiveAtlasMarkerSet): void {
        this.layerGroup.update({
            id: update.id,
            minZoom: update.minZoom,
            maxZoom: update.maxZoom,
            showLabels: update.showLabels || useStore().state.components.markers.showLabels, //FIXME
            priority: update.priority,
        });
    }
}