import {State} from "@/store";
import {DynmapPlayer, DynmapUrlConfig} from "@/dynmap";
import LiveAtlasMapDefinition from "@/model/LiveAtlasMapDefinition";

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

interface LiveAtlasSortedPlayers extends Array<DynmapPlayer> {
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
