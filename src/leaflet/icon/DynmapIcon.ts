import L, {PointTuple} from 'leaflet';

export interface DynmapIconOptions {
	icon: string;
	label: string;
	dimensions: PointTuple;
	showLabel: boolean;
	isHtml?: boolean;
	className?: string;
}

export class DynmapIcon extends L.Icon<DynmapIconOptions> {
	static defaultOptions: DynmapIconOptions = {
		icon: 'default',
		label: '',
		dimensions: [16,16],
		showLabel: false,
		isHtml: false,
		className: '',
	};
	private _container?: HTMLDivElement;

	constructor(options: DynmapIconOptions) {
		super(Object.assign(DynmapIcon.defaultOptions, options));
	}

	createIcon(oldIcon: HTMLElement) {
		if (oldIcon) {
			L.DomUtil.remove(oldIcon);
		}

		const
			img = document.createElement('img'),
			label = document.createElement('span'),
			url = `${window.config.url.markers}_markers_/${this.options.icon}.png`;

		// this._container.classList.add('Marker', 'mapMarker');
		this._container = document.createElement('div');
		this._container.classList.add('leaflet-div-icon');
		this._container.style.backgroundColor = 'pink';
		this._container.style.width = '16px';
		this._container.style.height = '16px';

		if(this.options.className) {
			this._container.classList.add(this.options.className);
		}

		img.classList.add('markerIcon', `markerIcon${this.options.dimensions.join('x')}`);
		img.src = url;

		label.classList.add(this.options.showLabel ? 'markerName-show' : 'markerName');
		label.classList.add(/*'markerName_' + set.id,*/ `markerName${this.options.dimensions.join('x')}`);

		if (this.options.isHtml) {
			label.insertAdjacentHTML('afterbegin', this.options.label);
		} else {
			label.textContent = this.options.label;
		}

		// this._container.insertAdjacentElement('beforeend', img);
		// this._container.insertAdjacentElement('beforeend', label);

		return this._container;
	}

	update() {

	}
}
