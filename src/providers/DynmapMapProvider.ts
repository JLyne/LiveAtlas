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
	LiveAtlasArea, LiveAtlasChat,
	LiveAtlasCircle, LiveAtlasComponentConfig,
	LiveAtlasDimension,
	LiveAtlasLine,
	LiveAtlasMarker,
	LiveAtlasMarkerSet,
	LiveAtlasPlayer, LiveAtlasServerConfig,
	LiveAtlasServerDefinition,
	LiveAtlasServerMessageConfig,
	LiveAtlasWorldDefinition
} from "@/index";
import {
	DynmapMarkerSetUpdates, DynmapTileUpdate, DynmapUpdate
} from "@/dynmap";
import {useStore} from "@/store";
import LiveAtlasMapDefinition from "@/model/LiveAtlasMapDefinition";
import ChatError from "@/errors/ChatError";
import {MutationTypes} from "@/store/mutation-types";
import MapProvider from "@/providers/MapProvider";
import {ActionTypes} from "@/store/action-types";
import {endWorldNameRegex, netherWorldNameRegex, titleColoursRegex} from "@/util";
import {getPoints} from "@/util/areas";
import {getLinePoints} from "@/util/lines";

export default class DynmapMapProvider extends MapProvider {
	private configurationAbort?: AbortController = undefined;
	private	markersAbort?: AbortController = undefined;
	private	updateAbort?: AbortController = undefined;

	private updatesEnabled = false;
	private updateTimeout: number = 0;
	private updateTimestamp: Date = new Date();
	private updateInterval: number = 3000;

	constructor(config: LiveAtlasServerDefinition) {
		super(config);
	}

	private static buildServerConfig(response: any): LiveAtlasServerConfig {
		return {
			grayHiddenPlayers: response.grayplayerswhenhidden || false,
			defaultMap: response.defaultmap || undefined,
			defaultWorld: response.defaultworld || undefined,
			defaultZoom: response.defaultzoom || 0,
			followMap: response.followmap || undefined,
			followZoom: response.followzoom || 0,
			title: response.title.replace(titleColoursRegex, '') || 'Dynmap',
			maxPlayers: response.maxcount || 0,
			expandUI: response.sidebaropened && response.sidebaropened !== 'false', //Sent as a string for some reason
		};
	}

	private static buildMessagesConfig(response: any): LiveAtlasServerMessageConfig {
		return {
			chatPlayerJoin: response.joinmessage || '',
			chatPlayerQuit: response.quitmessage || '',
			chatAnonymousJoin: response['msg-hiddennamejoin'] || '',
			chatAnonymousQuit: response['msg-hiddennamequit'] || '',
			chatErrorNotAllowed: response['msg-chatnotallowed'] || '',
			chatErrorRequiresLogin: response['msg-chatrequireslogin'] || '',
			chatErrorCooldown: response.spammessage || '',
			worldsHeading: response['msg-maptypes'] || '',
			playersHeading: response['msg-players'] || '',
		}
	}

	private buildWorlds(response: any): Array<LiveAtlasWorldDefinition> {
		const worlds: Map<string, LiveAtlasWorldDefinition> = new Map<string, LiveAtlasWorldDefinition>();

		//Get all the worlds first so we can handle append_to_world properly
		(response.worlds || []).forEach((world: any) => {
			let worldType: LiveAtlasDimension = 'overworld';

			if (netherWorldNameRegex.test(world.name) || (world.name == 'DIM-1')) {
				worldType = 'nether';
			} else if (endWorldNameRegex.test(world.name) || (world.name == 'DIM1')) {
				worldType = 'end';
			}

			worlds.set(world.name, {
				name: world.name,
				displayName: world.title || '',
				dimension: worldType,
				protected: world.protected || false,
				height: world.height || 256,
				seaLevel: world.sealevel || 64,
				center: {
					x: world.center.x || 0,
					y: world.center.y || 0,
					z: world.center.z || 0
				},
				maps: new Map(),
			});
		});

		(response.worlds || []).forEach((world: any) => {
			(world.maps || []).forEach((map: any) => {
				const worldName = map.append_to_world || world.name,
					w = worlds.get(worldName);

				if(!w) {
					console.warn(`Ignoring map '${map.name}' associated with non-existent world '${worldName}'`);
					return;
				}

				w.maps.set(map.name, Object.freeze(new LiveAtlasMapDefinition({
					world: w, //Ignore append_to_world here otherwise things break
					background: map.background || '#000000',
					backgroundDay: map.backgroundday || '#000000',
					backgroundNight: map.backgroundnight || '#000000',
					icon: map.icon || undefined,
					imageFormat: map['image-format'] || 'png',
					name: map.name || '(Unnamed map)',
					nightAndDay: map.nightandday || false,
					prefix: map.prefix || '',
					protected: map.protected || false,
					displayName: map.title || '',
					mapToWorld: map.maptoworld || undefined,
					worldToMap: map.worldtomap || undefined,
					nativeZoomLevels: map.mapzoomout || 1,
					extraZoomLevels: map.mapzoomin || 0
				})));
			});
		});

		return Array.from(worlds.values());
	}

