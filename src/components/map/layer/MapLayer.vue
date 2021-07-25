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

<script lang="ts">
import {defineComponent, onUnmounted, computed, watch} from "@vue/runtime-core";
import {Map} from 'leaflet';
import {useStore} from "@/store";
import {DynmapTileLayer} from "@/leaflet/tileLayer/DynmapTileLayer";
import LiveAtlasMapDefinition from "@/model/LiveAtlasMapDefinition";

export default defineComponent({
	props: {
		name: {
			type: String,
			required: true
		},
		map: {
			type: Object as () => LiveAtlasMapDefinition,
			required: true
		},
		leaflet: {
			type: Object as () => Map,
			required: true,
		}
	},

	setup(props) {
		const store = useStore(),
			layer = new DynmapTileLayer({
				errorTileUrl: 'images/blank.png',
				mapSettings: Object.freeze(JSON.parse(JSON.stringify(props.map))),
			}),
			active = computed(() => props.map === store.state.currentMap);

		const enableLayer = () => {
				props.leaflet.addLayer(layer);
			},

			disableLayer = () => {
				layer.remove();
			};

		watch(active, (newValue) => newValue ? enableLayer() : disableLayer());

		if(active.value) {
			enableLayer();
		}

		onUnmounted(() => {
			disableLayer();
		});
	},

	render() {
		return null;
	},
});
</script>
