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

import {PointTuple} from "leaflet";
import {
	LiveAtlasAreaMarker,
	LiveAtlasCircleMarker,
	LiveAtlasComponentConfig,
	LiveAtlasDimension,
	LiveAtlasLineMarker, LiveAtlasMarker,
	LiveAtlasMarkerSet,
	LiveAtlasPartialComponentConfig,
	LiveAtlasPlayer,
	LiveAtlasPointMarker,
	LiveAtlasServerConfig,
	LiveAtlasServerMessageConfig,
	LiveAtlasWorldDefinition
} from "@/index";
import {MutationTypes} from "@/store/mutation-types";
import {ActionTypes} from "@/store/action-types";
import LiveAtlasMapDefinition from "@/model/LiveAtlasMapDefinition";
import MapProvider from "@/providers/MapProvider";
import {getBoundsFromPoints, getMiddle, stripHTML, titleColoursRegex, validateConfigURL} from "@/util";
import {LiveAtlasMarkerType} from "@/util/markers";
import {Pl3xmapTileLayer} from "@/leaflet/tileLayer/Pl3xmapTileLayer";
import {LiveAtlasTileLayer, LiveAtlasTileLayerOptions} from "@/leaflet/tileLayer/LiveAtlasTileLayer";
import {getDefaultPlayerImage} from "@/util/images";

export default class Pl3xmapMapProvider extends MapProvider {
	private configurationAbort?: AbortController = undefined;
	private	markersAbort?: AbortController = undefined;
	private	playersAbort?: AbortController = undefined;

	private updatesEnabled = false;

	private playerUpdateTimeout: null | ReturnType<typeof setTimeout> = null;
	private playerUpdateTimestamp: Date = new Date();
	private playerUpdateInterval = 3000;

	private markerUpdateTimeout: null | ReturnType<typeof setTimeout> = null;
	private markerUpdateInterval = 3000;

	private worldPlayerUpdateIntervals: Map<string, number> = new Map();
	private worldMarkerUpdateIntervals: Map<string, number> = new Map();
	private worldComponents: Map<string, {
		components: LiveAtlasPartialComponentConfig,
	}> = new Map();

	private markerSets: Map<string, LiveAtlasMarkerSet> = new Map();
	private markers = new Map<string, Map<string, LiveAtlasMarker>>();

	constructor(name: string, config: string) {
		super(name, config);

		if(this.config === true) {
			this.config = window.location.pathname;
		}

		validateConfigURL(config, name, 'map');

		if(this.config.slice(-1) !== '/') {
			this.config = `${config}/`;
		}
	}

	private static buildServerConfig(response: any): LiveAtlasServerConfig {
		return {
			title: (response.ui?.title || 'Pl3xmap').replace(titleColoursRegex, ''),
			expandUI: response.ui?.sidebar?.pinned === 'pinned',
			singleMapWorlds: true,

			//Not used by pl3xmap
			defaultZoom: 1,
			defaultMap: undefined,
			defaultWorld: undefined,
			followMap: undefined,
			followZoom: undefined,
		};
	}

	private static buildMessagesConfig(response: any): LiveAtlasServerMessageConfig {
		return {
			worldsHeading: response.ui?.sidebar?.world_list_label || '',
			playersHeading: response.ui?.sidebar?.player_list_label || '',

			//Not used by pl3xmap
			chatPlayerJoin: '',
			chatPlayerQuit: '',
			chatAnonymousJoin: '',
			chatAnonymousQuit: '',
			chatErrorNotAllowed: '',
			chatErrorRequiresLogin: '',
			chatErrorCooldown: '',
		}
	}

