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

import {DynmapCircle} from "@/dynmap";
import {LatLngExpression} from "leaflet";
import DynmapPolyline from "@/leaflet/vector/DynmapPolyline";
import DynmapPolygon from "@/leaflet/vector/DynmapPolygon";

export const createCircle = (options: DynmapCircle, converter: Function): DynmapPolyline | DynmapPolygon => {
	const outline = !options.style.fillOpacity || (options.style.fillOpacity <= 0),
		points = getCirclePoints(options, converter, outline),
		circle = outline ? new DynmapPolyline(points, {
			...options.style,
			minZoom: options.minZoom,
			maxZoom: options.maxZoom,
		}) : new DynmapPolygon(points, {
			...options.style,
			minZoom: options.minZoom,
			maxZoom: options.maxZoom,
		});

	if(options.label) {
		circle.bindPopup(() => createPopup(options));
	}

	return circle;
};

export const updateCircle = (circle: DynmapPolyline | DynmapPolygon | undefined, options: DynmapCircle, converter: Function): DynmapPolyline | DynmapPolygon => {
	const outline = (options.style && options.style.fillOpacity && (options.style.fillOpacity <= 0)) as boolean,
		points = getCirclePoints(options, converter, outline);

	if (!circle) {
		return createCircle(options, converter);
	}

	circle.closePopup();
	circle.unbindPopup();
	circle.bindPopup(() => createPopup(options));
	circle.setStyle(options.style);
	circle.setLatLngs(points);
	circle.redraw();

	return circle;
}

export const createPopup = (options: DynmapCircle) => {
	const popup = document.createElement('span');

	if (options.popupContent) {
		popup.classList.add('CirclePopup');
		popup.insertAdjacentHTML('afterbegin', options.popupContent);
	} else if (options.isHTML) {
		popup.classList.add('CirclePopup');
		popup.insertAdjacentHTML('afterbegin', options.label);
	} else {
		popup.textContent = options.label;
	}

	return popup;
}

export const getCirclePoints = (options: DynmapCircle, converter: Function, outline: boolean): LatLngExpression[] => {
	const points = [];

	for(let i = 0; i < 360; i++) {
		const rad = i * Math.PI / 180.0,
			x = options.radius[0] * Math.sin(rad) + options.location.x,
			z = options.radius[1] * Math.cos(rad) + options.location.z;

		points.push(converter(x, options.location.y, z));
	}

	if(outline && points.length) {
		points.push(points[0]);
	}

	return points;
};
