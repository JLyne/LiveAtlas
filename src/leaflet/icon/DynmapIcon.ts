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

import {DivIconOptions, PointExpression, Icon, DivIcon, DomUtil, point} from 'leaflet';

export interface DynmapIconOptions extends DivIconOptions {
	icon: string;
	label: string;
	showLabel: boolean;
	isHtml?: boolean;
}

const markerContainer: HTMLDivElement = document.createElement('div');
markerContainer.className = 'marker';

const markerIcon: HTMLImageElement = document.createElement('img');
markerIcon.className = 'marker__icon';

const markerLabel: HTMLSpanElement = document.createElement('span');
markerLabel.className = 'marker__label';

export class DynmapIcon extends DivIcon {
	static defaultOptions: DynmapIconOptions = {
		icon: 'default',
		label: '',
		iconSize: [16, 16],
		showLabel: false,
		isHtml: false,
		className: '',
	};

	// @ts-ignore
	options: DynmapIconOptions;

	constructor(options: DynmapIconOptions) {
		super(Object.assign(DynmapIcon.defaultOptions, options));
	}

	createIcon(oldIcon: HTMLElement) {
		if (oldIcon) {
			DomUtil.remove(oldIcon);
		}

		const div = markerContainer.cloneNode(false) as HTMLDivElement,
			img = markerIcon.cloneNode(false) as HTMLImageElement,
			label = markerLabel.cloneNode(false) as HTMLSpanElement,

			url = `${window.config.url.markers}_markers_/${this.options.icon}.png`,
			size = point(this.options.iconSize as PointExpression);

		const sizeClass = [size.x, size.y].join('x');

		img.width = size.x;
		img.height = size.y;
		img.src = url;

		if(this.options.showLabel) {
			label.classList.add('marker__label--show');
		}

		label.classList.add(/*'markerName_' + set.id,*/ `marker__label--${sizeClass}`);

		if (this.options.isHtml) {
			label.insertAdjacentHTML('afterbegin', this.options.label);
		} else {
			label.textContent = this.options.label;
		}

		// @ts-ignore
		Icon.prototype._setIconStyles.call(this, div, 'icon');

		div.appendChild(img);
		div.appendChild(label);
		div.classList.add('marker');

		if(this.options.className) {
			div.classList.add(this.options.className);
		}

		return div;
	}
}
