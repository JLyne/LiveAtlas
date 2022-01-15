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
import {defineComponent, computed, onMounted, watch, onUnmounted} from "@vue/runtime-core";
import {useStore} from "@/store";
import {createLine, updateLine} from "@/util/lines";
import LiveAtlasPolyline from "@/leaflet/vector/LiveAtlasPolyline";
import LiveAtlasLayerGroup from "@/leaflet/layer/LiveAtlasLayerGroup";
import {LiveAtlasLineMarker, LiveAtlasMarkerSet} from "@/index";
import {nonReactiveState} from "@/store/state";
import {DynmapMarkerUpdate} from "@/dynmap";
import {LiveAtlasMarkerType, registerTypeUpdateHandler, unregisterTypeUpdateHandler} from "@/util/markers";

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
		const store = useStore(),
			currentMap = computed(() => store.state.currentMap),
			layers = Object.freeze(new Map<string, LiveAtlasPolyline>());

		let converter = currentMap.value!.locationToLatLng.bind(store.state.currentMap)

		const createLines = () => {
			nonReactiveState.markers.get(props.set.id)!.lines.forEach((line: LiveAtlasLineMarker, id: string) => {
				const layer = createLine(line, converter);

				layers.set(id, layer);
				props.layerGroup.addLayer(layer);
			});
		};

		const deleteLine = (id: string) => {
			let line = layers.get(id) as LiveAtlasPolyline;

			if (!line) {
				return;
			}

			props.layerGroup.removeLayer(line);
			layers.delete(id);
		};

		const handleUpdate = (update: DynmapMarkerUpdate) => {
			if(update.removed) {
				deleteLine(update.id);
			} else {
				const layer = updateLine(layers.get(update.id), update.payload as LiveAtlasLineMarker, converter);

				if(!layers.has(update.id)) {
					props.layerGroup.addLayer(layer);
				}

				layers.set(update.id, layer);
			}
		};

		watch(currentMap, (newValue, oldValue) => {
			if(newValue && (!oldValue || oldValue.world === newValue.world)) {
				converter = currentMap.value!.locationToLatLng.bind(store.state.currentMap);

				for (const [id, line] of nonReactiveState.markers.get(props.set.id)!.lines) {
					updateLine(layers.get(id), line, converter);
				}
			}
		});

		onMounted(() => {
			createLines();
			registerTypeUpdateHandler(handleUpdate, props.set.id, LiveAtlasMarkerType.LINE);
		});
		onUnmounted(() => {
			unregisterTypeUpdateHandler(handleUpdate, props.set.id, LiveAtlasMarkerType.LINE);
		});
	},

	render() {
		return null;
	}
});
</script>
