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

import {LiveAtlasPlayer, LiveAtlasPlayerMarker} from "@/index";
import {useStore} from "vuex";
import LiveAtlasLeafletMap from "@/leaflet/LiveAtlasLeafletMap";
import {LayerGroup} from "leaflet";
import AbstractPlayerLayer from "@/layers/AbstractPlayerLayer";
import {PlayerMarker} from "@/leaflet/marker/PlayerMarker";
import {Store} from "@/store";
import {computed, watch, WatchStopHandle} from "vue";

export default class LeafletPlayerLayer extends AbstractPlayerLayer {
    private readonly leaflet: LiveAtlasLeafletMap;
    private readonly pane: HTMLElement;
    private readonly layerGroup: LayerGroup;
    private readonly markers: Map<LiveAtlasPlayer, PlayerMarker> = new Map();
    private readonly store: Store = useStore();
    private readonly _playerCountUnwatch: WatchStopHandle;

    constructor(leaflet: LiveAtlasLeafletMap) {
        super();

        this.leaflet = leaflet;
        this.pane = leaflet.getPane('players') || leaflet.createPane('players');
        this.layerGroup = new LayerGroup([]);

        const playerCount = computed(() => this.store.state.players.size);

        this._playerCountUnwatch = watch(playerCount, (newValue) =>
            this.pane.classList.toggle('no-animations', newValue > 150));

        if(this.store.state.ui.playersAboveMarkers) {
            this.pane.style.zIndex = '600';
        }
    }

    enable(): void {
        this.leaflet.addLayer(this.layerGroup);
    }

    disable(): void {
        this.leaflet.removeLayer(this.layerGroup);
    }

    toggle(): void {
        this.leaflet.hasLayer(this.layerGroup) ? this.leaflet.removeLayer(this.layerGroup) : this.leaflet.addLayer(this.layerGroup);
    }

    addPlayer(player: LiveAtlasPlayer): LiveAtlasPlayerMarker {
        const componentSettings = this.store.state.components.players.markers!;

        const marker = new PlayerMarker(player, this.layerGroup, {
			compact: this.store.state.ui.compactPlayerMarkers,
			imageSize: componentSettings.imageSize,
			showHealth: componentSettings.showHealth,
			showArmor: componentSettings.showArmor,
			showYaw: componentSettings.showYaw,
        });

        this.markers.set(player, marker);

        return marker;
    }

    removePlayer(player: LiveAtlasPlayer): void {
        const marker = this.markers.get(player);

        if(marker) {
            this.layerGroup.removeLayer(marker);
            this.markers.delete(player);
        }
    }

    destroy() {
        super.destroy();
        this._playerCountUnwatch();
    }
}