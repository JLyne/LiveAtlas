/*
 * Copyright 2022 James Lyne
 *
 * Some portions of this file were taken from https://github.com/webbukkit/dynmap.
 * These portions are Copyright 2020 Dynmap Contributors.
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

import {useStore} from "@/store";
import {ActionTypes} from "@/store/action-types";
import {DynmapMarkerUpdate} from "@/dynmap";
import {computed, watch} from "@vue/runtime-core";
import {ComputedRef} from "@vue/reactivity";
import {
	LiveAtlasAreaMarker,
	LiveAtlasCircleMarker,
	LiveAtlasLineMarker,
	LiveAtlasMarker,
	LiveAtlasPointMarker
} from "@/index";
import {Layer} from "leaflet";
import {createCircle, updateCircle} from "@/util/circles";
import {createPointMarker, updatePointMarker} from "@/util/points";
import {createArea, updateArea} from "@/util/areas";
import {createLine, updateLine} from "@/util/lines";
import {GenericMarker} from "@/leaflet/marker/GenericMarker";
import LiveAtlasPolygon from "@/leaflet/vector/LiveAtlasPolygon";
import LiveAtlasPolyline from "@/leaflet/vector/LiveAtlasPolyline";

export type LiveAtlasMarkerUpdateCallback = ((update: DynmapMarkerUpdate) => void);

export enum LiveAtlasMarkerType {
	POINT,
	AREA,
	LINE,
	CIRCLE
}

let updateFrame = 0;
let pendingUpdates: ComputedRef;

const updateHandlers: { [key:string]: Set<LiveAtlasMarkerUpdateCallback>} = {};

export const startUpdateHandling = () => {
	const store = useStore();

	pendingUpdates = computed(() => store.state.pendingMarkerUpdates.length);

	watch(pendingUpdates, (newValue, oldValue) => {
		if(newValue && newValue > 0 && oldValue === 0 && !updateFrame) {
			updateFrame = requestAnimationFrame(() => handlePendingUpdates());
		}
	});
}

export const stopUpdateHandling = () => {
	if(updateFrame) {
		cancelAnimationFrame(updateFrame);
		updateFrame = 0;
	}
}

export const registerUpdateHandler = (callback: LiveAtlasMarkerUpdateCallback, set: string) => {
	if(!updateHandlers[set]) {
		updateHandlers[set] = new Set();
	}

	updateHandlers[set].add(callback);
}

export const unregisterUpdateHandler = (callback: LiveAtlasMarkerUpdateCallback, set: string) => {
	if(!updateHandlers[set]) {
		return;
	}

	updateHandlers[set].delete(callback);
}

const handlePendingUpdates = async () => {
	const store = useStore(),
		updates = await store.dispatch(ActionTypes.POP_MARKER_UPDATES, 10);

	for(const update of updates) {
		if(updateHandlers[update.set]) {
			updateHandlers[update.set].forEach(callback => callback(update));
		}
	}

	if(pendingUpdates.value) {
		// eslint-disable-next-line no-unused-vars
		updateFrame = requestAnimationFrame(() => handlePendingUpdates());
	} else {
		updateFrame = 0;
	}
};

export const createMarker = (options: LiveAtlasMarker, converter: Function): Layer => {
	switch(options.type) {
		case LiveAtlasMarkerType.POINT:
			return createPointMarker(options as LiveAtlasPointMarker, converter);
		case LiveAtlasMarkerType.AREA:
			return createArea(options as LiveAtlasAreaMarker, converter);
		case LiveAtlasMarkerType.LINE:
			return createLine(options as LiveAtlasLineMarker, converter);
		case LiveAtlasMarkerType.CIRCLE:
			return createCircle(options as LiveAtlasCircleMarker, converter);
	}
}

export const updateMarker = (marker: Layer | undefined, options: LiveAtlasMarker, converter: Function): Layer => {
	switch(options.type) {
		case LiveAtlasMarkerType.POINT:
			return updatePointMarker(marker as GenericMarker, options as LiveAtlasPointMarker, converter);
		case LiveAtlasMarkerType.AREA:
			return updateArea(marker as LiveAtlasPolygon | LiveAtlasPolyline, options as LiveAtlasAreaMarker, converter);
		case LiveAtlasMarkerType.LINE:
			return updateLine(marker as LiveAtlasPolyline, options as LiveAtlasLineMarker, converter);
		case LiveAtlasMarkerType.CIRCLE:
			return updateCircle(marker as LiveAtlasPolyline | LiveAtlasPolygon, options as LiveAtlasCircleMarker, converter);
	}
}
