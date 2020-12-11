<script lang="ts">
import {defineComponent, computed, onMounted, onUnmounted, watch} from "@vue/runtime-core";
import {LayerGroup, Polyline, Polygon} from 'leaflet';
import {useStore} from "@/store";
import {DynmapArea, DynmapMarkerSet} from "@/dynmap";
import {ActionTypes} from "@/store/action-types";
import {createArea, updateArea} from "@/util/areas";
import Util from '@/util';

export default defineComponent({
	props: {
		set: {
			type: Object as () => DynmapMarkerSet,
			required: true,
		},
		layerGroup: {
			type: Object as () => LayerGroup,
			required: true
		}
	},

	setup(props) {
		let updateFrame = 0;

		const store = useStore(),
			currentProjection = computed(() => store.state.currentProjection),
			pendingUpdates = computed(() => {
				const markerSetUpdates = store.state.pendingSetUpdates.get(props.set.id);

				return markerSetUpdates && markerSetUpdates.areaUpdates.length;
			}),
			layers = Object.freeze(new Map()) as Map<string, Polygon | Polyline>,

			createAreas = () => {
				const converter = Util.getPointConverter();

				props.set.areas.forEach((area: DynmapArea, id: string) => {
					const layer = createArea(area, converter);

					layers.set(id, layer);
					props.layerGroup.addLayer(layer);
				});
			},

			deleteArea = (id: string) => {
				let area = layers.get(id) as Polyline;

				if(!area) {
					return;
				}

				area.remove();
				layers.delete(id);
			},

			handlePendingUpdates = () => {
				useStore().dispatch(ActionTypes.POP_AREA_UPDATES, {
					markerSet: props.set.id,
					amount: 10,
				}).then(updates => {
					const converter = Util.getPointConverter();

					for(const update of updates) {
						if(update.removed) {
							console.log(`Deleting area ${update.id}`);
							deleteArea(update.id);
						} else {
							console.log(`Updating/creating area ${update.id}`);
							layers.set(update.id, updateArea(layers.get(update.id), update.payload as DynmapArea, converter));
						}
					}

					if(pendingUpdates.value) {
						console.log('More updates left, scheduling frame');
						// eslint-disable-next-line no-unused-vars
						updateFrame = requestAnimationFrame(() => handlePendingUpdates());
					} else {
						updateFrame = 0;
					}
				});
			};

		//FIXME: Prevent unnecessary repositioning when changing worlds
		watch(currentProjection, () => {
			const converter = Util.getPointConverter();

			for (const [id, area] of props.set.areas) {
				updateArea(layers.get(id), area, converter);
			}
		});

		watch(pendingUpdates, (newValue, oldValue) => {
			if(newValue && newValue > 0 && oldValue === 0 && !updateFrame) {
				updateFrame = requestAnimationFrame(() => handlePendingUpdates());
			}
		});

		onMounted(() => createAreas());
		onUnmounted(() => updateFrame && cancelAnimationFrame(updateFrame));
	},

	render() {
		return null;
	}
});
</script>
