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

import {Control, ControlOptions, DomUtil, Map} from 'leaflet';
import {useStore} from "@/store";
import '@/assets/icons/link.svg';
import ClipboardJS from 'clipboard';

export class LinkControl extends Control {
	// @ts-ignore
	options: ControlOptions

	private _map ?: Map;

	constructor(options: ControlOptions) {
		super(options);
	}

	onAdd(map: Map) {
		const linkButton = DomUtil.create('button', 'leaflet-control-link') as HTMLButtonElement;

		linkButton.type = 'button';
		linkButton.title = 'Copy link to current location';
		linkButton.innerHTML = `
		<svg class="svg-icon" aria-hidden="true">
		  <use xlink:href="#link" />
		</svg>`;

		new ClipboardJS(linkButton, {
			text: () => window.location.href.split("#")[0] + useStore().getters.url,
		});

		return linkButton;
	}
}
