<script lang="ts">
import {defineComponent, computed, ref} from "@vue/runtime-core";
import L from 'leaflet';
import {useStore} from "@/store";
import {DynmapCircle} from "@/dynmap";

export default defineComponent({
	props: {
		circleDefinition: {
			type: Object as () => DynmapCircle,
			required: true
		},
		layerGroup: {
			type: Object as () => L.LayerGroup,
			required: true
		}
	},

	setup() {
		const store = useStore(),
			markerSettings = computed(() => store.state.components.markers), //???
			currentProjection = computed(() => store.state.currentProjection),
			currentWorld = computed(() => store.state.currentWorld),
			visible = ref(false),

			circle = undefined as L.Circle | undefined;

		return {
			circle,
			visible,
			markerSettings,
			currentProjection,
			currentWorld,
		}
	},

	watch: {
		currentProjection() {
			// this.circle!.setLatLng(this.currentProjection.locationToLatLng(this.player.location));
		}
	},

	mounted() {

	},

	unmounted() {
		if(this.circle) {
			this.layerGroup.removeLayer(this.circle);
		}
	},

	render() {
		return null;
	},

	methods: {
		enableLayer() {
			// console.log('Enabling marker for ' + this.player.name);

			if(this.circle) {
				this.layerGroup.addLayer(this.circle);
				this.circle.setLatLng(this.currentProjection.locationToLatLng(this.player.location));
				this.visible = true;
			}
		},
		disableLayer() {
			// console.log('Disabling marker for ' + this.player.name);

			if(this.circle) {
				this.layerGroup.removeLayer(this.circle);
				this.visible = false;
			}
		},
	}
})
</script>

<style scoped>

</style>