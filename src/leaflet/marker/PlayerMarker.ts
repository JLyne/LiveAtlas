/*
 * Copyright 2021 James Lyne
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {LatLng, MarkerOptions, Marker, Util} from 'leaflet';
import {PlayerIcon} from "@/leaflet/icon/PlayerIcon";
import {LiveAtlasPlayer} from "@/index";

export interface PlayerMarkerOptions extends MarkerOptions {
	smallFace: boolean,
	showSkinFace: boolean,
	showBody: boolean,
	showHealth: boolean,
}

export class PlayerMarker extends Marker {
	declare options: PlayerMarkerOptions;

	private _player: LiveAtlasPlayer;

	constructor(player: LiveAtlasPlayer, options: PlayerMarkerOptions) {
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

	// noinspection JSUnusedGlobalSymbols
	_resetZIndex() {
		//Don't change the zindex
	}
}
