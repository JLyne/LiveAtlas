import {Map, Layer} from 'leaflet';
import {DynmapLayerControl} from "@/leaflet/control/DynmapLayerControl";

export default class LayerManager {
	private showControl: boolean = false;
	private readonly layerControl: DynmapLayerControl;
	private readonly map: Map;

	constructor(map: Map, showControl?: boolean) {
		this.showControl = showControl || this.showControl;
		this.map = map;
		this.layerControl = new DynmapLayerControl({}, {},{
			position: 'topleft',
		});

		if(this.showControl) {
			this.map.addControl(this.layerControl);
		}
	}

	addLayer(layer: Layer, showInControl: boolean, name: string, position: number) {
		this.map.addLayer(layer);

		if(showInControl) {
			this.layerControl.addOverlay(layer, name);
		}
	}

	addHiddenLayer(layer: Layer, name: string, position: number) {
		this.layerControl.addOverlay(layer, name);
	}

	removeLayer(layer: Layer) {
		this.map.removeLayer(layer);
		this.layerControl.removeLayer(layer);
	}
}