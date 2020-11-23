import {ControlPosition, LeafletMouseEvent} from "leaflet";

declare global {
	interface Window {
		config: DynmapConfig
	}
}

type DynmapConfig = {
	url: DynmapUrlConfig;
};

type DynmapUrlConfig = {
	configuration: string;
	update: string;
	sendmessage: string;
	login: string;
	register: string;
	tiles: string;
	markers: string;
}

interface DynmapServerConfig {
	version: string;
	allowChat: boolean;
	chatRequiresLogin: boolean;
	chatInterval: number;
	defaultMap?: string;
	defaultWorld?: string;
	defaultZoom?: number;
	followMap?: string;
	followZoom?: number;
	updateInterval: number;
	showLayerControl: boolean;
	title: string;
	loginEnabled: boolean;
	loginRequired: boolean;
	maxPlayers: number;
	hash: number;
}

interface DynmapMessageConfig {
	chatNotAllowed: string;
	chatRequiresLogin: string;
	chatCooldown: string;
	mapTypes: string;
	players: string;
	playerJoin: string;
	playerQuit: string;
	anonymousJoin: string;
	anonymousQuit: string;
}

interface DynmapWorld {
	seaLevel: number;
	name: string;
	protected: boolean;
	title: string;
	height: number;
	center: Coordinate;
	maps: Array<DynmapMap>;
}

interface DynmapMap {
	world: string;
	background: string;
	backgroundDay: string;
	backgroundNight: string;
	compassView: string;
	icon: string;
	imageFormat: string;
	name: string;
	nightAndDay: boolean;
	prefix: string;
	protected: boolean;
	title: string;
	type: string;
	mapToWorld: [number, number, number, number, number, number, number, number, number];
	worldToMap: [number, number, number, number, number, number, number, number, number];
	nativeZoomLevels: number;
	extraZoomLevels: number;
}

interface Coordinate {
	x: number;
	y: number;
	z: number;
}

interface DynmapLocation {
	x: number;
	y: number;
	z: number;
	world?: string;
}

interface DynmapConfigurationResponse {
	config: DynmapServerConfig,
	messages: DynmapMessageConfig,
	worlds: Array<DynmapWorld>,
}

interface DynmapUpdateResponse {
	configHash: number;
	playerCount: number;
	raining: boolean;
	thundering: boolean;
	timeOfDay: number;
	players: Array<DynmapPlayer>;
	timestamp: number;
	//TODO: Tiles etc
}

interface DynmapPlayer {
	account: string
	armor: number
	health: number
	name: string
	sort: number
	location: DynmapLocation;
}

declare module 'leaflet' {
	namespace Control {
		function extend<T extends Object>(props: T): { new(...args: any[]): T } & typeof Control;

		class CoordinatesControl extends Control {
			constructor(options: CoordinatesControlOptions);

			options: CoordinatesControlOptions
			_coordsContainer?: HTMLElement
			_regionContainer?: HTMLElement
			_chunkContainer?: HTMLElement
			_map?: L.Map

			_onMouseMove(event: LeafletMouseEvent): void

			_onMouseOut(event: LeafletMouseEvent): void

			_update(): void

		}

		interface CoordinatesControlOptions {
			showY: boolean
			showRegion: boolean
			showChunk: boolean
			label: string
			position: ControlPosition
		}

		function coordinatesControl(options: CoordinatesControlOptions): CoordinatesControl;
	}
}
