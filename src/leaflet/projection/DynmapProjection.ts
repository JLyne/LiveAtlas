import {Util, LatLng, Class} from 'leaflet';
import {Coordinate} from "@/dynmap";

export interface DynmapProjectionOptions {}

export interface DynmapProjection {
	locationToLatLng(location: Coordinate): LatLng;
	latLngToLocation(latLng: LatLng, y: number): Coordinate;
}

export class DynmapProjection extends Class {

	constructor(options?: DynmapProjectionOptions) {
		super();
		Util.setOptions(this, options);
	}

	locationToLatLng(location: Coordinate): LatLng {
		return new LatLng(location.x, location.z);
	}

	latLngToLocation(latLng: LatLng, y: number): Coordinate {
		return {x: latLng.lat, y, z: latLng.lng};
	}
}
