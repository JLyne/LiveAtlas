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
import {defineComponent, onUnmounted, computed, watch} from "@vue/runtime-core";
import {Map} from 'leaflet';
import {useStore} from "@/store";
import {DynmapTileLayer} from "@/leaflet/tileLayer/DynmapTileLayer";
import LiveAtlasMapDefinition from "@/model/LiveAtlasMapDefinition";
import {LiveAtlasTileLayer} from "@/leaflet/tileLayer/LiveAtlasTileLayer";
import {Pl3xmapTileLayer} from "@/leaflet/tileLayer/Pl3xmapTileLayer";

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
			active = computed(() => props.map === store.state.currentMap);

		let refreshTimeout: null | ReturnType<typeof setTimeout> = null,
			layer: LiveAtlasTileLayer;

		const refresh = () => {
			if(active.value) {
				layer.refresh();
			}

			refreshTimeout = setTimeout(refresh, props.map.tileUpdateInterval);
		};

		if(store.state.currentServer?.type === 'dynmap') {
			layer = new DynmapTileLayer({
				errorTileUrl: 'images/blank.png',
				mapSettings: Object.freeze(JSON.parse(JSON.stringify(props.map))),
			});
		} else {
			layer = new Pl3xmapTileLayer({
				errorTileUrl: 'images/blank.png',
				mapSettings: Object.freeze(JSON.parse(JSON.stringify(props.map)))
			});
		}

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

		if(props.map.tileUpdateInterval) {
			refreshTimeout = setTimeout(refresh, props.map.tileUpdateInterval);
		}

		onUnmounted(() => {
			disableLayer();

			if(refreshTimeout) {
				clearTimeout(refreshTimeout);
			}
		});
	},

	render() {
		return null;
	},
});
</script>
