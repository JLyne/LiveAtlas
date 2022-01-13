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
import {useStore} from "@/store";
import {ActionTypes} from "@/store/action-types";
import {createLine, updateLine} from "@/util/lines";
import LiveAtlasPolyline from "@/leaflet/vector/LiveAtlasPolyline";
import LiveAtlasLayerGroup from "@/leaflet/layer/LiveAtlasLayerGroup";
import {LiveAtlasLineMarker, LiveAtlasMarkerSet} from "@/index";
import {nonReactiveState} from "@/store/state";

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

				return markerSetUpdates && markerSetUpdates.lineUpdates.length;
			}),
			layers = Object.freeze(new Map<string, LiveAtlasPolyline>()),

			createLines = () => {
				const converter = currentMap.value!.locationToLatLng.bind(store.state.currentMap);

				nonReactiveState.markers.get(props.set.id)!.lines.forEach((line: LiveAtlasLineMarker, id: string) => {
					const layer = createLine(line, converter);

					layers.set(id, layer);
					props.layerGroup.addLayer(layer);
				});
			},

			deleteLine = (id: string) => {
				let line = layers.get(id) as LiveAtlasPolyline;

				if (!line) {
					return;
				}

				props.layerGroup.removeLayer(line);
				layers.delete(id);
			},

			handlePendingUpdates = async () => {
				const updates = await store.dispatch(ActionTypes.POP_LINE_UPDATES, {
					markerSet: props.set.id,
					amount: 10,
				}),
					converter = currentMap.value!.locationToLatLng.bind(store.state.currentMap);

				for(const update of updates) {
					if(update.removed) {
						deleteLine(update.id);
					} else {
						const layer = updateLine(layers.get(update.id), update.payload as LiveAtlasLineMarker, converter)

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

				for (const [id, line] of nonReactiveState.markers.get(props.set.id)!.lines) {
					updateLine(layers.get(id), line, converter);
				}
			}
		});

		watch(pendingUpdates, (newValue, oldValue) => {
			if(newValue && newValue > 0 && oldValue === 0 && !updateFrame) {
				updateFrame = requestAnimationFrame(() => handlePendingUpdates());
			}
		});

		onMounted(() => createLines());
		onUnmounted(() => updateFrame && cancelAnimationFrame(updateFrame));
	},

	render() {
		return null;
	}
});
</script>
