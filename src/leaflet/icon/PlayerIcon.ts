import L, {DivIconOptions} from 'leaflet';
import {DynmapPlayer} from "@/dynmap";

export interface PlayerIconOptions extends DivIconOptions {
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

		// var markerPosition = dynmap.getProjection().fromLocationToLatLng(player.location);
		// player.marker.setLatLng(markerPosition);

		this._container.classList.add('Marker', 'playerMarker', 'leaflet-marker-icon');

		this._playerImage = document.createElement('img');
		this._playerImage.classList.add(this.options.smallFace ? 'playerIconSm' : 'playerIcon');
		this._playerImage.src = 'images/player.png';

		this._playerName = document.createElement('span');
		this._playerName.classList.add(this.options.smallFace ? 'playerNameSm' : 'playerName');
		this._playerName.innerText = player.name;

		this._container.insertAdjacentElement('beforeend', this._playerImage);
		this._container.insertAdjacentElement('beforeend', this._playerName);

		if (this.options.showSkinFace) {

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
		}

		if (this.options.showHealth) {
			this._playerHealth = document.createElement('div');

			this._playerHealth.classList.add(this.options.smallFace ? 'healthContainerSm' : 'healthContainer');
			this._container.insertAdjacentElement('beforeend', this._playerHealth)

			this._playerHealthBar = document.createElement('div');
			this._playerHealthBar.classList.add('playerHealth');

			this._playerArmourBar = document.createElement('div');
			this._playerArmourBar.classList.add('playerHealth');

			this._playerHealthBg = document.createElement('div');
			this._playerArmourBg = document.createElement('div');

			this._playerHealthBg.classList.add('playerHealthBackground');
			this._playerArmourBar.classList.add('playerArmorBackground');

			this._playerHealthBg.insertAdjacentElement('beforeend', this._playerHealthBar);
			this._playerArmourBg.insertAdjacentElement('beforeend', this._playerArmourBar);

			this._playerHealth.insertAdjacentElement('beforeend', this._playerHealthBg);
			this._playerHealth.insertAdjacentElement('beforeend', this._playerArmourBg);

			this._playerHealth.hidden = true;
		} else {
			this._playerName.classList.add('playerNameNoHealth');
		}

		return this._container;
	}

	update() {
		this._playerName!.innerText = this._player!.name;

		if (this._player.health !== undefined && this._player.armor !== undefined) {
			this._playerHealth!.hidden = false;
			this._playerHealthBar!.style.width = Math.ceil(this._player.health * 2.5) + 'px';
			this._playerArmourBar!.style.width = Math.ceil(this._player.armor * 2.5) + 'px';
		} else {
			this._playerHealth!.hidden = true;
		}
	}
}
