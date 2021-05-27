/*
 * Copyright 2020 James Lyne
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
import {useStore} from "@/store";
import {MutationTypes} from "@/store/mutation-types";
import {watch} from "@vue/runtime-core";

import "@/assets/icons/chat.svg";

export class ChatControl extends Control {
	// @ts-ignore
	options: ControlOptions

	constructor(options: ControlOptions) {
		super(options);
	}

	onAdd() {
		const chatButton = DomUtil.create('button', 'leaflet-control-chat') as HTMLButtonElement;

		chatButton.type = 'button';
		chatButton.title = useStore().state.messages.chatTitle;
		chatButton.innerHTML = `
		<svg class="svg-icon">
		  <use xlink:href="#chat" />
		</svg>`;

		chatButton.addEventListener('click', e => {
			useStore().commit(MutationTypes.TOGGLE_UI_ELEMENT_VISIBILITY, 'chat');
			e.stopPropagation();
			e.preventDefault();
		});

		watch(useStore().state.ui.visibleElements, (newValue) => {
			chatButton.classList.toggle('active', newValue.has('chat'));
		});

		return chatButton;
	}
}
