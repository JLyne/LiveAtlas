import {State} from "@/store";
import {DynmapUrlConfig} from "@/dynmap";
import LiveAtlasMapDefinition from "@/model/LiveAtlasMapDefinition";
import {PathOptions, PointTuple, PolylineOptions} from "leaflet";

declare module "*.png" {
   const value: any;
   export = value;
}

declare module '*.vue' {
	import type {DefineComponent} from 'vue'
	const component: DefineComponent<{}, {}, any>
  export default component
}

declare global {
	// noinspection JSUnusedGlobalSymbols
	interface Window {
		liveAtlasConfig: LiveAtlasGlobalConfig,
	}
}

interface Coordinate {
	x: number;
	y: number;
	z: number;
}

interface LiveAtlasLocation {
	x: number;
	y: number;
	z: number;
	world?: string;
}

interface LiveAtlasGlobalConfig {
	servers: Map<string, LiveAtlasServerDefinition>;
	messages: LiveAtlasGlobalMessageConfig;
	ui: LiveAtlasUIConfig;
}

interface LiveAtlasServerDefinition {
	id: string
	label?: string
}

interface LiveAtlasDynmapServerDefinition extends LiveAtlasServerDefinition {
	type: 'dynmap',
	dynmap: DynmapUrlConfig,
}

// Messages defined directly in LiveAtlas and used for all servers
interface LiveAtlasGlobalMessageConfig {
	chatNoMessages: string;
	chatTitle: string;
	chatLogin: string;
	chatLoginLink: string;
	chatSend: string;
	chatPlaceholder: string;
	chatErrorDisabled: string;
	chatErrorUnknown: string;
	serversHeading: string;
	worldsSkeleton: string;
	playersSkeleton: string;
	playersTitle: string;
	playersTitleHidden: string;
	playersTitleOtherWorld: string;
	playersSearchPlaceholder: string;
	playersSearchSkeleton: string;
	followingHeading: string;
	followingUnfollow: string;
	followingTitleUnfollow: string;
	followingHidden: string;
	linkTitle: string;
	loadingTitle: string;
	locationRegion: string;
	locationChunk: string;
	contextMenuCopyLink: string;
	contextMenuCenterHere: string;
	toggleTitle: string;
	mapTitle: string;
	layersTitle: string;
	copyToClipboardSuccess: string;
	copyToClipboardError: string;
}

// Messages defined by dynmap configuration responses and can vary per server
interface LiveAtlasServerMessageConfig {
	chatPlayerJoin: string;
	chatPlayerQuit: string;
	chatAnonymousJoin: string;
	chatAnonymousQuit: string;
	chatErrorNotAllowed: string;
	chatErrorRequiresLogin: string;
	chatErrorCooldown: string;
	worldsHeading: string;
	playersHeading: string;
}

type LiveAtlasMessageConfig = LiveAtlasGlobalMessageConfig & LiveAtlasServerMessageConfig;

interface LiveAtlasUIConfig {
	playersAboveMarkers: boolean;
	playersSearch: boolean;
}

export type LiveAtlasUIElement = 'layers' | 'chat' | 'players' | 'maps' | 'settings';
export type LiveAtlasSidebarSection = 'servers' | 'players' | 'maps';
export type LiveAtlasDimension = 'overworld' | 'nether' | 'end';

interface LiveAtlasPlayer {
	name: string;
	displayName: string;
	uuid?: string;
	armor: number;
	health: number;
	sort: number;
	hidden: boolean;
	location: LiveAtlasLocation;
}

interface LiveAtlasSortedPlayers extends Array<LiveAtlasPlayer> {
	dirty?: boolean;
}

interface LiveAtlasWorldDefinition {
	seaLevel: number;
	name: string;
	dimension: LiveAtlasDimension;
	protected: boolean;
	title: string;
	height: number;
	center: Coordinate;
	maps: Map<string, LiveAtlasMapDefinition>;
}

interface LiveAtlasWorldState {
	raining: boolean;
	thundering: boolean;
	timeOfDay: number;
}

interface LiveAtlasParsedUrl {
	world?: string;
	map?: string;
	location?: Coordinate;
	zoom?: number;
	legacy: boolean;
}

interface LiveAtlasMapProvider {
	loadServerConfiguration(): Promise<void>;
	loadWorldConfiguration(world: LiveAtlasWorldDefinition): Promise<void>;
	startUpdates(): void;
	stopUpdates(): void;
	sendChatMessage(message: string): void;
	destroy(): void;
}

interface LiveAtlasMarkerSet {
	id: string,
	label: string;
	hidden: boolean;
	priority: number;
	minZoom?: number;
	maxZoom?: number;
	showLabels?: boolean;
	markers: Map<string, LiveAtlasMarker>;
	areas: Map<string, LiveAtlasArea>;
	lines: Map<string, LiveAtlasLine>;
	circles: Map<string, LiveAtlasCircle>;
}

interface LiveAtlasMarker {
	dimensions: PointTuple;
	icon: string;
	label: string;
	isHTML: boolean;
	location: Coordinate;
	minZoom?: number;
	maxZoom?: number;
	popupContent?: string;
}

interface LiveAtlasArea {
	style: PolylineOptions;
	label: string;
	isHTML: boolean;
	x: Array<number>;
	y: PointTuple;
	z: Array<number>;
	minZoom?: number;
	maxZoom?: number;
	popupContent?: string;
}

interface LiveAtlasLine {
	x: Array<number>;
	y: Array<number>;
	z: Array<number>;
	style: PolylineOptions;
	label: string;
	isHTML: boolean;
	minZoom?: number;
	maxZoom?: number;
	popupContent?: string;
}

interface LiveAtlasCircle {
	location: Coordinate;
	radius: PointTuple;
	style: PathOptions;
	label: string;
	isHTML: boolean;
	minZoom?: number;
	maxZoom?: number;
	popupContent?: string;
}
