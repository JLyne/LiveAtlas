/*
 * Copyright 2021 James Lyne
 *
 * Some portions of this file were taken from https://github.com/webbukkit/dynmap.
 * These portions are Copyright 2020 Dynmap Contributors.
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

import {BaseIconOptions, DomUtil, Icon, Layer, LayerOptions, Util} from 'leaflet';
import {getMinecraftHead} from '@/util';
import playerImage from '@/assets/images/player_face.png';
import {LiveAtlasPlayer, LiveAtlasPlayerImageSize} from "@/index";

const noSkinImage: HTMLImageElement = document.createElement('img');
noSkinImage.height = 16;
noSkinImage.width = 16;

const smallImage: HTMLImageElement = document.createElement('img');
smallImage.height = 16;
smallImage.width = 16;

const largeImage: HTMLImageElement = document.createElement('img');
largeImage.height = 32;
largeImage.width = 32;

const bodyImage: HTMLImageElement = document.createElement('img');
bodyImage.height = 32;
bodyImage.width = 32;

noSkinImage.src = smallImage.src = largeImage.src = bodyImage.src = playerImage;
noSkinImage.className = smallImage.className = largeImage.className = bodyImage.className = 'player__icon';

export interface PlayerIconOptions extends BaseIconOptions {
	imageSize: LiveAtlasPlayerImageSize,
	showSkin: boolean,
	showHealth: boolean,
	showArmor: boolean,
}

export class PlayerIcon extends Layer implements Icon<PlayerIconOptions> {
	declare options: PlayerIconOptions;

	private readonly _player: LiveAtlasPlayer;
	private _container?: HTMLDivElement;
	private _playerImage?: HTMLImageElement;
	private _playerInfo?: HTMLSpanElement;
	private _playerName?: HTMLSpanElement;

	private _currentName?: string;

	private _playerHealth?: HTMLMeterElement;
	private _playerArmor?: HTMLMeterElement;

	constructor(player: LiveAtlasPlayer, options: PlayerIconOptions) {
		super(options as LayerOptions);
		Util.setOptions(this, options);
		this._player = player;
	}

	createIcon(oldIcon: HTMLElement) {
		if (oldIcon) {
			DomUtil.remove(oldIcon);
		}

		const player = this._player;

		this._container = document.createElement('div');

		this._container.classList.add('marker', 'marker--player', 'leaflet-marker-icon');

		this._playerInfo = document.createElement('div');
		this._playerInfo.className = 'marker__label';

		this._playerName = document.createElement('span');
		this._playerName.className = 'player__name';
		this._playerName.innerHTML = this._currentName = player.displayName;

		if (this.options.showSkin) {
			let size;

			switch(this.options.imageSize) {
				case 'small':
					this._playerImage = smallImage.cloneNode() as HTMLImageElement;
					size = '16';
					break;

				case 'body':
					this._playerImage = bodyImage.cloneNode() as HTMLImageElement;
					size = 'body';
					break;

				default:
					this._playerImage = largeImage.cloneNode() as HTMLImageElement;
					size = '32';
			}

			getMinecraftHead(player, size).then(head => {
				this._playerImage!.src = head.src;
			}).catch(() => {});
		} else {
			this._playerImage = noSkinImage.cloneNode(false) as HTMLImageElement;
		}

		this._playerInfo.appendChild(this._playerImage);
		this._playerInfo.appendChild(this._playerName);
		this._container.appendChild(this._playerInfo);

		if (this.options.showHealth) {
			this._playerHealth = document.createElement('meter');
			this._playerHealth.className = 'player__health';
			this._playerHealth.hidden = true;
			this._playerHealth.max = 100;

			this._playerInfo.appendChild(this._playerHealth);
		}

		if (this.options.showArmor) {
			this._playerArmor = document.createElement('meter');
			this._playerArmor.className = 'player__armor';
			this._playerArmor.hidden = true;
			this._playerArmor.max = 100;

			this._playerInfo.appendChild(this._playerArmor);
		}

		return this._container;
	}

	createShadow(oldIcon?: HTMLElement): HTMLElement {
		// @ts-ignore - Typings are wrong here, can return null
		return null;
	}

	update() {
		if(!this._container) {
			return;
		}

		if(this._player!.displayName !== this._currentName) {
			this._playerName!.innerHTML = this._currentName = this._player!.displayName;
		}

		if(this.options.showHealth) {
			if (this._player.health !== undefined) {
				this._playerHealth!.hidden = false;
				this._playerHealth!.value = this._player.health * 5;
			} else {
				this._playerHealth!.hidden = true;
			}
		}

		if(this.options.showArmor) {
			if(this._player.armor !== undefined) {
				this._playerArmor!.hidden = false;
				this._playerArmor!.value = this._player.armor * 5;
			} else {
				this._playerArmor!.hidden = true;
			}
		}
	}
}
