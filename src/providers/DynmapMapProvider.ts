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

import {MarkerSet} from "dynmap";
import {
	LiveAtlasMapLayer,
	LiveAtlasMarker,
	LiveAtlasMarkerSet,
	LiveAtlasPlayer,
	LiveAtlasWorldDefinition
} from "@/index";
import {DynmapUrlConfig} from "@/dynmap";
import {MutationTypes} from "@/store/mutation-types";
import {ActionTypes} from "@/store/action-types";
import ChatError from "@/errors/ChatError";
import AbstractMapProvider from "@/providers/AbstractMapProvider";
import {
	buildAreas,
	buildCircles, buildComponents,
	buildLines,
	buildMarkers,
	buildMarkerSet,
	buildMessagesConfig,
	buildServerConfig, buildUpdates, buildWorlds
} from "@/util/dynmap";
import ConfigurationError from "@/errors/ConfigurationError";
import {DynmapTileLayer, DynmapTileLayerOptions} from "@/leaflet/tileLayer/DynmapTileLayer";
import {validateConfigURL} from "@/util";
import LeafletMapProvider from "@/providers/LeafletMapProvider";
import LeafletMapRenderer from "@/renderers/LeafletMapRenderer";
import LiveAtlasMapDefinition from "@/model/LiveAtlasMapDefinition";
import {DynmapProjection} from "@/leaflet/projection/DynmapProjection";

export default class DynmapMapProvider extends LeafletMapProvider {
	declare protected url: DynmapUrlConfig;
	private configurationAbort?: AbortController = undefined;
	private	markersAbort?: AbortController = undefined;
	private	updateAbort?: AbortController = undefined;

	private updatesEnabled = false;
	private updateTimeout: null | ReturnType<typeof setTimeout> = null;
	private updateTimestamp: Date = new Date();
	private updateInterval: number = 3000;

	private tileLayerOptions: Map<LiveAtlasMapDefinition, DynmapTileLayerOptions> = new Map();
	private tileLayers: Map<LiveAtlasMapDefinition, DynmapTileLayer> = new Map();
	private projections: Map<LiveAtlasMapDefinition, DynmapProjection> = new Map();

	constructor(name: string, config: DynmapUrlConfig, renderer: LeafletMapRenderer) {
		super(name, config, renderer);
	}

	protected validateURL() {
		if(typeof this.url !== 'undefined') {
			if (!this.url || this.url.constructor !== Object) {
				throw new ConfigurationError(`Dynmap configuration object missing`);
			}

			validateConfigURL(this.url.configuration, this.name, 'configuration');
			validateConfigURL(this.url.update, this.name,'update');
			validateConfigURL(this.url.markers, this.name,'markers');
			validateConfigURL(this.url.tiles, this.name,'tiles');
			validateConfigURL(this.url.sendmessage, this.name,'sendmessage');
		}
	}

	private async getMarkerSets(world: LiveAtlasWorldDefinition): Promise<void> {
		this.markersAbort = new AbortController();

		const url = `${this.url.markers}_markers_/marker_${encodeURIComponent(world.name)}.json`,
			markerSets: Map<string, LiveAtlasMarkerSet> = new Map(),
			markers = new Map<string, Map<string, LiveAtlasMarker>>(),
			response = await this.getJSON(url, this.markersAbort.signal);

		for (const key in response.sets || {}) {
			if (!Object.prototype.hasOwnProperty.call(response.sets, key)) {
				continue;
			}

			const set: MarkerSet = response.sets[key],
				markerSet = buildMarkerSet(key, set),
				setMarkers = new Map<string, LiveAtlasMarker>();

			buildMarkers(set.markers || {}, setMarkers, this.url);
			buildAreas(set.areas || {}, setMarkers);
			buildLines(set.lines || {}, setMarkers);
			buildCircles(set.circles || {}, setMarkers);

			markerSets.set(key, markerSet);
			markers.set(key, setMarkers);
		}

		this.store.commit(MutationTypes.SET_MARKER_SETS, markerSets);
		this.store.commit(MutationTypes.SET_MARKERS, markers);


		if(this.markersAbort) {
			this.markersAbort.abort();
		}
	}

