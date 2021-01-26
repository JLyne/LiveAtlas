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

import {LatLngExpression} from "leaflet";
import {DynmapArea} from "@/dynmap";
import DynmapPolyline from "@/leaflet/vector/DynmapPolyline";
import DynmapPolygon from "@/leaflet/vector/DynmapPolygon";

export const createArea = (options: DynmapArea, converter: Function): DynmapPolyline | DynmapPolygon => {
	const outline = !options.style.fillOpacity || (options.style.fillOpacity <= 0),
		points = getPoints(options, converter, outline),
		area = outline ? new DynmapPolyline(points, {
			...options.style,
			minZoom: options.minZoom,
			maxZoom: options.maxZoom,
		}) : new DynmapPolygon(points, {
			...options.style,
			minZoom: options.minZoom,
			maxZoom: options.maxZoom,
		});

	if (options.label) {
		area.bindPopup(() => createPopup(options));
	}

	return area;
};

export const updateArea = (area: DynmapPolyline | DynmapPolygon | undefined, options: DynmapArea, converter: Function): DynmapPolyline | DynmapPolygon => {
	const outline = (options.style && options.style.fillOpacity && (options.style.fillOpacity <= 0)) as boolean,
		points = getPoints(options, converter, outline);

	if (!area) {
		return createArea(options, converter);
	}

	const oldPoints = area.getLatLngs();
	let dirty = false;

	//Avoid pointless setStyle() redrawing by checking if styles have actually changed
	if(!isStyleEqual(area.options, options.style)) {
		area.setStyle(options.style); //FIXME: Maybe override setStyle to add an option for not redrawing
		dirty = true;
	}

	if(!arePointsEqual(oldPoints.length === 1 ? oldPoints[0] : oldPoints, points)) {
		area.setLatLngs(points);
		dirty = true;
	}

	area.closePopup();
	area.unbindPopup();
	area.bindPopup(() => createPopup(options));

	if(dirty) {
		area.redraw();
	}

	return area;
};

const arePointsEqual = (oldPoints: any, newPoints: any) => {
	return JSON.stringify(oldPoints) === JSON.stringify(newPoints);
}

const isStyleEqual = (oldStyle: any, newStyle: any) => {
	return oldStyle && newStyle
		&& (oldStyle.color === newStyle.color)
		&& (oldStyle.weight === newStyle.weight)
		&& (oldStyle.opacity === newStyle.opacity)
		&& (oldStyle.fillColor === newStyle.fillColor)
		&& (oldStyle.fillOpacity === newStyle.fillOpacity)
}

export const createPopup = (options: DynmapArea): HTMLElement => {
	const popup = document.createElement('span');

	if (options.popupContent) {
		popup.classList.add('AreaPopup');
		popup.insertAdjacentHTML('afterbegin', options.popupContent);
	} else if (options.isHTML) {
		popup.classList.add('AreaPopup');
		popup.insertAdjacentHTML('afterbegin', options.label);
	} else {
		popup.textContent = options.label;
	}

	return popup;
};

export const getPoints = (options: DynmapArea, converter: Function, outline: boolean): LatLngExpression[] | LatLngExpression[][] => {
	if (options.x.length === 2) {	/* Only 2 points */
		if (options.y[0] === options.y[1]) {
			return get2DBoxPoints(options, converter, outline);
		} else {
			return get3DBoxPoints(options, converter);
		}
	} else {
		if (options.y[0] === options.y[1]) {
			return get2DShapePoints(options, converter, outline);
		} else {
			return get3DShapePoints(options, converter);
		}
	}
};

export const get3DBoxPoints = (options: DynmapArea, converter: Function): LatLngExpression[][] => {
	const maxX = options.x[0],
		minX = options.x[1],
		maxY = options.y[0],
		minY = options.y[1],
		maxZ = options.z[0],
		minZ = options.z[1];

	return [
		[
			converter(minX, minY, minZ),
			converter(maxX, minY, minZ),
			converter(maxX, minY, maxZ),
			converter(minX, minY, maxZ)
		], [
			converter(minX, maxY, minZ),
			converter(maxX, maxY, minZ),
			converter(maxX, maxY, maxZ),
			converter(minX, maxY, maxZ)
		], [
			converter(minX, minY, minZ),
			converter(minX, maxY, minZ),
			converter(maxX, maxY, minZ),
			converter(maxX, minY, minZ)
		], [
			converter(maxX, minY, minZ),
			converter(maxX, maxY, minZ),
			converter(maxX, maxY, maxZ),
			converter(maxX, minY, maxZ)
		], [
			converter(minX, minY, maxZ),
			converter(minX, maxY, maxZ),
			converter(maxX, maxY, maxZ),
			converter(maxX, minY, maxZ)
		], [
			converter(minX, minY, minZ),
			converter(minX, maxY, minZ),
			converter(minX, maxY, maxZ),
			converter(minX, minY, maxZ)
		]
	];
};

export const get2DBoxPoints = (options: DynmapArea, converter: Function, outline: boolean): LatLngExpression[] => {
	const maxX = options.x[0],
		minX = options.x[1],
		minY = options.y[1],
		maxZ = options.z[0],
		minZ = options.z[1];

	if (outline) {
		return [
			converter(minX, minY, minZ),
			converter(maxX, minY, minZ),
			converter(maxX, minY, maxZ),
			converter(minX, minY, maxZ),
			converter(minX, minY, minZ)
		];
	} else {
		return [
			converter(minX, minY, minZ),
			converter(maxX, minY, minZ),
			converter(maxX, minY, maxZ),
			converter(minX, minY, maxZ)
		];
	}
};

export const get3DShapePoints = (options: DynmapArea, converter: Function): LatLngExpression[][] => {
	const toplist = [],
		botlist = [],
		polylist = [];

	for (let i = 0; i < options.x.length; i++) {
		toplist[i] = converter(options.x[i], options.y[0], options.z[i]);
		botlist[i] = converter(options.x[i], options.y[1], options.z[i]);
	}

	for (let i = 0; i < options.x.length; i++) {
		const sidelist = [];
		sidelist[0] = toplist[i];
		sidelist[1] = botlist[i];
		sidelist[2] = botlist[(i + 1) % options.x.length];
		sidelist[3] = toplist[(i + 1) % options.x.length];
		polylist[i] = sidelist;
	}

	polylist[options.x.length] = botlist;
	polylist[options.x.length + 1] = toplist;

	return polylist;
};

export const get2DShapePoints = (options: DynmapArea, converter: Function, outline: boolean): LatLngExpression[] => {
	const points = [];

	for (let i = 0; i < options.x.length; i++) {
		points[i] = converter(options.x[i], options.y[1], options.z[i]);
	}

	if (outline) {
		points.push(points[0]);
	}

	return points;
}