/*
 * Copyright 2023 James Lyne
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

import {LatLngExpression} from "leaflet";
import {Coordinate, LiveAtlasLineMarker} from "@/index";
import LiveAtlasPolyline from "@/leaflet/vector/LiveAtlasPolyline";
import {createPopup, tooltipOptions} from "@/leaflet/util/paths";

/**
 * Creates a {@link LiveAtlasPolyline} with the given options
 * @param {LiveAtlasLineMarker} options Marker options
 * @param {Function} converter Function for projecting the marker location onto the map
 * @return The created LiveAtlasPolyline
 */
export const createLineLayer = (options: LiveAtlasLineMarker, converter: Function): LiveAtlasPolyline => {
	const points = options.points.map(projectPointsMapCallback, converter),
		line = new LiveAtlasPolyline(points, options);

	if(options.popup) {
		line.bindPopup(() => createPopup(options, 'LinePopup'));
	}

	if (options.tooltip) {
		line.bindTooltip(() => options.tooltipHTML || options.tooltip, tooltipOptions);
	}

	return line;
};

/**
 * Updates or creates a {@link LiveAtlasPolyline} with the given options
 * @param {?LiveAtlasPolyline} line Optional existing LiveAtlasPolyline
 * @param {LiveAtlasLineMarker} options Marker options
 * @param {Function} converter Function for projecting the marker location onto the map
 * @returns The created or updated LiveAtlasPolyline
 */
export const updateLineLayer = (line: LiveAtlasPolyline | undefined, options: LiveAtlasLineMarker, converter: Function): LiveAtlasPolyline => {
	if (!line) {
		return createLineLayer(options, converter);
	}

	line.closePopup();
	line.unbindPopup();
	line.closeTooltip();
	line.unbindTooltip();

	if (options.popup) {
		line.bindPopup(() => createPopup(options, 'AreaPopup'));
	}

	if (options.tooltip) {
		line.bindTooltip(() => options.tooltipHTML || options.tooltip, tooltipOptions);
	}

	line.setStyle(options.style);
	line.setLatLngs(options.points.map(projectPointsMapCallback, converter));
	line.redraw();

	return line;
}

/**
 * Recursively applies the given function to the given array of {@link Coordinate}
 * @param point
 * @see {@link createAreaLayer}
 * @see {@link updateAreaLayer}
 * @private
 */
const projectPointsMapCallback = function(point: Coordinate): LatLngExpression {
	if(Array.isArray(point)) {
		return projectPointsMapCallback(point);
	} else {
		// @ts-ignore
		return this(point);
	}
};

/**
 * Calculates line points for the given individual x y and z arrays
 * @param {number[]} x Array of x coordinates
 * @param {[number, number]} y Array of y coordinates
 * @param {number[]} z Array of z coordinates
 * @returns Array of Coordinates
 */
export const getLinePoints = (x: number[], y: number[], z: number[]): Coordinate[] => {
	const points = [];

	for(let i = 0; i < x.length; i++) {
		points.push({x: x[i], y: y[i], z: z[i]});
	}

	return points;
};
