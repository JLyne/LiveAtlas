<template>
	<PlayerMarker v-for="[account, player] in players" :key="account" :player="player" :layerGroup="layerGroup"></PlayerMarker>
</template>

<script lang="ts">
import PlayerMarker from "@/components/map/marker/PlayerMarker.vue";
import {defineComponent, computed} from "@vue/runtime-core";
import {useStore} from "@/store";
import {LayerGroup} from 'leaflet';
import DynmapMap from "@/leaflet/DynmapMap";

export default defineComponent({
	components: {
		PlayerMarker
	},

	props: {
		leaflet: {
			type: Object as () => DynmapMap,
			required: true,
		}
	},

	setup(props) {
		props.leaflet.createPane('players');

		const store = useStore(),
			players = computed(() => store.state.players),
			componentSettings = store.state.components.playerMarkers,
			layerGroup = new LayerGroup([],{
				pane: 'players'
			});

		return {
			players,
			componentSettings,
			layerGroup,
		}
	},

	mounted() {
		// console.log('Mounted playersLayer');
		if(!this.componentSettings!.hideByDefault) {
			// console.log('Adding playersLayer');
			this.leaflet.getLayerManager().addLayer(this.layerGroup, true, useStore().state.messages.players, 1);
		}
	},

	unmounted() {
		// console.log('Unmounted playersLayer');
		this.leaflet.removeLayer(this.layerGroup);
	},

	render() {
		return null;
	}
})
</script>

<style scoped>

</style>