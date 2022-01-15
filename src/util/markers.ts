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

export type LiveAtlasMarkerUpdateCallback = ((update: DynmapMarkerUpdate) => void);

export enum LiveAtlasMarkerType {
	POINT,
	AREA,
	LINE,
	CIRCLE
}

let updateFrame = 0;
let pendingUpdates: ComputedRef;

const setHandlers: { [key:string]: Set<LiveAtlasMarkerUpdateCallback>} = {};
const typeHandlers: { [key:string]: Map<LiveAtlasMarkerType, Set<LiveAtlasMarkerUpdateCallback>>} = {};

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
	if(!setHandlers[set]) {
		setHandlers[set] = new Set();
	}

	setHandlers[set].add(callback);
}

export const registerTypeUpdateHandler = (callback: LiveAtlasMarkerUpdateCallback, set: string, type: LiveAtlasMarkerType) => {
	if(!typeHandlers[set]) {
		typeHandlers[set] = new Map();
	}

	if(typeHandlers[set].has(type)) {
		typeHandlers[set].get(type)!.add(callback);
	} else {
		typeHandlers[set].set(type, new Set([callback]));
	}
}

export const unregisterUpdateHandler = (callback: LiveAtlasMarkerUpdateCallback, set: string) => {
	if(!setHandlers[set]) {
		return;
	}

	setHandlers[set].delete(callback);
}

export const unregisterTypeUpdateHandler = (callback: LiveAtlasMarkerUpdateCallback, set: string, type: LiveAtlasMarkerType) => {
	if(typeHandlers[set]) {
		return;
	}

	if(typeHandlers[set].has(type)) {
		typeHandlers[set].get(type)!.delete(callback);
	}
}

const handlePendingUpdates = async () => {
	const store = useStore(),
		updates = await store.dispatch(ActionTypes.POP_MARKER_UPDATES, 10);

	for(const update of updates) {
		if(setHandlers[update.set]) {
			setHandlers[update.set].forEach(callback => callback(update));
		}

		if(typeHandlers[update.set] && typeHandlers[update.set].has(update.type)) {
			typeHandlers[update.set].get(update.type)!.forEach(callback => callback(update));
		}
	}

	if(pendingUpdates.value) {
		// eslint-disable-next-line no-unused-vars
		updateFrame = requestAnimationFrame(() => handlePendingUpdates());
	} else {
		updateFrame = 0;
	}
};
