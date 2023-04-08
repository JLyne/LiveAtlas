/*
 * Copyright 2022 James Lyne
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

import {Control, ControlOptions, DomEvent, DomUtil} from 'leaflet';
import {watch} from "vue";
import {useStore} from "@/store";
import {MutationTypes} from "@/store/mutation-types";

import "@/assets/icons/chat.svg";

/**
 * Leaflet map control providing a chat button which opens the chatbox on click
 */
export class ChatControl extends Control {
	declare options: ControlOptions

	constructor(options: ControlOptions) {
		super(options);
	}

	onAdd() {
		const store = useStore(),
			chatButton = DomUtil.create('button',
				'leaflet-control-bottom leaflet-control-button leaflet-control-chat') as HTMLButtonElement;

		chatButton.type = 'button';
		chatButton.title = store.state.messages.chatTitle;
		chatButton.innerHTML = `
		<svg class="svg-icon">
		  <use xlink:href="#icon--chat" />
		</svg>`;

		chatButton.addEventListener('click', e => {
			store.commit(MutationTypes.TOGGLE_UI_ELEMENT_VISIBILITY, 'chat');
			e.stopPropagation();
			e.preventDefault();
		});

		//Open chat on ArrowRight from button
		DomEvent.on(chatButton,'keydown', (e: Event) => {
			if((e as KeyboardEvent).key === 'ArrowRight') {
				store.commit(MutationTypes.SET_UI_ELEMENT_VISIBILITY, {element: 'chat', state: true});
			}
		});

		watch(store.state.ui.visibleElements, (newValue) => {
			chatButton.setAttribute('aria-expanded', newValue.has('chat').toString());
		});

		return chatButton;
	}
}
