import {DivIconOptions, PointExpression, Icon, DivIcon, DomUtil, point} from 'leaflet';

export interface DynmapIconOptions extends DivIconOptions {
	icon: string;
	label: string;
	showLabel: boolean;
	isHtml?: boolean;
}

const markerContainer: HTMLDivElement = document.createElement('div');
markerContainer.className = 'marker';

const markerIcon: HTMLImageElement = document.createElement('img');
markerIcon.className = 'marker__icon';

const markerLabel: HTMLSpanElement = document.createElement('span');
markerLabel.className = 'marker__label';

export class DynmapIcon extends DivIcon {
	static defaultOptions: DynmapIconOptions = {
		icon: 'default',
		label: '',
		iconSize: [16, 16],
		showLabel: false,
		isHtml: false,
		className: '',
	};

	// @ts-ignore
	options: DynmapIconOptions;

	constructor(options: DynmapIconOptions) {
		super(Object.assign(DynmapIcon.defaultOptions, options));
	}

	createIcon(oldIcon: HTMLElement) {
		if (oldIcon) {
			DomUtil.remove(oldIcon);
		}

		const div = markerContainer.cloneNode(false) as HTMLDivElement,
			img = markerIcon.cloneNode(false) as HTMLImageElement,
			label = markerLabel.cloneNode(false) as HTMLSpanElement,

			url = `${window.config.url.markers}_markers_/${this.options.icon}.png`,
			size = point(this.options.iconSize as PointExpression);

		const sizeClass = [size.x, size.y].join('x');

		img.width = size.x;
		img.height = size.y;
		img.src = url;

		if(this.options.showLabel) {
			label.classList.add('marker__label--show');
		}

		label.classList.add(/*'markerName_' + set.id,*/ `marker__label--${sizeClass}`);

		if (this.options.isHtml) {
			label.insertAdjacentHTML('afterbegin', this.options.label);
		} else {
			label.textContent = this.options.label;
		}

		// @ts-ignore
		Icon.prototype._setIconStyles.call(this, div, 'icon');

		div.appendChild(img);
		div.appendChild(label);
		div.classList.add('marker');

		if(this.options.className) {
			div.classList.add(this.options.className);
		}

		return div;
	}
}
