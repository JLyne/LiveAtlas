import L from 'leaflet';

const PlayerMarker = L.Marker.extend({
	options: {
		smallFace: true,
		showSkinFace: false,
		showBody: false,
		showHealth: false,
	},

	initialize: function (player, options) {
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
	},
});

var PlayerIcon = L.DivIcon.extend({
	_player: null,
	_container: null,
	_playerImage: null,
	_playerName: null,

	_playerHealth: null,
	_playerHealthBg: null,
	_playerHealthBar: null,
	_playerArmourBg: null,
	_playerArmourBar: null,

	options: {
		smallFace: true,
		showSkinFace: false,
		showBody: false,
		showHealth: false,
	},

	initialize: function (player, options) {
		this._player = player;
		L.Util.setOptions(this, options);
	},

	createIcon: function (oldIcon) {
		if (oldIcon) {
			L.DomUtil.remove(oldIcon);
		}

		var player = this._player;

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
			var that = this;

			if (this.options.smallFace) {
				getMinecraftHead(player.account, 16, function (head) {
					that._playerImage.src = head.src;
				});
			} else if (this.options.showBody) {
				getMinecraftHead(player.account, 'body', function (head) {
					that._playerImage.src = head.src;
				});
			} else {
				getMinecraftHead(player.account, 32, function (head) {
					that._playerImage.src = head.src;
				});
			}
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

		// var div = (oldIcon && oldIcon.tagName === 'DIV') ? oldIcon : document.createElement('div'),
		//     options = this.options;
		//
		// if (options.html instanceof Element) {
		// 	empty(div);
		// 	div.appendChild(options.html);
		// } else {
		// 	div.innerHTML = options.html !== false ? options.html : '';
		// }
		//
		// if (options.bgPos) {
		// 	var bgPos = toPoint(options.bgPos);
		// 	div.style.backgroundPosition = (-bgPos.x) + 'px ' + (-bgPos.y) + 'px';
		// }
		// this._setIconStyles(div, 'icon');
		//
		// return div;
	},

	update() {
		this._playerName.innerText = this.player.name;

		if (this.options.player.health !== undefined && this.options.player.armor !== undefined) {
			this.options.player.healthContainer.hidden = false;
			this._this.options.playerHealthBar.style.width = Math.ceil(this.options.player.health * 2.5) + 'px';
			this._this.options.playerArmourBar.style.width = Math.ceil(this.options.player.armor * 2.5) + 'px';
		} else {
			this.options.player.healthContainer.hidden = true;
		}
	}
});

export default PlayerMarker;