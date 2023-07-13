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

import LiveAtlasLeafletMap from "@/leaflet/LiveAtlasLeafletMap";
import {TileLayer} from "leaflet";
import {AbstractTileLayer} from "@/leaflet/tileLayer/AbstractTileLayer";
import AbstractMapLayer from "@/layers/AbstractMapLayer";

//FIXME: Can this class be merged since it is just a regular layer now?
export default class LeafletMapLayer extends AbstractMapLayer {
    private readonly leaflet: LiveAtlasLeafletMap;
    protected readonly layer: TileLayer;

    constructor(leaflet: LiveAtlasLeafletMap, tileLayer: AbstractTileLayer) {
        super();

        this.leaflet = leaflet;
		this.layer = tileLayer;
    }

    add(): void {
        this.leaflet.addLayer(this.layer);
    }

    remove(): void {
        this.leaflet.removeLayer(this.layer);
    }

    toggle(): void {
        this.leaflet.hasLayer(this.layer) ? this.leaflet.removeLayer(this.layer) : this.leaflet.addLayer(this.layer);
    }
}