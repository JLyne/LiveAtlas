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

import {PointExpression, Icon, DomUtil, point, BaseIconOptions, PointTuple, Layer, LayerOptions, Util} from 'leaflet';

export interface GenericIconOptions extends BaseIconOptions {
	iconUrl: string;
	label: string;
	isHtml?: boolean;
	showLabel?: boolean;
	iconSize?: PointTuple;
	iconAnchor?: PointTuple;
    className?: string;
}

const markerContainer: HTMLDivElement = document.createElement('div');
markerContainer.className = 'marker';

const markerIcon: HTMLImageElement = document.createElement('img');
markerIcon.className = 'marker__icon';

const markerLabel: HTMLSpanElement = document.createElement('span');
markerLabel.className = 'marker__label';

const defaultOptions: GenericIconOptions = {
	iconUrl: 'default',
	label: '',
	iconSize: undefined,
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

		const div = markerContainer.cloneNode(false) as HTMLDivElement;
		this._image = markerIcon.cloneNode(false) as HTMLImageElement;

		div.appendChild(this._image);
		div.classList.add('marker', 'leaflet-marker-icon');

		if(this.options.className) {
			div.classList.add(this.options.className);
		}

		//Create label lazily on hover
		this._image.addEventListener('mouseover', this._onHover);

		this._container = div;
		this.update();

		return div;
	}

	createLabel() {
		if(!this._container || this._labelCreated) {
			return;
		}

		this._image?.removeEventListener('mouseover', this._onHover);
		this._label = markerLabel.cloneNode(false) as HTMLSpanElement;

		this.update();

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

	update(options?: GenericIconOptions) {
		if(options) {
			this.options.iconUrl = options.iconUrl;
			this.options.iconSize = options.iconSize;
			this.options.iconAnchor = options.iconAnchor;
			this.options.isHtml = options.isHtml;
			this.options.label = options.label;
		}

		if(!this._container) {
			return;
		}

		this._container!.classList.toggle('marker--auto-size', !this.options.iconSize);

		if(this._image) {
			const iconSize = this.options.iconSize ? point(this.options.iconSize as PointExpression) : undefined,
				iconAnchor = this.options.iconAnchor ? point(this.options.iconAnchor as PointExpression) : undefined,
				marginLeft = iconAnchor ? -iconAnchor.x : iconSize ? -(iconSize.x / 2) : 0,
				marginTop = iconAnchor ? -iconAnchor.y : iconSize ? -(iconSize.y / 2) : 0;

			if(iconSize) {
				this._image.width = iconSize.x;
				this._image.height = iconSize.y;
			} else {
				this._image.removeAttribute('width');
				this._image.removeAttribute('height');
			}

			this._container.style.marginLeft = marginLeft ? `${marginLeft}px` : '';
			this._container.style.marginTop = marginTop ? `${marginTop}px` : '';
			this._container.style.height = iconSize ? `${iconSize.y}px` : 'auto';

			if(this._image.src !== this.options.iconUrl) {
				this._image.src = this.options.iconUrl;
			}
		}

		if(this._label) {
			if (this.options.isHtml && this._label.innerHTML !== this.options.label) {
				this._label.innerHTML = this.options.label;
			} else if(this._label.textContent !== this.options.label) {
				this._label.textContent = this.options.label;
			}
		}
	}
}
