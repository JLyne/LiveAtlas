/*
 * Copyright 2020 James Lyne
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

import {PathOptions, PointTuple, PolylineOptions} from "leaflet";
import {CoordinatesControlOptions} from "@/leaflet/control/CoordinatesControl";
import {LogoControlOptions} from "@/leaflet/control/LogoControl";
import {ClockControlOptions} from "@/leaflet/control/ClockControl";
import {LiveAtlasMessageConfig} from "@/index";

declare global {
	interface Window {
		config: { url: DynmapUrlConfig };
		liveAtlasConfig: any,
		hideSplash: Function;
		showSplash: Function;
		showSplashError: Function;
	}
}

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
	defaultMap?: string;
	defaultWorld?: string;
	defaultZoom: number;
	followMap?: string;
	followZoom: number;
	updateInterval: number;
	showLayerControl: boolean;
	title: string;
	loginEnabled: boolean;
	maxPlayers: number;
	grayHiddenPlayers: boolean;
	expandUI: boolean;
	hash: number;
}

interface DynmapComponentConfig {
	markers: DynmapMarkersConfig;
	playerMarkers?: DynmapPlayerMarkersConfig;
	coordinatesControl?: CoordinatesControlOptions;
	clockControl ?: ClockControlOptions;
	linkControl: boolean;
	logoControls: Array<LogoControlOptions>;
	chatBox?: DynmapChatBoxConfig;
	chatSending?: DynmapChatSendingConfig;
	chatBalloons: boolean;
}

interface DynmapMarkersConfig {
	showLabels: boolean
}

interface DynmapPlayerMarkersConfig {
	hideByDefault: boolean;
	layerName: string;
	layerPriority: number;
	showBodies: boolean;
	showSkinFaces: boolean;
	showHealth: boolean;
	smallFaces: boolean;
}

interface DynmapChatBoxConfig {
	allowUrlName: boolean;
	showPlayerFaces: boolean;
	messageLifetime: number;
	messageHistory: number;
}

interface DynmapChatSendingConfig {
	loginRequired: boolean;
	maxLength: number;
	cooldown: number;
}

interface DynmapWorld {
	seaLevel: number;
	name: string;
	protected: boolean;
	title: string;
	height: number;
	center: Coordinate;
	maps: Map<string, DynmapWorldMap>;
}

interface DynmapWorldMap {
	world: DynmapWorld;
	name: string;
	icon: string;
	title: string;
	background: string;
	nightAndDay: boolean;
	backgroundDay?: string;
	backgroundNight?: string;
	imageFormat: string;
	prefix: string;
	protected: boolean;
	mapToWorld: [number, number, number, number, number, number, number, number, number];
	worldToMap: [number, number, number, number, number, number, number, number, number];
	nativeZoomLevels: number;
	extraZoomLevels: number;
}

interface DynmapWorldState {
	raining: boolean;
	thundering: boolean;
	timeOfDay: number;
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
	messages: LiveAtlasMessageConfig,
	worlds: Array<DynmapWorld>,
	components: DynmapComponentConfig,
	loggedIn: boolean,
}

interface DynmapUpdateResponse {
	worldState: DynmapWorldState;
	configHash: number;
	playerCount: number;
	players: Set<DynmapPlayer>;
	updates: DynmapUpdates;
	timestamp: number;
}

interface DynmapPlayer {
	account: string;
	armor: number;
	health: number;
	name: string;
	sort: number;
	hidden: boolean;
	location: DynmapLocation;
}

interface DynmapMarkerSet {
	id: string,
	label: string;
	hidden: boolean;
	priority: number;
	minZoom?: number;
	maxZoom?: number;
	showLabels?: boolean;
	markers: Map<string, DynmapMarker>;
	areas: Map<string, DynmapArea>;
	lines: Map<string, DynmapLine>;
	circles: Map<string, DynmapCircle>;
}

interface DynmapMarker {
	dimensions: PointTuple;
	icon: string;
	label: string;
	isHTML: boolean;
	location: Coordinate;
	minZoom?: number;
	maxZoom?: number;
	popupContent?: string;
}

interface DynmapArea {
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

interface DynmapLine {
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

interface DynmapCircle {
	location: Coordinate;
	radius: PointTuple;
	style: PathOptions;
	label: string;
	isHTML: boolean;
	minZoom?: number;
	maxZoom?: number;
	popupContent?: string;
}

interface DynmapUpdates {
	markerSets: Map<string, DynmapMarkerSetUpdates>,
	tiles: Array<DynmapTileUpdate>,
	chat: Array<any> //TODO
}

interface DynmapMarkerSetUpdates {
	markerUpdates: Array<DynmapMarkerUpdate>
	areaUpdates: Array<DynmapAreaUpdate>
	circleUpdates: Array<DynmapCircleUpdate>
	lineUpdates: Array<DynmapLineUpdate>
	removed?: boolean
	payload?: {
		showLabels: boolean;
		hidden: boolean;
		minZoom: number;
		maxZoom: number;
		priority: number;
		label: string;
	}
}

interface DynmapUpdate {
	id: string,
	removed: boolean,
	payload?: any,
}

interface DynmapMarkerUpdate extends DynmapUpdate {
	payload?: DynmapMarker
}

interface DynmapAreaUpdate extends DynmapUpdate {
	payload?: DynmapArea
}

interface DynmapCircleUpdate extends DynmapUpdate {
	payload?: DynmapCircle
}

interface DynmapLineUpdate extends DynmapUpdate {
	payload?: DynmapLine
}

interface DynmapTileUpdate {
	name: string
	timestamp: number
}

interface DynmapParsedUrl {
	world?: string;
	map?: string;
	location?: Coordinate;
	zoom?: number;
	legacy: boolean;
}

interface DynmapChat {
	type: 'chat' | 'playerjoin' | 'playerleave';
	playerAccount?: string;
	playerName?: string;
	channel?: string;
	message?: string;
	source?: string;
	timestamp: number;
}

export type DynmapUIElement = 'chat' | 'players' | 'maps' | 'settings';