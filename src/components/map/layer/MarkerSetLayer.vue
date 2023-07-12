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
import {markRaw, watch, defineComponent, computed, onMounted, onUnmounted, reactive} from "vue";
import {LiveAtlasMapRenderer, LiveAtlasMarkerSet} from "@/index";
import {useStore} from "@/store";
import {MutationTypes} from "@/store/mutation-types";

export default defineComponent({
	props: {
		markerSet: {
			type: Object as () => LiveAtlasMarkerSet,
			required: true,
		},
    renderer: {
      type: Object as () => LiveAtlasMapRenderer,
      required: true,
    }
	},

	setup(props) {
		const store = useStore(),
			markerSettings = computed(() => store.state.components.markers),
			layer = props.renderer.createMarkerSetLayer(props.markerSet),
      layerDefinition = reactive({
				layer: markRaw(layer),
				name: props.markerSet.label,
				overlay: true,
				position: props.markerSet.priority || 0,
				enabled: !props.markerSet.hidden,
				showInControl: true
			}),
        enabled = computed(() => layerDefinition.enabled);

    watch(enabled, (newValue) => newValue ? layer.add() : layer.remove());

		onMounted(() => {
			store.commit(MutationTypes.ADD_LAYER, layerDefinition);

      if(layerDefinition.enabled) {
        layer.add();
      }
		});

		onUnmounted(() => {
      store.commit(MutationTypes.REMOVE_LAYER, layer);
      layer.remove();
    });

		return {
			markerSettings,
			layer,
		}
	},
	render() {
		return null;
	}
})
</script>
