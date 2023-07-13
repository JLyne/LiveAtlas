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
import LiveAtlasMapDefinition from "@/model/LiveAtlasMapDefinition";

export default defineComponent({
	props: {
		map: {
			type: Object as () => LiveAtlasMapDefinition,
			required: true
		},
	},

	setup(props) {
		const store = useStore(),
      layer = store.getters.currentMapProvider!.getBaseMapLayer(props.map),
			active = computed(() => props.map === store.state.currentMap);

		watch(active, newValue => newValue ? layer.add() : layer.remove());

		onMounted(() => {
      if(active.value) {
        layer.add();
      }
    });
		onUnmounted(() => layer.remove());
	},

	render() {
		return null;
	},
});
</script>
