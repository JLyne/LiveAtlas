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

import {LatLng, MarkerOptions, Marker, Map, Util} from 'leaflet';
import {PlayerIcon} from "@/leaflet/icon/PlayerIcon";
import {LiveAtlasPlayer, LiveAtlasPlayerImageSize} from "@/index";
import {watch} from "@vue/runtime-core";
import {WatchStopHandle} from "vue";

export interface PlayerMarkerOptions extends MarkerOptions {
	imageSize: LiveAtlasPlayerImageSize,
	showHealth: boolean,
	showArmor: boolean,
}

export class PlayerMarker extends Marker {
	declare options: PlayerMarkerOptions;

	private readonly _PlayerIcon: PlayerIcon;
	private readonly _player: LiveAtlasPlayer;
	private _playerUnwatch?: WatchStopHandle;

	constructor(player: LiveAtlasPlayer, options: PlayerMarkerOptions) {
		super(new LatLng(0, 0), options);
		this._player = player;

		this._PlayerIcon = options.icon = new PlayerIcon(player, {
			imageSize: options.imageSize,
			showHealth: options.showHealth,
			showArmor: options.showArmor,
		});

		Util.setOptions(this, options);
	}

	onAdd(map: Map) {
		this._playerUnwatch = watch(this._player, () => this._PlayerIcon.update(), {deep: true});
		return super.onAdd(map);
	}

	onRemove(map: Map): this {
		if(this._playerUnwatch) {
			this._playerUnwatch();
		}

		return super.onRemove(map);
	}

	// noinspection JSUnusedGlobalSymbols
	_resetZIndex() {
		//Don't change the zindex
	}
}
