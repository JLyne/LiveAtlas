/*
 * Copyright 2022 James Lyne
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

import {Layer} from "leaflet";
import {LiveAtlasLayerDefinition} from "@/index";
import {MutationTypes} from "@/store/mutation-types";
import {useStore} from "@/store";

export const sortLayers = (layers: Map<Layer, LiveAtlasLayerDefinition>) => {
	return Array.from(layers.values()).sort((entry1, entry2) => {
		if (entry1.position != entry2.position) {
			return entry1.position - entry2.position;
		}

		return ((entry1.name < entry2.name) ? -1 : ((entry1.name > entry2.name) ? 1 : 0));
	});
}

export const toggleLayer = (layer: Layer) => {
	const store = useStore();

	if(!store.state.layers.has(layer)) {
		return;
	}
	const enabled = !store.state.layers.get(layer)!.enabled;

	store.commit(MutationTypes.UPDATE_LAYER, {
		layer: layer,
		options: {enabled}
	});
}
