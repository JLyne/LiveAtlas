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
import {markRaw, defineComponent, onUnmounted, reactive, onMounted, computed, watch} from "vue";
import {LiveAtlasOverlay} from "@/index";
import {useStore} from "@/store";
import {MutationTypes} from "@/store/mutation-types";

export default defineComponent({
	props: {
		overlay: {
			type: Object as () => LiveAtlasOverlay,
			required: true
		}
	},

  setup(props) {
		const store = useStore(),
      layer = store.getters.currentMapProvider!.getOverlayMapLayer(props.overlay),
      layerDefinition = reactive({
        layer: markRaw(layer),
        name: props.overlay.label,
        overlay: true,
        position: props.overlay.priority || 0,
        enabled: false,
        showInControl: true
		}),
        enabled = computed(() => layerDefinition.enabled);

    watch(enabled, (newValue) => newValue ? layer.enable() : layer.disable());

		onMounted(() => {
			store.commit(MutationTypes.ADD_LAYER, layerDefinition);

      if(layerDefinition.enabled) {
        layer.enable();
      }
		});

		onUnmounted(() => {
      store.commit(MutationTypes.REMOVE_LAYER, layer);
      layer.disable();
    });

		return {
			layer,
		}
	},

	render() {
		return null;
	},
});
</script>
