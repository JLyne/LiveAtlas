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

import {State} from "@/store";
import {DynmapUrlConfig} from "@/dynmap";
import LiveAtlasMapDefinition from "@/model/LiveAtlasMapDefinition";
import {Coords, DoneCallback, InternalTiles, PathOptions, PointTuple, PolylineOptions} from "leaflet";
import {CoordinatesControlOptions} from "@/leaflet/control/CoordinatesControl";
import {ClockControlOptions} from "@/leaflet/control/ClockControl";
import {LogoControlOptions} from "@/leaflet/control/LogoControl";

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

	declare const process : {
		env: {
			VITE_VERSION: string
		}
	}
}

export interface ProcessEnv {
    [key: string]: string | undefined
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
	id: string;
	label?: string;
	type: 'dynmap' | 'pl3xmap';
	dynmap?: DynmapUrlConfig;
	pl3xmap?: string;
}

// Messages defined directly in LiveAtlas and used for all servers
interface LiveAtlasGlobalMessageConfig {
	chatNoMessages: string;
	chatTitle: string;
	chatLogin: string;
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
	loginTitle: string;
	loginHeading: string;
	loginUsernameLabel: string;
	loginPasswordLabel: string;
	loginSubmit: string;
	loginErrorUnknown: string;
	loginErrorDisabled: string;
	loginErrorIncorrect: string;
	loginSuccess: string;
	registerHeading: string;
	registerDescription: string;
	registerConfirmPasswordLabel: string;
	registerCodeLabel: string;
	registerSubmit: string;
	registerErrorUnknown: string;
	registerErrorDisabled: string;
	registerErrorVerifyFailed: string;
	registerErrorIncorrect: string;
	logoutTitle: string;
	logoutErrorUnknown: string;
	logoutSuccess: string;
	closeTitle: string;
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

export type LiveAtlasUIElement = 'layers' | 'chat' | 'players' | 'maps';
export type LiveAtlasUIModal = 'login' | 'settings';
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
	displayName: string;
	dimension: LiveAtlasDimension;
	protected: boolean;
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
	populateWorld(world: LiveAtlasWorldDefinition): Promise<void>;
	startUpdates(): void;
	stopUpdates(): void;
	sendChatMessage(message: string): void;
	login(formData: FormData): void;
	logout(): void;
	register(formData: FormData): void;
	destroy(): void;

	getPlayerHeadUrl(entry: HeadQueueEntry): string;
	getTilesUrl(): string;
	getMarkerIconUrl(icon: string): string;
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
	isLabelHTML: boolean;
	location: Coordinate;
	minZoom?: number;
	maxZoom?: number;
	popupContent?: string;
}

interface LiveAtlasPath {
	style: PathOptions;
	minZoom?: number;
	maxZoom?: number;
	popupContent?: string;
	tooltipContent?: string;
	isPopupHTML: boolean;
}

interface LiveAtlasArea extends LiveAtlasPath {
	style: PolylineOptions;
	outline: boolean;
	points: Coordinate[] | Coordinate[][] | Coordinate[][][]
}

interface LiveAtlasLine extends LiveAtlasPath {
	points: Coordinate[];
	style: PolylineOptions;
}

interface LiveAtlasCircle extends LiveAtlasPath {
	location: Coordinate;
	radius: PointTuple;
	style: PathOptions;
}

interface HeadQueueEntry {
	cacheKey: string;
	name: string;
	uuid?: string;
	size: string;
	image: HTMLImageElement;
}

interface LiveAtlasServerConfig {
	defaultMap?: string;
	defaultWorld?: string;
	defaultZoom: number;
	followMap?: string;
	followZoom?: number;
	title: string;
	expandUI: boolean;
}

interface LiveAtlasComponentConfig {
	markers: {
		showLabels: boolean;
	};
	playerMarkers?: LiveAtlasPlayerMarkerConfig;
	coordinatesControl?: CoordinatesControlOptions;
	clockControl?: ClockControlOptions;
	linkControl: boolean;
	layerControl: boolean;
	logoControls: Array<LogoControlOptions>;
	chatBox?: LiveAtlasChatBoxConfig;
	chatSending?: LiveAtlasChatSendingConfig;
	chatBalloons: boolean;
	login: boolean;
}

interface LiveAtlasPartialComponentConfig {
	markers?: {
		showLabels: boolean;
	};
	playerMarkers?: LiveAtlasPlayerMarkerConfig;
	coordinatesControl?: CoordinatesControlOptions;
	clockControl?: ClockControlOptions;
	linkControl?: boolean;
	layerControl?: boolean;
	logoControls?: Array<LogoControlOptions>;
	chatBox?: LiveAtlasChatBoxConfig;
	chatSending?: LiveAtlasChatSendingConfig;
	chatBalloons?: boolean;
	login?: boolean;
}

interface LiveAtlasPlayerMarkerConfig {
	grayHiddenPlayers: boolean;
	hideByDefault: boolean;
	layerName: string;
	layerPriority: number;
	showBodies: boolean;
	showSkinFaces: boolean;
	showHealth: boolean;
	showArmor: boolean;
	smallFaces: boolean;
}

interface LiveAtlasChatBoxConfig {
	allowUrlName: boolean;
	showPlayerFaces: boolean;
	messageLifetime: number;
	messageHistory: number;
}

interface LiveAtlasChatSendingConfig {
	loginRequired: boolean;
	maxLength: number;
	cooldown: number;
}

interface LiveAtlasChat {
	type: 'chat' | 'playerjoin' | 'playerleave';
	playerAccount?: string;
	playerName?: string;
	channel?: string;
	message?: string;
	source?: string;
	timestamp: number;
}

export interface LiveAtlasInternalTiles extends InternalTiles {
    [key: string]: LiveAtlasTile;
}

export interface LiveAtlasTile {
	active?: boolean;
	coords: Coords;
	current: boolean;
	el: LiveAtlasTileElement;
	loaded?: Date;
	retain?: boolean;
	complete: boolean;
}

export interface LiveAtlasTileElement extends HTMLImageElement {
	tileName?: string;
	url: string;
	callback: DoneCallback;
	abortController: AbortController;
}
