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

<template>
	<PlayerMarker v-for="[account, player] in players" :key="account" :player="player" :layerGroup="layerGroup"></PlayerMarker>
</template>

<script lang="ts">
import PlayerMarker from "@/components/map/marker/PlayerMarker.vue";
import {defineComponent, computed, watch} from "@vue/runtime-core";
import {useStore} from "@/store";
import {LayerGroup} from 'leaflet';
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
			playerPane = props.leaflet.createPane('players'),
			players = computed(() => store.state.players),
			playerCount = computed(() => store.state.players.size),
			playersAboveMarkers = computed(() => store.state.ui.playersAboveMarkers),
			componentSettings = computed(() => store.state.components.playerMarkers),
			layerGroup = new LayerGroup([],{
				pane: 'players'
			});

		watch(playerCount, (newValue) => playerPane.classList.toggle('no-animations', newValue > 150));

		if(playersAboveMarkers.value) {
			playerPane.style.zIndex = '600';
		}

		return {
			players,
			componentSettings,
			layerGroup,
		}
	},

	mounted() {
		if(!this.componentSettings!.hideByDefault) {
			this.leaflet.getLayerManager().addLayer(
				this.layerGroup,
				true,
				useStore().state.messages.playersHeading,
				this.componentSettings!.layerPriority);
		} else {
			this.leaflet.getLayerManager().addHiddenLayer(
				this.layerGroup,
				useStore().state.messages.playersHeading,
				this.componentSettings!.layerPriority);
		}
	},

	unmounted() {
		this.leaflet.removeLayer(this.layerGroup);
	},

	render() {
		return null;
	}
})
</script>
