import {MarkerOptions, Marker, Util, LatLngExpression} from 'leaflet';

export class GenericMarker extends Marker {
	constructor(latLng: LatLngExpression, options: MarkerOptions) {
		super(latLng, options);
		Util.setOptions(this, options);
	}

	_resetZIndex() {
		//Don't change the zindex
	}
}
