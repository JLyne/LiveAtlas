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

import {Control, ControlOptions, DomUtil} from 'leaflet';

export interface LogoControlOptions extends ControlOptions {
	url?: string;
	image?: string;
	text: string;
}

export class LogoControl extends Control {
	// @ts-ignore
	options: LogoControlOptions;

	constructor(options: LogoControlOptions) {
		super(options);
	}

	onAdd(map: L.Map) {
		const container = DomUtil.create('div', 'leaflet-control-logo');
		let link;

		if (this.options.url) {
			link = DomUtil.create('a', '', container) as HTMLAnchorElement;
			link.href = this.options.url;
		}

		if (this.options.image) {
			const image = DomUtil.create('img', '', link) as HTMLImageElement;
			image.src = this.options.image;
			image.alt = this.options.text;
		} else {
			container.textContent = this.options.text;
		}

		return container;
	}
}
