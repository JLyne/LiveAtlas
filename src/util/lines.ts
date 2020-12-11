import {DynmapLine} from "@/dynmap";
import {Polyline, Polygon, LatLngExpression} from "leaflet";

export const createLine = (options: DynmapLine, converter: Function): Polyline | Polygon => {
	const points = getLinePoints(options, converter),
		line = new Polyline(points, options.style);

	if(options.label) {
		line.bindPopup(() => createPopup(options));
	}

	return line;
};

export const updateLine = (line: Polyline | Polygon | undefined, options: DynmapLine, converter: Function): Polyline | Polygon => {
	const points = getLinePoints(options, converter);

	if (!line) {
		return createLine(options, converter);
	}

	line.unbindPopup();
	line.bindPopup(() => createPopup(options));
	line.setStyle(options.style);
	line.setLatLngs(points);
	line.redraw();

	return line;
}

export const createPopup = (options: DynmapLine) => {
	const popup = document.createElement('span');

	if (options.popupContent) {
		popup.classList.add('LinePopup');
		popup.insertAdjacentHTML('afterbegin', options.popupContent);
	} else if (options.isHTML) {
		popup.classList.add('LinePopup');
		popup.insertAdjacentHTML('afterbegin', options.label);
	} else {
		popup.textContent = options.label;
	}

	return popup;
}

export const getLinePoints = (options: DynmapLine, converter: Function): LatLngExpression[] => {
	const points = [];

	for(let i = 0; i < options.x.length; i++) {
		points.push(converter(options.x[i], options.y[i], options.z[i]));
	}

	return points;
};
