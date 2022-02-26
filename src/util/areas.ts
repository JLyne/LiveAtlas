/*
 * Copyright 2022 James Lyne
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

import {LatLngExpression} from "leaflet";
import LiveAtlasPolyline from "@/leaflet/vector/LiveAtlasPolyline";
import LiveAtlasPolygon from "@/leaflet/vector/LiveAtlasPolygon";
import {Coordinate, LiveAtlasAreaMarker} from "@/index";
import {arePointsEqual, createPopup, isStyleEqual, tooltipOptions} from "@/util/paths";

/**
 * Creates a {@link LiveAtlasPolyline} or {@link LiveAtlasPolygon} with the given options
 * @param {LiveAtlasAreaMarker} options Marker options
 * @param {Function} converter Function for projecting the marker location onto the map
 * @return The created LiveAtlasPolyline or LiveAtlasPolygon
 */
export const createAreaLayer = (options: LiveAtlasAreaMarker, converter: Function): LiveAtlasPolyline | LiveAtlasPolygon => {
	const outline = !options.style.fillOpacity || (options.style.fillOpacity <= 0),
		points = options.points.map(projectPointsMapCallback, converter) as LatLngExpression[] | LatLngExpression[][],
		area = outline ? new LiveAtlasPolyline(points, options) : new LiveAtlasPolygon(points, options);

	if (options.popup) {
		area.bindPopup(() => createPopup(options, 'AreaPopup'));
	}

	if (options.tooltip) {
		area.bindTooltip(() => options.tooltipHTML || options.tooltip, tooltipOptions);
	}

	return area;
};

/**
 * Updates or creates a {@link LiveAtlasPolyline} or {@link LiveAtlasPolygon} with the given options
 * @param {LiveAtlasPolyline | LiveAtlasPolygon} area Optional existing LiveAtlasPolyline or LiveAtlasPolygon
 * @param {LiveAtlasAreaMarker} options Marker options
 * @param {Function} converter Function for projecting the marker location onto the map
 * @returns The created or updated LiveAtlasPolyline or LiveAtlasPolygon
 */
export const updateAreaLayer = (area: LiveAtlasPolyline | LiveAtlasPolygon | undefined, options: LiveAtlasAreaMarker, converter: Function): LiveAtlasPolyline | LiveAtlasPolygon => {
	if (!area) {
		return createAreaLayer(options, converter);
	}

	const points = options.points.map(projectPointsMapCallback, converter) as LatLngExpression[] | LatLngExpression[][],
		oldPoints = area.getLatLngs();

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
	area.closeTooltip();
	area.unbindTooltip();

	if (options.popup) {
		area.bindPopup(() => createPopup(options, 'AreaPopup'));
	}

	if (options.tooltip) {
		area.bindTooltip(() => options.tooltipHTML || options.tooltip, tooltipOptions);
	}

	if(dirty) {
		area.redraw();
	}

	return area;
};

/**
 * Recursively applies the given function to the given array of {@link Coordinate}
 * @param point
 * @see {@link createAreaLayer}
 * @see {@link updateAreaLayer}
 * @returns Projected points as {@link LatLngExpression}
 * @private
 */
const projectPointsMapCallback = function(this: Function, point: Coordinate | Coordinate[] | Coordinate[][]): LatLngExpression | LatLngExpression[] {
	if(Array.isArray(point)) {
		return point.map(projectPointsMapCallback, this) as LatLngExpression[];
	} else {
		// @ts-ignore
		return this(point);
	}
};

/**
 * Calculates shape points for the given individual x y and z arrays
 * @param {number[]} x Array of x coordinates
 * @param {[number, number]} y Array of y coordinates
 * @param {number[]} z Array of z coordinates
 * @param outline Whether the resulting points will be used in a shape without a fill color
 * @returns Array of Coordinates
 */
export const getPoints = (x: number[], y: [number, number], z: number[], outline: boolean): Coordinate[] | Coordinate[][] => {
	if (x.length === 2) {	/* Only 2 points */
		if (y[0] === y[1]) {
			return get2DBoxPoints(x, y, z, outline);
		} else {
			return get3DBoxPoints(x, y, z);
		}
	} else {
		if (y[0] === y[1]) {
			return get2DShapePoints(x, y, z, outline);
		} else {
			return get3DShapePoints(x, y, z);
		}
	}
};

/**
 * Calculates cuboid points for the given individual x y and z arrays
 * @param {number[]} x Array of x coordinates
 * @param {[number, number]} y Array of y coordinates
 * @param {number[]} z Array of z coordinates
 * @private
 * @see {@link getPoints}
 * @returns Array of Coordinates
 */
