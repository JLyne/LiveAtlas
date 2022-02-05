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

<template>
	<img width="16" height="16" :src="image" alt="" />
</template>

<script lang="ts">
import defaultImage from '@/assets/images/player_face.png';
import {computed, defineComponent, watch} from "@vue/runtime-core";
import {LiveAtlasPlayer} from "@/index";
import {onMounted, ref} from "vue";
import {useStore} from "@/store";
import {getMinecraftHead} from "@/util";

export default defineComponent({
	name: 'PlayerImage',
	components: {},
	props: {
		player: {
			type: Object as () => LiveAtlasPlayer | string,
			required: true
		}
	},
	setup(props) {
		const store = useStore(),
			image = ref(defaultImage),
			name = computed(() => typeof props.player === 'string' ? props.player : props.player.name),
			imagesEnabled = computed(() => store.state.components.players.showImages),

			updatePlayerImage = async () => {
				image.value = defaultImage;

				if (imagesEnabled.value) {
					try {
						const result = await getMinecraftHead(props.player, 'small');
						image.value = result.src;
					} catch (e) {
					}
				}
			};

		watch(name, () => updatePlayerImage());
		onMounted(() => updatePlayerImage());

		return {
			image
		}
	}
});
</script>
