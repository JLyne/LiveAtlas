<script lang="ts">
import {defineComponent, computed} from "@vue/runtime-core";
import L, {LatLngExpression} from 'leaflet';
import {useStore} from "@/store";
import {DynmapCircle} from "@/dynmap";

export default defineComponent({
	props: {
		circles: {
			type: Object as () => Map<string, DynmapCircle>,
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
			for (const [id, circle] of this.circles) {
				this.updateCircle(id, circle, latLng);
			}
		}
	},

	mounted() {
		this.createCircles();
	},

	unmounted() {

	},

	render() {
		return null;
	},

	methods: {
		createCircles() {
			const projection = useStore().state.currentProjection,
				latLng = (x: number, y: number, z: number) => {
					return projection.locationToLatLng({x, y, z});
				};

			this.circles.forEach((circle: DynmapCircle, id: string) => {
				this.createCircle(id, circle, latLng);
			});
		},

		createCircle(id: string, options: DynmapCircle, latLng: Function) {
			const outline = !options.style.fillOpacity || (options.style.fillOpacity <= 0),
				points = this.getPoints(options, latLng, outline);
			let circle;

			if(outline) {
				circle = new L.Polyline(points, options.style);
			} else {
				circle = new L.Polygon(points, options.style);
			}

			if(options.label) {
				circle.bindPopup(() => {
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
				});
			}

			this.layers.set(id, circle);
			this.layerGroup.addLayer(circle);
		},

		getPoints(options: DynmapCircle, latLng: Function, outline: boolean): LatLngExpression[] {
			const points = [];

			for(let i = 0; i < 360; i++) {
				const rad = i * Math.PI / 180.0,
					x = options.radius[0] * Math.sin(rad) + options.location.x,
					z = options.radius[1] * Math.cos(rad) + options.location.z;

				console.log(x,options.location.y,z, latLng(x, options.location.y, z));

				points.push(latLng(x, options.location.y, z));
			}

			if(outline && points.length) {
				points.push(points[0]);
			}

			return points;
		},

		updateCircle(id: string, options: DynmapCircle, latLng: Function) {
			let circle = this.layers.get(id) as L.Polyline,
				outline = (options.style && options.style.fillOpacity && (options.style.fillOpacity <= 0)) as boolean,
				points = this.getPoints(options, latLng, outline);

			if (!circle) {
				return;
			}

			circle.setLatLngs(points);
			circle.redraw();
		},
	}
})
</script>

<style scoped>

</style>