	private buildWorlds(serverResponse: any, worldResponses: any[]): Array<LiveAtlasWorldDefinition> {
		const worlds: Array<LiveAtlasWorldDefinition> = [];

		this.worldComponents.clear();
		this.worldMarkerUpdateIntervals.clear();
		this.worldPlayerUpdateIntervals.clear();

		const filteredWorlds = (serverResponse.worlds || []).filter((w: any) => w && !!w.name)
			.sort((a: any, b: any) => a.order - b.order);

		filteredWorlds.forEach((world: any, index: number) => {
			const worldResponse = worldResponses[index],
				worldConfig: {components: LiveAtlasPartialComponentConfig } = {
					components: {
						players: {
							markers: undefined,
							imageUrl: getDefaultPlayerImage,
							grayHiddenPlayers: true,
							showImages: true,
						}
					},
				};

			this.worldMarkerUpdateIntervals.set(world.name, worldResponse.marker_update_interval || 3000);

			if(worldResponse.player_tracker?.enabled) {
				const health = !!worldResponse.player_tracker?.nameplates?.show_health,
					armor = !!worldResponse.player_tracker?.nameplates?.show_armor,
					images = !!worldResponse.player_tracker?.nameplates?.show_heads,
					updateInterval = worldResponse.player_tracker.update_interval ? worldResponse.player_tracker.update_interval * 1000 : 3000;

				this.worldPlayerUpdateIntervals.set(world.name, updateInterval);

				if(worldResponse.player_tracker?.nameplates?.heads_url) {
					worldConfig.components.players!.imageUrl = entry =>
						worldResponse.player_tracker.nameplates.heads_url
							.replace('{uuid}', entry.uuid).replace('{name}', encodeURIComponent(entry.name));
				}

				worldConfig.components.players!.markers = {
					hideByDefault: !!worldResponse.player_tracker?.default_hidden,
					layerName: worldResponse.player_tracker?.label || '',
					layerPriority: worldResponse.player_tracker?.priority,
					imageSize: images ? (health && armor ? 'large' : 'small') : 'none',
					showHealth: health,
					showArmor: armor,
					showYaw: true,
				}
			}

			this.worldComponents.set(world.name, worldConfig);

			if(!worldResponse) {
				console.warn(`World ${world.name} has no matching world config. Ignoring.`);
				return;
			}

			let dimension: LiveAtlasDimension = 'overworld';

			if(world.type === 'nether') {
				dimension = 'nether';
			} else if(world.type === 'the_end') {
				dimension = 'end';
			}

			const maps: Set<LiveAtlasMapDefinition> = new Set();

			const w = {
				name: world.name || '(Unnamed world)',
				displayName: world.display_name || world.name,
				dimension,
				seaLevel: 0,
				maps,
			};

			maps.add(Object.freeze(new LiveAtlasMapDefinition({
				world: w,

				name: 'flat',
				displayName: 'Flat',
				icon: world.icon ? `${this.config}images/icon/${world.icon}.png` : undefined,

				baseUrl: `${this.config}tiles/${w.name}/`,
				imageFormat: 'png',
				tileSize: 512,

				background: 'transparent',
				backgroundDay: 'transparent',
				backgroundNight: 'transparent',

				nativeZoomLevels: worldResponse.zoom.max || 1,
				extraZoomLevels: worldResponse.zoom.extra,
				defaultZoom: worldResponse.zoom.def || 1,
				tileUpdateInterval: worldResponse.tiles_update_interval ? worldResponse.tiles_update_interval * 1000 : undefined,

				center: {x: worldResponse.spawn.x, y: 0, z: worldResponse.spawn.z},
			})));

			worlds.push(w);
		});

		return Array.from(worlds.values());
	}

	private static buildComponents(response: any): LiveAtlasComponentConfig {
		const components: LiveAtlasComponentConfig = {
			coordinatesControl: undefined,
			linkControl: !!response.ui?.link?.enabled,
			layerControl: !!response.ui?.coordinates?.enabled,

			players: {
				markers: undefined, //Configured per-world
				imageUrl: getDefaultPlayerImage,

				//Not configurable
				showImages: true,
				grayHiddenPlayers: true,
			},

			//Not configurable
			markers: {
				showLabels: false,
			},

			nightDay: {
				mode: "night_day",
				value: -1
			},

			//Not used by pl3xmap
			chatBox: undefined,
			chatBalloons: false,
			clockControl: undefined,
			logoControls: [],
			login: false,
		};

		if(response.ui?.coordinates?.enabled) {
			//Try to remove {x}/{z} placeholders are we aren't using them
			const label = (response.ui?.coordinates?.html || "Location: ").replace(/{x}.*{z}/gi, '').trim(),
				labelPlain = new DOMParser().parseFromString(label, 'text/html').body.textContent || "";

			components.coordinatesControl = {
				showY: false,
				label: labelPlain,
				showRegion: false,
				showChunk: false,
			}
		}

		return components;
	}

	private async getMarkerSets(world: LiveAtlasWorldDefinition): Promise<void> {
		const url = `${this.config}tiles/${encodeURIComponent(world.name)}/markers.json`;

		if(this.markersAbort) {
			this.markersAbort.abort();
		}

		this.markersAbort = new AbortController();

		const response = await Pl3xmapMapProvider.getJSON(url, this.markersAbort.signal);

		if(!Array.isArray(response)) {
			return;
		}

		response.forEach(set => {
			if(!set || !set.id) {
				console.warn('Ignoring marker set without id');
				return;
			}

			const id = set.id,
				markers: Map<string, LiveAtlasMarker> = Object.freeze(new Map());

			(set.markers || []).forEach((marker: any) => {
				let markerId;

				switch(marker.type) {
					case 'icon':
						markerId = `point_${markers.size}`;
						markers.set(markerId, this.buildMarker(markerId, marker));
						break;

					case 'polyline':
						markerId = `line_${markers.size}`;
						markers.set(markerId, Pl3xmapMapProvider.buildLine(markerId, marker));
						break;

					case 'rectangle':
					case 'polygon':
						markerId = `area_${markers.size}`;
						markers.set(markerId, Pl3xmapMapProvider.buildArea(markerId, marker));
						break;

					case 'circle':
					case 'ellipse':
						markerId = `circle_${markers.size}`;
						markers.set(markerId, Pl3xmapMapProvider.buildCircle(markerId, marker));
						break;

					default:
						console.warn('Marker type ' + marker.type + ' not supported');
				}
			});

			this.markerSets.set(id, {
				id,
				label: set.name || "Unnamed set",
				hidden: set.hide || false,
				priority: set.order || 0,
				showLabels: false
			});
			this.markers.set(id, markers);
		});
	}

