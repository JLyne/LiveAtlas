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
import {globalMessages, serverMessages} from "../messages";

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
			VITE_APP_VERSION: string
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
	version?: number;
}

interface LiveAtlasServerDefinition {
	id: string;
	label?: string;
	type: 'dynmap' | 'pl3xmap';
	dynmap?: DynmapUrlConfig;
	pl3xmap?: string;
	squaremap?: string;
}

// Messages defined directly in LiveAtlas and used for all servers
type LiveAtlasGlobalMessageConfig = {
	[K in typeof globalMessages[number]]: string;
}

// Messages defined by dynmap configuration responses and can vary per server
type LiveAtlasServerMessageConfig = {
	[K in typeof serverMessages[number]]: string;
}

type LiveAtlasMessageConfig = LiveAtlasGlobalMessageConfig & LiveAtlasServerMessageConfig;

interface LiveAtlasUIConfig {
	playersAboveMarkers: boolean;
	playersSearch: boolean;
	compactPlayerMarkers: boolean;
}

export type LiveAtlasUIElement = 'layers' | 'chat' | LiveAtlasSidebarSection;
export type LiveAtlasUIModal = 'login' | 'settings';
export type LiveAtlasSidebarSection = 'servers' | 'players' | 'maps';
export type LiveAtlasDimension = 'overworld' | 'nether' | 'end';

export type LiveAtlasSidebarSectionState = {
	collapsed?: boolean;
}

interface LiveAtlasPlayer {
	name: string;
	displayName: string;
	uuid?: string;
	armor: number;
	health: number;
	sort: number;
	hidden: boolean;
	location: LiveAtlasLocation;
	yaw?: number;
}

interface LiveAtlasSortedPlayers extends Array<LiveAtlasPlayer> {
	dirty?: boolean;
}

interface LiveAtlasWorldDefinition {
	seaLevel: number;
	name: string;
	displayName: string;
	dimension: LiveAtlasDimension;
	center: Coordinate;
	defaultZoom?: number;
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
}

interface LiveAtlasMarkerSetContents {
	points: Map<string, LiveAtlasPointMarker>,
	areas: Map<string, LiveAtlasAreaMarker>;
	lines: Map<string, LiveAtlasLineMarker>;
	circles: Map<string, LiveAtlasCircleMarker>;
}

interface LiveAtlasMarker {
	tooltip: string;
	tooltipHTML?: string;
	popup?: string;
	isPopupHTML?: boolean;
	location: Coordinate;
	minZoom?: number;
	maxZoom?: number;
}

interface LiveAtlasPointMarker extends LiveAtlasMarker {
	dimensions: PointTuple;
	icon: string;
}

interface LiveAtlasPathMarker extends LiveAtlasMarker {
	style: PathOptions;
}

interface LiveAtlasAreaMarker extends LiveAtlasPathMarker {
	style: PolylineOptions;
	outline: boolean;
	points: Coordinate[] | Coordinate[][] | Coordinate[][][]
}

interface LiveAtlasLineMarker extends LiveAtlasPathMarker {
	points: Coordinate[];
	style: PolylineOptions;
}

interface LiveAtlasCircleMarker extends LiveAtlasPathMarker {
	radius: PointTuple;
	style: PathOptions;
}

interface HeadQueueEntry {
	cacheKey: string;
	name: string;
	uuid?: string;
	size: LiveAtlasPlayerImageSize;
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
	playerList: {
		showImages: boolean;
	},
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
	imageSize: LiveAtlasPlayerImageSize;
	showHealth: boolean;
	showArmor: boolean;
	showYaw: boolean;
}

export type LiveAtlasPlayerImageSize  = 'none' |  'small' |  'large' | 'body';

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