	private buildComponents(response: any): LiveAtlasComponentConfig {
		const components: LiveAtlasComponentConfig = {
			markers: {
				showLabels: false,
			},
			chatBox: undefined,
			chatBalloons: false,
			playerMarkers: undefined,
			coordinatesControl: undefined,
			layerControl: response.showlayercontrol && response.showlayercontrol !== 'false', //Sent as a string for some reason
			linkControl: false,
			clockControl: undefined,
			logoControls: [],
			login: response['login-enabled'] || false,
		};

		(response.components || []).forEach((component: any) => {
			const type = component.type || "unknown";

			switch (type) {
				case "markers":
					components.markers = {
						showLabels: component.showlabel || false,
					}

					break;

				case "playermarkers":
					components.playerMarkers = {
						hideByDefault: component.hidebydefault || false,
						layerName: component.label || "Players",
						layerPriority: component.layerprio || 0,
						showBodies: component.showplayerbody || false,
						showSkinFaces: component.showplayerfaces || false,
						showHealth: component.showplayerhealth || false,
						smallFaces: component.smallplayerfaces || false,
					}

					break;

				case "coord":
					components.coordinatesControl = {
						showY: !(component.hidey || false),
						label: component.label || "Location: ",
						showRegion: component['show-mcr'] || false,
						showChunk: component['show-chunk'] || false,
					}

					break;

				case "link":
					components.linkControl = true;

					break;

				case "digitalclock":
					components.clockControl = {
						showDigitalClock: true,
						showWeather: false,
						showTimeOfDay: false,
					}
					break;

				case "timeofdayclock":
					components.clockControl = {
						showTimeOfDay: true,
						showDigitalClock: component.showdigitalclock || false,
						showWeather: component.showweather || false,
					}
					break;

				case "logo":
					components.logoControls.push({
						text: component.text || '',
						url: component.linkurl || undefined,
						position: component.position.replace('-', '') || 'topleft',
						image: component.logourl || undefined,
					});
					break;

				case "chat":
					if (response.allowwebchat) {
						components.chatSending = {
							loginRequired: response['webchat-requires-login'] || false,
							maxLength: response['chatlengthlimit'] || 256,
							cooldown: response['webchat-interval'] || 5,
						}
					}
					break;

				case "chatbox":
					components.chatBox = {
						allowUrlName: component.allowurlname || false,
						showPlayerFaces: component.showplayerfaces || false,
						messageLifetime: component.messagettl || Infinity,
						messageHistory: component.scrollback || Infinity,
					}
					break;

				case "chatballoon":
					components.chatBalloons = true;
			}
		});

		return components;
	}

	private static buildMarkerSet(id: string, data: any): any {
		return {
			id,
			label: data.label || "Unnamed set",
			hidden: data.hide || false,
			priority: data.layerprio || 0,
			showLabels: data.showlabels || undefined,
			minZoom: typeof data.minzoom !== 'undefined' && data.minzoom > -1 ? data.minzoom : undefined,
			maxZoom: typeof data.maxzoom !== 'undefined' && data.maxzoom > -1 ? data.maxzoom : undefined,
		}
	}

	private static buildMarkers(data: any): Map<string, LiveAtlasMarker> {
		const markers = Object.freeze(new Map()) as Map<string, LiveAtlasMarker>;

		for (const key in data) {
			if (!Object.prototype.hasOwnProperty.call(data, key)) {
				continue;
			}

			markers.set(key, DynmapMapProvider.buildMarker(data[key]));
		}

		return markers;
	}

	private static buildMarker(marker: any): LiveAtlasMarker {
		return {
			label: marker.label || '',
			location: {
				x: marker.x || 0,
				y: marker.y || 0,
				z: marker.z || 0,
			},
			dimensions: marker.dim ? marker.dim.split('x') : [16, 16],
			icon: marker.icon || "default",
			isHTML: marker.markup || false,
			minZoom: typeof marker.minzoom !== 'undefined' && marker.minzoom > -1 ? marker.minzoom : undefined,
			maxZoom: typeof marker.maxzoom !== 'undefined' && marker.maxzoom > -1 ? marker.maxzoom : undefined,
			popupContent: marker.desc || undefined,
		};
	}

