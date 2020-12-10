<template>
	<GenericMarker v-for="[id, marker] in markerSet.markers" :options="marker" :key="id" :layer-group="layerGroup"></GenericMarker>
	<Areas :areas="markerSet.areas" :layer-group="layerGroup"></Areas>
	<Circles :circles="markerSet.circles" :layer-group="layerGroup"></Circles>
	<Lines :lines="markerSet.lines" :layer-group="layerGroup"></Lines>
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

export default defineComponent({
	components: {
		GenericMarker,
		Areas,
		Circles,
		Lines,
	},

	props: {
		leaflet: {
			type: Object as () => L.Map,
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
			this.leaflet.addLayer(this.layerGroup);
		}
	},

	unmounted() {
		// console.log('Unmounted markerSetLayer');
		this.leaflet.removeLayer(this.layerGroup);
	},

	render() {
		return null;
	}
})
</script>

<style scoped>

</style>