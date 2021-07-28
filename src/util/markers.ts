/*
 * Copyright 2021 James Lyne
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

import {LeafletMouseEvent, Marker} from "leaflet";
import {GenericIcon} from "@/leaflet/icon/GenericIcon";
import {GenericMarker} from "@/leaflet/marker/GenericMarker";
import {LiveAtlasMarker} from "@/index";

export const createMarker = (options: LiveAtlasMarker, converter: Function): Marker => {
	const marker = new GenericMarker(converter(options.location), {
		icon: new GenericIcon({
			icon: options.icon,
			label: options.label,
			iconSize: options.dimensions,
			isHtml: options.isLabelHTML,
		}),
		maxZoom: options.maxZoom,
		minZoom: options.minZoom,
	});

	marker.on('click', (e: LeafletMouseEvent) => {
		e.target._map.panTo(e.target.getLatLng());
	});

	if(options.popupContent) {
		marker.bindPopup(() => createPopup(options));
	}

	return marker;
};

export const updateMarker = (marker: Marker | undefined, options: LiveAtlasMarker, converter: Function): Marker => {
	if (!marker) {
		return createMarker(options, converter);
	}

	const oldLocation = marker.getLatLng(),
		newLocation = converter(options.location);

	if(!oldLocation.equals(newLocation)) {
		marker.setLatLng(newLocation);
	}

	if(marker instanceof GenericMarker) {
		const icon = marker.getIcon();

		if(icon && icon instanceof GenericIcon) {
			icon.update({
				icon: options.icon,
				label: options.label,
				iconSize: options.dimensions,
				isHtml: options.isLabelHTML,
			});
		}
	}

	marker.closePopup();
	marker.unbindPopup();

	if(options.popupContent) {
		marker.bindPopup(() => createPopup(options));
	}

	return marker;
};

const createPopup = (options: LiveAtlasMarker) => {
	const popup = document.createElement('span');

	if (options.popupContent) {
		popup.classList.add('MarkerPopup');
		popup.insertAdjacentHTML('afterbegin', options.popupContent);
	}

	return popup;
}
