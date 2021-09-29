<!--
  - Copyright 2021 James Lyne
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
	<li :class="`message message--${message.type}`">
		<img v-if="showFace" width="16" height="16" class="message__face" :src="image" alt="" />
		<span v-if="showSender" class="message__sender" v-html="message.playerName"></span>
		<span class="message__content" v-html="messageContent"></span>
	</li>
</template>

<script lang="ts">
	import {defineComponent, ref, onMounted, computed} from "@vue/runtime-core";
	import {getMinecraftHead} from '@/util';
	import {useStore} from "@/store";
	import defaultImage from '@/assets/images/player_face.png';
	import {LiveAtlasChat} from "@/index";

	export default defineComponent({
		props: {
			message: {
				type: Object as () => LiveAtlasChat,
				required: true,
			}
		},
		setup(props) {
			const store = useStore();
			let image = ref(defaultImage),
				showFace = computed(() => store.state.components.chatBox?.showPlayerFaces && props.message.playerAccount),
				showSender = computed(() => props.message.playerName && props.message.type === 'chat'),
				messageContent = computed(() => {
					switch(props.message.type) {
						case 'chat':
							return props.message.message;
						case 'playerjoin':
							if(props.message.playerName) {
								return store.state.messages.chatPlayerJoin
									.replace('%playername%', props.message.playerName);
							} else {
								return store.state.messages.chatAnonymousJoin;
							}
						case 'playerleave':
							if(props.message.playerName) {
								return store.state.messages.chatPlayerQuit
									.replace('%playername%', props.message.playerName);
							} else {
								return store.state.messages.chatAnonymousQuit;
							}
					}
				})

			onMounted(() => {
				if(showFace.value) {
					getMinecraftHead(props.message.playerAccount as string, 'small')
						.then((result) => image.value = result.src).catch(() => {});
				}
			});

			return {
				image,
				showFace,
				showSender,
				messageContent
			}
		}
	})
</script>

<style lang="scss">
	.message {
		.message__face {
			display: inline-block;
			vertical-align: baseline;
			margin-right: 0.5rem;
		}

		.message__sender {
			margin-right: 0.5rem;
			word-wrap: break-word;

			&:not(:empty):after {
				content: ': ';
			}
		}

		.message__content {
			word-wrap: break-word;
		}

		&.message--playerjoin,
		&.message--playerleave {
			font-style: italic;
		}

		@media (max-width: 320px) {
			&.message--chat {
				.message__sender:after {
					content: none;
				}

				.message__content {
					display: block;
					color: var(--text-emphasis);
				}
			}
		}
	}
</style>
