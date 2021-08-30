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

import {
	HeadQueueEntry,
	LiveAtlasMapProvider,
	LiveAtlasServerDefinition,
	LiveAtlasWorldDefinition
} from "@/index";
import {useStore} from "@/store";
import {computed, watch} from "@vue/runtime-core";
import {WatchStopHandle} from "vue";

export default abstract class MapProvider implements LiveAtlasMapProvider {
	protected readonly store = useStore();
	protected readonly config: LiveAtlasServerDefinition;
	private readonly currentWorldUnwatch: WatchStopHandle;

	protected constructor(config: LiveAtlasServerDefinition) {
		this.config = config;
		const currentWorld = computed(() => this.store.state.currentWorld);

		this.currentWorldUnwatch = watch(currentWorld, (newValue) => {
			if (newValue) {
				this.populateWorld(newValue);
			}
		});
	}

	abstract loadServerConfiguration(): Promise<void>;
	abstract populateWorld(world: LiveAtlasWorldDefinition): Promise<void>;

	abstract startUpdates(): void;
	abstract stopUpdates(): void;

	abstract getPlayerHeadUrl(head: HeadQueueEntry): string;
    abstract getTilesUrl(): string;
    abstract getMarkerIconUrl(icon: string): string;

    sendChatMessage(message: string) {
		throw new Error('Provider does not support chat');
	}

	async login(data: any) {
		throw new Error('Provider does not support logging in');
	}

	async logout() {
		throw new Error('Provider does not support logging out');
	}

	async register(data: any) {
		throw new Error('Provider does not support registration');
	}

	destroy() {
		this.currentWorldUnwatch();
	}

	protected static async fetchJSON(url: string, options: any) {
		let response, json;

		try {
			response = await fetch(url, options);
		} catch(e) {
			if(e instanceof DOMException && e.name === 'AbortError') {
				console.warn(`Request aborted (${url}`);
				throw e;
			} else {
				console.error(e);
			}

			throw new Error(`Network request failed`);
		}

		if (!response.ok) {
			throw new Error(`Network request failed (${response.statusText || 'Unknown'})`);
		}

		try {
			json = await response.json();
		} catch(e) {
			if(e instanceof DOMException && e.name === 'AbortError') {
				console.warn(`Request aborted (${url}`);
				throw e;
			} else {
				throw new Error('Request returned invalid json');
			}
		}

		return json;
	}

	protected static async getJSON(url: string, signal: AbortSignal) {
		return MapProvider.fetchJSON(url, {signal, credentials: 'include'});
	}
}
