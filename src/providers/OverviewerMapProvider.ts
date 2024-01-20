/*
 * Copyright 2022 James Lyne
 *
 * Some portions of this file were taken from https://github.com/overviewer/Minecraft-Overviewer.
 * These portions are Copyright 2022 Minecraft Overviewer Contributors.
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
	LiveAtlasAreaMarker,
	LiveAtlasComponentConfig,
	LiveAtlasMarker,
	LiveAtlasMarkerSet, LiveAtlasPointMarker,
	LiveAtlasServerConfig,
	LiveAtlasServerMessageConfig, LiveAtlasTileLayerOverlay,
	LiveAtlasWorldDefinition
} from "@/index";
import {useStore} from "@/store";
import {MutationTypes} from "@/store/mutation-types";
import MapProvider from "@/providers/MapProvider";
import {
	getBoundsFromPoints,
	getMiddle,
	guessWorldDimension,
	runSandboxed,
	stripHTML, validateConfigURL,
} from "@/util";
import {LiveAtlasTileLayer, LiveAtlasTileLayerOptions} from "@/leaflet/tileLayer/LiveAtlasTileLayer";
import {OverviewerTileLayer} from "@/leaflet/tileLayer/OverviewerTileLayer";
import LiveAtlasMapDefinition from "@/model/LiveAtlasMapDefinition";
import {OverviewerProjection} from "@/leaflet/projection/OverviewerProjection";
import {LiveAtlasMarkerType} from "@/util/markers";
import {getDefaultPlayerImage} from "@/util/images";

export default class OverviewerMapProvider extends MapProvider {
	private configurationAbort?: AbortController = undefined;
	private markersAbort?: AbortController = undefined;
	private readonly markersRegex: RegExp = /^overviewer.util.injectMarkerScript\('([\w.]+)'\);?$/mgi;
	private readonly mapMarkerSets: Map<string, Map<string, LiveAtlasMarkerSet>> = new Map();
	private readonly mapMarkers: Map<string, Map<string, Map<string, LiveAtlasMarker>>> = Object.freeze(new Map());

	constructor(name: string, config: string) {
		super(name, config);

		validateConfigURL(config, name, 'map');

		if(this.config.slice(-1) !== '/') {
			this.config = `${config}/`;
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	private static buildServerConfig(ignore: any): LiveAtlasServerConfig {
		return {
			title: useStore().state.initialTitle,
			singleMapWorlds: false,

			//Not used by overviewer
			expandUI: false,
			defaultZoom: 0, //Defined per map
			defaultMap: undefined,
			defaultWorld: undefined,
			followMap: undefined,
			followZoom: undefined,
		};
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	private static buildMessagesConfig(ignore: any): LiveAtlasServerMessageConfig {
		return {
			worldsHeading: 'Worlds',

			//Not used by overviewer
			playersHeading: '',
			chatPlayerJoin: '',
			chatPlayerQuit: '',
			chatAnonymousJoin: '',
			chatAnonymousQuit: '',
			chatErrorNotAllowed: '',
			chatErrorRequiresLogin: '',
			chatErrorCooldown: '',
		}
	}

	private buildWorlds(serverResponse: any): Array<LiveAtlasWorldDefinition> {
		const tileSize = serverResponse.CONST.tileSize,
			worlds: Map<string, LiveAtlasWorldDefinition> = new Map<string, LiveAtlasWorldDefinition>();

		(serverResponse.worlds || []).forEach((world: string) => {
			worlds.set(world, {
				name: world,
				displayName: world,
				dimension: guessWorldDimension(world),
				seaLevel: 64,
				maps: new Set<LiveAtlasMapDefinition>(),
			});
		});

		(serverResponse.tilesets || []).forEach((tileset: any) => {
			if(!tileset?.world || !worlds.has(tileset.world)) {
				console.warn(`Ignoring tileset with unknown world ${tileset.world}`);
				return;
			}

			const world = worlds.get(tileset.world) as LiveAtlasWorldDefinition,
				baseUrl = tileset.base ? `${this.config}${tileset.base}/${tileset.path}` : this.config + tileset.path,
				prefix = tileset.base,
				imageFormat = tileset.imgextension,
				nativeZoomLevels = tileset.zoomLevels,
				minZoom = tileset.minZoom,
				maxZoom = tileset.maxZoom;

			//Ignore overlays until all map definitions have been created
			if(tileset.isOverlay) {
				return;
			}

			world.maps.add(new LiveAtlasMapDefinition({
				world,

				name: tileset.path,
				displayName: tileset.name || tileset.path,

				baseUrl,
				tileSize,
				projection: new OverviewerProjection({
					upperRight: serverResponse.CONST.UPPERRIGHT,
					lowerLeft: serverResponse.CONST.LOWERLEFT,
					lowerRight: serverResponse.CONST.LOWERRIGHT,
					northDirection: tileset.north_direction,
					nativeZoomLevels,
					tileSize,
				}),
				prefix,

				background: tileset.bgcolor,
				imageFormat,

				nativeZoomLevels,
				minZoom,
				maxZoom,
				defaultZoom: tileset.defaultZoom,

				center: {
					x: tileset?.center[0] || 0,
					y: tileset?.center[1] || 64,
					z: tileset?.center[2] || 0,
				},

				overlays: new Map(),
			}));

			//Spawn marker
			const markerSets = new Map<string, LiveAtlasMarkerSet>(),
				markers = new Map<string, Map<string, LiveAtlasMarker>>();

			if(Array.isArray(tileset.spawn)) {
				markerSets.set('spawn', {
					id: 'spawn',
					label: tileset.poititle,
					hidden: false,
					priority: 0,
				});

				const setContents = new Map<string, LiveAtlasMarker>();

				setContents.set('spawn', {
					id: 'spawn',
					type: LiveAtlasMarkerType.POINT,
					iconUrl: this.config + serverResponse?.CONST?.image?.spawnMarker,
					iconSize: [32, 37],
                    iconAnchor: [15, 33],
					tooltip: 'Spawn',
					location: {
						x: tileset.spawn[0] || 0,
						y: tileset.spawn[1] || 64,
						z: tileset.spawn[2] || 0,
					}
				} as LiveAtlasPointMarker);

				markers.set('spawn', setContents);
			}

			this.mapMarkerSets.set(tileset.path, markerSets);
			this.mapMarkers.set(tileset.path, markers);

		});

		//Loop over tilesets again to handle overlays and add them to relevant maps
		(serverResponse.tilesets || []).forEach((tileset: any) => {
			if(!tileset.isOverlay) {
				return;
			}

			const overlay: LiveAtlasTileLayerOverlay = {
				id: tileset.path,
				label: tileset.name || tileset.path,
				hidden: true,
				priority: 0,
				tileLayerOptions: {
					baseUrl: tileset.base ? `${this.config}${tileset.base}/${tileset.path}` : this.config + tileset.path,
					tileSize,
					prefix: tileset.base,
					imageFormat: tileset.imgextension,
					nativeZoomLevels: tileset.zoomLevels,
					minZoom: tileset.minZoom,
					maxZoom: tileset.maxZoom,
				}
			};

			//Add to listed maps, or all maps in defined world if no maps are listed
			(worlds.get(tileset.world)?.maps || []).forEach(map => {
				if(!tileset?.tilesets?.length || tileset.tilesets.includes(map.name)) {
					map.overlays.set(tileset.path, overlay);
				}
			});

			return;
		});

		return Array.from(worlds.values());
	}

	private static buildComponents(response: any): LiveAtlasComponentConfig {
		const components: LiveAtlasComponentConfig = {
			coordinatesControl: undefined,
			linkControl: true,
			layerControl: response?.map?.controls?.overlays,

			//Not configurable
			markers: {
				showLabels: false,
			},

			nightDay: {
				mode: "night_day",
				value: -1
			},

			//Not used by Overviewer
			players: {
				markers: undefined,
				imageUrl: getDefaultPlayerImage,
				showImages: false,
				grayHiddenPlayers: false,
			},
			chatBox: undefined,
			chatBalloons: false,
			clockControl: undefined,
			logoControls: [],
			login: false,
		};

		if(response?.map?.controls?.coordsBox) {
			components.coordinatesControl = {
				showY: false,
				label: 'Location: ',
				showRegion: true,
				showChunk: false,
			}
		}

		return components;
	}

	private async getMarkerSets(): Promise<void> {
		this.markersAbort = new AbortController();

		//Overviewer markers are stored in multiple files
		//baseMarkers.js - makes calls to injectMarkerScript to load additional files
		//markers.js - If present, maps marker sets to specific maps
		//markersDB.js - If present, contains markers for each marker set
		//additional files - i.e. regions.js, can add extra marker sets and/or markers
		const response = await OverviewerMapProvider.getText(`${this.config}baseMarkers.js`, this.markersAbort.signal),
			//Don't need to run this JS as getting the filenames from injectMarkerScript calls is enough
			files = response.matchAll(this.markersRegex);

		let markerSets: any = {}, markers: any = {}, result: any;

		for(const file of files) {
			let code = await OverviewerMapProvider.getText(`${this.config}${file[1]}`, this.markersAbort.signal);

			switch(file[1]) {
				//Contains list of marker sets per map in markers object
				case 'markers.js':
					markerSets = await runSandboxed(code += 'return markers || {};');
					break;

				//Contains list of markers per marker set in markersDB object
				case 'markersDB.js':
					markers = await runSandboxed(code += 'return markersDB || {};');
					break;

				//Additional files can add to either of the above objects
				default:
					result = await runSandboxed(`var markers = {}, markersDB = {}; ${code} return {markers, markersDB}`);
					markerSets = Object.assign(markerSets, result.markers);
					markers = Object.assign(markers, result.markersDB);

					break;
			}
		}

		//Organise defined markers and sets in to per-map maps
		for(const map in markerSets) {
			if(!Object.prototype.hasOwnProperty.call(markerSets, map) || !this.mapMarkerSets.has(map)) {
				console.warn(`Ignoring unknown map ${map} in marker set list`);
				continue;
			}

			markerSets[map].forEach((set: any, index: number) => {
				this.mapMarkerSets.get(map)!.set(set.groupName, {
					id: set.groupName,
					hidden: !set.checked,
					label: set.displayName,
					priority: index,
				});

				const setContents = new Map<string, LiveAtlasMarker>();

				(markers[set.groupName]?.raw || []).forEach((marker: any, index: number) => {
					const id = `marker_${index}`;
					setContents.set(id, this.buildMarker(id, marker, set));
				});

				this.mapMarkers.get(map)!.set(set.groupName, setContents);
			});
		}
	}

	private buildMarker(id: string, data: any, markerSet: any): LiveAtlasMarker {
		const marker: any = {
			id,
			tooltip: stripHTML(data.hovertext.trim()),
			tooltipHTML: data.hovertext.trim(),
			popup: markerSet.createInfoWindow ? data.text : undefined,
			isPopupHTML: true,
		}

		if(typeof data.points !== 'undefined') {
			marker.style = {
				color: data.strokeColor,
				weight: data.strokeWeight,
				fill: data.fill,
			};
			marker.location = getMiddle(getBoundsFromPoints(data.points));
			marker.points = data.points;
			marker.type = data.isLine ? LiveAtlasMarkerType.LINE : LiveAtlasMarkerType.AREA;
		} else {
			marker.type = LiveAtlasMarkerType.POINT;
			marker.location = {x: data.x, y: data.y, z: data.z};
			marker.iconUrl = this.config + (data.icon || markerSet.icon);
		}

		return marker as LiveAtlasMarker | LiveAtlasAreaMarker;
	}

	async loadServerConfiguration(): Promise<void> {
		if(this.configurationAbort) {
			this.configurationAbort.abort();
		}

		this.configurationAbort = new AbortController();

		const baseUrl = this.config,
			response = await OverviewerMapProvider.getText(`${baseUrl}overviewerConfig.js`, this.configurationAbort.signal);

		try {
			//Overviewer's config is a JS object rather than JSON, so we need to run the JS to evaluate it :(
			//Doing this in an iframe to at least attempt to protect from bad things
			const result = await runSandboxed(response + ' return overviewerConfig;');

			this.store.commit(MutationTypes.SET_SERVER_CONFIGURATION, OverviewerMapProvider.buildServerConfig(result));
			this.store.commit(MutationTypes.SET_MESSAGES, OverviewerMapProvider.buildMessagesConfig(result));
			this.store.commit(MutationTypes.SET_WORLDS, this.buildWorlds(result));
			this.store.commit(MutationTypes.SET_COMPONENTS, OverviewerMapProvider.buildComponents(result));

			await this.getMarkerSets();
		} catch(e) {
			console.error(e);
			throw e;
		}
	}

	async populateMap(map:LiveAtlasMapDefinition) {
		this.store.commit(MutationTypes.SET_MARKER_SETS, this.mapMarkerSets.get(map.name) || new Map());
		this.store.commit(MutationTypes.SET_MARKERS, this.mapMarkers.get(map.name) || new Map());
	}

	createTileLayer(options: LiveAtlasTileLayerOptions): LiveAtlasTileLayer {
		return new OverviewerTileLayer(options);
	}
}
