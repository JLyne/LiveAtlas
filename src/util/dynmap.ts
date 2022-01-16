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

import {DynmapMarkerSetUpdate, DynmapMarkerUpdate, DynmapTileUpdate} from "@/dynmap";
import {
	LiveAtlasAreaMarker,
	LiveAtlasChat,
	LiveAtlasCircleMarker,
	LiveAtlasComponentConfig,
	LiveAtlasDimension,
	LiveAtlasLineMarker, LiveAtlasMarker,
	LiveAtlasPlayerImageSize,
	LiveAtlasPointMarker,
	LiveAtlasServerConfig,
	LiveAtlasServerMessageConfig,
	LiveAtlasWorldDefinition
} from "@/index";
import {getPoints} from "@/util/areas";
import {
	decodeHTMLEntities,
	endWorldNameRegex, getBounds,
	getMiddle,
	netherWorldNameRegex,
	stripHTML,
	titleColoursRegex
} from "@/util";
import {getLinePoints} from "@/util/lines";
import LiveAtlasMapDefinition from "@/model/LiveAtlasMapDefinition";
import {
	Configuration,
	Marker,
	MarkerArea,
	MarkerCircle,
	MarkerLine,
	MarkerSet,
	Options,
	WorldConfiguration,
	WorldMapConfiguration
} from "dynmap";
import {PointTuple} from "leaflet";
import {LiveAtlasMarkerType} from "@/util/markers";

export function buildServerConfig(response: Options): LiveAtlasServerConfig {
	let title = 'Dynmap';

	if(response.title) {
		title = response.title.replace(titleColoursRegex, '') || title;
	}

	const followZoom = parseInt(response.followzoom || "", 10);

	return {
		defaultMap: response.defaultmap || undefined,
		defaultWorld: response.defaultworld || undefined,
		defaultZoom: response.defaultzoom || 0,
		followMap: response.followmap || undefined,
		followZoom: isNaN(followZoom) ? undefined : followZoom,
		title: title,
		expandUI: !!response.sidebaropened && response.sidebaropened !== 'false', //Sent as a string for some reason
	};
}

export function buildMessagesConfig(response: Options): LiveAtlasServerMessageConfig {
	return {
		chatPlayerJoin: response.joinmessage || '',
		chatPlayerQuit: response.quitmessage || '',
		chatAnonymousJoin: response['msg-hiddennamejoin'] || '',
		chatAnonymousQuit: response['msg-hiddennamequit'] || '',
		chatErrorNotAllowed: response['msg-chatnotallowed'] || '',
		chatErrorRequiresLogin: response['msg-chatrequireslogin'] || '',
		chatErrorCooldown: response.spammessage || '',
		worldsHeading: response['msg-maptypes'] || '',
		playersHeading: response['msg-players'] ? `${response['msg-players']} ({cur}/{max})` : '',
	}
}

