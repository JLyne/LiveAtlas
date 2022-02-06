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
import {computed, watch} from "@vue/runtime-core";
import {nextTick, WatchStopHandle} from "vue";
import {useStore} from "@/store";

export interface PlayerMarkerOptions extends MarkerOptions {
	imageSize: LiveAtlasPlayerImageSize,
	showHealth: boolean,
	showArmor: boolean,
	showYaw: boolean,
	compact: boolean,
}

export class PlayerMarker extends Marker {
	declare options: PlayerMarkerOptions;
	declare _icon: HTMLElement | null;

	private readonly _PlayerIcon: PlayerIcon;
	private readonly _player: LiveAtlasPlayer;
	private _playerUnwatch?: WatchStopHandle;
	private _imageUrlUnwatch?: WatchStopHandle;

	constructor(player: LiveAtlasPlayer, options: PlayerMarkerOptions) {
		super(new LatLng(0, 0), options);
		this._player = player;

		this._PlayerIcon = options.icon = new PlayerIcon(player, {
			imageSize: options.imageSize,
			showHealth: options.showHealth,
			showArmor: options.showArmor,
			showYaw: options.showYaw,
			compact: options.compact,
		});

		Util.setOptions(this, options);
	}

	onAdd(map: Map) {
		const imageUrl = computed(() => useStore().state.components.players.imageUrl);

		this._playerUnwatch = watch(this._player, () => this._PlayerIcon.update(), {deep: true});
		this._imageUrlUnwatch = watch(imageUrl, () => nextTick(() => this._PlayerIcon.updateImage()));

		return super.onAdd(map);
	}

	onRemove(map: Map): this {
		if(this._playerUnwatch) {
			this._playerUnwatch();
		}

		if(this._imageUrlUnwatch) {
			this._imageUrlUnwatch();
		}

		if(this._icon) {
			this._PlayerIcon.detach();
		}

		return super.onRemove(map);
	}

	// noinspection JSUnusedGlobalSymbols
	_resetZIndex() {
		//Don't change the zindex
	}
}
