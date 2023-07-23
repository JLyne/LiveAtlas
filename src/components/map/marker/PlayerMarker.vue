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
import {defineComponent, computed, ref, onMounted, onUnmounted} from "vue";
import {LiveAtlasChat, LiveAtlasPlayer, LiveAtlasPlayerLayer} from "@/index";
import {useStore} from "@/store";

export default defineComponent({
	props: {
		player: {
			type: Object as () => LiveAtlasPlayer,
			required: true
		},
		layer: {
			type: Object as () => LiveAtlasPlayerLayer,
			required: true
		}
	},

	setup(props) {
		const store = useStore(),
			currentMap = computed(() => store.state.currentMap),
			currentWorld = computed(() => store.state.currentWorld),
			chatBalloonsEnabled = computed(() => store.state.components.chatBalloons),

			//Whether the marker is currently visible
			markerVisible = ref(false),

			//The player marker
			marker = props.layer.addPlayer(props.player),

			//Chat messages to show in the popup
			playerChat = computed(() => {
				if(!chatBalloonsEnabled.value) {
					return [];
				}

        const id = props.player.uuid || props.player.name;

        if(!store.state.chat.perPlayer.has(id)) {
          return [];
        }

        return store.state.chat.perPlayer.get(id)!.slice(0, 5);
			}),

			show = () => {
				if(currentMap.value && !markerVisible.value) {
					marker.enable();
					markerVisible.value = true;
				}
			},
			hide = () => {
				if(markerVisible.value) {
					marker.disable();
					markerVisible.value = false;
				}
			};

		onMounted(() => {
			if(currentMap.value && currentWorld.value!.name === props.player.location.world) {
				show();
			}
		});

		onUnmounted(() => props.layer.removePlayer(props.player));

		return {
			currentMap,
			currentWorld,
			chatBalloonsEnabled,

			marker,
			markerVisible,

			playerChat,

			show,
			hide
		}
	},

	watch: {
		player: {
			deep: true,
			handler(newValue) {
				if(this.currentMap && newValue.location.world === this.currentWorld!.name) {
          this.marker.update(newValue);
          this.show();
				} else {
					this.hide();
				}
			},
		},
		playerChat(newValue: LiveAtlasChat[]) {
			if(!this.chatBalloonsEnabled || !this.markerVisible || !newValue.length) {
				return;
			}

      this.marker.showChat(newValue);
		},
		currentWorld(newValue) {
			if(newValue && newValue.name === this.player.location.world) {
				this.show();
			} else {
				this.hide();
			}
		}
	},

  render() {
    return null;
  }
})
</script>
