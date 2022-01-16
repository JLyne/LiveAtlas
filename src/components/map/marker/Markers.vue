<!--
  - Copyright 2022 James Lyne
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
import LiveAtlasLayerGroup from "@/leaflet/layer/LiveAtlasLayerGroup";
import {LiveAtlasAreaMarker, LiveAtlasMarker, LiveAtlasMarkerSet} from "@/index";
import {nonReactiveState} from "@/store/state";
import {DynmapMarkerUpdate} from "@/dynmap";
import {
	createMarkerLayer,
	registerSetUpdateHandler, unregisterSetUpdateHandler, updateMarkerLayer
} from "@/util/markers";
import {Layer} from "leaflet";

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
			layers = Object.freeze(new Map()) as Map<string, Layer>;

		let converter = currentMap.value!.locationToLatLng.bind(currentMap.value);

		const createMarkers = () => {
			nonReactiveState.markers.get(props.set.id)!.forEach((area: LiveAtlasMarker, id: string) => {
				const layer = createMarkerLayer(area, converter);

				layers.set(id, layer);
				props.layerGroup.addLayer(layer);
			});
		};

		const deleteMarker = (id: string) => {
			let marker = layers.get(id);

			if(!marker) {
				return;
			}

			props.layerGroup.removeLayer(marker);
			layers.delete(id);
		};

		const handleUpdate = (update: DynmapMarkerUpdate) => {
			if(update.removed) {
				deleteMarker(update.id);
			} else {
				const layer = updateMarkerLayer(layers.get(update.id), update.payload as LiveAtlasAreaMarker, converter);

				if(!layers.has(update.id)) {
					props.layerGroup.addLayer(layer);
				}

				layers.set(update.id, layer);
			}
		};

		watch(currentMap, (newValue, oldValue) => {
			if(newValue && (!oldValue || oldValue.world === newValue.world)) {
				converter = newValue.locationToLatLng.bind(newValue);

				for (const [id, area] of nonReactiveState.markers.get(props.set.id)!) {
					updateMarkerLayer(layers.get(id), area, converter);
				}
			}
		});

		onMounted(() => {
			createMarkers();
			registerSetUpdateHandler(handleUpdate, props.set.id);
		});
		onUnmounted(() => {
			unregisterSetUpdateHandler(handleUpdate, props.set.id);
		});
	},

	render() {
		return null;
	}
});
</script>
