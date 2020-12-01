import L, {ControlOptions, ControlPosition, LeafletMouseEvent} from 'leaflet';
import {useStore} from "@/store";

const store = useStore();

export interface CoordinatesControlOptions extends ControlOptions {
	showY: boolean;
	showRegion: boolean;
	showChunk: boolean;
	label: string;
}

export class LayerControl extends L.Control.Layers {
	constructor() {
		super();
	}

	// Function override to include pos
	addOverlay(layer: L.Layer, name: string, pos: number) {
		this._addLayer(layer, name, true, pos);
		this._update();
		return this;
	}

	// Function override to order layers by pos
	_addLayer(layer: L.Layer, name: string, overlay, pos: number) {
		var id = L.stamp(layer);

		this._layers[pos] = {
			layer: layer,
			name: name,
			overlay: overlay,
			id: id
		};

		if (this.options.autoZIndex && layer.setZIndex) {
			this._lastZIndex++;
			layer.setZIndex(this._lastZIndex);
		}
	}

	// Function override to convert the position-based ordering into the id-based ordering
	_onInputClick() {
		var i, input, obj,
		    inputs = this._form.getElementsByTagName('input'),
		    inputsLen = inputs.length,
		    baseLayer;

		this._handlingClick = true;

		// Convert ID to pos
		var id2pos = {};
		for (i in this._layers) {
			id2pos[this._layers[i].id] = i;
		}

		for (i = 0; i < inputsLen; i++) {
			input = inputs[i];
			obj = this._layers[id2pos[input.layerId]];

			if (input.checked && !this._map.hasLayer(obj.layer)) {
				this._map.addLayer(obj.layer);
				if (!obj.overlay) {
					baseLayer = obj.layer;
				}
			} else if (!input.checked && this._map.hasLayer(obj.layer)) {
				this._map.removeLayer(obj.layer);
			}
		}

		if (baseLayer) {
			this._map.setZoom(this._map.getZoom());
			this._map.fire('baselayerchange', {layer: baseLayer});
		}

		this._handlingClick = false;
	}
}
