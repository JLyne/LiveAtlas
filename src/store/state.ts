import {
	DynmapComponentConfig,
	DynmapMap,
	DynmapMessageConfig,
	DynmapPlayer,
	DynmapServerConfig,
	DynmapWorld
} from "@/dynmap";

export type State = {
	configuration: DynmapServerConfig;
	messages: DynmapMessageConfig;
	components: DynmapComponentConfig;

	worlds: Map<string, DynmapWorld>;
	maps: Map<string, DynmapMap>;
	players: Map<string, DynmapPlayer>;

	following?: DynmapPlayer;

	// currentServer?: string;
	currentWorld?: DynmapWorld;
	currentMap?: DynmapMap;

	raining: boolean;
	thundering: boolean;
	timeOfDay: number;

	updateRequestId: number;
	updateTimestamp: Date;
}

export const state: State = {
	configuration: {
		version: '',
		allowChat: false,
		chatRequiresLogin: false,
		chatInterval: 5000,
		defaultMap: '',
		defaultWorld: '',
		defaultZoom: 0,
		followMap: '',
		followZoom: 0,
		updateInterval: 3000,
		showLayerControl: true,
		title: '',
		loginEnabled: false,
		loginRequired: false,
		maxPlayers: 0,
		hash: 0,
	},

	messages: {
		chatNotAllowed: '',
		chatRequiresLogin: '',
		chatCooldown: '',
		mapTypes: '',
		players: '',
		playerJoin: '',
		playerQuit: '',
		anonymousJoin: '',
		anonymousQuit: '',
	},

	worlds: new Map(),
	maps: new Map(),
	players: new Map(),

	components: {
		playerMarkers: undefined,
	},

	raining: false,
	thundering: false,
	timeOfDay: 0,

	following: undefined,

	currentWorld: undefined,
	currentMap: undefined,

	updateRequestId: 0,
	updateTimestamp: new Date(),
};