	private static buildAreas(data: any): Map<string, LiveAtlasArea> {
		const areas = Object.freeze(new Map()) as Map<string, LiveAtlasArea>;

		for (const key in data) {
			if (!Object.prototype.hasOwnProperty.call(data, key)) {
				continue;
			}

			areas.set(key, DynmapMapProvider.buildArea(data[key]));
		}

		return areas;
	}

	private static buildArea(area: any): LiveAtlasArea {
		const opacity = area.fillopacity || 0,
			x = area.x || [0, 0],
			y: [number, number] = [area.ybottom || 0, area.ytop || 0],
			z = area.z || [0, 0];

		return {
			style: {
				color: area.color || '#ff0000',
				opacity: area.opacity || 1,
				weight: area.weight || 1,
				fillColor: area.fillcolor || '#ff0000',
				fillOpacity: area.fillopacity || 0,
			},
			outline: !opacity,
			label: area.label || '',
			isHTML: area.markup || false,
			points: getPoints(x, y, z, !opacity),
			minZoom: typeof area.minzoom !== 'undefined' && area.minzoom > -1 ? area.minzoom : undefined,
			maxZoom: typeof area.maxzoom !== 'undefined' && area.maxzoom > -1 ? area.maxzoom : undefined,
			popupContent: area.desc || undefined,
		};
	}

	private static buildLines(data: any): Map<string, LiveAtlasLine> {
		const lines = Object.freeze(new Map()) as Map<string, LiveAtlasLine>;

		for (const key in data) {
			if (!Object.prototype.hasOwnProperty.call(data, key)) {
				continue;
			}

			lines.set(key, DynmapMapProvider.buildLine(data[key]));
		}

		return lines;
	}

	private static buildLine(line: any): LiveAtlasLine {
		return {
			style: {
				color: line.color || '#ff0000',
				opacity: line.opacity || 1,
				weight: line.weight || 1,
			},
			label: line.label || '',
			isHTML: line.markup || false,
			points: getLinePoints(line.x || [0, 0], line.y || [0, 0], line.z || [0, 0]),
			minZoom: typeof line.minzoom !== 'undefined' && line.minzoom > -1 ? line.minzoom : undefined,
			maxZoom: typeof line.maxzoom !== 'undefined' && line.maxzoom > -1 ? line.maxzoom : undefined,
			popupContent: line.desc || undefined,
		};
	}

	private static buildCircles(data: any): Map<string, LiveAtlasCircle> {
		const circles = Object.freeze(new Map()) as Map<string, LiveAtlasCircle>;

		for (const key in data) {
			if (!Object.prototype.hasOwnProperty.call(data, key)) {
				continue;
			}

			circles.set(key, DynmapMapProvider.buildCircle(data[key]));
		}

		return circles;
	}

	private static buildCircle(circle: any): LiveAtlasCircle {
		return {
			location: {
				x: circle.x || 0,
				y: circle.y || 0,
				z: circle.z || 0,
			},
			radius: [circle.xr || 0, circle.zr || 0],
			style: {
				fillColor: circle.fillcolor || '#ff0000',
				fillOpacity: circle.fillopacity || 0,
				color: circle.color || '#ff0000',
				opacity: circle.opacity || 1,
				weight: circle.weight || 1,
			},
			label: circle.label || '',
			isHTML: circle.markup || false,

			minZoom: typeof circle.minzoom !== 'undefined' && circle.minzoom > -1 ? circle.minzoom : undefined,
			maxZoom: typeof circle.maxzoom !== 'undefined' && circle.maxzoom > -1 ? circle.maxzoom : undefined,
			popupContent: circle.desc || undefined,
		};
	}

