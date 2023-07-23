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
	<PlayerMarker v-for="[account, player] in players" :key="account" :player="player" :layer="layer"></PlayerMarker>
</template>

<script lang="ts">
import {defineComponent, computed, watch, onMounted, onUnmounted, reactive} from "vue";
import {useStore} from "@/store";
import PlayerMarker from "@/components/map/marker/PlayerMarker.vue";
import {MutationTypes} from "@/store/mutation-types";
import {markRaw} from "vue";

export default defineComponent({
	components: {
		PlayerMarker
	},

	setup() {
		const store = useStore(),
			players = computed(() => store.state.players),
			componentSettings = computed(() => store.state.components.players.markers),
      layer = store.getters.currentMapProvider!.getPlayerLayer(),

      layerDefinition = reactive({
				layer: markRaw(layer),
				name: store.state.components.players.markers!.layerName,
				overlay: true,
				position: componentSettings.value!.layerPriority,
				enabled: !componentSettings.value!.hideByDefault,
				showInControl: true
			}),
        enabled = computed(() => layerDefinition.enabled);

		watch(enabled, (newValue) => newValue ? layer.enable() : layer.disable());

		onMounted(() => {
			store.commit(MutationTypes.ADD_LAYER, layerDefinition);

      if(layerDefinition.enabled) {
        layer.enable();
      }
		});

		onUnmounted(() => {
      store.commit(MutationTypes.REMOVE_LAYER, layer);
      layer.disable();
    });

		return {
			players,
			componentSettings,
			layer,
		}
	},

	render() {
		return null;
	}
})
</script>
