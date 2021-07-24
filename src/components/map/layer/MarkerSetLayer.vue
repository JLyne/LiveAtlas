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

<template>
	<Areas :layer-group="layerGroup" :set="markerSet"></Areas>
	<Circles :layer-group="layerGroup" :set="markerSet"></Circles>
	<Lines :layer-group="layerGroup" :set="markerSet"></Lines>
	<Markers :layer-group="layerGroup" :set="markerSet"></Markers>
</template>

<script lang="ts">
import {defineComponent, computed} from "@vue/runtime-core";
import {useStore} from "@/store";
import Areas from "@/components/map/vector/Areas.vue";
import Circles from "@/components/map/vector/Circles.vue";
import Lines from "@/components/map/vector/Lines.vue";
import Markers from "@/components/map/vector/Markers.vue";
import LiveAtlasLeafletMap from "@/leaflet/LiveAtlasLeafletMap";
import LiveAtlasLayerGroup from "@/leaflet/layer/LiveAtlasLayerGroup";
import {LiveAtlasMarkerSet} from "@/index";

export default defineComponent({
	components: {
		Areas,
		Circles,
		Lines,
		Markers,
	},

	props: {
		leaflet: {
			type: Object as () => LiveAtlasLeafletMap,
			required: true,
		},

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

		return {
			markerSettings,
			layerGroup,
		}
	},

	watch: {
		markerSet: {
			handler(newValue) {
				if(newValue && this.layerGroup) {
					this.layerGroup.update({
						id: this.markerSet.id,
						minZoom: this.markerSet.minZoom,
						maxZoom: this.markerSet.maxZoom,
						showLabels: this.markerSet.showLabels || useStore().state.components.markers.showLabels,
						priority: this.markerSet.priority,
					});

					if(newValue.hidden) {
						this.leaflet.getLayerManager()
							.addHiddenLayer(this.layerGroup, newValue.label, this.markerSet.priority);
					} else {
						this.leaflet.getLayerManager()
							.addLayer(this.layerGroup, true, newValue.label, this.markerSet.priority);
					}
				}
			},
			deep: true,
		}
	},

	mounted() {
		if(this.markerSet.hidden) {
			this.leaflet.getLayerManager()
				.addHiddenLayer(this.layerGroup, this.markerSet.label, this.markerSet.priority);
		} else {
			this.leaflet.getLayerManager()
				.addLayer(this.layerGroup, true, this.markerSet.label, this.markerSet.priority);
		}
	},

	unmounted() {
		this.leaflet.getLayerManager().removeLayer(this.layerGroup);
	},

	render() {
		return null;
	}
})
</script>

<style scoped>

</style>
