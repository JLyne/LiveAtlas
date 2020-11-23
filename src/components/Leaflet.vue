<template>
	<div class="map">
		<MapLayer v-for="[name, map] in maps" :key="name" :map="map" :name="name" :leaflet="leaflet"></MapLayer>
		<PlayersLayer></PlayersLayer>
	</div>
</template>

<script lang="ts">
import {defineComponent} from "@vue/runtime-core";
import L from 'leaflet';
import {useStore} from '@/store';
import MapLayer from "@/components/map/layer/MapLayer.vue";
import PlayersLayer from "@/components/map/layer/PlayersLayer.vue";

export default defineComponent({
	components: {
		MapLayer,
		PlayersLayer
	},

	data() {
		return {
			leaflet: undefined as L.Map | undefined,
		}
	},

	computed: {
		maps() {
			return useStore().state.maps;
		},
	},

	mounted() {
		this.leaflet = new L.Map(this.$el, {
			zoom: 1,
			center: new L.LatLng(0, 0),
			zoomAnimation: true,
			zoomControl: true,
			preferCanvas: true,
			attributionControl: false,
			crs: L.CRS.Simple,
			worldCopyJump: false,
		});
	},
})
</script>

<style scoped>

</style>