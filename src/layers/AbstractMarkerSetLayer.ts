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

import {LiveAtlasMarker, LiveAtlasMarkerSet, LiveAtlasMarkerSetLayer} from "@/index";
import {DynmapMarkerUpdate} from "@/dynmap";
import {registerSetUpdateHandler, unregisterSetUpdateHandler} from "@/util/markers";
import {watch, WatchStopHandle} from "vue";
import {nonReactiveState} from "@/store/state";

export default abstract class AbstractMarkerSetLayer implements LiveAtlasMarkerSetLayer {
    protected readonly markerSet: LiveAtlasMarkerSet;
    protected readonly setUpdateHandler;
    private readonly _markerSetUnwatch: WatchStopHandle;

    protected constructor(set: LiveAtlasMarkerSet) {
        this.markerSet = set;
        this.setUpdateHandler = this.updateMarker.bind(this);

        this._markerSetUnwatch = watch(set, newValue => {
            this.update(newValue);
        }, {deep: true});
    }

    protected addAllMarkers() {
        nonReactiveState.markers.get(this.markerSet.id)!.forEach((marker: LiveAtlasMarker) => {
            this.addMarker(marker);
		});
    }

    add() {
        registerSetUpdateHandler(this.setUpdateHandler, this.markerSet.id);
    }

    remove() {
        unregisterSetUpdateHandler(this.setUpdateHandler, this.markerSet.id);
        this._markerSetUnwatch();
    }

    abstract toggle(): void;

    abstract addMarker(marker: LiveAtlasMarker): void;
    abstract removeMarker(id: string): void;
    abstract update(update: LiveAtlasMarkerSet): void;
    abstract updateMarker(update: DynmapMarkerUpdate): void;
}