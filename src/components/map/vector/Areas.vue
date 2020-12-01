<script lang="ts">
import {defineComponent, computed} from "@vue/runtime-core";
import L, {LatLngExpression} from 'leaflet';
import {useStore} from "@/store";
import {DynmapArea} from "@/dynmap";

export default defineComponent({
	props: {
		areas: {
			type: Object as () => Map<string, DynmapArea>,
			required: true
		},
		layerGroup: {
			type: Object as () => L.LayerGroup,
			required: true
		}
	},

	setup() {
		const store = useStore(),
			currentProjection = computed(() => store.state.currentProjection),
			layers = Object.freeze(new Map()) as Map<string, L.Path>;

		return {
			layers,
			currentProjection,
		}
	},

	watch: {
		//FIXME: Prevent unnecessary repositioning when changing worlds
		currentProjection() {
			const projection = useStore().state.currentProjection,
				latLng = (x: number, y: number, z: number) => {
					return projection.locationToLatLng({x, y, z});
				}

			// eslint-disable-next-line no-unused-vars
			for (const [id, area] of this.areas) {
				this.updateArea(id, area, latLng);
			}
		}
	},

	mounted() {
		this.createAreas();
	},

	unmounted() {

	},

	render() {
		return null;
	},

	methods: {
		createAreas() {
			const projection = useStore().state.currentProjection,
				latLng = (x: number, y: number, z: number) => {
					return projection.locationToLatLng({x, y, z});
				};

			this.areas.forEach((area: DynmapArea, id: string) => {
				this.createArea(id, area, latLng);
			});
		},

		createArea(id: string, options: DynmapArea, latLng: Function) {
			const outline = !options.style.fillOpacity || (options.style.fillOpacity <= 0),
				points = this.getPoints(options, latLng, outline),
				area: L.Path = outline ? new L.Polyline(points, options.style) : new L.Polygon(points, options.style);

			if (options.label) {
				area.bindPopup(() => {
					const popup = document.createElement('span');

					if (options.popupContent) {
						popup.classList.add('AreaPopup');
						popup.insertAdjacentHTML('afterbegin', options.popupContent);
					} else if (options.isHTML) {
						popup.classList.add('AreaPopup');
						popup.insertAdjacentHTML('afterbegin', options.label);
					} else {
						popup.textContent = options.label;
					}

					return popup;
				});
			}

			this.layers.set(id, area);
			this.layerGroup.addLayer(area);
		},

		updateArea(id: string, options: DynmapArea, latLng: Function) {
			let area = this.layers.get(id) as L.Polyline,
				outline = (options.style && options.style.fillOpacity && (options.style.fillOpacity <= 0)) as boolean,
				points = this.getPoints(options, latLng, outline);

			if (!area) {
				return;
			}

			area.setLatLngs(points);
			area.redraw();
		},

		getPoints(options: DynmapArea, latLng: Function, outline: boolean): LatLngExpression[] | LatLngExpression[][] {
			if (options.x.length === 2) {	/* Only 2 points */
				if (options.y[0] === options.y[1]) {
					return this.get2DBoxPoints(options, latLng, outline);
				} else {
					return this.get3DBoxPoints(options, latLng);
				}
			} else {
				if (options.y[0] === options.y[1]) {
					return this.get2DShapePoints(options, latLng, outline);
				} else {
					return this.get3DShapePoints(options, latLng);
				}
			}
		},

		get3DBoxPoints(options: DynmapArea, latLng: Function): LatLngExpression[][] {
			const maxX = options.x[0],
				minX = options.x[1],
				maxY = options.y[0],
				minY = options.y[1],
				maxZ = options.z[0],
				minZ = options.z[1];

			return [
				[
					latLng(minX, minY, minZ),
					latLng(maxX, minY, minZ),
					latLng(maxX, minY, maxZ),
					latLng(minX, minY, maxZ)
				], [
					latLng(minX, maxY, minZ),
					latLng(maxX, maxY, minZ),
					latLng(maxX, maxY, maxZ),
					latLng(minX, maxY, maxZ)
				], [
					latLng(minX, minY, minZ),
					latLng(minX, maxY, minZ),
					latLng(maxX, maxY, minZ),
					latLng(maxX, minY, minZ)
				], [
					latLng(maxX, minY, minZ),
					latLng(maxX, maxY, minZ),
					latLng(maxX, maxY, maxZ),
					latLng(maxX, minY, maxZ)
				], [
					latLng(minX, minY, maxZ),
					latLng(minX, maxY, maxZ),
					latLng(maxX, maxY, maxZ),
					latLng(maxX, minY, maxZ)
				], [
					latLng(minX, minY, minZ),
					latLng(minX, maxY, minZ),
					latLng(minX, maxY, maxZ),
					latLng(minX, minY, maxZ)
				]
			];
		},

		get2DBoxPoints(options: DynmapArea, latLng: Function, outline: boolean): LatLngExpression[] {
			const maxX = options.x[0],
				minX = options.x[1],
				minY = options.y[1],
				maxZ = options.z[0],
				minZ = options.z[1];

			if (outline) {
				return [
					latLng(minX, minY, minZ),
					latLng(maxX, minY, minZ),
					latLng(maxX, minY, maxZ),
					latLng(minX, minY, maxZ),
					latLng(minX, minY, minZ)
				];
			} else {
				return [
					latLng(minX, minY, minZ),
					latLng(maxX, minY, minZ),
					latLng(maxX, minY, maxZ),
					latLng(minX, minY, maxZ)
				];
			}
		},

		get3DShapePoints(options: DynmapArea, latLng: Function): LatLngExpression[][] {
			const toplist = [],
				botlist = [],
				polylist = [];

			for (let i = 0; i < options.x.length; i++) {
				toplist[i] = latLng(options.x[i], options.y[0], options.z[i]);
				botlist[i] = latLng(options.x[i], options.y[1], options.z[i]);
			}

			for (let i = 0; i < options.x.length; i++) {
				const sidelist = [];
				sidelist[0] = toplist[i];
				sidelist[1] = botlist[i];
				sidelist[2] = botlist[(i + 1) % options.x.length];
				sidelist[3] = toplist[(i + 1) % options.x.length];
				polylist[i] = sidelist;
			}

			polylist[options.x.length] = botlist;
			polylist[options.x.length + 1] = toplist;

			return polylist;
		},

		get2DShapePoints(options: DynmapArea, latLng: Function, outline: boolean): LatLngExpression[] {
			const points = [];

			for (let i = 0; i < options.x.length; i++) {
				points[i] = latLng(options.x[i], options.y[1], options.z[i]);
			}

			if (outline) {
				points.push(points[0]);
			}

			return points;
		}
	}
})
</script>

<style scoped>

</style>