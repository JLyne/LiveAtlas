/*
 * Copyright 2021 James Lyne
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
import {useStore} from "@/store";
import {MutationTypes} from "@/store/mutation-types";
import {watch} from "@vue/runtime-core";

import "@/assets/icons/login.svg";
import "@/assets/icons/logout.svg";
import {computed} from "vue";
import {ActionTypes} from "@/store/action-types";
import {notify} from "@kyvg/vue3-notification";
import LiveAtlasLeafletMap from "@/leaflet/LiveAtlasLeafletMap";

export class LoginControl extends Control {
	declare _map: LiveAtlasLeafletMap;
	declare options: ControlOptions;

	private readonly store = useStore();
	private readonly loggedIn = computed(() => this.store.state.loggedIn);
	private readonly _button: HTMLButtonElement;

	constructor(options: ControlOptions) {
		super(options);

		this._button = DomUtil.create('button',
				'leaflet-control-bottom leaflet-control-button leaflet-control-login') as HTMLButtonElement;

		this._button.type = 'button';

		this._button.addEventListener('click', async e => {
			e.stopPropagation();
			e.preventDefault();

			await this.handleClick();
		});

		//Open login on ArrowRight from button
		DomEvent.on(this._button,'keydown', async (e: Event) => {
			if ((e as KeyboardEvent).key === 'ArrowRight') {
				e.stopPropagation();
				e.preventDefault();

				await this.handleClick();
			}
		});

		watch(this.loggedIn, () => {
			this.update();
		});

		const visibleModal = computed(() => this.store.state.ui.visibleModal);

		watch(visibleModal, (newValue, oldValue) => {
			this._button.setAttribute('aria-expanded', (newValue === 'login').toString());

			if(this._map && !newValue && oldValue === 'login') {
				this._button.focus();
			}
		});

		this.update();
	}

	onAdd() {
		return this._button;
	}

	private update() {
		this._button.title = this.loggedIn.value
			? this.store.state.messages.logoutTitle : this.store.state.messages.loginTitle;
		this._button.innerHTML = `
			<svg class="svg-icon">
			  <use xlink:href="#icon--${this.loggedIn.value ? 'logout' : 'login'}" />
			</svg>`;
	}

	private async handleClick() {
		const logoutSuccess = computed(() => this.store.state.messages.logoutSuccess),
			logoutError = computed(() => this.store.state.messages.logoutErrorUnknown);

		if (this.loggedIn.value) {
			try {
				await this.store.dispatch(ActionTypes.LOGOUT, undefined);
				notify(logoutSuccess.value);
			} catch(e) {
				notify(logoutError.value);
			}
		} else {
			this.store.commit(MutationTypes.SHOW_UI_MODAL, 'login');
		}
	}
}
