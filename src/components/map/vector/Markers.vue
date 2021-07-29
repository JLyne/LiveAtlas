<!--
  - Copyright 2021 James Lyne
  -
  - Licensed under the Apache License, Version 2.0 (the "License");
  - you may not use this file except in compliance with the License.
  - You may obtain a copy of the License at
  -
  - http://www.apache.org/licenses/LICENSE-2.0
  -
  - Unless required by applicable law or agreed to in writing, software
  - distributed under the License is distributed on an "AS IS" BASIS,
  - WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  - See the License for the specific language governing permissions and
  - limitations under the License.
  -->

<script lang="ts">
import {defineComponent, computed, onMounted, onUnmounted, watch} from "@vue/runtime-core";
import {Marker} from 'leaflet';
import {useStore} from "@/store";
import {ActionTypes} from "@/store/action-types";
import {createMarker, updateMarker} from "@/util/markers";
import LiveAtlasLayerGroup from "@/leaflet/layer/LiveAtlasLayerGroup";
import {LiveAtlasMarker, LiveAtlasMarkerSet} from "@/index";

export default defineComponent({
	props: {
		set: {
			type: Object as () => LiveAtlasMarkerSet,
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

				return markerSetUpdates && markerSetUpdates.markerUpdates.length;
			}),
			layers = Object.freeze(new Map()) as Map<string, Marker>,

			createMarkers = () => {
				const converter = currentMap.value!.locationToLatLng.bind(store.state.currentMap);

				props.set.markers.forEach((marker: LiveAtlasMarker, id: string) => {
					const layer = createMarker(marker, converter);

					layers.set(id, layer);
					props.layerGroup.addLayer(layer);
				});
			},

			deleteMarker = (id: string) => {
				let marker = layers.get(id) as Marker;

				if(!marker) {
					return;
				}

				props.layerGroup.removeLayer(marker);
				layers.delete(id);
			},

			handlePendingUpdates = async () => {
				const updates = await useStore().dispatch(ActionTypes.POP_MARKER_UPDATES, {
					markerSet: props.set.id,
					amount: 10,
				}),
					converter = currentMap.value!.locationToLatLng.bind(store.state.currentMap);

				for(const update of updates) {
					if(update.removed) {
						deleteMarker(update.id);
					} else {
						const layer = updateMarker(layers.get(update.id), update.payload as LiveAtlasMarker, converter);

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

		watch(currentMap, (newValue, oldValue) => {
			if(newValue && (!oldValue || oldValue.world === newValue.world)) {
				const converter = currentMap.value!.locationToLatLng.bind(store.state.currentMap);

				for (const [id, marker] of props.set.markers) {
					updateMarker(layers.get(id), marker, converter);
				}
			}
		});

		watch(pendingUpdates, (newValue, oldValue) => {
			if(newValue && newValue > 0 && oldValue === 0 && !updateFrame) {
				updateFrame = requestAnimationFrame(() => handlePendingUpdates());
			}
		});

		onMounted(() => createMarkers());
		onUnmounted(() => updateFrame && cancelAnimationFrame(updateFrame));
	},

	render() {
		return null;
	}
});
</script>