	private buildUpdates(data: Array<any>) {
		const updates = {
				markerSets: new Map<string, DynmapMarkerSetUpdates>(),
				tiles: [] as DynmapTileUpdate[],
				chat: [] as LiveAtlasChat[],
			},
			dropped = {
				stale: 0,
				noSet: 0,
				noId: 0,
				unknownType: 0,
				unknownCType: 0,
				incomplete: 0,
				notImplemented: 0,
			},
			lastUpdate = this.updateTimestamp;

		let accepted = 0;

		for (const entry of data) {
			switch (entry.type) {
				case 'component': {
					if (lastUpdate && entry.timestamp < lastUpdate) {
						dropped.stale++;
						continue;
					}

					if (!entry.id) {
						dropped.noId++;
						continue;
					}

					//Set updates don't have a set field, the id is the set
					const set = entry.msg.startsWith("set") ? entry.id : entry.set;

					if (!set) {
						dropped.noSet++;
						continue;
					}

					if (entry.ctype !== 'markers') {
						dropped.unknownCType++;
						continue;
					}

					if (!updates.markerSets.has(set)) {
						updates.markerSets.set(set, {
							areaUpdates: [],
							markerUpdates: [],
							lineUpdates: [],
							circleUpdates: [],
							removed: false,
						});
					}

					const markerSetUpdates = updates.markerSets.get(set),
						update: DynmapUpdate = {
							id: entry.id,
							removed: entry.msg.endsWith('deleted'),
						};

					if (entry.msg.startsWith("set")) {
						markerSetUpdates!.removed = update.removed;
						markerSetUpdates!.payload = update.removed ? undefined : DynmapMapProvider.buildMarkerSet(set, entry);
					} else if (entry.msg.startsWith("marker")) {
						update.payload = update.removed ? undefined : DynmapMapProvider.buildMarker(entry);
						markerSetUpdates!.markerUpdates.push(Object.freeze(update));
					} else if (entry.msg.startsWith("area")) {
						update.payload = update.removed ? undefined : DynmapMapProvider.buildArea(entry);
						markerSetUpdates!.areaUpdates.push(Object.freeze(update));

					} else if (entry.msg.startsWith("circle")) {
						update.payload = update.removed ? undefined : DynmapMapProvider.buildCircle(entry);
						markerSetUpdates!.circleUpdates.push(Object.freeze(update));

					} else if (entry.msg.startsWith("line")) {
						update.payload = update.removed ? undefined : DynmapMapProvider.buildLine(entry);
						markerSetUpdates!.lineUpdates.push(Object.freeze(update));
					}

					accepted++;

					break;
				}

				case 'chat':
					if (!entry.message || !entry.timestamp) {
						dropped.incomplete++;
						continue;
					}

					if (entry.timestamp < lastUpdate) {
						dropped.stale++;
						continue;
					}

					if (entry.source !== 'player' && entry.source !== 'web') {
						dropped.notImplemented++;
						continue;
					}

					updates.chat.push({
						type: 'chat',
						source: entry.source || undefined,
						playerAccount: entry.account || undefined,
						playerName: entry.playerName || undefined,
						message: entry.message || "",
						timestamp: entry.timestamp,
						channel: entry.channel || undefined,
					});
					break;

				case 'playerjoin':
					if (!entry.account || !entry.timestamp) {
						dropped.incomplete++;
						continue;
					}

					if (entry.timestamp < lastUpdate) {
						dropped.stale++;
						continue;
					}

					updates.chat.push({
						type: 'playerjoin',
						playerAccount: entry.account,
						playerName: entry.playerName || "",
						timestamp: entry.timestamp || undefined,
					});
					break;

				case 'playerquit':
					if (!entry.account || !entry.timestamp) {
						dropped.incomplete++;
						continue;
					}

					if (entry.timestamp < lastUpdate) {
						dropped.stale++;
						continue;
					}

					updates.chat.push({
						type: 'playerleave',
						playerAccount: entry.account,
						playerName: entry.playerName || "",
						timestamp: entry.timestamp || undefined,
					});
					break;

				case 'tile':
					if (!entry.name || !entry.timestamp) {
						dropped.incomplete++;
						continue;
					}

					if (lastUpdate && entry.timestamp < lastUpdate) {
						dropped.stale++;
						continue;
					}

					updates.tiles.push({
						name: entry.name,
						timestamp: entry.timestamp,
					});

					accepted++;
					break;

				default:
					dropped.unknownType++;
			}
		}

		//Sort chat by newest first
		updates.chat = updates.chat.sort((one, two) => {
			return two.timestamp - one.timestamp;
		});

		console.debug(`Updates: ${accepted} accepted. Rejected: `, dropped);

		return updates;
	}

