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

<template>
	<MapMarkers :layer-group="layerGroup" :set="markerSet"></MapMarkers>
</template>

<script lang="ts">
import {markRaw, watch, defineComponent, computed, onMounted, onUnmounted} from "vue";
import {LiveAtlasMarkerSet} from "@/index";
import {useStore} from "@/store";
import {MutationTypes} from "@/store/mutation-types";
import LiveAtlasLayerGroup from "@/leaflet/layer/LiveAtlasLayerGroup";
import MapMarkers from "@/components/map/marker/MapMarkers.vue";

export default defineComponent({
	components: {
		MapMarkers,
	},

	props: {
		markerSet: {
			type: Object as () => LiveAtlasMarkerSet,
			required: true,
		}
	},

	setup(props) {
		const store = useStore(),
			markerSettings = computed(() => store.state.components.markers),
			layerGroup = new LiveAtlasLayerGroup({
				id: props.markerSet.id,
				minZoom: props.markerSet.minZoom,
				maxZoom: props.markerSet.maxZoom,
				showLabels: props.markerSet.showLabels || store.state.components.markers.showLabels,
				priority: props.markerSet.priority,
			});

		watch(props.markerSet, newValue => {
			if(newValue && layerGroup) {
				layerGroup.update({
					id: props.markerSet.id,
					minZoom: props.markerSet.minZoom,
					maxZoom: props.markerSet.maxZoom,
					showLabels: props.markerSet.showLabels || store.state.components.markers.showLabels,
					priority: props.markerSet.priority,
				});

				// store.commit(MutationTypes.UPDATE_LAYER, {
				// 	layer: layerGroup,
				// 	options: {enabled: newValue.hidden}
				// });
			}
		}, {deep: true});

		onMounted(() => {
			store.commit(MutationTypes.ADD_LAYER, {
				layer: markRaw(layerGroup),
				name: props.markerSet.label,
				overlay: true,
				position: props.markerSet.priority || 0,
				enabled: !props.markerSet.hidden,
				showInControl: true
			});
		});

		onUnmounted(() => store.commit(MutationTypes.REMOVE_LAYER, layerGroup));

		return {
			markerSettings,
			layerGroup,
		}
	},
	render() {
		return null;
	}
})
</script>
