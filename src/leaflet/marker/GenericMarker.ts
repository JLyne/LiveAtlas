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

import {MarkerOptions, Marker, LatLngExpression, Icon, Map} from 'leaflet';
import {LiveAtlasPointMarker} from "@/index";
import {GenericIcon} from "@/leaflet/icon/GenericIcon";

export interface GenericMarkerOptions extends MarkerOptions {
	icon: GenericIcon;
	minZoom?: number;
	maxZoom?: number;
}

export class GenericMarker extends Marker {
	declare options: GenericMarkerOptions;

	constructor(latLng: LatLngExpression, options: LiveAtlasPointMarker) {
		super(latLng, {});

		this.options.icon = new GenericIcon({
			icon: options.icon,
			label: options.tooltipHTML || options.tooltip,
			iconSize: options.dimensions,
			isHtml: !!options.tooltipHTML,
		});

		this.options.maxZoom = options.maxZoom;
		this.options.minZoom = options.maxZoom;
	}

	// noinspection JSUnusedGlobalSymbols
	_resetZIndex() {
		//Don't change the zindex
	}

	getIcon(): Icon.Default {
		return this.options.icon as Icon.Default;
	}

	createLabel(): void {
		this.options.icon.createLabel();
	}

	removeLabel(): void {
		this.options.icon.createLabel();
	}

	onRemove(map: Map): this {
		this.options.icon.removeLabel();

		super.onRemove(map);

		return this;
	}
}
