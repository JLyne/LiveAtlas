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

import {Direction, LatLngExpression, PathOptions} from "leaflet";
import {LiveAtlasPathMarker} from "@/index";

export const tooltipOptions = {
	direction: 'top' as Direction,
	sticky: true,
	opacity: 1.0,
	interactive: false,
};

/**
 * Determines if the 2 given arrays of {@link LatLngExpression} are equal by comparing the JSON serialised representations
 * @param {LatLngExpression | LatLngExpression[] | LatLngExpression[][] | LatLngExpression[][][]} oldPoints Points to compare
 * @param {LatLngExpression | LatLngExpression[] | LatLngExpression[][] | LatLngExpression[][][]} newPoints Other points to compare
 * @return Whether both arrays of points are considered equal
 */
export const arePointsEqual = (oldPoints: LatLngExpression | LatLngExpression[] | LatLngExpression[][] | LatLngExpression[][][],
						newPoints: LatLngExpression | LatLngExpression[] | LatLngExpression[][] | LatLngExpression[][][]) => {
	return JSON.stringify(oldPoints) === JSON.stringify(newPoints);
}

/**
 * Determines if the 2 given {@link PathOptions} are equal by comapring their properties
 * @param {PathOptions} oldStyle PathOptions to compare
 * @param {PathOptions} newStyle Other PathOptions to compare
 * @return Whether both PathOptions are considered equal
 */
export const isStyleEqual = (oldStyle: PathOptions, newStyle: PathOptions) => {
	return oldStyle && newStyle
		&& (oldStyle.color === newStyle.color)
		&& (oldStyle.weight === newStyle.weight)
		&& (oldStyle.opacity === newStyle.opacity)
		&& (oldStyle.fillColor === newStyle.fillColor)
		&& (oldStyle.fillOpacity === newStyle.fillOpacity)
}

/**
 * Creates a popup element for the given marker
 * @param {LiveAtlasPointMarker} options Marker options
 * @param {string} className Classname to add to the popup element
 * @returns {HTMLSpanElement} The marker element
 */
export const createPopup = (options: LiveAtlasPathMarker, className: string): HTMLElement => {
	const popup = document.createElement('span');

	if(options.isPopupHTML) {
		popup.classList.add(className);
		popup.insertAdjacentHTML('afterbegin', options.popup as string);
	} else {
		popup.textContent = options.popup as string;
	}

	return popup;
};
