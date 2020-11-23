import L from 'leaflet';

const DynmapTileLayer = L.TileLayer.extend({
	options: {
		worldName: '',
		prefix: '',
	},

	_cachedTileUrls: null,
	_namedTiles: null,

	initialize(options) {
		L.TileLayer.prototype.initialize.call(this, options);
		this._cachedTileUrls = {};
		this._namedTiles = {};
		L.Util.setOptions(this, options);
	},

	getProjection: function () {
		return this.projection;
	},

	getTileName: function() {
		throw "getTileName not implemented";
	},

	getTileUrl: function (coords) {
		var tileName = this.getTileName(coords, coords.z),
			url = this._cachedTileUrls[tileName];

		if (!url) {
			let path = escape(`${this.options.worldName}/${tileName}`);
			url = `${window.config.url.tiles}${path}`;
			this._cachedTileUrls[tileName] = url;
		}

		return url;
	},

	updateNamedTile: function (name) {
		var tile = this._namedTiles[name];
		delete this._cachedTileUrls[name];

		if (tile) {
			tile.src = this._cachedTileUrls[name] = this.options.dynmap.getTileUrl(name);
		}
	},

	createTile(coords, done) {
		var tile = L.TileLayer.prototype.createTile.call(this, coords, done),
			name = this.getTileName(coords);

		tile.tileName = name;

		// console.log("Adding " + tile.tileName);
		this._namedTiles[name] = tile;

		return tile;
	},

	// stops loading all tiles in the background layer
	_abortLoading: function () {
		var i, tile;
		for (i in this._tiles) {
			if (!Object.prototype.hasOwnProperty.call(this._tiles, i)) {
				continue;
			}

			tile = this._tiles[i]

			if (tile.coords.z !== this._tileZoom) {
				if (!tile.complete && tile.el && tile.el.tileName) {
					// console.log("Aborting " + tile.el.tileName);
					delete this._namedTiles[tile.el.tileName];
				}
			}
		}

		L.TileLayer.prototype._abortLoading.call(this);
	},

	_removeTile: function (key) {
		var tile = this._tiles[key];

		if (!tile) {
			return;
		}

		var tileName = tile.el.tileName;

		if (tileName) {
			// console.log("Removing " + tileName);
			delete this._namedTiles[tileName];
			delete this._cachedTileUrls[tileName];
		}

		L.TileLayer.prototype._removeTile.call(this, key);
	},

	// Some helper functions.
	zoomprefix: function (amount) {
		return 'zzzzzzzzzzzzzzzzzzzzzz'.substr(0, amount);
	},

	getTileInfo: function (coords) {
		// zoom: max zoomed in = this.options.maxZoom, max zoomed out = 0
		// izoom: max zoomed in = 0, max zoomed out = this.options.maxZoom
		// zoomoutlevel: izoom < mapzoomin -> 0, else -> izoom - mapzoomin (which ranges from 0 till mapzoomout)
		var izoom = this._getZoomForUrl();
		var zoomoutlevel = Math.max(0, izoom - (this.options.maxZoom - this.options.maxNativeZoom));
		var scale = 1 << zoomoutlevel;
		var x = scale * coords.x;
		var y = scale * coords.y;
		return {
			prefix: this.options.prefix,
			nightday: (this.options.nightandday && this.options.dynmap.serverday) ? '_day' : '',
			scaledx: x >> 5,
			scaledy: y >> 5,
			zoom: this.zoomprefix(zoomoutlevel),
			zoomprefix: (zoomoutlevel == 0) ? "" : (this.zoomprefix(zoomoutlevel) + "_"),
			x: x,
			y: y,
			fmt: this.options['image-format'] || 'png'
		};
	}
});

export default DynmapTileLayer;