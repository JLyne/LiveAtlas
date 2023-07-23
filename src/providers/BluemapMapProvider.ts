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
	LiveAtlasMarkerSet, LiveAtlasMarkerSetLayer, LiveAtlasOverlay,
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

export default class BluemapMapProvider extends AbstractMapProvider {
	declare protected renderer: BluemapMapRenderer;
	private configurationAbort?: AbortController = undefined;
	private	markersAbort?: AbortController = undefined;

	private updatesEnabled: boolean = false;

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

		this.store.commit(MutationTypes.SET_SERVER_CONFIGURATION, config);
		//this.store.commit(MutationTypes.SET_MESSAGES, Pl3xmapMapProvider.buildMessagesConfig(response));
		this.store.commit(MutationTypes.SET_WORLDS, await this.buildWorlds(worldNames));
		//this.store.commit(MutationTypes.SET_COMPONENTS, Pl3xmapMapProvider.buildComponents(response));
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
					map = Object.freeze(new LiveAtlasMapDefinition({
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
		this.startUpdates();
		await this.getMarkerSets(world);

		this.store.commit(MutationTypes.SET_MARKER_SETS, this.markerSets);
		this.store.commit(MutationTypes.SET_MARKERS, this.markers);

		this.markerSets.clear();
		this.markers.clear();
	}

	private async getMarkerSets(world: LiveAtlasWorldDefinition): Promise<void> {
		const url = `${this.url}maps/${encodeURIComponent(world.name)}/live/markers.json`;

		if(this.markersAbort) {
			this.markersAbort.abort();
		}

		this.markersAbort = new AbortController();

		const response = await BluemapMapProvider.getJSON(url, this.markersAbort.signal);

		console.log(response);

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

	private startUpdates() {
		if(this.updatesEnabled) {
			return;
		}

		this.updatesEnabled = true;
	}

	getBaseMapLayer(map: LiveAtlasMapDefinition): LiveAtlasMapLayer {
		console.log(map);
		console.log(this.maps.get(map));
		return new BluemapMapLayer(this.renderer.getMapViewer()!, this.maps.get(map)!);
	}

	getMarkerSetLayer(set: LiveAtlasMarkerSet): LiveAtlasMarkerSetLayer {
		return new BluemapMarkerSetLayer(this.renderer.getMapViewer()!, set);
	}

	getOverlayMapLayer(options: LiveAtlasOverlay): LiveAtlasMapLayer {
		return undefined;
	}

	destroy() {
		this.updatesEnabled = false;
	}
}
