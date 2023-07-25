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
    protected mapControls: MapControls | undefined;
    protected freeFlightControls: FreeFlightControls | undefined;

    protected loadingCheckFrame: number = 0;

    protected lastZoom: number = 0;
    protected lastX: number = 0;
    protected lastY: number = 0;
    protected lastZ: number = 0;


    constructor() {
        super();
    }

    init(element: HTMLElement): void {
        this.events = element;
        this.mapViewer = new MapViewer(element, this.events);

        this.mapControls = new MapControls(this.mapViewer.renderer.domElement, element);
        this.freeFlightControls = new FreeFlightControls(this.mapViewer.renderer.domElement);
        this.store.commit(MutationTypes.SET_MAP_STATE, {zoomReversed: true});

        this.mapViewer!.controlsManager.controls = this.mapControls;

        this.startStateChecks();
    }

    private startStateChecks() {
        this.loadingCheckFrame = requestAnimationFrame(() => this.stateCheck());
    }

    private stopStateChecks() {
        if(this.loadingCheckFrame) {
            cancelAnimationFrame(this.loadingCheckFrame);
        }
    }

    private stateCheck() {
        //Map is loading if it has currentlyLoading in any of its tileManagers
        //Can't use bluemapMapTileLoad event for this, as it fires before currentlyLoading updates and doesn't fire for errors
        const loading = !this.mapViewer?.map?.isLoaded
            || !!this.mapViewer.map.hiresTileManager.currentlyLoading
            || !!this.mapViewer.map.lowresTileManager.filter(manager => !!manager.currentlyLoading).length,

            mapPosition = this.mapViewer!.controlsManager.position,
            mapZoom = this.mapViewer!.controlsManager.distance,
            storePosition = this.store.state.currentMapState.location,
            storeZoom = this.store.state.currentMapState.zoom;

        if(loading != this.store.state.currentMapState.loading) {
            this.store.commit(MutationTypes.SET_MAP_STATE, {loading});
        }

        //Zoom has finished changing if it matches previous frame but doesn't match the store
        if(mapZoom === this.lastZoom && Math.round(this.lastZoom) !== storeZoom) {
            console.log('Zoom changed');
            this.store.commit(MutationTypes.SET_MAP_STATE, {
                zoom: Math.round(this.lastZoom),
            });
        }

        //Position has finished changing if it matches previous frame but doesn't match the store
        if((mapPosition.x === this.lastX && this.lastX !== storePosition.x)
            || (mapPosition.y === this.lastY && this.lastY !== storePosition.y)
            || (mapPosition.z === this.lastZ && this.lastZ !== storePosition.z)) {
            console.log('Position changed');
            this.store.commit(MutationTypes.SET_MAP_STATE, {
                location: {
                    x: this.lastX,
                    y: this.lastY,
                    z: this.lastZ
                }
            });
        }

        this.lastZoom = this.mapViewer!.controlsManager.distance;
        this.lastX = mapPosition.x;
        this.lastY = mapPosition.y;
        this.lastZ = mapPosition.z;

        this.loadingCheckFrame = requestAnimationFrame(() => this.stateCheck());
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
    }

    getMapViewer(): MapViewer | undefined {
        return this.mapViewer;
    }

    destroy(): void {
        super.destroy();

        if(this.mapViewer) {
            //FIXME: ???
            this.stopStateChecks();
        }
    }

    focus(): void {

    }

    setView(target: LiveAtlasMapViewTarget): void {
        if (this.mapViewer) {
            const controls = this.mapViewer!.controlsManager;

            if (controls.controls && controls.controls.stopFollowingPlayerMarker) {
                controls.controls.stopFollowingPlayerMarker();
            }

            controls.position.copy(target.location);

            if(target.zoom) {
                controls.distance = target.zoom;
            }
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