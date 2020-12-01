<template>
	<PlayerMarker v-for="[account, player] in players" :key="account" :player="player" :layerGroup="layerGroup"></PlayerMarker>
</template>

<script lang="ts">
import PlayerMarker from "@/components/map/marker/PlayerMarker.vue";
import {defineComponent, computed} from "@vue/runtime-core";
import {useStore} from "@/store";
import L from 'leaflet';

export default defineComponent({
	components: {
		PlayerMarker
	},

	props: {
		leaflet: {
			type: Object as () => L.Map,
			required: true,
		}
	},

	setup() {
		const store = useStore(),
			players = computed(() => store.state.players),
			componentSettings = store.state.components.playerMarkers,
			layerGroup = new L.LayerGroup() as L.LayerGroup;

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
			this.leaflet.addLayer(this.layerGroup);
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