import L from 'leaflet';

const DynmapProjection = L.Class.extend({
	initialize: function (options) {
		L.Util.setOptions(this, options);
	},
	fromLocationToLatLng: function () {
		throw "fromLocationToLatLng not implemented";
	},
	fromLatLngToLocation: function () {
		return null;
	}
});

export default DynmapProjection;