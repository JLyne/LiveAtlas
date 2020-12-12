<script lang="ts">
import {defineComponent, computed, watch, onMounted, onUnmounted} from "@vue/runtime-core";
import {useStore} from "@/store";
import {ClockControl, ClockControlOptions} from "@/leaflet/control/ClockControl";
import DynmapMap from "@/leaflet/DynmapMap";

export default defineComponent({
	props: {
		leaflet: {
			type: Object as () => DynmapMap,
			required: true,
		}
	},

	setup(props) {
		const store = useStore(),
			componentSettings = store.state.components.clockControl,
			worldState = computed(() => store.state.currentWorldState),
			control = new ClockControl(componentSettings as ClockControlOptions) as ClockControl;

		watch(worldState, (newValue) => control.update(newValue), { deep: true });

		onMounted(() => props.leaflet.addControl(control));
		onUnmounted(() => props.leaflet.removeControl(control));
	},

	render() {
		return null;
	}
})
</script>
