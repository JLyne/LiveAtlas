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
	LiveAtlasAreaMarker,
	LiveAtlasCircleMarker,
	LiveAtlasComponentConfig,
	LiveAtlasDimension,
	LiveAtlasLineMarker,
	LiveAtlasPointMarker,
	LiveAtlasMarkerSet, LiveAtlasMarkerSetContents,
	LiveAtlasPartialComponentConfig,
	LiveAtlasPlayer,
	LiveAtlasServerConfig,
	LiveAtlasServerDefinition,
	LiveAtlasServerMessageConfig,
	LiveAtlasWorldDefinition
} from "@/index";
import LiveAtlasMapDefinition from "@/model/LiveAtlasMapDefinition";
import {MutationTypes} from "@/store/mutation-types";
import MapProvider from "@/providers/MapProvider";
import {ActionTypes} from "@/store/action-types";
import {titleColoursRegex} from "@/util";

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
	private markers = new Map<string, LiveAtlasMarkerSetContents>();

	constructor(config: LiveAtlasServerDefinition) {
		super(config);
	}

	private static buildServerConfig(response: any): LiveAtlasServerConfig {
		return {
			title: (response.ui?.title || 'Pl3xmap').replace(titleColoursRegex, ''),
			expandUI: response.ui?.sidebar?.pinned === 'pinned',

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
					components: {},
				};

			this.worldMarkerUpdateIntervals.set(world.name, worldResponse.marker_update_interval || 3000);

			if(worldResponse.player_tracker?.enabled) {
				const health = !!worldResponse.player_tracker?.nameplates?.show_health,
					armor = !!worldResponse.player_tracker?.nameplates?.show_armor,
					images = !!worldResponse.player_tracker?.nameplates?.show_heads,
					updateInterval = worldResponse.player_tracker.update_interval ? worldResponse.player_tracker.update_interval * 1000 : 3000;

				this.worldPlayerUpdateIntervals.set(world.name, updateInterval);

				worldConfig.components.playerMarkers = {
					grayHiddenPlayers: true,
					hideByDefault: !!worldResponse.player_tracker?.default_hidden,
					layerName: worldResponse.player_tracker?.label || '',
					layerPriority: worldResponse.player_tracker?.priority,
					imageSize: images ? (health && armor ? 'large' : 'small') : 'none',
					showHealth: health,
					showArmor: armor,
					showYaw: true,
				}
			} else {
				worldConfig.components.playerMarkers = undefined;
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

			const maps: Map<string, LiveAtlasMapDefinition> = new Map();

			const w = {
				name: world.name || '(Unnamed world)',
				displayName: world.display_name || world.name,
				dimension,
				seaLevel: 0,
				center: {x: worldResponse.spawn.x, y: 0, z: worldResponse.spawn.z},
				defaultZoom: worldResponse.zoom.def || 1,
				maps,
			};

			maps.set('flat', Object.freeze(new LiveAtlasMapDefinition({
				world: w,

				background: 'transparent',
				backgroundDay: 'transparent',
				backgroundNight: 'transparent',
				icon: world.icon ? `${this.config.pl3xmap}images/icon/${world.icon}.png` : undefined,
				imageFormat: 'png',
				name: 'flat',
				displayName: 'Flat',

				nativeZoomLevels: worldResponse.zoom.max || 1,
				extraZoomLevels: worldResponse.zoom.extra || 0,
				tileUpdateInterval: worldResponse.tiles_update_interval ? worldResponse.tiles_update_interval * 1000 : undefined,
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

			//Configured per-world
			playerMarkers: undefined,

			//Not configurable
			markers: {
				showLabels: false,
			},
			playerList: {
				showImages: true,
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
		const url = `${this.config.pl3xmap}tiles/${world.name}/markers.json`;

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

			const id = set.id;

			const points: Map<string, LiveAtlasPointMarker> = Object.freeze(new Map()),
				circles: Map<string, LiveAtlasCircleMarker> = Object.freeze(new Map()),
				areas: Map<string, LiveAtlasAreaMarker> = Object.freeze(new Map()),
				lines: Map<string, LiveAtlasLineMarker> = Object.freeze(new Map());

			(set.markers || []).forEach((marker: any) => {
				switch(marker.type) {
					case 'icon':
						points.set(`marker-${points.size}`, Pl3xmapMapProvider.buildMarker(marker));
						break;

					case 'polyline':
						lines.set(`line-${lines.size}`, Pl3xmapMapProvider.buildLine(marker));
						break;

					case 'rectangle':
						areas.set(`area-${areas.size}`, Pl3xmapMapProvider.buildRectangle(marker));
						break;

					case 'polygon':
						areas.set(`area-${areas.size}`, Pl3xmapMapProvider.buildArea(marker));
						break;

					case 'circle':
					case 'ellipse':
						circles.set(`circle-${circles.size}`, Pl3xmapMapProvider.buildCircle(marker));
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
			this.markers.set(id, Object.seal({points, circles, areas, lines}));
		});
	}

	private static buildMarker(marker: any): LiveAtlasPointMarker {
		return {
			location: {
				x: marker.point?.x || 0,
				y: 0,
				z: marker.point?.z || 0,
			},
			dimensions: marker.size ? [marker.size.x || 16, marker.size.z || 16] : [16, 16],
			icon: marker.icon || "default",

			label: (marker.tooltip || '').trim(),
			isLabelHTML: true
		};
	}

	private static buildRectangle(area: any): LiveAtlasAreaMarker {
		return {
			style: {
				stroke: typeof area.stroke !== 'undefined' ? !!area.stroke : true,
				color: area.color || '#3388ff',
				weight: area.weight || 3,
				opacity: typeof area.opacity !== 'undefined' ? area.opacity : 1,
				fill: typeof area.stroke !== 'undefined' ? !!area.stroke : true,
				fillColor: area.fillColor || area.color || '#3388ff',
				fillOpacity: area.fillOpacity || 0.2,
				fillRule: area.fillRule,
			},
			points: [
				area.points[0],
				{x: area.points[0].x, z: area.points[1].z},
				area.points[1],
				{x: area.points[1].x, z: area.points[0].z},
			],
			outline: false,

			tooltipContent: area.tooltip,
			popupContent: area.popup,
			isPopupHTML: true,
		};
	}

	private static buildArea(area: any): LiveAtlasAreaMarker {
		return {
			style: {
				stroke: typeof area.stroke !== 'undefined' ? !!area.stroke : true,
				color: area.color || '#3388ff',
				weight: area.weight || 3,
				opacity: typeof area.opacity !== 'undefined' ? area.opacity : 1,
				fill: typeof area.fill !== 'undefined' ? !!area.fill : true,
				fillColor: area.fillColor || area.color || '#3388ff',
				fillOpacity: area.fillOpacity || 0.2,
				fillRule: area.fillRule,
			},
			points: area.points,
			outline: false,

			tooltipContent: area.tooltip,
			popupContent: area.popup,
			isPopupHTML: true,
		};
	}

	private static buildLine(line: any): LiveAtlasLineMarker {
		return {
			style: {
				stroke: typeof line.stroke !== 'undefined' ? !!line.stroke : true,
				color: line.color || '#3388ff',
				weight: line.weight || 3,
				opacity: typeof line.opacity !== 'undefined' ? line.opacity : 1,
			},
			points: line.points,

			tooltipContent: line.tooltip,
			popupContent: line.popup,
			isPopupHTML: true,
		};
	}

	private static buildCircle(circle: any): LiveAtlasCircleMarker {
		return {
			location: {
				x: circle.center?.x || 0,
				y: 0,
				z: circle.center?.z || 0,
			},
			radius: [circle.radiusX || circle.radius || 0, circle.radiusZ || circle.radius || 0],
			style: {
				stroke: typeof circle.stroke !== 'undefined' ? !!circle.stroke : true,
				color: circle.color || '#3388ff',
				weight: circle.weight || 3,
				opacity: typeof circle.opacity !== 'undefined' ? circle.opacity : 1,
				fill: typeof circle.stroke !== 'undefined' ? !!circle.stroke : true,
				fillColor: circle.fillColor || circle.color || '#3388ff',
				fillOpacity: circle.fillOpacity || 0.2,
				fillRule: circle.fillRule,
			},

			tooltipContent: circle.tooltip,
			popupContent: circle.popup,
			isPopupHTML: true
		};
	}

	async loadServerConfiguration(): Promise<void> {
		if(this.configurationAbort) {
			this.configurationAbort.abort();
		}

		this.configurationAbort = new AbortController();

		const baseUrl = this.config.pl3xmap,
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
		this.store.commit(MutationTypes.SET_SERVER_MESSAGES, Pl3xmapMapProvider.buildMessagesConfig(response));
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

	private async getPlayers(): Promise<Set<LiveAtlasPlayer>> {
		const url = `${this.config.pl3xmap}tiles/players.json`;

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
			if(this.store.state.components.playerMarkers) {
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
	}

    getTilesUrl(): string {
        return `${this.config.pl3xmap}tiles/`;
    }

	getPlayerHeadUrl(head: HeadQueueEntry): string {
		//TODO: Listen to config
        return 'https://mc-heads.net/avatar/{uuid}/16'.replace('{uuid}', head.uuid || '');
    }

    getMarkerIconUrl(icon: string): string {
        return `${this.config.pl3xmap}images/icon/registered/${icon}.png`;
    }

	destroy() {
		super.destroy();

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
