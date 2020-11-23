import axios from 'axios';
import {
	DynmapConfigurationResponse, DynmapMap, DynmapMessageConfig,
	DynmapPlayer,
	DynmapServerConfig,
	DynmapUpdateResponse,
	DynmapWorld
} from "@/dynmap";

export default {
	getConfiguration(): Promise<DynmapConfigurationResponse> {
		return axios.get(window.config.url.configuration).then((response): DynmapConfigurationResponse => {
			const data = response.data,
				config: DynmapServerConfig = {
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
				},
				messages: DynmapMessageConfig = {
					chatNotAllowed: data['msg-chatnotallowed'] || '',
					chatRequiresLogin: data['msg-chatrequireslogin'] || '',
					chatCooldown: data.spammessage || '',
					mapTypes: data['msg-maptypes'] || '',
					players: data['msg-players'] || '',
					playerJoin: data.joinmessage || '',
					playerQuit: data.quitmessage || '',
					anonymousJoin: data['msg-hiddennamejoin'] || '',
					anonymousQuit: data['msg-hiddennamequit'] || '',
				},
				worlds: Array<DynmapWorld> = [];

			(data.worlds || []).forEach((world: any) => {
                const maps: Array<DynmapMap> = [];

                (world.maps || []).forEach((map: any) => {
                    maps.push({
						world: world.name,
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
				})
			});

			return {
				config,
				messages,
				worlds,
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

			(data.players || []).forEach((player: any) => {
				players.push({
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
