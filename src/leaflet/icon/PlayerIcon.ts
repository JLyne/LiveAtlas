/*
 * Copyright 2022 James Lyne
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

import {BaseIconOptions, Icon, Layer, LayerOptions, Util} from 'leaflet';
import {LiveAtlasPlayer, LiveAtlasPlayerImageSize} from "@/index";
import {getImagePixelSize, getPlayerImage} from "@/util/images";
import defaultImage from '@/assets/images/player_face.png';

const playerImage: HTMLImageElement = document.createElement('img');
playerImage.src = defaultImage;
playerImage.className = 'player__icon';

export interface PlayerIconOptions extends BaseIconOptions {
	compact: boolean;
	imageSize: LiveAtlasPlayerImageSize,
	showHealth: boolean,
	showArmor: boolean,
	showYaw: boolean,
}

export class PlayerIcon extends Layer implements Icon<PlayerIconOptions> {
	declare options: PlayerIconOptions;
	declare createShadow: (oldIcon?: HTMLElement) => HTMLElement;

	private readonly _player: LiveAtlasPlayer;
	private _container?: HTMLDivElement;
	private _playerImage?: HTMLImageElement;
	private _playerInfo?: HTMLSpanElement;
	private _playerName?: HTMLSpanElement;

	private _currentName?: string;

	private _playerHealth?: HTMLMeterElement;
	private _playerArmor?: HTMLMeterElement;
	private _playerYaw?: HTMLDivElement;

	private _currentYaw = 0;

	constructor(player: LiveAtlasPlayer, options: PlayerIconOptions) {
		super(options as LayerOptions);
		Util.setOptions(this, options);
		this._player = player;
	}

	createIcon() {
		// Reuse detached icon if it exists
		if (this._container) {
			this.update();
			return this._container;
		}

		this._currentName = undefined;
		this._container = document.createElement('div');
		this._container.classList.add('marker', 'marker--player', 'leaflet-marker-icon');

		this._playerInfo = document.createElement('div');
		this._playerInfo.className = 'marker__label';

		this._playerName = document.createElement('span');
		this._playerName.className = 'player__name';

		if(this.options.compact) {
			this._container.classList.add('marker--compact');
		}

		if (this.options.imageSize != 'none') {
			this._playerImage = playerImage.cloneNode() as HTMLImageElement;
			this._playerImage.height = this._playerImage.width = getImagePixelSize(this.options.imageSize);

			this.updateImage();
			this._playerInfo.appendChild(this._playerImage);
		}

		this._playerInfo.appendChild(this._playerName);

		if (this.options.showHealth) {
			this._playerHealth = document.createElement('meter');
			this._playerHealth.className = 'player__health';
			this._playerHealth.hidden = true;
			this._playerHealth.max = 20;

			this._playerInfo.appendChild(this._playerHealth);
		}

		if (this.options.showArmor) {
			this._playerArmor = document.createElement('meter');
			this._playerArmor.className = 'player__armor';
			this._playerArmor.hidden = true;
			this._playerArmor.max = 20;

			this._playerInfo.appendChild(this._playerArmor);
		}

		if (this.options.showYaw) {
			this._container.classList.add('player--yaw');

			this._playerYaw = document.createElement('div');
			this._playerYaw.className = 'player__yaw';
			this._container.appendChild(this._playerYaw);
		}

		this._container.appendChild(this._playerInfo);
		this.update();

		return this._container;
	}

	updateImage() {
		getPlayerImage(this._player, this.options.imageSize).then(head => {
			this._playerImage!.src = head.src;
		}).catch(() => {});
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
				this._playerHealth!.value = this._player.health;
			} else {
				this._playerHealth!.hidden = true;
			}
		}

		if(this.options.showArmor) {
			if(this._player.armor !== undefined) {
				this._playerArmor!.hidden = false;
				this._playerArmor!.value = this._player.armor;
			} else {
				this._playerArmor!.hidden = true;
			}
		}

		if(this.options.showYaw) {
			if(this._player.yaw !== undefined) {
				// https://stackoverflow.com/a/53416030
				const delta = ((((this._player.yaw - this._currentYaw) % 360) + 540) % 360) - 180;

				this._currentYaw = this._currentYaw + delta;
				this._playerYaw!.style.setProperty('--player-yaw', `${this._currentYaw}deg`);
			}
		}
	}

	detach() {
		if(this._container && this._container.parentNode) {
			this._container = this._container.parentNode.removeChild(this._container);
		}
	}
}