const get3DBoxPoints = (x: number[], y: [number, number], z: number[]): Coordinate[][] => {
	const maxX = x[0],
		minX = x[1],
		maxY = y[0],
		minY = y[1],
		maxZ = z[0],
		minZ = z[1];

	return [
		[
			{x: minX, y: minY, z: minZ},
			{x: maxX, y: minY, z: minZ},
			{x: maxX, y: minY, z: maxZ},
			{x: minX, y: minY, z: maxZ}
		], [
			{x: minX, y: maxY, z: minZ},
			{x: maxX, y: maxY, z: minZ},
			{x: maxX, y: maxY, z: maxZ},
			{x: minX, y: maxY, z: maxZ}
		], [
			{x: minX, y: minY, z: minZ},
			{x: minX, y: maxY, z: minZ},
			{x: maxX, y: maxY, z: minZ},
			{x: maxX, y: minY, z: minZ}
		], [
			{x: maxX, y: minY, z: minZ},
			{x: maxX, y: maxY, z: minZ},
			{x: maxX, y: maxY, z: maxZ},
			{x: maxX, y: minY, z: maxZ}
		], [
			{x: minX, y: minY, z: maxZ},
			{x: minX, y: maxY, z: maxZ},
			{x: maxX, y: maxY, z: maxZ},
			{x: maxX, y: minY, z: maxZ}
		], [
			{x: minX, y: minY, z: minZ},
			{x: minX, y: maxY, z: minZ},
			{x: minX, y: maxY, z: maxZ},
			{x: minX, y: minY, z: maxZ}
		]
	];
};

/**
 * Calculates rectangle points for the given individual x y and z arrays
 * @param {number[]} x Array of x coordinates
 * @param {[number, number]} y Array of y coordinates
 * @param {number[]} z Array of z coordinates
 * @param outline Whether the resulting points will be used in a shape without a fill color
 * @private
 * @see {@link getPoints}
 * @returns Array of Coordinates
 */
const get2DBoxPoints = (x: number[], y: [number, number], z: number[], outline: boolean): Coordinate[] => {
	const maxX = x[0],
		minX = x[1],
		minY = y[1],
		maxZ = z[0],
		minZ = z[1];

	if (outline) {
		return [
			{x: minX, y: minY, z: minZ},
			{x: maxX, y: minY, z: minZ},
			{x: maxX, y: minY, z: maxZ},
			{x: minX, y: minY, z: maxZ},
			{x: minX, y: minY, z: minZ}
		];
	} else {
		return [
			{x: minX, y: minY, z: minZ},
			{x: maxX, y: minY, z: minZ},
			{x: maxX, y: minY, z: maxZ},
			{x: minX, y: minY, z: maxZ}
		];
	}
};

/**
 * Calculates non-cuobidal 3d shape points for the given individual x y and z arrays
 * @param {number[]} x Array of x coordinates
 * @param {[number, number]} y Array of y coordinates
 * @param {number[]} z Array of z coordinates
 * @private
 * @see {@link getPoints}
 * @returns Array of Coordinates
 */
const get3DShapePoints = (x: number[], y: [number, number], z: number[]): Coordinate[][] => {
	const toplist = [],
		botlist = [],
		polylist = [];

	for (let i = 0; i < x.length; i++) {
		toplist[i] = {x: x[i], y: y[0], z: z[i]};
		botlist[i] = {x: x[i], y: y[1], z: z[i]};
	}

	for (let i = 0; i < x.length; i++) {
		polylist[i] = [
			toplist[i],
			botlist[i],
			botlist[(i + 1) % x.length],
			toplist[(i + 1) % x.length],
		];
	}

	polylist[x.length] = botlist;
	polylist[x.length + 1] = toplist;

	return polylist;
};

/**
 * Calculates non-quadrilateral 2d shape points for the given individual x y and z arrays
 * @param {number[]} x Array of x coordinates
 * @param {[number, number]} y Array of y coordinates
 * @param {number[]} z Array of z coordinates
 * @param outline Whether the resulting points will be used in a shape without a fill color
 * @private
 * @see {@link getPoints}
 * @returns Array of Coordinates
 */
const get2DShapePoints = (x: number[], y: [number, number], z: number[], outline: boolean): Coordinate[] => {
	const points = [];

	for (let i = 0; i < x.length; i++) {
		points[i] = {x: x[i], y: y[1], z: z[i]};
	}

	if (outline) {
		points.push(points[0]);
	}

	return points;
};
