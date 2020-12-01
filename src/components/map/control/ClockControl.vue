<script lang="ts">
import {defineComponent, computed} from "@vue/runtime-core";
import {useStore} from "@/store";
import L from 'leaflet';
import {ClockControl, ClockControlOptions} from "@/leaflet/control/ClockControl";

export default defineComponent({
	props: {
		leaflet: {
			type: Object as () => L.Map,
			required: true,
		}
	},

	setup() {
		const store = useStore(),
			componentSettings = store.state.components.clockControl,
			worldState = computed(() => store.state.currentWorldState),
			control = new ClockControl(componentSettings as ClockControlOptions) as ClockControl;

		return {
			control,
			worldState
		}
	},

	watch: {
		worldState: {
			handler(newValue) {
				if (this.control) {
					this.control.update(newValue);
				}
			},
			deep: true,
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