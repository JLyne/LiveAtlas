import axios, {AxiosResponse} from 'axios';
import {
	DynmapComponentConfig,
	DynmapConfigurationResponse, DynmapMap, DynmapMessageConfig,
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
		defaultZoom: data.defaultZoom || 0,
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
		const maps: Array<DynmapMap> = [];

		(world.maps || []).forEach((map: any) => {
			maps.push({
				world: world,
				background: map.background || '#000000',
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
			playerMarkers: undefined,
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
		}
	});

	return components;
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
				players: Array<DynmapPlayer> = [];

			// (data.players || []).forEach((player: any) => {
			for(let i = 0; i < 408; i++) {
				players.push({
					account: "VIDEO GAMES " + i,//player.account || "",
					health: Math.round(Math.random() * 10),//player.health || 0,
					armor: Math.round(Math.random() * 10),//player.armor || 0,
					name: "VIDEO GAMES " + i,//Math.round(Math.random() * 10),//player.name || "Steve",
					sort: 0,//player.sort || 0,
					location: {
						x: Math.round(Math.random() * 100) - 50, //player.x || 0,
						y: Math.round(Math.random() * 100) - 50, //player.y || 0,
						z: Math.round(Math.random() * 100) - 50, //player.z || 0,
						world: "earth", //player.world || undefined,
					}
				});
				// });
			}

			return {
				timeOfDay: data.servertime || 0,
				thundering: data.isThundering || false,
				raining: data.hasStorm || false,
				playerCount: data.count || 0,
				configHash: data.configHash || 0,
				timestamp: data.timestamp || 0,
				players,
			}
		});
	}
}
