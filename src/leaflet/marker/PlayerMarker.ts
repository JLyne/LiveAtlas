/*
 * Copyright 2022 James Lyne
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

import {computed, watch, nextTick, WatchStopHandle} from "vue";
import {LatLng, Marker, Map, LayerGroup, Popup} from 'leaflet';
import {LiveAtlasChat, LiveAtlasPlayer, LiveAtlasPlayerImageSize, LiveAtlasPlayerMarker} from "@/index";
import {useStore} from "@/store";
import {PlayerIcon} from "@/leaflet/icon/PlayerIcon";
import LiveAtlasLeafletMap from "@/leaflet/LiveAtlasLeafletMap";

export interface PlayerMarkerOptions {
	imageSize: LiveAtlasPlayerImageSize,
	showHealth: boolean,
	showArmor: boolean,
	showYaw: boolean,
	compact: boolean,
}

export class PlayerMarker extends LayerGroup implements LiveAtlasPlayerMarker {
	declare _map: LiveAtlasLeafletMap;
	private readonly _parent: LayerGroup;
	private readonly _player: LiveAtlasPlayer;
	private readonly _marker: Marker;
	private readonly _icon: PlayerIcon;

	//Chat balloon
	private readonly _balloon: Popup;
	private _balloonVisible: boolean = false;
	//Timeout for closing the chat balloon
	private _balloonTimeout: ReturnType<typeof setTimeout> | null = null;

	//Cutoff time for chat messages
	//Only messages newer than this time will be shown in the chat balloon
	//Used to prevent old seen messages reappearing in some situations
	private _balloonCutoff: number = 0;

	private _imageUrlUnwatch?: WatchStopHandle;

	private readonly handleProjectionChange = () => this.update();

	constructor(player: LiveAtlasPlayer, layerGroup: LayerGroup, options: PlayerMarkerOptions) {
		super([]);

		this._parent = layerGroup;
		this._player = player;

		this._icon = new PlayerIcon(player, {
			imageSize: options.imageSize,
			showHealth: options.showHealth,
			showArmor: options.showArmor,
			showYaw: options.showYaw,
			compact: options.compact,
		});

		this._marker = new Marker(new LatLng(0, 0), {
			icon: this._icon,
			pane: 'players',
		});

		//Popup for chat messages, if chat balloons are enabled
		this._balloon =  new Popup({
			autoClose: false,
			autoPan: false,
			keepInView: false,
			closeButton: false,
			closeOnEscapeKey: false,
			closeOnClick: false,
			className: 'leaflet-popup--chat',
			minWidth: 0,
			pane: 'players',
		});

		this.addLayer(this._marker);
	}

	onAdd(map: Map) {
		const imageUrl = computed(() => useStore().state.components.players.imageUrl);
		this._imageUrlUnwatch = watch(imageUrl, () => nextTick(() => this._icon.updateImage()));

		this.update();
		map.on('projectionchange', this.handleProjectionChange);

		return super.onAdd(map);
	}

	onRemove(map: Map): this {
		if(this._imageUrlUnwatch) {
			this._imageUrlUnwatch();
		}

		if(this._icon) {
			this._icon.detach();
		}

		map.off('projectionchange', this.handleProjectionChange);

		return super.onRemove(map);
	}

	update() {
		if(this._map) {
			const latLng = this._map.locationToLatLng(this._player.location);

			this._marker.setLatLng(latLng);
			this._balloon.setLatLng(latLng);

			this._icon.update();
		}
	}

	showChat(chat: LiveAtlasChat[]) {
		chat = chat.filter(message => message.timestamp > this._balloonCutoff);

		const content = chat.reduceRight<string>((previousValue, currentValue) => {
			return previousValue + `<span>${currentValue.message}</span>`;
		}, '');

		if(!chat.length) {
			this.closeChatBalloon();
			return;
		}

		//Update balloon if content has changed
		if(content != this._balloon.getContent() || !this._balloonVisible) {
			this._balloon.setContent(content);

			if(!this._balloonVisible) {
				this.addLayer(this._balloon);
				this._balloonVisible = true;
			}

			//Reset close timer
			if(this._balloonTimeout) {
				clearTimeout(this._balloonTimeout);
			}

			//Set cutoff to oldest visible message
			this._balloonCutoff = chat[chat.length - 1].timestamp - 1;

			this._balloonTimeout = setTimeout(() => {
				this._balloonCutoff = chat[0].timestamp;
				this.closeChatBalloon()
			}, 8000);
		}
	}

	private closeChatBalloon() {
		this.removeLayer(this._balloon);
		this._balloonVisible = false;
	}

	enable() {
		this._parent.addLayer(this);

		//Prevent showing chat messages which were sent while the player was hidden
		this._balloonCutoff = new Date().getTime();
	}

	disable() {
		if(this._balloonTimeout) {
			clearTimeout(this._balloonTimeout);
		}

		this.closeChatBalloon();
		this._parent.removeLayer(this);
	}

	toggle() {
		this._map ? this._parent.removeLayer(this) : this._parent.addLayer(this);
	}

	destroy() {

	}
}
