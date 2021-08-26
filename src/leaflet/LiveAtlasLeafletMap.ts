/*
 * Copyright 2021 James Lyne
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

import {Map, DomUtil, MapOptions} from 'leaflet';
import LayerManager from "@/leaflet/layer/LayerManager";

export default class LiveAtlasLeafletMap extends Map {
	declare _controlCorners: any;
	declare	_controlContainer?: HTMLElement;
	declare	_container?: HTMLElement;

	private readonly _layerManager: LayerManager;

	constructor(element: string | HTMLElement, options?: MapOptions) {
		super(element, options);

		this._layerManager = Object.seal(new LayerManager(this));
	}

	getLayerManager(): LayerManager {
		return this._layerManager;
	}

	// noinspection JSUnusedGlobalSymbols
	_initControlPos() {
		const corners: any = this._controlCorners = {},
			l = 'leaflet-',
			container = this._controlContainer =
				DomUtil.create('div', l + 'control-container', this._container);

		function createCorner(vSide: string, hSide: string) {
			const className = l + vSide + ' ' + l + hSide;

			corners[`${vSide}${hSide}`] = DomUtil.create('div', className, container);
		}

		createCorner('top', 'left');
		createCorner('top', 'right');
		createCorner('top', 'center');
		createCorner('bottom', 'center');
		createCorner('bottom', 'left');
		createCorner('bottom', 'right');
	}
}
