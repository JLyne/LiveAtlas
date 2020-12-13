import {Control, ControlOptions, DomUtil, Map} from 'leaflet';
import {useStore} from "@/store";
import linkIcon from '@/assets/icons/link.svg';
import ClipboardJS from 'clipboard';

export class LinkControl extends Control {
	// @ts-ignore
	options: ControlOptions

	private _map ?: Map;

	constructor(options: ControlOptions) {
		super(options);
	}

	onAdd(map: Map) {
		const linkButton = DomUtil.create('button', 'leaflet-control-link') as HTMLButtonElement;

		linkButton.type = 'button';
		linkButton.title = 'Link';
		linkButton.innerHTML = `
		<svg class="svg-icon" viewBox="${linkIcon.viewBox}">
		  <use xlink:href="${linkIcon.url}" />
		</svg>`;

		new ClipboardJS(linkButton, {
			text: () => window.location.href.split("#")[0] + useStore().getters.url,
		});

		return linkButton;
	}
}
