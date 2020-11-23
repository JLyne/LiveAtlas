import DynmapTileLayer from "@/leaflet/tileLayer/DynmapTileLayer";
import HDProjection from "@/leaflet/projection/HDProjection";
import L from 'leaflet';

const HDMapType = DynmapTileLayer.extend({
	projection: undefined,
	options: {
		maxZoom: 1,
		maxNativeZoom: 1,
		worldName: '',
		prefix: '',
		errorTileUrl: 'images/blank.png',
	},
	initialize(options) {
		DynmapTileLayer.prototype.initialize.call(this, options);
		options.zoomReverse = true;
		options.tileSize = 128;
		options.minZoom = 0;
		L.Util.setOptions(this, options);
		this.projection = new HDProjection(Object.assign(options, {map: this}));
	},

	getTileName: function(coords) {
		let info = this.getTileInfo(coords);
		// Y is inverted for HD-map.
		info.y = -info.y;
		info.scaledy = info.y >> 5;
		return `${info.prefix}${info.nightday}/${info.scaledx}_${info.scaledy}/${info.zoom}${info.x}_${info.y}.${info.fmt}`;
	},
	zoomprefix: function(amount) {
		// amount == 0 -> ''
		// amount == 1 -> 'z_'
		// amount == 2 -> 'zz_'
		return 'zzzzzzzzzzzzzzzzzzzzzz'.substr(0, amount) + (amount === 0 ? '' : '_');
	}
});

// maptypes.HDMapType = function(options) { return new HDMapType(options); };

const hdMapType = (options) => {
	return new HDMapType(options);
}

export {
	HDMapType,
	hdMapType
};