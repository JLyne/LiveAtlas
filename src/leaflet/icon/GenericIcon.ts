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

import {PointExpression, Icon, DomUtil, point, BaseIconOptions, PointTuple, Layer, LayerOptions, Util} from 'leaflet';
import {useStore} from "@/store";

export interface GenericIconOptions extends BaseIconOptions {
	icon: string;
	label: string;
	isHtml?: boolean;
	showLabel?: boolean;
	iconSize: PointTuple;
    className?: string;
}

const markerContainer: HTMLDivElement = document.createElement('div');
markerContainer.className = 'marker';

const markerIcon: HTMLImageElement = document.createElement('img');
markerIcon.className = 'marker__icon';

const markerLabel: HTMLSpanElement = document.createElement('span');
markerLabel.className = 'marker__label';

const defaultOptions: GenericIconOptions = {
	icon: 'default',
	label: '',
	iconSize: [16, 16],
	popupAnchor: [0, 0],
	iconAnchor: [0, 0],
	tooltipAnchor: [0, 0],
	isHtml: false,
	className: '',
}

export class GenericIcon extends Layer implements Icon<GenericIconOptions> {
	declare options: GenericIconOptions;
	declare createShadow: (oldIcon?: HTMLElement) => HTMLElement;

	private _image?: HTMLImageElement;
	private _label?: HTMLSpanElement;
	private _container?: HTMLDivElement;
	private _labelCreated: boolean = false;
	private _onHover: EventListener = () => {
		this.createLabel();
	};

	constructor(options: GenericIconOptions) {
		super(options as LayerOptions);
		Util.setOptions(this, Object.assign(defaultOptions, options));
	}

	createIcon(oldIcon: HTMLElement) {
		if (oldIcon) {
			DomUtil.remove(oldIcon);
		}

		const div = markerContainer.cloneNode(false) as HTMLDivElement,
			url = useStore().state.currentMapProvider!.getMarkerIconUrl(this.options.icon),
			size = point(this.options.iconSize as PointExpression);

		this._image = markerIcon.cloneNode(false) as HTMLImageElement;

		this._image.width = size.x;
		this._image.height = size.y;
		this._image.src = url;

		div.appendChild(this._image);
		div.style.marginLeft = `${-(size.x / 2)}px`;
		div.style.marginTop = `${-(size.y / 2)}px`;
		div.style.height = `${size.y}px`;
		div.classList.add('marker', 'leaflet-marker-icon');

		if(this.options.className) {
			div.classList.add(this.options.className);
		}

		//Create label lazily on hover
		this._image.addEventListener('mouseover', this._onHover);

		this._container = div;

		return div;
	}

	createLabel() {
		if(!this._container || this._labelCreated) {
			return;
		}

		this._image?.removeEventListener('mouseover', this._onHover);

		const size = point(this.options.iconSize as PointExpression),
			sizeClass = [size.x, size.y].join('x');

		this._label = markerLabel.cloneNode(false) as HTMLSpanElement;

		this._label.classList.add(/*'markerName_' + set.id,*/ `marker__label--${sizeClass}`);

		if (this.options.isHtml) {
			this._label.innerHTML = this.options.label;
		} else {
			this._label.textContent = this.options.label;
		}

		this._container!.appendChild(this._label);
		this._labelCreated = true;
	}

	removeLabel() {
		if(!this._container || !this._labelCreated) {
			return;
		}

		this._label!.remove();
		this._label = undefined;
		this._labelCreated = false;
	}

	update(options: GenericIconOptions) {
		if(this._image && options.icon !== this.options.icon) {
			this.options.icon = options.icon;
			this._image!.src = useStore().state.currentMapProvider!.getMarkerIconUrl(this.options.icon);
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
