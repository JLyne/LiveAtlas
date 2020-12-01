import L from 'leaflet';

L.Map.include({
	_initControlPos: function () {
		const corners: any = this._controlCorners = {},
			l = 'leaflet-',
			container = this._controlContainer =
				L.DomUtil.create('div', l + 'control-container', this._container);

		function createCorner(vSide: string, hSide: string) {
			const className = l + vSide + ' ' + l + hSide;

			corners[`${vSide}${hSide}`] = L.DomUtil.create('div', className, container);
		}

		createCorner('top', 'left');
		createCorner('top', 'bar');
		createCorner('top', 'right');
		createCorner('top', 'center');
		createCorner('bottom', 'center');
		createCorner('bottom', 'bar');
		createCorner('bottom', 'left');
		createCorner('bottom', 'right');
	},

	getUrl() {

	}
});