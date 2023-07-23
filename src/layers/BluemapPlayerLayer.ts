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
import AbstractPlayerLayer from "@/layers/AbstractPlayerLayer";
import {Store} from "@/store";
import {MapViewer} from "bluemap/MapViewer";
import {MarkerSet} from "bluemap/markers/MarkerSet";
import {PLAYER_MARKER_SET_ID} from "bluemap/markers/PlayerMarkerManager";
import {PlayerMarker} from "@/bluemap/marker/PlayerMarker";
export default class BluemapPlayerLayer extends AbstractPlayerLayer {
    private readonly viewer: MapViewer;
    private readonly markerSet: MarkerSet;
    private readonly markers: Map<LiveAtlasPlayer, PlayerMarker> = new Map();
    private readonly store: Store = useStore();

    constructor(viewer: MapViewer) {
        super();

        this.viewer = viewer;
        this.markerSet = new MarkerSet(PLAYER_MARKER_SET_ID);
        this.viewer.markers.add(this.markerSet);
    }

    enable(): void {
        this.markerSet.visible = true;
    }

    disable(): void {
        this.markerSet.visible = false;
    }

    toggle(): void {
        this.markerSet.visible = !this.markerSet.visible;
    }

    addPlayer(player: LiveAtlasPlayer): LiveAtlasPlayerMarker {
        const marker = new PlayerMarker(player);

        this.markers.set(player, marker);
        this.markerSet.add(marker);

        return marker;
    }

    removePlayer(player: LiveAtlasPlayer): void {
        const marker = this.markers.get(player);

        if(marker) {
            this.markerSet.remove(marker);
            marker.dispose();
        }
    }

    destroy() {
        super.destroy();
        this.viewer.markers.remove(this.markerSet);
    }
}