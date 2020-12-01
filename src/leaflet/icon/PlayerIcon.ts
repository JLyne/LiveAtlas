import L, {MarkerOptions} from 'leaflet';
import {DynmapPlayer} from "@/dynmap";

const noSkinImage: HTMLImageElement = document.createElement('img');
noSkinImage.height = 16;
noSkinImage.width = 16;
noSkinImage.src = 'images/player.png';

export interface PlayerIconOptions extends MarkerOptions {
	smallFace: boolean,
	showSkinFace: boolean,
	showBody: boolean,
	showHealth: boolean,
}

export class PlayerIcon extends L.DivIcon {
	private readonly _player: DynmapPlayer;
	private _container?: HTMLDivElement;
	private _playerImage?: HTMLImageElement;
	private _playerName?: HTMLSpanElement;

	private _playerHealth?: HTMLDivElement;
	private _playerHealthBg?: HTMLDivElement;
	private _playerHealthBar?: HTMLDivElement;
	private _playerArmourBg?: HTMLDivElement;
	private _playerArmourBar?: HTMLDivElement;

	// @ts-ignore
	options: PlayerIconOptions;

	constructor(player: DynmapPlayer, options: PlayerIconOptions) {
		super(options);
		this._player = player;
	}

	createIcon(oldIcon: HTMLElement) {
		if (oldIcon) {
			L.DomUtil.remove(oldIcon);
		}

		const player = this._player;

		this._container = document.createElement('div');

		this._container.classList.add('Marker', 'playerMarker', 'leaflet-marker-icon');

		this._playerName = document.createElement('span');
		this._playerName.classList.add(this.options.smallFace ? 'playerNameSm' : 'playerName');
		this._playerName.innerText = player.name;

		if (this.options.showSkinFace) {
			this._playerImage = document.createElement('img');
			this._playerImage.classList.add(this.options.smallFace ? 'playerIconSm' : 'playerIcon');

			// if (this.options.smallFace) {
			// 	getMinecraftHead(player.account, 16, head => {
			// 		this._playerImage!.src = head.src;
			// 	});
			// } else if (this.options.showBody) {
			// 	getMinecraftHead(player.account, 'body', head => {
			// 		this._playerImage!.src = head.src;
			// 	});
			// } else {
			// 	getMinecraftHead(player.account, 32, head => {
			// 		this._playerImage!.src = head.src;
			// 	});
			// }
		} else {
			this._playerImage = noSkinImage.cloneNode(false) as HTMLImageElement;
			this._playerImage.classList.add(this.options.smallFace ? 'playerIconSm' : 'playerIcon');
		}

		this._container.appendChild(this._playerImage);
		this._container.appendChild(this._playerName);

		if (this.options.showHealth) {
			this._playerHealth = document.createElement('div');

			this._playerHealth.classList.add(this.options.smallFace ? 'healthContainerSm' : 'healthContainer');
			this._container.appendChild(this._playerHealth)

			this._playerHealthBar = document.createElement('div');
			this._playerHealthBar.classList.add('playerHealth');

			this._playerArmourBar = document.createElement('div');
			this._playerArmourBar.classList.add('playerHealth');

			this._playerHealthBg = document.createElement('div');
			this._playerArmourBg = document.createElement('div');

			this._playerHealthBg.classList.add('playerHealthBackground');
			this._playerArmourBar.classList.add('playerArmorBackground');

			this._playerHealthBg.appendChild(this._playerHealthBar);
			this._playerArmourBg.appendChild(this._playerArmourBar);

			this._playerHealth.appendChild(this._playerHealthBg);
			this._playerHealth.appendChild(this._playerArmourBg);

			this._playerHealth.hidden = true;
		} else {
			this._playerName.classList.add('playerNameNoHealth');
		}

		return this._container;
	}

	update() {
		if(!this._container) {
			return;
		}

		this._playerName!.innerText = this._player!.name;

		if(this.options.showHealth) {
			if (this._player.health !== undefined && this._player.armor !== undefined) {
				this._playerHealth!.hidden = false;
				this._playerHealthBar!.style.width = Math.ceil(this._player.health * 2.5) + 'px';
				this._playerArmourBar!.style.width = Math.ceil(this._player.armor * 2.5) + 'px';
			} else {
				this._playerHealth!.hidden = true;
			}
		}
	}
}
