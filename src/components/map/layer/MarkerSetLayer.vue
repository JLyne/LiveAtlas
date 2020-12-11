<template>
	<GenericMarker v-for="[id, marker] in markerSet.markers" :options="marker" :key="id" :layer-group="layerGroup"></GenericMarker>
	<Areas :layer-group="layerGroup" :set="markerSet"></Areas>
	<Circles :layer-group="layerGroup" :set="markerSet"></Circles>
	<Lines :layer-group="layerGroup" :set="markerSet"></Lines>
</template>

<script lang="ts">
import {defineComponent, computed} from "@vue/runtime-core";
import {useStore} from "@/store";
import L from 'leaflet';
import {DynmapMarkerSet} from "@/dynmap";
import GenericMarker from "@/components/map/marker/GenericMarker.vue";
import Areas from "@/components/map/vector/Areas.vue";
import Circles from "@/components/map/vector/Circles.vue";
import Lines from "@/components/map/vector/Lines.vue";
import DynmapMap from "@/leaflet/DynmapMap";

export default defineComponent({
	components: {
		GenericMarker,
		Areas,
		Circles,
		Lines,
	},

	props: {
		leaflet: {
			type: Object as () => DynmapMap,
			required: true,
		},

		markerSet: {
			type: Object as () => DynmapMarkerSet,
			required: true,
		}
	},

	setup() {
		const store = useStore(),
			markerSettings = computed(() => store.state.components.markers),
			layerGroup = new L.LayerGroup() as L.LayerGroup;

		return {
			markerSettings,
			layerGroup,
		}
	},

	mounted() {
		// console.log('Mounted markerSetLayer');

		if(!this.markerSet.hidden) {
			// console.log('Adding markerSetLayer');
			this.leaflet.getLayerManager().addLayer(this.layerGroup, true, this.markerSet.label, 1);
		}
	},

	unmounted() {
		// console.log('Unmounted markerSetLayer');
		this.leaflet.getLayerManager().removeLayer(this.layerGroup);
	},

	render() {
		return null;
	}
})
</script>

<style scoped>

</style>