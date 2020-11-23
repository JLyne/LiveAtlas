import DynmapProjection from "@/leaflet/projection/DynmapProjection";
import L from 'leaflet';

const HDProjection = DynmapProjection.extend({
	fromLocationToLatLng: function (location) {
		var wtp = this.options.worldtomap;
		var lat = wtp[3] * location.x + wtp[4] * location.y + wtp[5] * location.z;
		var lng = wtp[0] * location.x + wtp[1] * location.y + wtp[2] * location.z;

		return new L.LatLng(
			-((128 - lat) / (1 << this.options.mapzoomout)),
			lng / (1 << this.options.mapzoomout),
			true);
	},
	fromLatLngToLocation: function (latlon, y) {
		var ptw = this.options.maptoworld;
		var lat = latlon.lng * (1 << this.options.mapzoomout);
		var lon = 128 + latlon.lat * (1 << this.options.mapzoomout);
		var x = ptw[0] * lat + ptw[1] * lon + ptw[2] * y;
		var z = ptw[6] * lat + ptw[7] * lon + ptw[8] * y;
		return {x: x, y: y, z: z};
	}
});

export default HDProjection;
