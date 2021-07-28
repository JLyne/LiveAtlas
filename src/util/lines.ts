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

import LiveAtlasPolyline from "@/leaflet/vector/LiveAtlasPolyline";
import {Coordinate, LiveAtlasLine} from "@/index";
import {LatLngExpression} from "leaflet";

export const createLine = (options: LiveAtlasLine, converter: Function): LiveAtlasPolyline => {
	const points = options.points.map(projectPointsMapCallback, converter),
		line = new LiveAtlasPolyline(points, options);

	if(options.label) {
		line.bindPopup(() => createPopup(options));
	}

	return line;
};

export const updateLine = (line: LiveAtlasPolyline | undefined, options: LiveAtlasLine, converter: Function): LiveAtlasPolyline => {
	if (!line) {
		return createLine(options, converter);
	}

	line.closePopup();
	line.unbindPopup();
	line.bindPopup(() => createPopup(options));
	line.setStyle(options.style);
	line.setLatLngs(options.points.map(projectPointsMapCallback, converter));
	line.redraw();

	return line;
}

const projectPointsMapCallback = function(point: Coordinate): LatLngExpression {
	if(Array.isArray(point)) {
		return projectPointsMapCallback(point);
	} else {
		// @ts-ignore
		return this(point);
	}
};

export const createPopup = (options: LiveAtlasLine) => {
	const popup = document.createElement('span');

	if (options.popupContent) {
		popup.classList.add('LinePopup');
		popup.insertAdjacentHTML('afterbegin', options.popupContent);
	} else if (options.isHTML) {
		popup.classList.add('LinePopup');
		popup.insertAdjacentHTML('afterbegin', options.label);
	} else {
		popup.textContent = options.label;
	}

	return popup;
}

export const getLinePoints = (x: number[], y: number[], z: number[]): Coordinate[] => {
	const points = [];

	for(let i = 0; i < x.length; i++) {
		points.push({x: x[i], y: y[i], z: z[i]});
	}

	return points;
};
