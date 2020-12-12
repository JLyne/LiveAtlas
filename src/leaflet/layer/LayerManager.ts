import L from 'leaflet';
import {DynmapLayerControl} from "@/leaflet/control/DynmapLayerControl";

export default class LayerManager {
	private showControl: boolean = false;
	private readonly layerControl: DynmapLayerControl;
	private readonly map: L.Map;

	constructor(map: L.Map, showControl?: boolean) {
		this.showControl = showControl || this.showControl;
		this.map = map;
		this.layerControl = new DynmapLayerControl({}, {},{
			position: 'topleft',
		});

		if(this.showControl) {
			this.map.addControl(this.layerControl);
		}
	}

	addLayer(layer: L.Layer, showInControl: boolean, name: string, position: number) {
		this.map.addLayer(layer);

		if(showInControl) {
			this.layerControl.addOverlay(layer, name);
		}
	}

	removeLayer(layer: L.Layer) {
		this.map.removeLayer(layer);
		this.layerControl.removeLayer(layer);
	}
}