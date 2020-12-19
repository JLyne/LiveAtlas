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
import {DynmapLayerControl} from "@/leaflet/control/DynmapLayerControl";

export default class LayerManager {
	private showControl: boolean = false;
	private readonly layerControl: DynmapLayerControl;
	private readonly map: Map;

	constructor(map: Map, showControl?: boolean) {
		this.showControl = showControl || this.showControl;
		this.map = map;
		this.layerControl = new DynmapLayerControl({}, {},{
			position: 'topleft',
		});

		if(this.showControl) {
			this.map.addControl(this.layerControl);
		}
	}

	//TODO: Respect position
	addLayer(layer: Layer, showInControl: boolean, name: string, position: number) {
		this.map.addLayer(layer);

		if(showInControl) {
			if(this.layerControl.hasLayer(layer)) {
				this.layerControl.removeLayer(layer);
			}

			this.layerControl.addOverlay(layer, name);
		}
	}

	addHiddenLayer(layer: Layer, name: string, position: number) {
		this.layerControl.addOverlay(layer, name);
	}

	removeLayer(layer: Layer) {
		this.map.removeLayer(layer);
		this.layerControl.removeLayer(layer);
	}
}