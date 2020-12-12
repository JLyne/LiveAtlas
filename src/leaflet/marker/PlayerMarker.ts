import {LatLng, MarkerOptions, Marker, Util} from 'leaflet';
import {DynmapPlayer} from "@/dynmap";
import {PlayerIcon} from "@/leaflet/icon/PlayerIcon";

export interface PlayerMarkerOptions extends MarkerOptions {
	smallFace: boolean,
	showSkinFace: boolean,
	showBody: boolean,
	showHealth: boolean,
}

export class PlayerMarker extends Marker {
	private _player: DynmapPlayer;

	constructor(player: DynmapPlayer, options: PlayerMarkerOptions) {
		super(new LatLng(0, 0), options);
		this._player = player;
		options.draggable = false;

		options.icon = new PlayerIcon(player, {
			smallFace: options.smallFace,
			showSkinFace: options.showSkinFace,
			showBody: options.showBody,
			showHealth: options.showHealth,
		});

		Util.setOptions(this, options);
	}

	getIcon(): PlayerIcon {
		return this.options.icon as PlayerIcon;
	}

	panTo() {
		if (!this._map) {
			return;
		}

		this._map.panTo(this.getLatLng(), {
			animate: false,
			noMoveStart: true,
		});
	}

	_resetZIndex() {
		//Don't change the zindex
	}
}
