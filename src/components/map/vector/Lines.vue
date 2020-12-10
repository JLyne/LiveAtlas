<script lang="ts">
import {defineComponent, computed} from "@vue/runtime-core";
import L, {LatLngExpression} from 'leaflet';
import {useStore} from "@/store";
import {DynmapLine} from "@/dynmap";

export default defineComponent({
	props: {
		lines: {
			type: Object as () => Map<string, DynmapLine>,
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
			for (const [id, line] of this.lines) {
				this.updateLine(id, line, latLng);
			}
		}
	},

	mounted() {
		this.createLines();
	},

	unmounted() {

	},

	render() {
		return null;
	},

	methods: {
		createLines() {
			const projection = useStore().state.currentProjection,
				latLng = (x: number, y: number, z: number) => {
					return projection.locationToLatLng({x, y, z});
				};

			this.lines.forEach((line: DynmapLine, id: string) => {
				this.createLine(id, line, latLng);
			});
		},

		createLine(id: string, options: DynmapLine, latLng: Function) {
			const points = this.getPoints(options, latLng),
				line= new L.Polyline(points, options.style);

			if(options.label) {
				line.bindPopup(() => {
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
				});
			}

			this.layers.set(id, line);
			this.layerGroup.addLayer(line);
		},

		getPoints(options: DynmapLine, latLng: Function): LatLngExpression[] {
			const points = [];

			for(let i = 0; i < options.x.length; i++) {
				points.push(latLng(options.x[i], options.y[i], options.z[i]));
			}

			return points;
		},

		updateLine(id: string, options: DynmapLine, latLng: Function) {
			let line = this.layers.get(id) as L.Polyline,
				points = this.getPoints(options, latLng);

			if (!line) {
				return;
			}

			line.setLatLngs(points);
			line.redraw();
		},
	}
})
</script>

<style scoped>

</style>