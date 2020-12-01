<script lang="ts">
import {defineComponent} from "@vue/runtime-core";
import {useStore} from "@/store";
import L from 'leaflet';
import {CoordinatesControl, CoordinatesControlOptions} from "@/leaflet/control/CoordinatesControl";

export default defineComponent({
	props: {
		leaflet: {
			type: Object as () => L.Map,
			required: true,
		}
	},

	setup() {
		const store = useStore(),
			componentSettings = store.state.components.coordinatesControl,
			control = new CoordinatesControl(componentSettings as CoordinatesControlOptions);

		return {
			control,
		}
	},

	mounted() {
		this.leaflet.addControl(this.control);
		// console.log('Mounted coordinatesControl');
	},

	unmounted() {
		this.leaflet.removeControl(this.control);
		// console.log('Unmounted coordinatesControl');
	},

	render() {
		return null;
	}
})
</script>

<style scoped>

</style>