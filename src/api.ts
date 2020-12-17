/*
 * Copyright 2020 James Lyne
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

import {
	DynmapArea,
	DynmapChat,
	DynmapCircle,
	DynmapComponentConfig,
	DynmapConfigurationResponse,
	DynmapLine,
	DynmapMarker,
	DynmapMarkerSet,
	DynmapMarkerSetUpdates,
	DynmapMessageConfig,
	DynmapPlayer,
	DynmapServerConfig,
	DynmapTileUpdate,
	DynmapUpdate,
	DynmapUpdateResponse,
	DynmapUpdates,
	DynmapWorld,
	DynmapWorldMap
} from "@/dynmap";
import {Sanitizer} from "@esri/arcgis-html-sanitizer";
import {useStore} from "@/store";

const sanitizer = new Sanitizer();

function buildServerConfig(response: any): DynmapServerConfig {
	return {
		version: response.dynmapversion || '',
		allowChat: response.allowwebchat || false,
		chatRequiresLogin: response['webchat-requires-login'] || false,
		chatInterval: response['webchat-interval'] || 5,
		defaultMap: response.defaultmap || undefined,
		defaultWorld: response.defaultworld || undefined,
		defaultZoom: response.defaultzoom || 0,
		followMap: response.followmap || undefined,
		followZoom: response.followzoom || 0,
		updateInterval: response.updaterate || 3000,
		showLayerControl: response.showlayercontrol || true,
		title: response.title || 'Dynmap',
		loginEnabled: response['login-enabled'] || false,
		loginRequired: response.loginrequired || false,
		maxPlayers: response.maxcount || 0,
		hash: response.confighash || 0,
	};
}

function buildMessagesConfig(response: any): DynmapMessageConfig {
	return {
		chatNotAllowed: response['msg-chatnotallowed'] || '',
		chatRequiresLogin: response['msg-chatrequireslogin'] || '',
		chatCooldown: response.spammessage || '',
		mapTypes: response['msg-maptypes'] || '',
		players: response['msg-players'] || '',
		playerJoin: response.joinmessage || '',
		playerQuit: response.quitmessage || '',
		anonymousJoin: response['msg-hiddennamejoin'] || '',
		anonymousQuit: response['msg-hiddennamequit'] || '',
	}
}

function buildWorlds(response: any): Array<DynmapWorld> {
	const worlds: Array<DynmapWorld> = [];

	(response.worlds || []).forEach((world: any) => {
		const maps: Map<string, DynmapWorldMap> = new Map();

		(world.maps || []).forEach((map: any) => {
			maps.set(map.name, {
				world: world,
				background: '#121212', //map.background || '#000000',
				backgroundDay: map.backgroundday || '#000000',
				backgroundNight: map.backgroundnight || '#000000',
				compassView: map.compassview || 'S',
				icon: map.icon || undefined,
				imageFormat: map['image-format'] || 'png',
				name: map.name || '(Unnamed map)',
				nightAndDay: map.nightandday || false,
				prefix: map.prefix || '',
				protected: map.protected || false,
				title: map.title || '',
				type: map.type || 'HDMapType',
				mapToWorld: map.maptoworld || [0, 0, 0, 0, 0, 0, 0, 0, 0],
				worldToMap: map.worldtomap || [0, 0, 0, 0, 0, 0, 0, 0, 0],
				nativeZoomLevels: map.mapzoomout || 1,
				extraZoomLevels: map.mapzoomin || 0,
			});
		});

		worlds.push({
			seaLevel: world.sealevel || 64,
			name: world.name || '(Unnamed world)',
			protected: world.protected || false,
			title: world.title || '',
			height: world.height || 256,
			center: {
				x: world.center.x || 0,
				y: world.center.y || 0,
				z: world.center.z || 0
			},
			maps,
		});
	});

	return worlds;
}

function buildComponents(response: any): DynmapComponentConfig {
	const components: DynmapComponentConfig = {
			markers: {
				showLabels: false,
			},
			playerMarkers: undefined,
			coordinatesControl: undefined,
			linkControl: false,
			clockControl: undefined,
			logoControls: [],
		};

	(response.components || []).forEach((component: any) => {
		const type = component.type || "unknown";

		switch(type) {
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
		}
	});

	return components;
}

function buildMarkers(data: any): Map<string, DynmapMarker> {
	const markers = Object.freeze(new Map()) as Map<string, DynmapMarker>;

	for(const key in data) {
		if (!Object.prototype.hasOwnProperty.call(data, key)) {
			continue;
		}

		markers.set(key, buildMarker(data[key]));
	}

	return markers;
}

function buildMarker(marker: any): DynmapMarker {
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
		minZoom: marker.minzoom || undefined,
		maxZoom: marker.maxZoom || undefined,
		popupContent: marker.desc || undefined,
	};
}

function buildAreas(data: any): Map<string, DynmapArea> {
	const areas = Object.freeze(new Map()) as Map<string, DynmapArea>;

	for(const key in data) {
		if (!Object.prototype.hasOwnProperty.call(data, key)) {
			continue;
		}

		areas.set(key, buildArea(data[key]));
	}

	return areas;
}

function buildArea(area: any): DynmapArea {
	return  {
		style: {
			color: area.color || '#ff0000',
			opacity: area.opacity || 1,
			weight: area.weight || 1,
			fillColor: area.fillcolor || '#ff0000',
			fillOpacity: area.fillopacity || 0,
		},
		label: area.label || '',
		isHTML: area.markup || false,
		x: area.x || [0, 0],
		y: [area.ybottom || 0, area.ytop || 0],
		z: area.z || [0, 0],
		minZoom: area.minzoom || undefined,
		maxZoom: area.maxZoom || undefined,
		popupContent: area.desc || undefined,
	};
}

function buildLines(data: any): Map<string, DynmapLine> {
	const lines = Object.freeze(new Map()) as Map<string, DynmapLine>;

	for(const key in data) {
		if (!Object.prototype.hasOwnProperty.call(data, key)) {
			continue;
		}

		lines.set(key, buildLine(data[key]));
	}

	return lines;
}

function buildLine(line: any): DynmapLine {
	return {
		x: line.x || [0, 0],
		y: line.y || [0, 0],
		z: line.z || [0, 0],
		style: {
			color: line.color || '#ff0000',
			opacity: line.opacity || 1,
			weight: line.weight || 1,
		},
		label: line.label || '',
		isHTML: line.markup || false,
		minZoom: line.minzoom || undefined,
		maxZoom: line.maxZoom || undefined,
		popupContent: line.desc || undefined,
	};
}

function buildCircles(data: any): Map<string, DynmapCircle> {
	const circles = Object.freeze(new Map()) as Map<string, DynmapCircle>;

	for(const key in data) {
		if (!Object.prototype.hasOwnProperty.call(data, key)) {
			continue;
		}

		circles.set(key, buildCircle(data[key]));
	}

	return circles;
}

function buildCircle(circle: any): DynmapCircle {
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

		minZoom: circle.minzoom || undefined,
		maxZoom: circle.maxZoom || undefined,
		popupContent: circle.desc || undefined,
	};
}

function buildUpdates(data: Array<any>): DynmapUpdates {
	const updates = {
		markerSets: new Map<string, DynmapMarkerSetUpdates>(),
		tiles: [] as DynmapTileUpdate[],
		chat: [] as DynmapChat[],
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
		lastUpdate = useStore().state.updateTimestamp;

	let accepted = 0;

	for(const entry of data) {
		switch(entry.type) {
			case 'component': {
				if(lastUpdate && entry.timestamp < lastUpdate) {
					dropped.stale++;
					continue;
				}

				if(!entry.id) {
					dropped.noId++;
					continue;
				}

				if(!entry.set) {
					dropped.noSet++;
					continue;
				}

				if(entry.ctype !== 'markers') {
					dropped.unknownCType++;
					continue;
				}

				if(!updates.markerSets.has(entry.set)) {
					updates.markerSets.set(entry.set, {
						areaUpdates: [],
						markerUpdates: [],
						lineUpdates: [],
						circleUpdates: [],
					});
				}

				const markerSetUpdates = updates.markerSets.get(entry.set),
					update: DynmapUpdate = {
						id: entry.id,
						removed: entry.msg.endsWith('deleted'),
					};

				if(entry.msg.startsWith("marker")) {
					update.payload = update.removed ? undefined : buildMarker(entry);
					markerSetUpdates!.markerUpdates.push(Object.freeze(update));
				} else if(entry.msg.startsWith("area")) {
					update.payload = update.removed ? undefined : buildArea(entry);
					markerSetUpdates!.areaUpdates.push(Object.freeze(update));

				} else if(entry.msg.startsWith("circle")) {
					update.payload = update.removed ? undefined : buildCircle(entry);
					markerSetUpdates!.circleUpdates.push(Object.freeze(update));

				} else if(entry.msg.startsWith("line")) {
					update.payload = update.removed ? undefined : buildLine(entry);
					markerSetUpdates!.lineUpdates.push(Object.freeze(update));
				}

				accepted++;

				break;
			}

			case 'chat':
				if(!entry.account || !entry.message || !entry.timestamp) {
					dropped.incomplete++;
					continue;
				}

				if(entry.timestamp < lastUpdate) {
					dropped.stale++;
					continue;
				}

				if(entry.source !== 'player') {
					dropped.notImplemented++;
					continue;
				}

				updates.chat.push({
					type: 'chat',
					account: entry.account,
					message: entry.message,
					timestamp: entry.timestamp,
					channel: entry.channel || undefined,
				});
				break;

			case 'tile':
				if(!entry.name || !entry.timestamp) {
					dropped.incomplete++;
					continue;
				}

				if(lastUpdate && entry.timestamp < lastUpdate) {
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

	updates.chat = updates.chat.sort((one, two) => {
		return one.timestamp - two.timestamp;
	});

	console.debug(`Updates: ${accepted} accepted. Rejected: `, dropped);

	return updates;
}

export default {
	getConfiguration(): Promise<DynmapConfigurationResponse> {
		return fetch(window.config.url.configuration).then(response => {
			if (!response.ok) {
				throw new Error('Network response was not ok');
			}

			return response.json();
		}).then((response): DynmapConfigurationResponse => {
			return {
				config: buildServerConfig(response),
				messages: buildMessagesConfig(response),
				worlds: buildWorlds(response),
				components: buildComponents(response),
			}
		});
	},

	getUpdate(requestId: number, world: string, timestamp: number): Promise<DynmapUpdateResponse> {
		let url = window.config.url.update;
		url = url.replace('{world}', world);
		url = url.replace('{timestamp}', timestamp.toString());

		return fetch(url).then(response => {
			if (!response.ok) {
				throw new Error('Network response was not ok');
			}

			return response.json();
		}).then((response): DynmapUpdateResponse => {
			const players: Set<DynmapPlayer> = new Set();

			(response.players || []).forEach((player: any) => {
				players.add({
					account: player.account || "",
					health: player.health || 0,
					armor: player.armor || 0,
					name: player.name ? sanitizer.sanitize(player.name) : "Steve",
					sort: player.sort || 0,
					location: {
						x: player.x || 0,
						y: player.y || 0,
						z: player.z || 0,
						world: player.world || undefined,
					}
				});
			});

			//Extra fake players for testing
			// for(let i = 0; i < 150; i++) {
			// 	players.add({
			// 		account: "VIDEO GAMES " + i,
			// 		health: Math.round(Math.random() * 10),
			// 		armor: Math.round(Math.random() * 10),
			// 		name: "VIDEO GAMES " + i,
			// 		sort: 0,
			// 		location: {
			// 			x: Math.round(Math.random() * 1000) - 500,
			// 			y: 64,
			// 			z: Math.round(Math.random() * 1000) - 500,
			// 			world: "world",
			// 		}
			// 	});
			// }

			return {
				worldState: {
					timeOfDay: response.servertime || 0,
					thundering: response.isThundering || false,
					raining: response.hasStorm || false,
				},
				playerCount: response.count || 0,
				configHash: response.configHash || 0,
				timestamp: response.timestamp || 0,
				players,
				updates: buildUpdates(response.updates || []),
			}
		});
	},

	getMarkerSets(world: string): Promise<Map<string, DynmapMarkerSet>> {
		const url = `${window.config.url.markers}_markers_/marker_${world}.json`;

		return fetch(url).then(response => {
			if (!response.ok) {
				throw new Error('Network response was not ok');
			}

			return response.json();
		}).then((response): Map<string, DynmapMarkerSet> => {
			const sets: Map<string, DynmapMarkerSet> = new Map();

			response.sets = response.sets || {};

			for(const key in response.sets) {
				if(!Object.prototype.hasOwnProperty.call(response.sets, key)) {
					continue;
				}

				const set = response.sets[key],
					markers = buildMarkers(set.markers || {}),
					circles = buildCircles(set.circles || {}),
					areas = buildAreas(set.areas || {}),
					lines = buildLines(set.lines || {});

				sets.set(key, {
					id: key,
					label: set.label || "Unnamed set",
					hidden: set.hide || false,
					priority: set.layerprio || 0,
					showLabels: set.showlabels || undefined,
					minZoom: set.minzoom || undefined,
					maxZoom: set.maxzoom || undefined,
					markers,
					areas,
					lines,
					circles,
				});
			}

			return sets;
		});
	}
}
