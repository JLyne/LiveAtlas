import axios, {AxiosResponse} from 'axios';
import {
	DynmapArea, DynmapCircle,
	DynmapComponentConfig,
	DynmapConfigurationResponse, DynmapLine, DynmapMap, DynmapMarker, DynmapMarkerSet, DynmapMessageConfig,
	DynmapPlayer,
	DynmapServerConfig,
	DynmapUpdateResponse,
	DynmapWorld
} from "@/dynmap";

function buildServerConfig(response: AxiosResponse): DynmapServerConfig {
	const data = response.data;

	return {
		version: data.dynmapversion || '',
		allowChat: data.allowwebchat || false,
		chatRequiresLogin: data['webchat-requires-login'] || false,
		chatInterval: data['webchat-interval'] || 5,
		defaultMap: data.defaultmap || undefined,
		defaultWorld: data.defaultworld || undefined,
		defaultZoom: data.defaultzoom || 0,
		followMap: data.followmap || undefined,
		followZoom: data.followzoom || 0,
		updateInterval: data.updaterate || 3000,
		showLayerControl: data.showlayercontrol || true,
		title: data.title || 'Dynmap',
		loginEnabled: data['login-enabled'] || false,
		loginRequired: data.loginrequired || false,
		maxPlayers: data.maxcount || 0,
		hash: data.confighash || 0,
	};
}

function buildMessagesConfig(response: AxiosResponse): DynmapMessageConfig {
	const data = response.data;

	return {
		chatNotAllowed: data['msg-chatnotallowed'] || '',
		chatRequiresLogin: data['msg-chatrequireslogin'] || '',
		chatCooldown: data.spammessage || '',
		mapTypes: data['msg-maptypes'] || '',
		players: data['msg-players'] || '',
		playerJoin: data.joinmessage || '',
		playerQuit: data.quitmessage || '',
		anonymousJoin: data['msg-hiddennamejoin'] || '',
		anonymousQuit: data['msg-hiddennamequit'] || '',
	}
}

function buildWorlds(response: AxiosResponse): Array<DynmapWorld> {
	const data = response.data,
		worlds: Array<DynmapWorld> = [];

	(data.worlds || []).forEach((world: any) => {
		const maps: Map<string, DynmapMap> = new Map();

		(world.maps || []).forEach((map: any) => {
			maps.set(map.name, {
				world: world,
				background: '#121212', //map.background || '#000000',
				backgroundDay: map.backgroundday || '#000000',
				backgroundNight: map.backgroundnight || '#000000',
				compassView: map.compassView || 'S',
				icon: map.icon || undefined,
				imageFormat: map.imageFormat || 'png',
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

function buildComponents(response: AxiosResponse): DynmapComponentConfig {
	const data = response.data,
		components: DynmapComponentConfig = {
			markers: {
				showLabels: false,
			},
			playerMarkers: undefined,
			coordinatesControl: undefined,
			linkControl: false,
			clockControl: undefined,
			logoControls: [],
		};

	(data.components || []).forEach((component: any) => {
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
				}
				break;

			case "timeofdayclock":
				components.clockControl = {
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

		const marker = data[key];

		markers.set(key, {
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
		});
	}

	return markers;
}

function buildAreas(data: any): Map<string, DynmapArea> {
	const areas = Object.freeze(new Map()) as Map<string, DynmapArea>;

	for(const key in data) {
		if (!Object.prototype.hasOwnProperty.call(data, key)) {
			continue;
		}

		const area = data[key];

		areas.set(key, {
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
		});
	}

	return areas;
}

function buildLines(data: any): Map<string, DynmapLine> {
	const lines = Object.freeze(new Map()) as Map<string, DynmapLine>;

	for(const key in data) {
		if (!Object.prototype.hasOwnProperty.call(data, key)) {
			continue;
		}

		const line = data[key];

		lines.set(key, {
			x: line.x || [0, 0],
			y: [line.ybottom || 0, line.ytop || 0],
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
		});
	}

	return lines;
}

function buildCircles(data: any): Map<string, DynmapCircle> {
	const circles = Object.freeze(new Map()) as Map<string, DynmapCircle>;

	for(const key in data) {
		if (!Object.prototype.hasOwnProperty.call(data, key)) {
			continue;
		}

		const circle = data[key];

		circles.set(key, {
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
		});
	}

	return circles;
}

export default {
	getConfiguration(): Promise<DynmapConfigurationResponse> {
		return axios.get(window.config.url.configuration).then((response): DynmapConfigurationResponse => {
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

		return axios.get(url).then((response): DynmapUpdateResponse => {
			const data = response.data,
				players: Set<DynmapPlayer> = new Set();

			(data.players || []).forEach((player: any) => {
				players.add({
					account: player.account || "",
					health: player.health || 0,
					armor: player.armor || 0,
					name: player.name || "Steve",
					sort: player.sort || 0,
					location: {
						x: player.x || 0,
						y: player.y || 0,
						z: player.z || 0,
						world: player.world || undefined,
					}
				});
			});

			for(let i = 0; i < 408; i++) {
				players.add({
					account: "VIDEO GAMES " + i,
					health: Math.round(Math.random() * 10),
					armor: Math.round(Math.random() * 10),
					name: "VIDEO GAMES " + i,
					sort: 0,
					location: {
						x: Math.round(Math.random() * 1000) - 500,
						y: 64,
						z: Math.round(Math.random() * 1000) - 500,
						world: "world",
					}
				});
			}

			return {
				worldState: {
					timeOfDay: data.servertime || 0,
					thundering: data.isThundering || false,
					raining: data.hasStorm || false,
				},
				playerCount: data.count || 0,
				configHash: data.configHash || 0,
				timestamp: data.timestamp || 0,
				players,
			}
		});
	},

	getMarkerSets(world: string): Promise<Map<string, DynmapMarkerSet>> {
		const url = `${window.config.url.markers}_markers_/marker_${world}.json`;

		return axios.get(url).then((response): Map<string, DynmapMarkerSet> => {
			const data = response.data,
				sets: Map<string, DynmapMarkerSet> = new Map();

			data.sets = data.sets || {};

			for(const key in data.sets) {
				if(!Object.prototype.hasOwnProperty.call(data.sets, key)) {
					continue;
				}

				const set = data.sets[key],
					markers = buildMarkers(set.markers || {}),
					circles = buildCircles(set.circles || {}),
					areas = buildAreas(set.areas || {}),
					lines = buildLines(set.lines || {});

				sets.set(key, {
					label: set.label || "Unnamed set",
					hidden: set.hidden || false,
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
