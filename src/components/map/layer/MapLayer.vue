<script lang="ts">
import {defineComponent} from "@vue/runtime-core";
import {DynmapMap} from "@/dynmap";
import L from 'leaflet';
import {useStore} from "@/store";
import {HDMapType} from "@/leaflet/mapType/HDMapType";
import {MutationTypes} from "@/store/mutation-types";

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

	setup() {
		let layer = undefined as HDMapType | undefined;

		return {
			layer,
		}
	},

	computed: {
		active(): boolean {
			return this.map === useStore().state.currentMap;
		}
	},

	watch: {
		active(newValue) {
			console.warn(`Active for ${this.map.world.name} ${this.map.name} now ${newValue}`);

			if(newValue) {
				this.enableLayer();
			} else {
				this.disableLayer();
			}
		}
	},

	mounted() {
		// console.log('mounted ' + this.name + ' ' + this.active);
		this.layer = new HDMapType({
			errorTileUrl: 'images/blank.png',
			mapSettings: Object.freeze(JSON.parse(JSON.stringify(this.map))),
		}) as HDMapType;

		console.log(this.layer);

		if(this.active) {
			this.enableLayer();
		}
	},

	unmounted() {
		// console.log('unmounted '  + this.name);
		this.disableLayer();
	},

	render() {
		return null;
	},

	methods: {
		enableLayer() {
			if(!this.layer) {
				return;
			}

			console.warn('Enabling layer ' + this.map.world.name + ' ' + this.map.name);

			useStore().commit(MutationTypes.SET_CURRENT_PROJECTION, this.layer.getProjection());
			this.leaflet.addLayer(this.layer);
			this.leaflet.panTo(this.layer.getProjection().locationToLatLng(this.map.world.center), {
				noMoveStart: true,
				animate: false,
			});
		},
		disableLayer() {
			if(this.layer) {
				console.warn('Disabling layer ' + this.map.world.name + ' ' + this.map.name);
				this.layer.remove();
			}
		}
	}
})
</script>

<style scoped>

</style>