export function buildWorlds(response: Configuration): Array<LiveAtlasWorldDefinition> {
	const worlds: Map<string, LiveAtlasWorldDefinition> = new Map<string, LiveAtlasWorldDefinition>();

	//Get all the worlds first so we can handle append_to_world properly
	(response.worlds || []).forEach((world: WorldConfiguration) => {
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
			seaLevel: world.sealevel || 64,
			center: {
				x: world.center.x || 0,
				y: world.center.y || 0,
				z: world.center.z || 0
			},
			maps: new Map(),
		});
	});

	(response.worlds || []).forEach((world: WorldConfiguration) => {
		(world.maps || []).forEach((map: WorldMapConfiguration) => {
			const actualWorld = worlds.get(world.name),
				// @ts-ignore
				assignedWorldName = map.append_to_world || world.name, //handle append_to_world
				assignedWorld = worlds.get(assignedWorldName);

			if (!assignedWorld || !actualWorld) {
				console.warn(`Ignoring map '${map.name}' associated with non-existent world '${assignedWorldName}'`);
				return;
			}

			assignedWorld.maps.set(map.name, Object.freeze(new LiveAtlasMapDefinition({
				world: actualWorld, //Ignore append_to_world here for Dynmap URL parity
				background: map.background || '#000000',
				backgroundDay: map.backgroundday || '#000000',
				backgroundNight: map.backgroundnight || '#000000',
				icon: (map.icon || undefined) as string | undefined,
				imageFormat: map['image-format'] || 'png',
				name: map.name || '(Unnamed map)',
				nightAndDay: map.nightandday || false,
				prefix: map.prefix || '',
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

export function buildComponents(response: Configuration): LiveAtlasComponentConfig {
	const components: LiveAtlasComponentConfig = {
		markers: {
			showLabels: false,
		},
		chatBox: undefined,
		chatBalloons: false,
		playerMarkers: undefined,
		playerList: {
			showImages: response.showplayerfacesinmenu || false,
		},
		coordinatesControl: undefined,
		layerControl: !!response.showlayercontrol && response.showlayercontrol !== 'false', //Sent as a string for some reason
		linkControl: false,
		clockControl: undefined,
		logoControls: [],
		login: response['login-enabled'] || false,
	};

	(response.components || []).forEach((component: any) => {
		const type = component.type || "unknown";
		let imageSize: LiveAtlasPlayerImageSize = 'large';

		switch (type) {
			case "markers":
				components.markers = {
					showLabels: component.showlabel || false,
				}

				break;

			case "playermarkers":
				if(!component.showplayerfaces) {
					imageSize = 'none';
				} else if(component.smallplayerfaces) {
					imageSize = 'small';
				} else if(component.showplayerbody) {
					imageSize = 'body';
				}

				components.playerMarkers = {
					grayHiddenPlayers: response.grayplayerswhenhidden || false,
					hideByDefault: component.hidebydefault || false,
					layerName: component.label || "Players",
					layerPriority: component.layerprio || 0,
					imageSize,
					showHealth: component.showplayerhealth || false,
					showArmor: component.showplayerhealth || false,
					showYaw: false,
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

export function buildMarkerSet(id: string, data: MarkerSet): any {
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

export function buildMarkers(data: any, list: Map<string, LiveAtlasMarker>): void {
	let id;

	for (const key in data) {
		if (!Object.prototype.hasOwnProperty.call(data, key)) {
			continue;
		}

		id = `point_${key}`;
		list.set(id, buildMarker(id, data[key]));
	}
}

export function buildMarker(id: string, data: Marker): LiveAtlasPointMarker {
	let dimensions;

	if(data.dim) {
		dimensions = data.dim.split('x').filter(value => !isNaN(Number(value)));

		if(dimensions.length !== 2) {
			dimensions = undefined;
		}
	}

	const marker = {
		id,
		type: LiveAtlasMarkerType.POINT,
		location: {
			x: data.x || 0,
			y: data.y || 0,
			z: data.z || 0,
		},
		dimensions: (dimensions || [16, 16]) as PointTuple,
		icon: data.icon || "default",
		minZoom: typeof data.minzoom !== 'undefined' && data.minzoom > -1 ? data.minzoom : undefined,
		maxZoom: typeof data.maxzoom !== 'undefined' && data.maxzoom > -1 ? data.maxzoom : undefined,
		tooltip: data.markup ? stripHTML(data.label) : data.label,
		tooltipHTML: data.markup ? data.label : undefined,
		popup: data.desc || undefined,
		isPopupHTML: true,
	} as LiveAtlasPointMarker;

	//Fix double escaping on non-HTML labels
	if(!marker.tooltipHTML) {
		marker.tooltip = decodeHTMLEntities(marker.tooltip);
	}

	return marker;
}

export function buildAreas(data: any, list: Map<string, LiveAtlasMarker>): void {
	let id;

	for (const key in data) {
		if (!Object.prototype.hasOwnProperty.call(data, key)) {
			continue;
		}

		id = `area_${key}`;
		list.set(id, buildArea(id, data[key]));
	}
}

export function buildArea(id: string, area: MarkerArea): LiveAtlasAreaMarker {
	const x = area.x || [0, 0],
		y = [area.ybottom || 0, area.ytop || 0] as [number, number],
		z = area.z || [0, 0],
		bounds = getBounds(x, y, z),
		location = getMiddle(bounds);

	return {
		id,
		type: LiveAtlasMarkerType.AREA,
		style: {
			color: area.color || '#ff0000',
			opacity: area.opacity || 1,
			weight: area.weight || 1,
			fillColor: area.fillcolor || '#ff0000',
			fillOpacity: area.fillopacity || 0,
		},
		outline: !area.fillopacity,
		bounds,
		location,
		points: getPoints(x, y, z, !area.fillopacity),
		minZoom: typeof area.minzoom !== 'undefined' && area.minzoom > -1 ? area.minzoom : undefined,
		maxZoom: typeof area.maxzoom !== 'undefined' && area.maxzoom > -1 ? area.maxzoom : undefined,

		tooltip: area.markup ? stripHTML(area.label) : area.label,
		tooltipHTML: area.markup ? area.label : undefined,
		popup: area.desc || area.label || undefined,
		isPopupHTML: area.desc ? true : area.markup || false,
	};
}

export function buildLines(data: any, list: Map<string, LiveAtlasMarker>): void {
	let id;

	for (const key in data) {
		if (!Object.prototype.hasOwnProperty.call(data, key)) {
			continue;
		}

		id = `line_${key}`;
		list.set(id, buildLine(id, data[key]));
	}
}

export function buildLine(id: string, line: MarkerLine): LiveAtlasLineMarker {
	const x = line.x || [0, 0],
		y = line.y || [0, 0],
		z = line.z || [0, 0],
		bounds = getBounds(x, y, z),
		location = getMiddle(bounds);

	return {
		id,
		type: LiveAtlasMarkerType.LINE,
		style: {
			color: line.color || '#ff0000',
			opacity: line.opacity || 1,
			weight: line.weight || 1,
		},
		location,
		bounds,
		points: getLinePoints(x, y, z),
		minZoom: typeof line.minzoom !== 'undefined' && line.minzoom > -1 ? line.minzoom : undefined,
		maxZoom: typeof line.maxzoom !== 'undefined' && line.maxzoom > -1 ? line.maxzoom : undefined,

		tooltip: line.markup ? stripHTML(line.label) : line.label,
		tooltipHTML: line.markup ? line.label : undefined,
		popup: line.desc || line.label || undefined,
		isPopupHTML: line.desc ? true : line.markup || false,
	};
}

export function buildCircles(data: any, list: Map<string, LiveAtlasMarker>): void {
	let id;

	for (const key in data) {
		if (!Object.prototype.hasOwnProperty.call(data, key)) {
			continue;
		}

		id = `circle_${key}`;
		list.set(id, buildCircle(id, data[key]));
	}
}

export function buildCircle(id: string, circle: MarkerCircle): LiveAtlasCircleMarker {
	return {
		id,
		type: LiveAtlasMarkerType.CIRCLE,
		location: {
			x: circle.x || 0,
			y: circle.y || 0,
			z: circle.z || 0,
		},
		bounds: {
			max: {
				x: (circle.x || 0) + (circle.xr || 0),
				y: circle.y || 0,
				z: (circle.z || 0) + (circle.z || 0),
			},
			min: {
				x: (circle.x || 0) - (circle.xr || 0),
				y: circle.y || 0,
				z: (circle.z || 0) - (circle.z || 0),
			}
		},
		radius: [circle.xr || 0, circle.zr || 0],
		style: {
			fillColor: circle.fillcolor || '#ff0000',
			fillOpacity: circle.fillopacity || 0,
			color: circle.color || '#ff0000',
			opacity: circle.opacity || 1,
			weight: circle.weight || 1,
		},
		minZoom: typeof circle.minzoom !== 'undefined' && circle.minzoom > -1 ? circle.minzoom : undefined,
		maxZoom: typeof circle.maxzoom !== 'undefined' && circle.maxzoom > -1 ? circle.maxzoom : undefined,

		tooltip: circle.markup ? stripHTML(circle.label) : circle.label,
		tooltipHTML: circle.markup ? circle.label : undefined,
		popup: circle.desc || circle.label || undefined,
		isPopupHTML: circle.desc ? true : circle.markup || false,
	};
}

export function buildUpdates(data: Array<any>, lastUpdate: Date) {
	const updates = {
			markerSets: [] as DynmapMarkerSetUpdate[],
			markers: [] as DynmapMarkerUpdate[],
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
		};

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

				const update: any = {
					id: entry.id,
					removed: entry.msg.endsWith('deleted'),
					set,
				};

				if (entry.msg.startsWith("set")) {
					if(!update.removed) {
						update.payload = buildMarkerSet(set, entry);
					}

					updates.markerSets.push(Object.freeze(update as DynmapMarkerSetUpdate));
				} else {
					if (entry.msg.startsWith("marker")) {
						update.id = `point_${entry.id}`;
						update.type = LiveAtlasMarkerType.POINT;
						update.payload = update.removed ? undefined : buildMarker(update.id, entry);
					} else if (entry.msg.startsWith("area")) {
						update.id = `area_${entry.id}`;
						update.type = LiveAtlasMarkerType.AREA;
						update.payload = update.removed ? undefined : buildArea(update.id, entry);
					} else if (entry.msg.startsWith("circle")) {
						update.id = `circle_${entry.id}`;
						update.type = LiveAtlasMarkerType.CIRCLE;
						update.payload = update.removed ? undefined : buildCircle(update.id, entry);
					} else if (entry.msg.startsWith("line")) {
						update.id = `line_${entry.id}`;
						update.type = LiveAtlasMarkerType.LINE;
						update.payload = update.removed ? undefined : buildLine(update.id, entry);
					}

					updates.markers.push(Object.freeze(update as DynmapMarkerUpdate));
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

				if (entry.source !== 'player' && entry.source !== 'web' && entry.source !== 'plugin') {
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
