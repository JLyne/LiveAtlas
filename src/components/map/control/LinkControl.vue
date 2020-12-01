<script lang="ts">
import {defineComponent} from "@vue/runtime-core";
import L from 'leaflet';
import {LinkControl} from "@/leaflet/control/LinkControl";

export default defineComponent({
	props: {
		leaflet: {
			type: Object as () => L.Map,
			required: true,
		}
	},

	setup() {
		const control = new LinkControl({
				position: 'bottomleft',
			});

		return {
			control,
		}
	},

	mounted() {
		this.leaflet.addControl(this.control);
	},

	unmounted() {
		this.leaflet.removeControl(this.control);
	},

	render() {
		return null;
	}
})
</script>

<style scoped>

</style>