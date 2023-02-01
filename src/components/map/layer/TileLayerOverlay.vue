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
import {defineComponent, onUnmounted} from "vue";
import {LiveAtlasTileLayerOverlay} from "@/index";
import {useStore} from "@/store";
import LiveAtlasLeafletMap from "@/leaflet/LiveAtlasLeafletMap";

export default defineComponent({
	props: {
		options: {
			type: Object as () => LiveAtlasTileLayerOverlay,
			required: true
		},
		leaflet: {
			type: Object as () => LiveAtlasLeafletMap,
			required: true,
		}
	},

	setup(props) {
		const store = useStore();

		let layer = store.state.currentMapProvider!.createTileLayer(Object.freeze(JSON.parse(JSON.stringify(props.options.tileLayerOptions))));

		props.leaflet.getLayerManager().addHiddenLayer(layer, props.options.label, props.options.priority);

		onUnmounted(() => {
			props.leaflet.getLayerManager().removeLayer(layer);
			layer.remove();
		});
	},

	render() {
		return null;
	},
});
</script>
