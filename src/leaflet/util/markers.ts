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

import {ComputedRef, computed, watch} from "vue";
import {Layer} from "leaflet";
import {
	LiveAtlasAreaMarker,
	LiveAtlasCircleMarker,
	LiveAtlasLineMarker,
	LiveAtlasMarker,
	LiveAtlasPointMarker
} from "@/index";
import {DynmapMarkerUpdate} from "@/dynmap";
import {useStore} from "@/store";
import {ActionTypes} from "@/store/action-types";
import {createCircleLayer, updateCircleLayer} from "@/leaflet/util/circles";
import {createPointLayer, updatePointLayer} from "@/leaflet/util/points";
import {createAreaLayer, updateAreaLayer} from "@/leaflet/util/areas";
import {createLineLayer, updateLineLayer} from "@/leaflet/util/lines";
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

let idleCallback = 0;
let pendingUpdates: ComputedRef;

const updateHandlers: Set<LiveAtlasMarkerUpdateCallback> = new Set();
const setUpdateHandlers: { [key:string]: Set<LiveAtlasMarkerUpdateCallback>} = {};

/**
 * Starts handling of pending marker updates
 */
export const startUpdateHandling = () => {
	const store = useStore();

	pendingUpdates = computed(() => store.state.pendingMarkerUpdates.length);

	watch(pendingUpdates, (newValue, oldValue) => {
		if(newValue && newValue > 0 && oldValue === 0 && !idleCallback) {
			idleCallback = requestIdleCallback((deadline) => handlePendingUpdates(deadline), {
				timeout: 3000,
			}); //FIXME: Safari
		}
	});
}

/**
 * Stops handling of pending marker updates
 */
export const stopUpdateHandling = () => {
	if(idleCallback) {
		cancelIdleCallback(idleCallback);
		idleCallback = 0;
	}
}

/**
 * Registers the given callback as a global handler for marker updates
 * @param {LiveAtlasMarkerUpdateCallback} callback The callback
 */
export const registerUpdateHandler = (callback: LiveAtlasMarkerUpdateCallback) => {
	updateHandlers.add(callback);
}

/**
 * Unregisters the given callback as a global handler for marker updates
 * @param {LiveAtlasMarkerUpdateCallback} callback The callback
 */
export const unregisterUpdateHandler = (callback: LiveAtlasMarkerUpdateCallback) => {
	updateHandlers.delete(callback);
}

/**
 * Registers the given callback as a handler for marker updates in the given marker set
 * @param {LiveAtlasMarkerUpdateCallback} callback The callback
 * @param {string} set: The marker set id
 */
export const registerSetUpdateHandler = (callback: LiveAtlasMarkerUpdateCallback, set: string) => {
	if(!setUpdateHandlers[set]) {
		setUpdateHandlers[set] = new Set();
	}

	setUpdateHandlers[set].add(callback);
}

/**
 * Unregisters the given callback as a handler for marker updates in the given marker set
 * @param {LiveAtlasMarkerUpdateCallback} callback The callback
 * @param {string} set: The marker set id
 */
export const unregisterSetUpdateHandler = (callback: LiveAtlasMarkerUpdateCallback, set: string) => {
	if(!setUpdateHandlers[set]) {
		return;
	}

	setUpdateHandlers[set].delete(callback);
}

/**
 * Handles pending marker updates, if any exist
 * Up to 10 updates will be taken from the list and the appropriate registered update handlers will be called
 * If further updates remain, an animation frame will be scheduled for further calls
 * @private
 */
const handlePendingUpdates = async (deadline: IdleDeadline) => {
	const store = useStore();

	while(deadline.timeRemaining() > 2) {
		const updates = await store.dispatch(ActionTypes.POP_MARKER_UPDATES, 10);

		if(!updates) {
			break;
		}

		for(const update of updates) {
			updateHandlers.forEach(callback => callback(update));

			if(setUpdateHandlers[update.set]) {
				setUpdateHandlers[update.set].forEach(callback => callback(update));
			}
		}
	}

	if(pendingUpdates.value) {
		idleCallback = requestIdleCallback((deadline) => handlePendingUpdates(deadline), {
			timeout: 3000
		}); //FIXME: Safari
	} else {
		idleCallback = 0;
	}
};

/**
 * Creates the appropriate type of marker layer for the given {@link LiveAtlasMarker}
 * @param {LiveAtlasMarker} options Marker options
 * @param {Function} converter Function for projecting the marker location onto the map
 * @returns The created layer
 * @see createPointLayer
 * @see createAreaLayer
 * @see createCircleLayer
 * @see createLineLayer
 */
export const createMarkerLayer = (options: LiveAtlasMarker, converter: Function): Layer => {
	switch(options.type) {
		case LiveAtlasMarkerType.POINT:
			return createPointLayer(options as LiveAtlasPointMarker, converter);
		case LiveAtlasMarkerType.AREA:
			return createAreaLayer(options as LiveAtlasAreaMarker, converter);
		case LiveAtlasMarkerType.LINE:
			return createLineLayer(options as LiveAtlasLineMarker, converter);
		case LiveAtlasMarkerType.CIRCLE:
			return createCircleLayer(options as LiveAtlasCircleMarker, converter);
	}
}

/**
 * Updates or creates an appropriate type of marker layer with the given options
 * @param {?Layer} marker Optional existing marker layer to update
 * @param {?LiveAtlasMarker} options Marker options
 * @param {Function} converter Function for projecting the marker location onto the map
 * @returns The created layer
 * @see updatePointLayer
 * @see updateAreaLayer
 * @see updateCircleLayer
 * @see updateLineLayer
 */
export const updateMarkerLayer = (marker: Layer | undefined, options: LiveAtlasMarker, converter: Function): Layer => {
	switch(options.type) {
		case LiveAtlasMarkerType.POINT:
			return updatePointLayer(marker as GenericMarker, options as LiveAtlasPointMarker, converter);
		case LiveAtlasMarkerType.AREA:
			return updateAreaLayer(marker as LiveAtlasPolygon | LiveAtlasPolyline, options as LiveAtlasAreaMarker, converter);
		case LiveAtlasMarkerType.LINE:
			return updateLineLayer(marker as LiveAtlasPolyline, options as LiveAtlasLineMarker, converter);
		case LiveAtlasMarkerType.CIRCLE:
			return updateCircleLayer(marker as LiveAtlasPolyline | LiveAtlasPolygon, options as LiveAtlasCircleMarker, converter);
	}
}
