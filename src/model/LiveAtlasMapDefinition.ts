import {Coordinate, LiveAtlasWorldDefinition} from "@/index";
import {LatLng} from "leaflet";
import {LiveAtlasProjection} from "@/model/LiveAtlasProjection";

export interface LiveAtlasMapDefinitionOptions {
	world: LiveAtlasWorldDefinition;
	name: string;
	icon?: string;
	title?: string;
	background?: string;
	nightAndDay?: boolean;
	backgroundDay?: string;
	backgroundNight?: string;
	imageFormat: string;
	prefix?: string;
	protected?: boolean;
	mapToWorld?: [number, number, number, number, number, number, number, number, number];
	worldToMap?: [number, number, number, number, number, number, number, number, number];
	nativeZoomLevels: number;
	extraZoomLevels: number;
}

export default class LiveAtlasMapDefinition {
	readonly world: LiveAtlasWorldDefinition;
	readonly name: string;
	readonly icon?: string;
	readonly title: string;
	readonly background: string;
	readonly nightAndDay: boolean;
	readonly backgroundDay?: string;
	readonly backgroundNight?: string;
	readonly imageFormat: string;
	readonly prefix: string;
	readonly protected: boolean;
	private readonly projection?: Readonly<LiveAtlasProjection>;
	readonly nativeZoomLevels: number;
	readonly extraZoomLevels: number;

	constructor(options: LiveAtlasMapDefinitionOptions) {
		this.world = options.world; //Ignore append_to_world here otherwise things break
		this.name = options.name;
		this.icon = options.icon || undefined;
		this.title = options.title || '';

		this.background = options.background || '#000000';
		this.nightAndDay = options.nightAndDay || false;
		this.backgroundDay = options.backgroundDay || '#000000';
		this.backgroundNight = options.backgroundNight || '#000000';

		this.imageFormat = options.imageFormat;
		this.prefix = options.prefix || '';
		this.protected = options.protected || false;

		this.nativeZoomLevels = options.nativeZoomLevels || 1;
		this.extraZoomLevels = options.extraZoomLevels || 0;

		if(options.mapToWorld || options.worldToMap) {
			this.projection = Object.freeze(new LiveAtlasProjection({
				mapToWorld: options.mapToWorld || [0, 0, 0, 0, 0, 0, 0, 0, 0],
				worldToMap: options.worldToMap || [0, 0, 0, 0, 0, 0, 0, 0, 0],
				nativeZoomLevels: this.nativeZoomLevels,
			}));
		}
	}

	locationToLatLng(location: Coordinate): LatLng {
		return this.projection ? this.projection.locationToLatLng(location)
			: LiveAtlasMapDefinition.defaultProjection.locationToLatLng(location);
	}

	latLngToLocation(latLng: LatLng, y: number): Coordinate {
		return this.projection ? this.projection.latLngToLocation(latLng, y)
			: LiveAtlasMapDefinition.defaultProjection.latLngToLocation(latLng, y);
	}

	getIcon(): string {
		let worldType: string,
			mapType: string;

		switch(this.world.dimension) {
			case 'nether':
				worldType = 'nether';
				mapType = ['surface', 'nether'].includes(this.name) ? 'surface' : 'flat';
				break;

			case 'end':
				worldType = 'the_end';
				mapType = ['surface', 'the_end'].includes(this.name) ? 'surface' : 'flat';
				break;

			case 'overworld':
			default:
				worldType = 'world';
				mapType = ['surface', 'flat', 'biome', 'cave'].includes(this.name) ? this.name : 'flat';
				break;
		}

		return `block_${worldType}_${mapType}`;
	}

	static defaultProjection = Object.freeze({
		locationToLatLng(location: Coordinate): LatLng {
			return new LatLng(location.x, location.z);
		},

		latLngToLocation(latLng: LatLng, y: number): Coordinate {
			return {x: latLng.lat, y: y, z: latLng.lng};
		}
	})
}