	async loadServerConfiguration(): Promise<void> {
		if(this.configurationAbort) {
			this.configurationAbort.abort();
		}

		this.configurationAbort = new AbortController();

		const response = await this.getJSON(this.url.configuration, this.configurationAbort.signal);

		if (response.error) {
			throw new Error(response.error);
		}

		const config = buildServerConfig(response),
			worlds = buildWorlds(response, this.url);

		this.tileLayerOptions = worlds.tileLayerOptions;
		this.projections = worlds.projections;
		this.updateInterval = response.updaterate || 3000;

		this.store.commit(MutationTypes.SET_SERVER_CONFIGURATION, config);
		this.store.commit(MutationTypes.SET_SERVER_CONFIGURATION_HASH, response.confighash || 0);
		this.store.commit(MutationTypes.SET_MAX_PLAYERS, response.maxcount || 0);
		this.store.commit(MutationTypes.SET_MESSAGES, buildMessagesConfig(response));
		this.store.commit(MutationTypes.SET_WORLDS, worlds.worlds);
		this.store.commit(MutationTypes.SET_COMPONENTS, buildComponents(response, this.url));
		this.store.commit(MutationTypes.SET_LOGGED_IN, response.loggedin || false);
	}

	async populateWorld(world: LiveAtlasWorldDefinition): Promise<void> {
		await this.getMarkerSets(world);
	}

	async populateMap(map: LiveAtlasMapDefinition) {
		this.renderer.setProjection(this.projections.get(map)!);
	}

	getBaseMapLayer(map: LiveAtlasMapDefinition): LiveAtlasMapLayer {
		if(!this.tileLayers.has(map)) {
			this.tileLayers.set(map, new DynmapTileLayer(this.tileLayerOptions.get(map)!));
		}

		return this.renderer.createMapLayer(this.tileLayers.get(map)!);
	}

	private async getUpdate(): Promise<void> {
		let url = this.url.update;
		url = url.replace('{world}', encodeURIComponent(this.store.state.currentWorld!.name));
		url = url.replace('{timestamp}', this.updateTimestamp.getTime().toString());

		if(this.updateAbort) {
			this.updateAbort.abort();
		}

		this.updateAbort = new AbortController();

		const response = await this.getJSON(url, this.updateAbort.signal);
		const players: Set<LiveAtlasPlayer> = new Set(),
			updates = buildUpdates(response.updates || [], this.updateTimestamp, this.url),
			worldState = {
				timeOfDay: response.servertime || 0,
				thundering: response.isThundering || false,
				raining: response.hasStorm || false,
			};

		(response.players || []).forEach((player: any) => {
			const world = player.world && player.world !== '-some-other-bogus-world-' ? player.world : undefined;

			players.add({
				name: player.account || "",
				displayName: player.name || "",
				health: player.health || 0,
				armor: player.armor || 0,
				sort: player.sort || 0,
				hidden: !world,
				location: {
					//Add 0.5 to position in the middle of a block
					x: !isNaN(player.x) ? player.x + 0.5 : 0,
					y: !isNaN(player.y) ? player.y : 0,
					z: !isNaN(player.z) ? player.z + 0.5 : 0,
					world: world,
				}
			});
		});

		//Extra fake players for testing
		// for(let i = 0; i < 450; i++) {
		// 	players.add({
		// 		account: "VIDEO GAMES " + i,
		// 		health: Math.round(Math.random() * 10),
		// 		armor: Math.round(Math.random() * 10),
		// 		name: "VIDEO GAMES " + i,
		// 		sort: Math.round(Math.random() * 10),
		// 		hidden: false,
		// 		location: {
		// 			x: Math.round(Math.random() * 1000) - 500,
		// 			y: 64,
		// 			z: Math.round(Math.random() * 1000) - 500,
		// 			world: "world",
		// 		}
		// 	});
		// }

		this.updateTimestamp = new Date(response.timestamp || 0);

		this.store.commit(MutationTypes.SET_WORLD_STATE, worldState);
		this.store.commit(MutationTypes.ADD_MARKER_SET_UPDATES, updates.markerSets);
		this.store.commit(MutationTypes.ADD_MARKER_UPDATES, updates.markers);
		this.store.commit(MutationTypes.ADD_CHAT, updates.chat);

		if(response.confighash) {
			this.store.commit(MutationTypes.SET_SERVER_CONFIGURATION_HASH, response.confighash);
		}

		this.tileLayers.get(this.store.state.currentMap!)!.updateTiles(updates.tiles);

		await this.store.dispatch(ActionTypes.SET_PLAYERS, players);
	}

