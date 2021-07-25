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

import {DivIconOptions, PointExpression, Icon, DivIcon, DomUtil, point} from 'leaflet';
import {useStore} from "@/store";

export interface GenericIconOptions extends DivIconOptions {
	icon: string;
	label: string;
	isHtml?: boolean;
	showLabel?: boolean;
}

const markerContainer: HTMLDivElement = document.createElement('div');
markerContainer.className = 'marker';

const markerIcon: HTMLImageElement = document.createElement('img');
markerIcon.className = 'marker__icon';

const markerLabel: HTMLSpanElement = document.createElement('span');
markerLabel.className = 'marker__label';

export class GenericIcon extends DivIcon {
	static defaultOptions: GenericIconOptions = {
		icon: 'default',
		label: '',
		iconSize: [16, 16],
		isHtml: false,
		className: '',
	};

	// @ts-ignore
	options: GenericIconOptions;
	_image?: HTMLImageElement;
	_label?: HTMLSpanElement;

	constructor(options: GenericIconOptions) {
		super(Object.assign(GenericIcon.defaultOptions, options));
	}

	createIcon(oldIcon: HTMLElement) {
		if (oldIcon) {
			DomUtil.remove(oldIcon);
		}

		const div = markerContainer.cloneNode(false) as HTMLDivElement,
			url = useStore().state.currentMapProvider!.getMarkerIconUrl(this.options.icon),
			size = point(this.options.iconSize as PointExpression);

		this._image = markerIcon.cloneNode(false) as HTMLImageElement;
		this._label = markerLabel.cloneNode(false) as HTMLSpanElement;

		const sizeClass = [size.x, size.y].join('x');

		this._image.width = size.x;
		this._image.height = size.y;
		this._image.src = url;

		this._label.classList.add(/*'markerName_' + set.id,*/ `marker__label--${sizeClass}`);

		if (this.options.isHtml) {
			this._label.innerHTML = this.options.label;
		} else {
			this._label.textContent = this.options.label;
		}

		// @ts-ignore
		Icon.prototype._setIconStyles.call(this, div, 'icon');

		div.appendChild(this._image);
		div.appendChild(this._label);
		div.classList.add('marker');

		if(this.options.className) {
			div.classList.add(this.options.className);
		}

		return div;
	}

	update(options: GenericIconOptions) {
		if(this._image && options.icon !== this.options.icon) {
			this._image!.src = useStore().state.currentMapProvider!.getMarkerIconUrl(this.options.icon);
			this.options.icon = options.icon;
		}

		const iconSize = point(options.iconSize || [16, 16] as PointExpression),
			oldSize = point(this.options.iconSize as PointExpression);

		if(this._image && (iconSize.x !== oldSize.x || iconSize.y !== oldSize.y)) {
			this._image!.width = iconSize.x;
			this._image!.height = iconSize.y;
			this.options.iconSize = options.iconSize;
		}

		if(this._label && (options.label !== this.options.label || options.isHtml !== this.options.isHtml)) {
			if (options.isHtml) {
				this._label!.innerHTML = options.label;
			} else {
				this._label!.textContent = options.label;
			}

			this.options.isHtml = options.isHtml;
			this.options.label = options.label;
		}
	}
}
