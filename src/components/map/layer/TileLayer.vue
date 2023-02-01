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
import {computed, defineComponent, onUnmounted, watch} from "vue";
import {useStore} from "@/store";
import {LiveAtlasTileLayerOptions} from "@/leaflet/tileLayer/LiveAtlasTileLayer";
import LiveAtlasLeafletMap from "@/leaflet/LiveAtlasLeafletMap";
import LiveAtlasMapDefinition from "@/model/LiveAtlasMapDefinition";

export default defineComponent({
	props: {
		options: {
			type: Object as () => LiveAtlasTileLayerOptions,
			required: true
		},
		leaflet: {
			type: Object as () => LiveAtlasLeafletMap,
			required: true,
		}
	},

	setup(props) {
		const store = useStore(),
			active = computed(() => props.options instanceof LiveAtlasMapDefinition && props.options === store.state.currentMap);

		let layer = store.state.currentMapProvider!.createTileLayer(Object.freeze(JSON.parse(JSON.stringify(props.options))));

		const enableLayer = () => props.leaflet.addLayer(layer),
			disableLayer = () => layer.remove();

		watch(active, newValue => newValue ? enableLayer() : disableLayer());

		if(active.value) {
			enableLayer();
		}

		onUnmounted(() => disableLayer());
	},

	render() {
		return null;
	},
});
</script>