	private buildMarker(id: string, marker: any): LiveAtlasPointMarker {
		return {
			id,
			type: LiveAtlasMarkerType.POINT,
			location: {
				x: marker.point?.x || 0,
				y: 0,
				z: marker.point?.z || 0,
			},
			iconSize: marker.size ? [marker.size.x || 16, marker.size.z || 16] : [16, 16],
			iconUrl: `${this.config}images/icon/registered/${marker.icon || "default"}.png`,

			tooltip: marker.tooltip ? stripHTML(marker.tooltip) : '',
			tooltipHTML: marker.tooltip,
			popup: marker.popup,
			isPopupHTML: true,
		};
	}

	private static buildArea(id: string, area: any): LiveAtlasAreaMarker {
		let points;

		if(area.type === 'rectangle') {
			points = [
				{x: area.points[0].x, y: 0, z: area.points[0].z},
				{x: area.points[0].x, y: 0, z: area.points[1].z},
				{x: area.points[1].x, y: 0, z: area.points[1].z},
				{x: area.points[1].x, y: 0, z: area.points[0].z},
			];
		} else {
			points = this.addY(area.points);
		}

		const bounds = getBoundsFromPoints(points);

		return {
			id,
			type: LiveAtlasMarkerType.AREA,
			style: {
				stroke: (typeof area.stroke === 'undefined' || !!area.stroke) && !!area.color,
				color: area.color || '#3388ff',
				weight: area.weight || 3,
				opacity: typeof area.opacity !== 'undefined' ? area.opacity : 1,
				fill: (typeof area.fill === 'undefined' || !!area.fill) && !!area.fillColor,
				fillColor: area.fillColor || area.color || '#3388ff',
				fillOpacity: area.fillOpacity || 0.2,
				fillRule: area.fillRule,
			},
			points,
			bounds,
			location: getMiddle(bounds),
			outline: false,

			tooltip: area.tooltip ? stripHTML(area.tooltip) : '',
			tooltipHTML: area.tooltip,
			popup: area.popup,
			isPopupHTML: true,
		};
	}

	private static buildLine(id: string, line: any): LiveAtlasLineMarker {
		const points = this.addY(line.points),
			bounds = getBoundsFromPoints(points);

		return {
			id,
			type: LiveAtlasMarkerType.LINE,
			style: {
				stroke: (typeof line.stroke === 'undefined' || !!line.stroke) && !!line.color,
				color: line.color || '#3388ff',
				weight: line.weight || 3,
				opacity: typeof line.opacity !== 'undefined' ? line.opacity : 1,
			},
			points,
			bounds,
			location: getMiddle(bounds),
			tooltip: line.tooltip ? stripHTML(line.tooltip) : '',
			tooltipHTML: line.tooltip,
			popup: line.popup,
			isPopupHTML: true,
		};
	}

	private static buildCircle(id: string, circle: any): LiveAtlasCircleMarker {
		const radius = [circle.radiusX || circle.radius || 0, circle.radiusZ || circle.radius || 0] as PointTuple,
			location = {
				x: circle.center?.x || 0,
				y: 0,
				z: circle.center?.z || 0,
			};

		return {
			id,
			type: LiveAtlasMarkerType.CIRCLE,
			location,
			radius,
			bounds: {
				max: {x: location.x + radius[0], y: 0, z: location.z + radius[1] },
				min: {x: location.x - radius[0], y: 0, z: location.z - radius[1] },
			},
			style: {
				stroke: (typeof circle.stroke === 'undefined' || !!circle.stroke) && !!circle.color,
				color: circle.color || '#3388ff',
				weight: circle.weight || 3,
				opacity: typeof circle.opacity !== 'undefined' ? circle.opacity : 1,
				fill: (typeof circle.fill === 'undefined' || !!circle.fill) && !!circle.fillColor,
				fillColor: circle.fillColor || circle.color || '#3388ff',
				fillOpacity: circle.fillOpacity || 0.2,
				fillRule: circle.fillRule,
			},

			tooltip: circle.tooltip ? stripHTML(circle.tooltip) : '',
			tooltipHTML: circle.tooltip,
			popup: circle.popup,
			isPopupHTML: true,
		};
	}

