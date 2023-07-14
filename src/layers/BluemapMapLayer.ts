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

import AbstractMapLayer from "@/layers/AbstractMapLayer";
import {MapViewer} from "bluemap/MapViewer";
import {Map as BluemapMap} from "bluemap/BlueMap";

//FIXME: Can this class be merged since it is just a regular layer now?
export default class BluemapMapLayer extends AbstractMapLayer {
    private readonly viewer: MapViewer;
    protected readonly map: BluemapMap;

    constructor(viewer: MapViewer, map: BluemapMap) {
        super();

        this.viewer = viewer;
		this.map = map;
    }

    enable(): void {
        console.log(this.map);
        this.viewer.switchMap(this.map);
    }

    disable(): void {
        this.map.unload();
    }

    toggle(): void {
        this.viewer.map === this.map ? this.map.unload() : this.viewer.switchMap(this.map);
    }

    destroy(): void {
        this.disable();
        this.map.dispose();
    }
}