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

import {
	LiveAtlasMapLayer,
	LiveAtlasMapProvider, LiveAtlasMapRenderer, LiveAtlasMarkerSet, LiveAtlasMarkerSetLayer, LiveAtlasOverlay,
	LiveAtlasWorldDefinition
} from "@/index";
import {useStore} from "@/store";
import LiveAtlasMapDefinition from "@/model/LiveAtlasMapDefinition";

export default abstract class AbstractMapProvider implements LiveAtlasMapProvider {
	protected readonly store = useStore();
	protected readonly renderer: LiveAtlasMapRenderer;
	protected name: string;
	protected config: any;

	protected constructor(name: string, config: any, renderer: LiveAtlasMapRenderer) {
		this.name = name;
		this.config = config;
		this.renderer = renderer;
	}

	abstract loadServerConfiguration(): Promise<void>;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async populateWorld(world: LiveAtlasWorldDefinition): Promise<void> {}
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async populateMap(map: LiveAtlasMapDefinition): Promise<void> {}

	startUpdates(): void {}
	stopUpdates(): void {}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	sendChatMessage(message: string) {
		throw new Error('Provider does not support chat');
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async login(data: any) {
		throw new Error('Provider does not support logging in');
	}

	async logout() {
		throw new Error('Provider does not support logging out');
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async register(data: any) {
		throw new Error('Provider does not support registration');
	}

	protected static async fetch(url: string, options: any) {
		let response;

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

		return response;
	}

	protected static async fetchText(url: string, options: any) {
		const response = await this.fetch(url, options);
		let text;

		try {
			text = await response.text();
		} catch(e) {
			if(e instanceof DOMException && e.name === 'AbortError') {
				console.warn(`Request aborted (${url}`);
			}

			throw e;
		}

		return text;
	}

	protected static async fetchJSON(url: string, options: any) {
		const response = await this.fetch(url, options);
		let json;

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

	protected static async getText(url: string, signal: AbortSignal) {
		return AbstractMapProvider.fetchText(url, {signal, credentials: 'include'});
	}

	protected static async getJSON(url: string, signal: AbortSignal) {
		return AbstractMapProvider.fetchJSON(url, {signal, credentials: 'include'});
	}

	abstract getBaseMapLayer(options: LiveAtlasMapDefinition): LiveAtlasMapLayer;
	abstract getOverlayMapLayer(options: LiveAtlasOverlay): LiveAtlasMapLayer;
	abstract getMarkerSetLayer(set: LiveAtlasMarkerSet): LiveAtlasMarkerSetLayer;
	getRenderer(): LiveAtlasMapRenderer {
		return this.renderer;
	}
}