	private async getMarkerSets(world: LiveAtlasWorldDefinition): Promise<Map<string, LiveAtlasMarkerSet>> {
		const url = `${this.config.dynmap!.markers}_markers_/marker_${world.name}.json`;

		if(this.markersAbort) {
			this.markersAbort.abort();
		}

		this.markersAbort = new AbortController();

		const response = await DynmapMapProvider.fetchJSON(url, this.markersAbort.signal);
		const sets: Map<string, LiveAtlasMarkerSet> = new Map();

		response.sets = response.sets || {};

		for (const key in response.sets) {
			if (!Object.prototype.hasOwnProperty.call(response.sets, key)) {
				continue;
			}

			const set = response.sets[key],
				markers = DynmapMapProvider.buildMarkers(set.markers || {}),
				circles = DynmapMapProvider.buildCircles(set.circles || {}),
				areas = DynmapMapProvider.buildAreas(set.areas || {}),
				lines = DynmapMapProvider.buildLines(set.lines || {});

			sets.set(key, {
				...DynmapMapProvider.buildMarkerSet(key, set),
				markers,
				circles,
				areas,
				lines,
			});
		}

		return sets;
	}

	async loadServerConfiguration(): Promise<void> {
		if(this.configurationAbort) {
			this.configurationAbort.abort();
		}

		this.configurationAbort = new AbortController();

		const response = await DynmapMapProvider.fetchJSON(this.config.dynmap!.configuration, this.configurationAbort.signal);

		if (response.error === 'login-required') {
			throw new Error("Login required");
		} else if (response.error) {
			throw new Error(response.error);
		}

		const config = DynmapMapProvider.buildServerConfig(response);

		this.updateInterval = response.updaterate || 3000;

		this.store.commit(MutationTypes.SET_SERVER_CONFIGURATION, config);
		this.store.commit(MutationTypes.SET_SERVER_CONFIGURATION_HASH, response.confighash || 0);
		this.store.commit(MutationTypes.SET_SERVER_MESSAGES, DynmapMapProvider.buildMessagesConfig(response));
		this.store.commit(MutationTypes.SET_WORLDS, this.buildWorlds(response));
		this.store.commit(MutationTypes.SET_COMPONENTS, this.buildComponents(response));
		this.store.commit(MutationTypes.SET_LOGGED_IN, response.loggedin || false);
	}

	async populateWorld(world: LiveAtlasWorldDefinition): Promise<void> {
		const markerSets = await this.getMarkerSets(world);

		useStore().commit(MutationTypes.SET_MARKER_SETS, markerSets);
	}

	private async getUpdate(): Promise<void> {
		let url = this.config.dynmap!.update;
		url = url.replace('{world}', this.store.state.currentWorld!.name);
		url = url.replace('{timestamp}', this.updateTimestamp.getTime().toString());

		if(this.updateAbort) {
			this.updateAbort.abort();
		}

		this.updateAbort = new AbortController();

		const response = await DynmapMapProvider.fetchJSON(url, this.updateAbort.signal);
		const players: Set<LiveAtlasPlayer> = new Set(),
			updates = this.buildUpdates(response.updates || []),
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
		this.store.commit(MutationTypes.ADD_TILE_UPDATES, updates.tiles);
		this.store.commit(MutationTypes.ADD_CHAT, updates.chat);
		this.store.commit(MutationTypes.SET_SERVER_CONFIGURATION_HASH, response.confighash || 0);

		await this.store.dispatch(ActionTypes.SET_PLAYERS, players);
	}

	sendChatMessage(message: string) {
		const store = useStore();

		if (!store.state.components.chatSending) {
			return Promise.reject(store.state.messages.chatErrorDisabled);
		}

		return fetch(this.config.dynmap!.sendmessage, {
			method: 'POST',
			body: JSON.stringify({
				name: null,
				message: message,
			})
		}).then((response) => {
			if (response.status === 403) { //Rate limited
				throw new ChatError(store.state.messages.chatErrorCooldown
					.replace('%interval%', store.state.components.chatSending!.cooldown.toString()));
			}

			if (!response.ok) {
				throw new Error('Network request failed');
			}

			return response.json();
		}).then(response => {
			if (response.error !== 'none') {
				throw new ChatError(store.state.messages.chatErrorNotAllowed);
			}
		}).catch(e => {
			if (!(e instanceof ChatError)) {
				console.error(store.state.messages.chatErrorUnknown);
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

		this.updateTimeout = 0;
	}

	getTilesUrl(): string {
        return this.config.dynmap!.tiles;
    }

	getPlayerHeadUrl(head: HeadQueueEntry): string {
		const icon = (head.size === 'body') ? `faces/body/${head.name}.png` :`faces/${head.size}x${head.size}/${head.name}.png`

        return this.getMarkerIconUrl(icon);
    }

    getMarkerIconUrl(icon: string): string {
        return `${this.config.dynmap!.markers}_markers_/${icon}.png`;
    }

	destroy() {
		super.destroy();

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
}
