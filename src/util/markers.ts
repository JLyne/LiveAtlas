import {Marker} from "leaflet";
import {DynmapMarker} from "@/dynmap";
import {DynmapIcon} from "@/leaflet/icon/DynmapIcon";
import {DynmapProjection} from "@/leaflet/projection/DynmapProjection";

export const createMarker = (options: DynmapMarker, projection: DynmapProjection): Marker => {
	return new Marker(projection.locationToLatLng(options.location), {
		icon: new DynmapIcon({
			icon: options.icon,
			label: options.label,
			iconSize: options.dimensions,
			showLabel: false,
			isHtml: options.isHTML,
		}),
		// maxZoom: this.options.maxZoom,
		// minZoom: this.options.minZoom,
	});
};

export const updateMarker = (marker: Marker | undefined, options: DynmapMarker, projection: DynmapProjection): Marker => {
	if (!marker) {
		return createMarker(options, projection);
	}

	//TODO

	return marker;
};