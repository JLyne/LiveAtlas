/*
 * Copyright 2020 James Lyne
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

import {Map, Layer} from 'leaflet';
import {LiveAtlasLayerControl} from "@/leaflet/control/LiveAtlasLayerControl";
import {watch} from "vue";
import {useStore} from "@/store";
import {computed} from "@vue/runtime-core";

export default class LayerManager {
	private readonly layerControl: LiveAtlasLayerControl;
	private readonly map: Map;

	constructor(map: Map) {
		const showControl = computed(() => useStore().state.components.layerControl);
		this.map = map;
		this.layerControl = new LiveAtlasLayerControl({}, {},{
			position: 'topleft',
		});

		if(showControl.value) {
			this.map.addControl(this.layerControl);
		}

		watch(showControl, (show) => {
			if(show) {
				this.map.addControl(this.layerControl);
			} else {
				this.map.removeControl(this.layerControl);
			}
		})
	}

	addLayer(layer: Layer, showInControl: boolean, name: string, position: number) {
		this.map.addLayer(layer);

		if(showInControl) {
			if(this.layerControl.hasLayer(layer)) {
				this.layerControl.removeLayer(layer);
			}

			if(typeof position !== 'undefined') {
				this.layerControl.addOverlayAtPosition(layer, name, position);
			} else {
				this.layerControl.addOverlay(layer, name);
			}
		}
	}

	addHiddenLayer(layer: Layer, name: string, position: number) {
		if(this.layerControl.hasLayer(layer)) {
			this.layerControl.removeLayer(layer);
		}

		if(typeof position !== 'undefined') {
			this.layerControl.addOverlayAtPosition(layer, name, position);
		} else {
			this.layerControl.addOverlay(layer, name);
		}
	}

	removeLayer(layer: Layer) {
		this.map.removeLayer(layer);
		this.layerControl.removeLayer(layer);
	}
}