	sendChatMessage(message: string) {
		if (!this.store.state.components.chatSending) {
			return Promise.reject(this.store.state.messages.chatErrorDisabled);
		}

		return fetch(this.url.sendmessage, {
			method: 'POST',
			credentials: 'include',
			body: JSON.stringify({
				name: null,
				message: message,
			})
		}).then((response) => {
			if (response.status === 403) { //Rate limited
				throw new ChatError(this.store.state.messages.chatErrorCooldown
					.replace('%interval%', this.store.state.components.chatSending!.cooldown.toString()));
			}

			if (!response.ok) {
				throw new Error('Network request failed');
			}

			return response.json();
		}).then(response => {
			if (response.error !== 'none') {
				throw new ChatError(this.store.state.messages.chatErrorNotAllowed);
			}
		}).catch(e => {
			if (!(e instanceof ChatError)) {
				console.error(this.store.state.messages.chatErrorUnknown);
				console.trace(e);
			}

			throw e;
		});
	}

	startUpdates() {
		this.updatesEnabled = true;
		this.update();
	}

	private async update() {
		try {
			await this.getUpdate();
		} finally {
			if(this.updatesEnabled) {
				if(this.updateTimeout) {
					clearTimeout(this.updateTimeout);
				}

				this.updateTimeout = setTimeout(() => this.update(), this.updateInterval);
			}
		}
	}

	stopUpdates() {
		this.updatesEnabled = false;

		if (this.updateTimeout) {
			clearTimeout(this.updateTimeout);
		}

		this.updateTimeout = null;

		if(this.configurationAbort) {
			this.configurationAbort.abort();
		}

		if(this.updateAbort) {
			this.updateAbort.abort();
		}

		if(this.markersAbort) {
			this.markersAbort.abort();
		}
	}

    async login(data: any) {
		if (!this.store.getters.loginEnabled) {
			return Promise.reject(this.store.state.messages.loginErrorDisabled);
		}

		this.store.commit(MutationTypes.SET_LOGGED_IN, false);

		try {
			const body = new URLSearchParams();

			body.append('j_username', data.username || '');
			body.append('j_password', data.password || '');


			const response = await DynmapMapProvider.fetchJSON(this.url.login, {
				method: 'POST',
				body,
			});

			switch(response.result) {
				case 'success':
					this.store.commit(MutationTypes.SET_LOGGED_IN, true);
					return;

				case 'loginfailed':
					return Promise.reject(this.store.state.messages.loginErrorIncorrect);

				default:
					return Promise.reject(this.store.state.messages.loginErrorUnknown);
			}
		} catch(e) {
			console.error(this.store.state.messages.loginErrorUnknown);
			console.trace(e);
			return Promise.reject(this.store.state.messages.loginErrorUnknown);
		}
	}

	async logout() {
		if (!this.store.getters.loginEnabled) {
			return Promise.reject(this.store.state.messages.loginErrorDisabled);
		}

		try {
			await DynmapMapProvider.fetchJSON(this.url.login, {
				method: 'POST',
			});

			this.store.commit(MutationTypes.SET_LOGGED_IN, false);
		} catch(e) {
			return Promise.reject(this.store.state.messages.logoutErrorUnknown);
		}
	}

    async register(data: any) {
		if (!this.store.getters.loginEnabled) {
			return Promise.reject(this.store.state.messages.loginErrorDisabled);
		}

		this.store.commit(MutationTypes.SET_LOGGED_IN, false);

		try {
			const body = new URLSearchParams();

			body.append('j_username', data.username || '');
			body.append('j_password', data.password || '');
			body.append('j_verify_password', data.password || '');
			body.append('j_passcode', data.code || '');

			const response = await DynmapMapProvider.fetchJSON(this.url.register, {
				method: 'POST',
				body,
			});

			switch(response.result) {
				case 'success':
					this.store.commit(MutationTypes.SET_LOGGED_IN, true);
					return;

				case 'verifyfailed':
					return Promise.reject(this.store.state.messages.registerErrorVerifyFailed);

				case 'registerfailed':
					return Promise.reject(this.store.state.messages.registerErrorIncorrect);

				default:
					return Promise.reject(this.store.state.messages.registerErrorUnknown);
			}
		} catch(e) {
			console.error(this.store.state.messages.registerErrorUnknown);
			console.trace(e);
			return Promise.reject(this.store.state.messages.registerErrorUnknown);
		}
	}

	protected async getJSON(url: string, signal: AbortSignal) {
		return AbstractMapProvider.fetchJSON(url, {signal, credentials: 'include'}).then(response => {
			if(response.error === 'login-required') {
				this.store.commit(MutationTypes.SET_LOGIN_REQUIRED, true);
				throw new Error("Login required");
			}

			return response;
		});
	}
}
