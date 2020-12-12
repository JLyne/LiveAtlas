<script lang="ts">
import {defineComponent} from "@vue/runtime-core";
import {LogoControl, LogoControlOptions} from "@/leaflet/control/LogoControl";
import DynmapMap from "@/leaflet/DynmapMap";

export default defineComponent({
	props: {
		options: {
			type: Object as () => LogoControlOptions,
			required: true,
		},
		leaflet: {
			type: Object as () => DynmapMap,
			required: true,
		}
	},

	setup(props) {
		const control = new LogoControl(props.options);

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