import L, {MapOptions} from 'leaflet';
import LayerManager from "@/leaflet/layer/LayerManager";

interface DynmapMapOptions extends MapOptions {
	layerControl: boolean;
}

export default class DynmapMap extends L.Map {
	private readonly _layerManager: LayerManager;
	private _controlCorners: any;
	private	_controlContainer?: HTMLElement;
	private	_container?: HTMLElement;

	constructor(element: string | HTMLElement, options?: DynmapMapOptions) {
		super(element, options);

		this._layerManager = Object.seal(new LayerManager(this, options?.layerControl));
	}

	getLayerManager(): LayerManager {
		return this._layerManager;
	}

	_initControlPos() {
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
	}

	getUrl() {

	}
}
