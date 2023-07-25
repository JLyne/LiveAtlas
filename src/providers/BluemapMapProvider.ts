/*
 * Copyright 2023 James Lyne
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
	LiveAtlasMapLayer, LiveAtlasMarker,
	LiveAtlasMarkerSet, LiveAtlasMarkerSetLayer, LiveAtlasOverlay, LiveAtlasPlayer, LiveAtlasPlayerLayer,
	LiveAtlasServerConfig,
	LiveAtlasWorldDefinition
} from "@/index";
import AbstractMapProvider from "@/providers/AbstractMapProvider";
import {guessWorldDimension} from "@/util";
import BluemapMapRenderer from "@/renderers/BluemapMapRenderer";
import {MutationTypes} from "@/store/mutation-types";
import LiveAtlasMapDefinition from "@/model/LiveAtlasMapDefinition";
import {Map as BluemapMap} from "bluemap/BlueMap";
import BluemapMapLayer from "@/layers/BluemapMapLayer";
import BluemapMarkerSetLayer from "@/layers/BluemapMarkerSetLayer";
import {reactive} from "vue";
import BluemapPlayerLayer from "@/layers/BluemapPlayerLayer";
import {getDefaultPlayerImage} from "@/util/images";

export default class BluemapMapProvider extends AbstractMapProvider {
	declare protected renderer: BluemapMapRenderer;
	private configurationAbort?: AbortController = undefined;
	private	markersAbort?: AbortController = undefined;
	private	playersAbort?: AbortController = undefined;

	private updatesEnabled: boolean = false;

	private playerUpdateTimestamp: Date = new Date();
	private playerUpdateTimeout: null | ReturnType<typeof setTimeout> = null;
	private playerUpdateInterval = 1000;

	private markerSets: Map<string, LiveAtlasMarkerSet> = new Map();
	private markers = new Map<string, Map<string, LiveAtlasMarker>>();
	private maps: Map<LiveAtlasMapDefinition, BluemapMap> = new Map<LiveAtlasMapDefinition, BluemapMap>();

	constructor(name: string, config: string, renderer: BluemapMapRenderer) {
		super(name, config, renderer);
	}

	private static buildServerConfig(): LiveAtlasServerConfig {
		return {
			title: '//FIXME',
			expandUI: false,
			singleMapWorlds: true,

			//Not used by bluemap
			defaultZoom: 1,
			defaultMap: undefined,
			defaultWorld: undefined,
			followMap: undefined,
			followZoom: undefined,
		};
	}

	async init(): Promise<void> {
		if(this.configurationAbort) {
			this.configurationAbort.abort();
		}

		this.configurationAbort = new AbortController();

		const baseUrl = this.url,
			response = await BluemapMapProvider.getJSON(`${baseUrl}settings.json`, this.configurationAbort.signal);

		if (response.error) {
			throw new Error(response.error);
		}

		const config = BluemapMapProvider.buildServerConfig(),
			worldNames = response.maps || [];

		this.renderer!.setZoomLimits(response.minZoomDistance, response.maxZoomDistance);

		this.store.commit(MutationTypes.SET_SERVER_CONFIGURATION, config);
		//this.store.commit(MutationTypes.SET_MESSAGES, Pl3xmapMapProvider.buildMessagesConfig(response));
		this.store.commit(MutationTypes.SET_WORLDS, await this.buildWorlds(worldNames));
		this.store.commit(MutationTypes.SET_COMPONENTS, {
			coordinatesControl: {
				showY: true,
				label: "Location: ",
				showRegion: false,
				showChunk: true,
			},
			linkControl: true,
			layerControl: true,

			players: {
				markers: {
					hideByDefault: false,
					layerName: "Player",
					layerPriority: 0,
					imageSize: 'large',
					showHealth: false,
					showArmor: false,
					showYaw: false,
				},
				imageUrl: getDefaultPlayerImage,

				//Not configurable
				showImages: true,
				grayHiddenPlayers: true,
			},

			//Not configurable
			markers: {
				showLabels: false,
			},

			//Not used by bluemap
			chatBox: undefined,
			chatBalloons: false,
			clockControl: undefined,
			logoControls: [],
			login: false,
		});
	}

	private async buildWorlds(worldNames: string[]) {
		const promises: Promise<void>[] = [],
			worlds: LiveAtlasWorldDefinition[] = [],
			viewer = this.renderer.getMapViewer()!,
			//FIXME BlueMapApp.loadBlocker
			loadBlocker = async () => {
				await new Promise(resolve => setTimeout(resolve, 100));
			};

		for(const name of worldNames) {
			const bluemapMap = new BluemapMap(name, `${this.url}maps/${name}/`, loadBlocker, viewer.events);

			promises.push(bluemapMap.loadSettings().then(() => {
				const world = {
					name: name,
					displayName: bluemapMap.data.name,
					dimension: guessWorldDimension(name),
					maps: new Set<LiveAtlasMapDefinition>(),
					seaLevel: 64,
					sort: bluemapMap.data.sorting
				},
					map = reactive(new LiveAtlasMapDefinition({
						name: bluemapMap.data.name,
						world,
						center: {
							x: bluemapMap.data.startPos.x,
							y: 0,
							z: bluemapMap.data.startPos.z
						}
					}));

				world.maps.add(map);
				worlds.push(world);
				this.maps.set(map, bluemapMap);
			}));
		}

		await Promise.all(promises);

		return worlds;
	}

	async populateWorld(world: LiveAtlasWorldDefinition) {
		this.stopUpdates();
		await this.getMarkerSets(world);

		this.store.commit(MutationTypes.SET_MARKER_SETS, this.markerSets);
		this.store.commit(MutationTypes.SET_MARKERS, this.markers);

		this.markerSets.clear();
		this.markers.clear();
		this.startUpdates(world);
	}

	private async getMarkerSets(world: LiveAtlasWorldDefinition): Promise<void> {
		const url = `${this.url}maps/${encodeURIComponent(world.name)}/live/markers.json`;

		if(this.markersAbort) {
			this.markersAbort.abort();
		}

		this.markersAbort = new AbortController();

		const response = await BluemapMapProvider.getJSON(url, this.markersAbort.signal);

		for(const setId in response) {
			const set = response[setId],
				markers: Map<string, LiveAtlasMarker> = Object.freeze(new Map());

			//TODO
			this.markerSets.set(setId, {
				id: setId,
				label: set.label || "Unnamed set",
				hidden: set.defaultHidden || false,
				//TODO: Toggleable
				priority: set.sorting  || 0
			});
			this.markers.set(setId, markers);
		}
	}

	private startUpdates(world: LiveAtlasWorldDefinition) {
		if(this.updatesEnabled) {
			return;
		}

		this.updatesEnabled = true;
		this.updatePlayers(world);
	}

	private async updatePlayers(world: LiveAtlasWorldDefinition) {
		try {
			if(this.store.getters.playerMarkersEnabled) {
				const players = await this.getPlayers(world);

				this.playerUpdateTimestamp = new Date();

				console.log('Setting players');
				this.store.commit(MutationTypes.SET_PLAYERS, players);
			}
		} finally {
			if(this.updatesEnabled) {
				if(this.playerUpdateTimeout) {
					clearTimeout(this.playerUpdateTimeout);
				}

				this.playerUpdateTimeout = setTimeout(() => this.updatePlayers(world), this.playerUpdateInterval);
			}
		}
	}

	private async getPlayers(world: LiveAtlasWorldDefinition): Promise<Set<LiveAtlasPlayer>> {
		const url = `${this.url}maps/${encodeURIComponent(world.name)}/live/players.json`;

		if(this.playersAbort) {
			this.playersAbort.abort();
		}

		this.playersAbort = new AbortController();

		const response = await BluemapMapProvider.getJSON(url, this.playersAbort.signal),
			players: Set<LiveAtlasPlayer> = new Set();

		(response.players || []).forEach((player: any) => {
			players.add({
				name: (player.name || '').toLowerCase(),
				uuid: player.uuid,
				displayName: player.name || "",
				health: 0,
				armor: 0,
				sort: 0,
				hidden: player.foreign,
				location: {
					x: player.position?.x || 0,
					y: player.position?.y || 0,
					z: player.position?.z || 0,
					world: player.foreign ? undefined : world.name,
				},
				rotation: {
					yaw: player.position?.yaw || 0,
					pitch: player.position?.pitch || 0,
					roll: player.position?.roll || 0,
				}
			});
		});

		// Extra fake players for testing
		// for(let i = 0; i < 450; i++) {
		// 	players.add({
		// 		name: "VIDEO GAMES " + i,
		// 		displayName: "VIDEO GAMES " + i,
		// 		health: Math.round(Math.random() * 10),
		// 		armor: Math.round(Math.random() * 10),
		// 		sort: Math.round(Math.random() * 10),
		// 		hidden: false,
		// 		location: {
		// 			x: Math.round(Math.random() * 1000) - 500,
		// 			y: 0,
		// 			z: Math.round(Math.random() * 1000) - 500,
		// 			world: "world",
		// 		}
		// 	});
		// }

		return players;
	}

	private stopUpdates() {
		this.updatesEnabled = false;

		if(this.playersAbort) {
			this.playersAbort.abort();
		}
	}

	getBaseMapLayer(map: LiveAtlasMapDefinition): LiveAtlasMapLayer {
		return new BluemapMapLayer(this.renderer.getMapViewer()!, this.maps.get(map)!);
	}

	getMarkerSetLayer(set: LiveAtlasMarkerSet): LiveAtlasMarkerSetLayer {
		return new BluemapMarkerSetLayer(this.renderer.getMapViewer()!, set);
	}

	getOverlayMapLayer(options: LiveAtlasOverlay): LiveAtlasMapLayer {
		throw null;
	}

	getPlayerLayer(): LiveAtlasPlayerLayer {
		return new BluemapPlayerLayer(this.renderer.getMapViewer()!);
	}

	destroy() {
		this.stopUpdates();
	}
}
