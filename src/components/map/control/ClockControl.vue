<!--
  - Copyright 2022 James Lyne
  -
  - Licensed under the Apache License, Version 2.0 (the "License");
  - you may not use this file except in compliance with the License.
  - You may obtain a copy of the License at
  -
  - http://www.apache.org/licenses/LICENSE-2.0
  -
  - Unless required by applicable law or agreed to in writing, software
  - distributed under the License is distributed on an "AS IS" BASIS,
  - WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  - See the License for the specific language governing permissions and
  - limitations under the License.
  -->

<script lang="ts">
import {computed, defineComponent, onMounted, onUnmounted, watch} from "vue";
import {useStore} from "@/store";
import {ClockControl, ClockControlOptions} from "@/leaflet/control/ClockControl";
import LiveAtlasLeafletMap from "@/leaflet/LiveAtlasLeafletMap";

export default defineComponent({
	props: {
		leaflet: {
			type: Object as () => LiveAtlasLeafletMap,
			required: true,
		}
	},

	setup(props) {
		const store = useStore(),
			componentSettings = computed(() => store.state.components.clockControl);
		let control = new ClockControl(componentSettings.value as ClockControlOptions) as ClockControl;

		watch(componentSettings, (newSettings) => {
			props.leaflet.removeControl(control);

			if(!newSettings) {
				return;
			}

			control = new ClockControl(newSettings as ClockControlOptions);
			props.leaflet.addControl(control);
		}, {deep: true});

		onMounted(() => props.leaflet.addControl(control));
		onUnmounted(() => props.leaflet.removeControl(control));
	},

	render() {
		return null;
	}
})
</script>
