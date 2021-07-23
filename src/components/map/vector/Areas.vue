<!--
  - Copyright 2020 James Lyne
  -
  -    Licensed under the Apache License, Version 2.0 (the "License");
  -    you may not use this file except in compliance with the License.
  -    You may obtain a copy of the License at
  -
  -      http://www.apache.org/licenses/LICENSE-2.0
  -
  -    Unless required by applicable law or agreed to in writing, software
  -    distributed under the License is distributed on an "AS IS" BASIS,
  -    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  -    See the License for the specific language governing permissions and
  -    limitations under the License.
  -->

<script lang="ts">
import {defineComponent, computed, onMounted, onUnmounted, watch} from "@vue/runtime-core";
import {useStore} from "@/store";
import {DynmapArea, DynmapMarkerSet} from "@/dynmap";
import {ActionTypes} from "@/store/action-types";
import {createArea, updateArea} from "@/util/areas";
import {getPointConverter} from '@/util';
import LiveAtlasLayerGroup from "@/leaflet/layer/LiveAtlasLayerGroup";
import LiveAtlasPolygon from "@/leaflet/vector/LiveAtlasPolygon";
import LiveAtlasPolyline from "@/leaflet/vector/LiveAtlasPolyline";

export default defineComponent({
	props: {
		set: {
			type: Object as () => DynmapMarkerSet,
			required: true,
		},
		layerGroup: {
			type: Object as () => LiveAtlasLayerGroup,
			required: true
		}
	},

	setup(props) {
		let updateFrame = 0;

		const store = useStore(),
			currentMap = computed(() => store.state.currentMap),
			pendingUpdates = computed(() => {
				const markerSetUpdates = store.state.pendingSetUpdates.get(props.set.id);

				return markerSetUpdates && markerSetUpdates.areaUpdates.length;
			}),
			layers = Object.freeze(new Map()) as Map<string, LiveAtlasPolygon | LiveAtlasPolyline>,

			createAreas = () => {
				const converter = getPointConverter();

				props.set.areas.forEach((area: DynmapArea, id: string) => {
					const layer = createArea(area, converter);

					layers.set(id, layer);
					props.layerGroup.addLayer(layer);
				});
			},

			deleteArea = (id: string) => {
				let area = layers.get(id) as LiveAtlasPolyline;

				if(!area) {
					return;
				}

				props.layerGroup.removeLayer(area);
				layers.delete(id);
			},

			handlePendingUpdates = async () => {
				const updates = await useStore().dispatch(ActionTypes.POP_AREA_UPDATES, {
					markerSet: props.set.id,
					amount: 10,
				});

				const converter = getPointConverter();

				for(const update of updates) {
					if(update.removed) {
						deleteArea(update.id);
					} else {
						const layer = updateArea(layers.get(update.id), update.payload as DynmapArea, converter)

						if(!layers.has(update.id)) {
							props.layerGroup.addLayer(layer);
						}

						layers.set(update.id, layer);
					}
				}

				if(pendingUpdates.value) {
					// eslint-disable-next-line no-unused-vars
					updateFrame = requestAnimationFrame(() => handlePendingUpdates());
				} else {
					updateFrame = 0;
				}
			};

		//FIXME: Prevent unnecessary repositioning when changing worlds
		watch(currentMap, (newValue) => {
			if(newValue) {
				const converter = getPointConverter();

				for (const [id, area] of props.set.areas) {
					updateArea(layers.get(id), area, converter);
				}
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
