<script lang="ts">
import {defineComponent, onMounted, onUnmounted} from "@vue/runtime-core";
import {LinkControl} from "@/leaflet/control/LinkControl";
import DynmapMap from "@/leaflet/DynmapMap";

export default defineComponent({
	props: {
		leaflet: {
			type: Object as () => DynmapMap,
			required: true,
		}
	},

	setup(props) {
		const control = new LinkControl({
			position: 'bottomleft',
		});

		onMounted(() => props.leaflet.addControl(control));
		onUnmounted(() => props.leaflet.removeControl(control));
	},

	render() {
		return null;
	}
})
</script>
