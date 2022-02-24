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

import {LeafletMouseEvent, Marker} from "leaflet";
import {GenericIcon} from "@/leaflet/icon/GenericIcon";
import {GenericMarker} from "@/leaflet/marker/GenericMarker";
import {LiveAtlasPointMarker} from "@/index";

export const createPointLayer = (options: LiveAtlasPointMarker, converter: Function): Marker => {
	const marker = new GenericMarker(converter(options.location), options);

	marker.on('click', (e: LeafletMouseEvent) => {
		if(!e.target.getPopup() || e.target.isPopupOpen()) {
			e.target._map.panTo(e.target.getLatLng());
		}
	});

	if(options.popup) {
		marker.bindPopup(() => createPopup(options));
	}

	return marker;
};

export const updatePointLayer = (marker: Marker | undefined, options: LiveAtlasPointMarker, converter: Function): Marker => {
	if (!marker) {
		return createPointLayer(options, converter);
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
				iconUrl: options.iconUrl,
				label: options.tooltipHTML || options.tooltip,
				iconSize: options.iconSize,
				isHtml: !!options.tooltipHTML,
			});
		}
	}

	marker.closePopup();
	marker.unbindPopup();

	if(options.popup) {
		marker.bindPopup(() => createPopup(options));
	}

	return marker;
};

const createPopup = (options: LiveAtlasPointMarker) => {
	const popup = document.createElement('span');

	if (options.popup) {
		popup.classList.add('MarkerPopup');
		popup.insertAdjacentHTML('afterbegin', options.popup);
	}

	return popup;
}