	private static addY(points: any) {
		for (const point of points) {
			point.y = 0;
		}

		return points;
	}

	async loadServerConfiguration(): Promise<void> {
		if(this.configurationAbort) {
			this.configurationAbort.abort();
		}

		this.configurationAbort = new AbortController();

		const baseUrl = this.config,
			response = await Pl3xmapMapProvider.getJSON(`${baseUrl}tiles/settings.json`, this.configurationAbort.signal);

		if (response.error) {
			throw new Error(response.error);
		}

		const config = Pl3xmapMapProvider.buildServerConfig(response),
			worldNames: string[] = (response.worlds || []).filter((world: any) => world && !!world.name)
				.map((world: any) => world.name);

		const worldResponses = await Promise.all(worldNames.map(name =>
			Pl3xmapMapProvider.getJSON(`${baseUrl}tiles/${name}/settings.json`, this.configurationAbort!.signal)));

		this.store.commit(MutationTypes.SET_SERVER_CONFIGURATION, config);
		this.store.commit(MutationTypes.SET_MESSAGES, Pl3xmapMapProvider.buildMessagesConfig(response));
		this.store.commit(MutationTypes.SET_WORLDS, this.buildWorlds(response, worldResponses));
		this.store.commit(MutationTypes.SET_COMPONENTS, Pl3xmapMapProvider.buildComponents(response));
	}

	async populateWorld(world: LiveAtlasWorldDefinition) {
		const worldConfig = this.worldComponents.get(world.name);
		await this.getMarkerSets(world);

		this.playerUpdateInterval = this.worldPlayerUpdateIntervals.get(world.name) || 3000;
		this.markerUpdateInterval = this.worldMarkerUpdateIntervals.get(world.name) || 3000;

		this.store.commit(MutationTypes.SET_MARKER_SETS, this.markerSets);
		this.store.commit(MutationTypes.SET_MARKERS, this.markers);
		this.store.commit(MutationTypes.SET_COMPONENTS, worldConfig!.components);

		this.markerSets.clear();
		this.markers.clear();
	}

	createTileLayer(options: LiveAtlasTileLayerOptions): LiveAtlasTileLayer {
		return new Pl3xmapTileLayer(options);
	}

	private async getPlayers(): Promise<Set<LiveAtlasPlayer>> {
		const url = `${this.config}tiles/players.json`;

		if(this.playersAbort) {
			this.playersAbort.abort();
		}

		this.playersAbort = new AbortController();

		const response = await Pl3xmapMapProvider.getJSON(url, this.playersAbort.signal),
			players: Set<LiveAtlasPlayer> = new Set();

		(response.players || []).forEach((player: any) => {
			players.add({
				name: (player.name || '').toLowerCase(),
				uuid: player.uuid,
				displayName: player.display_name || player.name || "",
				health: player.health || 0,
				armor: player.armor || 0,
				sort: 0,
				hidden: false,
				location: {
					//Add 0.5 to position in the middle of a block
					x: !isNaN(player.x) ? player.x + 0.5 : 0,
					y: 0,
					z: !isNaN(player.z) ? player.z + 0.5 : 0,
					world: player.world,
				},
				yaw: !isNaN(player.yaw) ? parseFloat(player.yaw) + 180 : 0,
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

		this.store.commit(MutationTypes.SET_MAX_PLAYERS, response.max || 0);

		return players;
	}

	startUpdates() {
		this.updatesEnabled = true;
		this.updatePlayers();
		this.updateMarkers();
	}

	private async updatePlayers() {
		try {
			if(this.store.getters.playerMarkersEnabled) {
				const players = await this.getPlayers();

				this.playerUpdateTimestamp = new Date();

				await this.store.dispatch(ActionTypes.SET_PLAYERS, players);
			}
		} finally {
			if(this.updatesEnabled) {
				if(this.playerUpdateTimeout) {
					clearTimeout(this.playerUpdateTimeout);
				}

				this.playerUpdateTimeout = setTimeout(() => this.updatePlayers(), this.playerUpdateInterval);
			}
		}
	}

	private async updateMarkers() {
		//TODO: Implement once Pl3xmap offers a way to do this without recreating all markers
	}

	stopUpdates() {
		this.updatesEnabled = false;

		if (this.markerUpdateTimeout) {
			clearTimeout(this.markerUpdateTimeout);
		}

		if (this.playerUpdateTimeout) {
			clearTimeout(this.playerUpdateTimeout);
		}

		this.markerUpdateTimeout = null;
		this.playerUpdateTimeout = null;

		if(this.configurationAbort) {
			this.configurationAbort.abort();
		}

		if(this.playersAbort) {
			this.playersAbort.abort();
		}

		if(this.markersAbort) {
			this.markersAbort.abort();
		}
	}
}
