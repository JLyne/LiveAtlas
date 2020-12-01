import L, {ControlOptions} from 'leaflet';

export interface LogoControlOptions extends ControlOptions {
	url?: string;
	image?: string;
	text: string;
}

export class LogoControl extends L.Control {
	// @ts-ignore
	options: LogoControlOptions;

	constructor(options: LogoControlOptions) {
		super(options);
	}

	onAdd(map: L.Map) {
		const container = L.DomUtil.create('div', 'leaflet-control-logo');
		let link;

		if (this.options.url) {
			link = L.DomUtil.create('a', '', container) as HTMLAnchorElement;
			link.href = this.options.url;
		}

		if (this.options.image) {
			const image = L.DomUtil.create('img', '', link) as HTMLImageElement;
			image.src = this.options.image;
			image.alt = this.options.text;
		} else {
			container.textContent = this.options.text;
		}

		return container;
	}
}

//
// dynmap.map.options.attributionControl = false;
// if (dynmap.map.attributionControl) {
// 	dynmap.map.removeControl(dynmap.map.attributionControl);
// 	dynmap.map.attributionControl = null;
// }
// }
// ;
