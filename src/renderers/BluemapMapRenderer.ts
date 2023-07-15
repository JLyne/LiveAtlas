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
import LiveAtlasLeafletMap from "@/leaflet/LiveAtlasLeafletMap";
import {FreeFlightControls, MapControls, MapViewer} from "bluemap/BlueMap";
import {LiveAtlasMapLayer, LiveAtlasMapViewTarget, LiveAtlasMarkerSet, LiveAtlasMarkerSetLayer} from "@/index";
import {LiveAtlasTileLayerOptions} from "@/leaflet/tileLayer/AbstractTileLayer";

export default class BluemapMapRenderer extends AbstractMapRenderer {
    protected events: HTMLElement | undefined;
    protected mapViewer: MapViewer | undefined;
    protected _mapControls: MapControls | undefined;
    protected freeFlightControls: FreeFlightControls | undefined;

    constructor() {
        super();
    }

    init(element: HTMLElement): void {
        this.events = element;
        this.mapViewer = new MapViewer(element, this.events);

        this._mapControls = new MapControls(this.mapViewer.renderer.domElement, element);
        this.freeFlightControls = new FreeFlightControls(this.mapViewer.renderer.domElement);

        this.resetCamera();
    }

    resetCamera() {
        const map = this.mapViewer!.map,
            controls = this.mapViewer!.controlsManager;

        if (map) {
            controls.position.set(map.data.startPos.x, 0, map.data.startPos.z);
            controls.distance = 1500;
            controls.angle = 0;
            controls.rotation = 0;
            controls.tilt = 0;
            controls.ortho = 0;
        }

        controls.controls = this._mapControls;
    }

    getMapViewer(): MapViewer | undefined {
        return this.mapViewer;
    }

    destroy(): void {
        super.destroy();

        if(this.mapViewer) {
            //FIXME: ???
        }
    }

    focus(): void {

    }

    setView(target: LiveAtlasMapViewTarget): void {

    }

    zoomIn(): void {

    }

    zoomOut(): void {

    }

    createMarkerSetLayer(options: LiveAtlasMarkerSet): LiveAtlasMarkerSetLayer {

    }

    hackGetLeaflet(): LiveAtlasLeafletMap {

    }
}