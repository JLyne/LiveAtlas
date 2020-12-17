<!--
  - Copyright 2020 James Lyne
  -
  -    Licensed under the Apache License, Version 2.0 (the "License");
  -    you may not use this file except in compliance with the License.
  -    You may obtain a copy of the License at
  -
  -      http://www.apache.org/licenses/LICENSE-2.0
  -
  -    Unless required by applicable law or agreed to in writing, software
  -    distributed under the License is distributed on an "AS IS" BASIS,
  -    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  -    See the License for the specific language governing permissions and
  -    limitations under the License.
  -->

<script lang="ts">
import {defineComponent, onMounted, onUnmounted} from "@vue/runtime-core";
import {ChatControl} from "@/leaflet/control/ChatControl";
import DynmapMap from "@/leaflet/DynmapMap";

export default defineComponent({
	props: {
		leaflet: {
			type: Object as () => DynmapMap,
			required: true,
		}
	},

	setup(props) {
		const control = new ChatControl({
			position: 'topleft',
		});

		onMounted(() => props.leaflet.addControl(control));
		onUnmounted(() => props.leaflet.removeControl(control));
	},

	render() {
		return null;
	}
})
</script>
