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
import {DynmapWorldMap} from "@/dynmap";
import {Map} from 'leaflet';
import {useStore} from "@/store";
import {HDMapType} from "@/leaflet/mapType/HDMapType";
import {MutationTypes} from "@/store/mutation-types";
import {ActionTypes} from "@/store/action-types";
import {getMinecraftTime} from "@/util";

export default defineComponent({
	props: {
		name: {
			type: String,
			required: true
		},
		map: {
			type: Object as () => DynmapWorldMap,
			required: true
		},
		leaflet: {
			type: Object as () => Map,
			required: true,
		}
	},

	setup(props) {
		let updateFrame = 0,
			stopUpdateWatch: Function;

		const store = useStore(),
			night = computed(() => getMinecraftTime(store.state.currentWorldState.timeOfDay).night),
			layer = new HDMapType({
				errorTileUrl: 'images/blank.png',
				mapSettings: Object.freeze(JSON.parse(JSON.stringify(props.map))),
				night: night.value,
			}),
			pendingUpdates = computed(() => !!store.state.pendingTileUpdates.length),
			active = computed(() => props.map === store.state.currentMap),

			enableLayer = () => {
				useStore().commit(MutationTypes.SET_CURRENT_PROJECTION, layer.getProjection());
				props.leaflet.addLayer(layer);

				stopUpdateWatch = watch(pendingUpdates, (newValue, oldValue) => {
					if(newValue && !oldValue && !updateFrame) {
						handlePendingUpdates();
					}
				});
			},

			disableLayer = () => {
				layer.remove();

				if(stopUpdateWatch) {
					stopUpdateWatch();
				}
			},

			handlePendingUpdates = () => {
				useStore().dispatch(ActionTypes.POP_TILE_UPDATES, 10).then(updates => {
					for(const update of updates) {
						layer.updateNamedTile(update.name, update.timestamp);
					}

					if(pendingUpdates.value) {
						// eslint-disable-next-line no-unused-vars
						updateFrame = requestAnimationFrame(() => handlePendingUpdates());
					} else {
						updateFrame = 0;
					}
				});
			};

		watch(active, (newValue) => newValue ? enableLayer() : disableLayer());
		watch(night, (newValue) =>  {
			if(props.map.nightAndDay && active.value) {
				layer.setNight(newValue);
			}
		});

		if(active.value) {
			enableLayer();
		}

		onUnmounted(() => {
			disableLayer();

			if(updateFrame) {
				cancelAnimationFrame(updateFrame);
			}
		});
	},

	render() {
		return null;
	},
});
</script>
