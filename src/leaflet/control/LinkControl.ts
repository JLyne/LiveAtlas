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

import {Control, ControlOptions, DomUtil} from 'leaflet';
import {useStore} from "@/store";
import '@/assets/icons/link.svg';
import { toClipboard } from '@soerenmartius/vue3-clipboard';
import {notify} from "@kyvg/vue3-notification";
import {computed} from "@vue/runtime-core";

export class LinkControl extends Control {
	declare options: ControlOptions

	constructor(options: ControlOptions) {
		super(options);
	}

	onAdd() {
		const store = useStore(),
			linkButton = DomUtil.create('button',
				'leaflet-control-button leaflet-control-link') as HTMLButtonElement,
			copySuccessMessage = computed(() => store.state.messages.copyToClipboardSuccess),
			copyErrorMessage = computed(() => store.state.messages.copyToClipboardError);

		linkButton.type = 'button';
		linkButton.title = store.state.messages.linkTitle;
		linkButton.innerHTML = `
		<svg class="svg-icon" aria-hidden="true">
		  <use xlink:href="#icon--link" />
		</svg>`;

		linkButton.addEventListener('click', e => {
			e.preventDefault();
			toClipboard(window.location.href.split("#")[0] + store.getters.url).then(() => {
				notify(copySuccessMessage.value);
			}).catch((e) => {
				notify({ type: 'error', text: copyErrorMessage.value });
				console.error('Error copying to clipboard', e);
			});

		});

		return linkButton;
	}
}
