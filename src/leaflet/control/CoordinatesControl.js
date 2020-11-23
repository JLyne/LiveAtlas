import L from 'leaflet';

L.Control.CoordinatesControl = L.Control.extend({
	options: {
		showY: true,
		showRegion: false,
		showChunk: false,
		label: 'x,y,z: ',
		position: 'topleft',
	},

	_coordsContainer: undefined,
	_regionContainer: undefined,
	_chunkContainer: undefined,

	constructor(options) {
		L.Util.setOptions(this, options);
	},

	onAdd(map) {
		var container = L.DomUtil.create('div', 'coord-control');

		if (!this.options.showY) {
			container.classList.add('coord-control-noy');
		}

		this._coordsContainer = L.DomUtil.create('span', 'coord-control-value');
		this._coordsContainer.innerText = this.options.showY ? '---,---,---' : '---,---';
		this._coordsContainer.dataset.label = this.options.label;
		container.insertAdjacentElement('beforeend', this._coordsContainer);

		if (this.options.showRegion) {
			this._regionContainer = L.DomUtil.create('span', 'coord-control-value');
			this._regionContainer.innerText = '--------';
			container.insertAdjacentElement('beforeend', this._regionContainer);
		}

		if (this.options.showChunk) {
			this._chunkContainer = L.DomUtil.create('span', 'coord-control-value');
			this._chunkContainer.innerText = '---,---';
			this._chunkContainer.dataset.label = 'Chunk: ';
			container.insertAdjacentElement('beforeend', this._chunkContainer);
		}

		map.on('mousemove', this._onMouseMove, this);
		map.on('mouseout', this._onMouseOut, this);

		this._update();
		return container;
	},

	remove() {
		if (!this._map) {
			return this;
		}

		this._map.on('mousemove', this._onMouseMove, this);
		this._map.on('mouseout', this._onMouseOut, this);
		L.Control.prototype.remove.call(this);

		return this;
	},

	_onMouseMove(event) {
		if (!this._map) {
			return;
		}

		var loc = dynmap.getProjection().fromLatLngToLocation(event.latlng, dynmap.world.sealevel + 1);

		if (this.options.showY) {
			this._coordsContainer.innerText = Math.round(loc.x) + ',' + loc.y + ',' + Math.round(loc.z);
		} else {
			this._coordsContainer.innerText = Math.round(loc.x) + ',' + Math.round(loc.z);
		}

		if (this.options.showRegion) {
			this._regionContainer.innerText = 'r.' + Math.floor(loc.x / 512) + '.' + Math.floor(loc.z / 512) + '.mca';
		}

		if (this.options.showChunk) {
			this._chunkContainer.innerText = 'Chunk: ' + Math.floor(loc.x / 16) + ',' + Math.floor(loc.z / 16);
		}
	},

	_onMouseOut() {
		if (!this._map) {
			return;
		}

		if (this.options.showY) {
			this._coordsContainer.innerText = '---,---';
		} else {
			this._coordsContainer.innerText = '---,---,---';
		}

		if (this.options.showRegion) {
			this._regionContainer.innerText = '--------';
		}

		if (this.options.showChunk) {
			this._chunkContainer.innerText = '---,---';
		}
	},

	_update() {
	}
});
