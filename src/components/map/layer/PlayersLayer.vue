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
	<PlayerMarker v-for="[account, player] in players" :key="account" :player="player" :layerGroup="layerGroup"></PlayerMarker>
</template>

<script lang="ts">
import {defineComponent, computed, watch, onMounted, onUnmounted} from "vue";
import {LayerGroup} from 'leaflet';
import {useStore} from "@/store";
import PlayerMarker from "@/components/map/marker/PlayerMarker.vue";
import LiveAtlasLeafletMap from "@/leaflet/LiveAtlasLeafletMap";

export default defineComponent({
	components: {
		PlayerMarker
	},

	props: {
		leaflet: {
			type: Object as () => LiveAtlasLeafletMap,
			required: true,
		}
	},

	setup(props) {
		const store = useStore(),
			playerPane = props.leaflet.getPane('players') || props.leaflet.createPane('players'),
			players = computed(() => store.state.players),
			playerCount = computed(() => store.state.players.size),
			playersAboveMarkers = computed(() => store.state.ui.playersAboveMarkers),
			componentSettings = computed(() => store.state.components.players.markers),
			layerGroup = new LayerGroup([],{
				pane: 'players'
			});

		watch(playerCount, (newValue) => playerPane.classList.toggle('no-animations', newValue > 150));

		onMounted(() => {
			if(!componentSettings.value!.hideByDefault) {
				props.leaflet.getLayerManager().addLayer(
					layerGroup,
					true,
					store.state.components.players.markers!.layerName,
					componentSettings.value!.layerPriority);
			} else {
				props.leaflet.getLayerManager().addHiddenLayer(
					layerGroup,
					store.state.components.players.markers!.layerName,
					componentSettings.value!.layerPriority);
			}
		});

		onUnmounted(() => props.leaflet.getLayerManager().removeLayer(layerGroup));

		if(playersAboveMarkers.value) {
			playerPane.style.zIndex = '600';
		}

		return {
			players,
			componentSettings,
			layerGroup,
		}
	},

	render() {
		return null;
	}
})
</script>
