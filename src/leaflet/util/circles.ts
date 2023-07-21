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
import {LiveAtlasCircleMarker} from "@/index";
import LiveAtlasPolyline from "@/leaflet/vector/LiveAtlasPolyline";
import LiveAtlasPolygon from "@/leaflet/vector/LiveAtlasPolygon";
import {createPopup, tooltipOptions} from "@/leaflet/util/paths";

/**
 * Creates a {@link LiveAtlasPolygon} with the given options
 * @param {LiveAtlasCircleMarker} options Marker options
 * @param {Function} converter Function for projecting the marker location onto the map
 * @return The created LiveAtlasPolygon
 */
export const createCircleLayer = (options: LiveAtlasCircleMarker, converter: Function): LiveAtlasPolyline | LiveAtlasPolygon => {
	const outline = !options.style.fillOpacity || (options.style.fillOpacity <= 0),
		points = getCirclePoints(options, converter, outline),
		circle = outline ? new LiveAtlasPolyline(points, options) : new LiveAtlasPolygon(points, options);

	if(options.popup) {
		circle.bindPopup(() => createPopup(options, 'CirclePopup'));
	}

	if (options.tooltip) {
		circle.bindTooltip(() => options.tooltipHTML || options.tooltip, tooltipOptions);
	}

	return circle;
};

/**
 * Updates or creates a {@link LiveAtlasPolyline} with the given options
 * @param {?LiveAtlasPolyline | LiveAtlasPolygon | undefined} circle Optional existing LiveAtlasPolyline or LiveAtlasPolygons
 * @param {LiveAtlasCircleMarker} options Marker options
 * @param {Function} converter Function for projecting the marker location onto the map
 * @returns The created or updated LiveAtlasPolyline or LiveAtlasPolygon
 */
export const updateCircleLayer = (circle: LiveAtlasPolyline | LiveAtlasPolygon | undefined, options: LiveAtlasCircleMarker, converter: Function): LiveAtlasPolyline | LiveAtlasPolygon => {
	if (!circle) {
		return createCircleLayer(options, converter);
	}

	const outline = (options.style && options.style.fillOpacity && (options.style.fillOpacity <= 0)) as boolean;

	circle.closePopup();
	circle.unbindPopup();
	circle.closeTooltip();
	circle.unbindTooltip();

	if (options.popup) {
		circle.bindPopup(() => createPopup(options, 'AreaPopup'));
	}

	if (options.tooltip) {
		circle.bindTooltip(() => options.tooltipHTML || options.tooltip, tooltipOptions);
	}

	circle.setStyle(options.style);
	circle.setLatLngs(getCirclePoints(options, converter, outline));
	circle.redraw();

	return circle;
}

/**
 * Calculates projected points for the given {@link LiveAtlasCircleMarker}
 * @param {LiveAtlasCircleMarker} options LiveAtlasCircleMarker to calculate points for
 * @param {Function} converter Function for projecting the points
 * @param outline Whether the resulting points will be used in a shape without a fill color
 * @returns Array of projected points
 */
export const getCirclePoints = (options: LiveAtlasCircleMarker, converter: Function, outline: boolean): LatLngExpression[] => {
	const points = [];

	for(let i = 0; i < 360; i++) {
		const rad = i * Math.PI / 180.0,
			x = options.radius[0] * Math.sin(rad) + options.location.x,
			z = options.radius[1] * Math.cos(rad) + options.location.z;

		points.push(converter({x, y:options.location.y, z}));
	}

	if(outline && points.length) {
		points.push(points[0]);
	}

	return points;
};
