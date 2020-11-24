import L, {LatLng, MarkerOptions} from 'leaflet';
import {DynmapPlayer} from "@/dynmap";
import {PlayerIcon} from "@/leaflet/icon/PlayerIcon";

export interface PlayerMarkerOptions extends MarkerOptions {
	smallFace: boolean,
	showSkinFace: boolean,
	showBody: boolean,
	showHealth: boolean,
}

export class PlayerMarker extends L.Marker {
	private _player: DynmapPlayer;

	constructor(player: DynmapPlayer, options: PlayerMarkerOptions) {
		super(new LatLng(0,0), options);
		this._player = player;
		options.draggable = false;
		options.icon = new PlayerIcon(player, {
			smallFace: options.smallFace,
			showSkinFace: options.showSkinFace,
			showBody: options.showBody,
			showHealth: options.showHealth,
		});

		L.Util.setOptions(this, options);
		//this._latlng = toLatLng(latlng); //TODO
	}
}
