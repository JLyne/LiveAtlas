/*
 * Copyright 2020 James Lyne
 *
 * Some portions of this file were taken from https://github.com/webbukkit/dynmap.
 * These portions are Copyright 2020 Dynmap Contributors.
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

import {Marker} from "leaflet";
import {DynmapMarker} from "@/dynmap";
import {DynmapIcon} from "@/leaflet/icon/DynmapIcon";
import {DynmapProjection} from "@/leaflet/projection/DynmapProjection";
import {GenericMarker} from "@/leaflet/marker/GenericMarker";

export const createMarker = (options: DynmapMarker, projection: DynmapProjection): Marker => {
	return new GenericMarker(projection.locationToLatLng(options.location), {
		icon: new DynmapIcon({
			icon: options.icon,
			label: options.label,
			iconSize: options.dimensions,
			isHtml: options.isHTML,
		}),
		maxZoom: options.maxZoom,
		minZoom: options.minZoom,
	});
};

export const updateMarker = (marker: Marker | undefined, options: DynmapMarker, projection: DynmapProjection): Marker => {
	if (!marker) {
		return createMarker(options, projection);
	}

	const oldLocation = marker.getLatLng(),
		newLocation = projection.locationToLatLng(options.location);

	if(!oldLocation.equals(newLocation)) {
		marker.setLatLng(newLocation);
	}

	if(marker instanceof GenericMarker) {
		const icon = marker.getIcon();

		if(icon && icon instanceof DynmapIcon) {
			icon.update({
				icon: options.icon,
				label: options.label,
				iconSize: options.dimensions,
				isHtml: options.isHTML,
			});
		}
	}

	return marker;
};
