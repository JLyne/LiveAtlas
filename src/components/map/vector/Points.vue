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
import {Marker} from 'leaflet';
import {useStore} from "@/store";
import {createPointMarker, updatePointMarker} from "@/util/points";
import LiveAtlasLayerGroup from "@/leaflet/layer/LiveAtlasLayerGroup";
import {LiveAtlasPointMarker, LiveAtlasMarkerSet} from "@/index";
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
			layers = Object.freeze(new Map()) as Map<string, Marker>;

		let converter = currentMap.value!.locationToLatLng.bind(store.state.currentMap);

		const createMarkers = () => {
			nonReactiveState.markers.get(props.set.id)!.points.forEach((marker: LiveAtlasPointMarker, id: string) => {
				const layer = createPointMarker(marker, converter);

				layers.set(id, layer);
				props.layerGroup.addLayer(layer);
			});
		};

		const deleteMarker = (id: string) => {
			let marker = layers.get(id) as Marker;

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
				const layer = updatePointMarker(layers.get(update.id), update.payload as LiveAtlasPointMarker, converter);

				if(!layers.has(update.id)) {
					props.layerGroup.addLayer(layer);
				}

				layers.set(update.id, layer);
			}
		};

		watch(currentMap, (newValue, oldValue) => {
			if(newValue && (!oldValue || oldValue.world === newValue.world)) {
				converter = currentMap.value!.locationToLatLng.bind(store.state.currentMap);

				for (const [id, marker] of nonReactiveState.markers.get(props.set.id)!.points) {
					updatePointMarker(layers.get(id), marker, converter);
				}
			}
		});

		onMounted(() => {
			createMarkers();
			registerTypeUpdateHandler(handleUpdate, props.set.id, LiveAtlasMarkerType.POINT);
		});
		onUnmounted(() => {
			unregisterTypeUpdateHandler(handleUpdate, props.set.id, LiveAtlasMarkerType.POINT);
		});
	},

	render() {
		return null;
	}
});
</script>
