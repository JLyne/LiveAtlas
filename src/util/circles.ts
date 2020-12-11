import {DynmapCircle} from "@/dynmap";
import {Polyline, Polygon, LatLngExpression} from "leaflet";

export const createCircle = (options: DynmapCircle, converter: Function): Polyline | Polygon => {
	const outline = !options.style.fillOpacity || (options.style.fillOpacity <= 0),
		points = getCirclePoints(options, converter, outline);
	let circle;

	if(outline) {
		circle = new Polyline(points, options.style);
	} else {
		circle = new Polygon(points, options.style);
	}

	if(options.label) {
		circle.bindPopup(() => createPopup(options));
	}

	return circle;
};

export const updateCircle = (circle: Polyline | Polygon | undefined, options: DynmapCircle, converter: Function): Polyline | Polygon => {
	const outline = (options.style && options.style.fillOpacity && (options.style.fillOpacity <= 0)) as boolean,
		points = getCirclePoints(options, converter, outline);

	if (!circle) {
		return createCircle(options, converter);
	}

	circle.unbindPopup();
	circle.bindPopup(() => createPopup(options));
	circle.setStyle(options.style);
	circle.setLatLngs(points);
	circle.redraw();

	return circle;
}

export const createPopup = (options: DynmapCircle) => {
	const popup = document.createElement('span');

	if (options.popupContent) {
		popup.classList.add('CirclePopup');
		popup.insertAdjacentHTML('afterbegin', options.popupContent);
	} else if (options.isHTML) {
		popup.classList.add('CirclePopup');
		popup.insertAdjacentHTML('afterbegin', options.label);
	} else {
		popup.textContent = options.label;
	}

	return popup;
}

export const getCirclePoints = (options: DynmapCircle, converter: Function, outline: boolean): LatLngExpression[] => {
	const points = [];

	for(let i = 0; i < 360; i++) {
		const rad = i * Math.PI / 180.0,
			x = options.radius[0] * Math.sin(rad) + options.location.x,
			z = options.radius[1] * Math.cos(rad) + options.location.z;

		points.push(converter(x, options.location.y, z));
	}

	if(outline && points.length) {
		points.push(points[0]);
	}

	return points;
};
