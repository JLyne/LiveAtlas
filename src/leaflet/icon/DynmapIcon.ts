import {DivIconOptions, PointExpression, Icon, DivIcon, DomUtil, point} from 'leaflet';

export interface DynmapIconOptions extends DivIconOptions {
	icon: string;
	label: string;
	showLabel: boolean;
	isHtml?: boolean;
}

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

		const div = document.createElement('div'),
			img = document.createElement('img'),
			label = document.createElement('span'),
			url = `${window.config.url.markers}_markers_/${this.options.icon}.png`,
			size = point(this.options.iconSize as PointExpression);

		const sizeClass = [size.x, size.y].join('x');

		img.className = `marker__icon marker__icon--${sizeClass}`;
		img.src = url;

		label.className = this.options.showLabel ? 'marker__label marker__label--show' : 'marker__label';
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

		console.log(div.className);

		return div;
	}
}
