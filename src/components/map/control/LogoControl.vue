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
import {defineComponent} from "@vue/runtime-core";
import {LogoControl, LogoControlOptions} from "@/leaflet/control/LogoControl";
import LiveAtlasLeafletMap from "@/leaflet/LiveAtlasLeafletMap";

export default defineComponent({
	props: {
		options: {
			type: Object as () => LogoControlOptions,
			required: true,
		},
		leaflet: {
			type: Object as () => LiveAtlasLeafletMap,
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
