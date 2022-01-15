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
import {createArea, updateArea} from "@/util/areas";
import LiveAtlasLayerGroup from "@/leaflet/layer/LiveAtlasLayerGroup";
import LiveAtlasPolygon from "@/leaflet/vector/LiveAtlasPolygon";
import LiveAtlasPolyline from "@/leaflet/vector/LiveAtlasPolyline";
import {LiveAtlasAreaMarker, LiveAtlasMarkerSet} from "@/index";
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
			layers = Object.freeze(new Map()) as Map<string, LiveAtlasPolygon | LiveAtlasPolyline>;

		let converter = currentMap.value!.locationToLatLng.bind(currentMap.value);

		const createAreas = () => {
			nonReactiveState.markers.get(props.set.id)!.areas.forEach((area: LiveAtlasAreaMarker, id: string) => {
				const layer = createArea(area, converter);

				layers.set(id, layer);
				props.layerGroup.addLayer(layer);
			});
		};

		const deleteArea = (id: string) => {
			let area = layers.get(id) as LiveAtlasPolyline;

			if(!area) {
				return;
			}

			props.layerGroup.removeLayer(area);
			layers.delete(id);
		};

		const handleUpdate = (update: DynmapMarkerUpdate) => {
			if(update.removed) {
				deleteArea(update.id);
			} else {
				const layer = updateArea(layers.get(update.id), update.payload as LiveAtlasAreaMarker, converter);

				if(!layers.has(update.id)) {
					props.layerGroup.addLayer(layer);
				}

				layers.set(update.id, layer);
			}
		};

		watch(currentMap, (newValue, oldValue) => {
			if(newValue && (!oldValue || oldValue.world === newValue.world)) {
				converter = newValue.locationToLatLng.bind(newValue);

				for (const [id, area] of nonReactiveState.markers.get(props.set.id)!.areas) {
					updateArea(layers.get(id), area, converter);
				}
			}
		});

		onMounted(() => {
			createAreas();
			registerTypeUpdateHandler(handleUpdate, props.set.id, LiveAtlasMarkerType.AREA);
		});
		onUnmounted(() => {
			unregisterTypeUpdateHandler(handleUpdate, props.set.id, LiveAtlasMarkerType.AREA);
		});
	},

	render() {
		return null;
	}
});
</script>
