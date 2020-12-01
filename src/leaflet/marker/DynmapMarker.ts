import L, {LatLng} from "leaflet";

export class DynmapMarker extends L.Marker {
	options: {
		image: null,
		showLabel: true,
		label: "",
		minZoom: 0,
		maxZoom: Infinity,
	}

	constructor(latlng: LatLng, options) {
		options.icon = new LabelledIcon(player, {
			smallFace: options.smallFace,
			showSkinFace: options.showSkinFace,
			showBody: options.showBody,
			showHealth: options.showHealth,
		});
		super(latlng, options);
  	}

	update() {

	}
}
