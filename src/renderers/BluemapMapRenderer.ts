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
import {FreeFlightControls, MapControls, MapViewer} from "bluemap/BlueMap";
import {LiveAtlasMapViewTarget} from "@/index";
import {MutationTypes} from "@/store/mutation-types";

export default class BluemapMapRenderer extends AbstractMapRenderer {
    protected events: HTMLElement | undefined;
    protected mapViewer: MapViewer | undefined;
    protected _mapControls: MapControls | undefined;
    protected freeFlightControls: FreeFlightControls | undefined;

    protected loadingCheckFrame: number = 0;

    constructor() {
        super();
    }

    init(element: HTMLElement): void {
        this.events = element;
        this.mapViewer = new MapViewer(element, this.events);

        this._mapControls = new MapControls(this.mapViewer.renderer.domElement, element);
        this.freeFlightControls = new FreeFlightControls(this.mapViewer.renderer.domElement);
        this.store.commit(MutationTypes.SET_MAP_STATE, {zoomReversed: true});

        this.resetCamera();
        this.startLoadingCheck();
    }

    private startLoadingCheck() {
        this.loadingCheckFrame = requestAnimationFrame(() => this.loadingCheck());
    }

    private stopLoadingCheck() {
        if(this.loadingCheckFrame) {
            cancelAnimationFrame(this.loadingCheckFrame);
        }
    }

    private loadingCheck() {
        //Check if current map has any pending tile loads in any of its tileManagers
        //Can't use bluemapMapTileLoad event here as it fires before currentlyLoading updates, and doesn't fire for errors
        const loading = !this.mapViewer?.map?.isLoaded
            || !!this.mapViewer.map.hiresTileManager.currentlyLoading
            || !!this.mapViewer.map.lowresTileManager.filter(manager => !!manager.currentlyLoading).length;

        if(loading != this.store.state.currentMapState.loading) {
            this.store.commit(MutationTypes.SET_MAP_STATE, {loading});
        }

        this.loadingCheckFrame = requestAnimationFrame(() => this.loadingCheck());
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
            this.stopLoadingCheck();
        }
    }

    focus(): void {

    }

    setView(target: LiveAtlasMapViewTarget): void {
        if (this.mapViewer && this.mapViewer.map) {
            const controls = this.mapViewer!.controlsManager;

            if (controls.controls && controls.controls.stopFollowingPlayerMarker) {
                controls.controls.stopFollowingPlayerMarker();
            }

            controls.position.copy(target.location);
        }
    }

    zoomIn(): void {
        if (this.mapViewer) {
            this.mapViewer.controlsManager.controls.mouseZoom.deltaZoom -= 3;
        }
    }

    zoomOut(): void {
        if (this.mapViewer) {
            this.mapViewer.controlsManager.controls.mouseZoom.deltaZoom += 3;
        }
    }

    setZoomLimits(min: number, max: number): void {
        this.store.commit(MutationTypes.SET_MAP_STATE, {
            maxZoom: max,
            minZoom: min,
        });
    }
}