<script lang="ts">
import {defineComponent} from "@vue/runtime-core";
import {DynmapMap} from "@/dynmap";
import L from 'leaflet';
import {useStore} from "@/store";
import {hdMapType} from "@/leaflet/mapType/HDMapType";

export default defineComponent({
	props: {
		name: {
			type: String,
			required: true
		},
		map: {
			type: Object as () => DynmapMap,
			required: true
		},
		leaflet: {
			type: Object as () => L.Map,
			required: true,
		}
	},

	data() {
		return {
			layer: hdMapType({
				maxZoom: this.map.nativeZoomLevels + this.map.extraZoomLevels,
				maxNativeZoom: this.map.nativeZoomLevels,
				errorTileUrl: 'images/blank.png',
				worldName: this.map.world,
				prefix: this.map.prefix,
			}) as L.Layer,
		}
	},

	computed: {
		active(): boolean {
			return this.map === useStore().state.currentMap;
		}
	},

	watch: {
		active(newValue) {
			console.warn(`Active for ${this.map.world} ${this.map.name} now ${newValue}`);

			if(newValue) {
				this.enableLayer();
			} else {
				this.disableLayer();
			}
		}
	},

	mounted() {
		console.log('mounted ' + this.name + ' ' + this.active);

		if(this.active) {
			this.enableLayer();
		}
	},

	unmounted() {
		console.log('unmounted '  + this.name);
	},

	render() {
		return null;
	},

	methods: {
		enableLayer() {
			console.warn('Enabling layer ' + this.map.world + ' ' + this.map.name);
			this.leaflet.addLayer(this.layer);
		},
		disableLayer() {
			console.warn('Disabling layer ' + this.map.world + ' ' + this.map.name);
			this.layer.remove();
		}
	}
})
</script>

<style scoped>

</style>