<script lang="ts">
import {defineComponent, computed, ref} from "@vue/runtime-core";
import L from 'leaflet';
import {DynmapMarker} from "@/dynmap";
import {useStore} from "@/store";
import {DynmapIcon} from "@/leaflet/icon/DynmapIcon";

export default defineComponent({
	props: {
		options: {
			type: Object as () => DynmapMarker,
			required: true
		},
		layerGroup: {
			type: Object as () => L.LayerGroup,
			required: true
		}
	},

	setup(props) {
		const store = useStore(),
			markerSettings = computed(() => store.state.components.markers),
			currentProjection = computed(() => store.state.currentProjection),
			projectedPosition = computed(() => store.state.currentProjection.locationToLatLng(props.options.location)),
			visible = ref(false),

			marker = undefined as L.Marker | undefined;

		return {
			marker,
			visible,
			projectedPosition,
			markerSettings,
			currentProjection,
		}
	},

	watch: {
		currentProjection() {
			this.marker!.setLatLng(this.currentProjection.locationToLatLng(this.options.location));
		}
	},

	mounted() {
		this.marker = new L.Marker(this.currentProjection.locationToLatLng(this.options.location), {
			icon: new DynmapIcon({
				icon: this.options.icon,
				label: this.options.label,
				dimensions: this.options.dimensions,
				showLabel: true,
				isHtml: this.options.isHTML,
			}),
			// maxZoom: this.options.maxZoom,
			// minZoom: this.options.minZoom,
		});

		this.layerGroup.addLayer(this.marker);
	},

	unmounted() {
		if(this.marker) {
			this.layerGroup.removeLayer(this.marker);
		}
	},

	render() {
		return null;
	}
})
</script>

<style scoped>

</style>