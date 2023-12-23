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
	<li :class="`message message--${message.type}`">
		<PlayerImage v-if="showFace && message.playerAccount" :player="message.playerAccount" width="16" height="16" class="message__face" />
		<span v-if="messageChannel" class="message__channel" v-html="messageChannel"></span>
		<span v-if="showSender" class="message__sender" v-html="message.playerName"></span>
		<span class="message__content">{{ messageContent }}</span>
	</li>
</template>

<script lang="ts">
	import {defineComponent, computed} from "vue";
	import {useStore} from "@/store";
	import {LiveAtlasChat} from "@/index";
	import PlayerImage from "@/components/PlayerImage.vue";

	export default defineComponent({
		components: {PlayerImage},
		props: {
			message: {
				type: Object as () => LiveAtlasChat,
				required: true,
			}
		},
		setup(props) {
			const store = useStore();
			let showFace = computed(() => store.state.components.chatBox?.showPlayerFaces && props.message.playerAccount),
				showSender = computed(() => props.message.playerName && props.message.type === 'chat'),
				messageChannel = computed(() => props.message.type === 'chat' ? props.message.channel : undefined),
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

			return {
				showFace,
				showSender,
				messageChannel,
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

		.message__channel,
		.message__sender {
			margin-right: 0.5rem;
			word-wrap: break-word;
		}

		.message__channel {
			&:not(:empty):before {
				content: '[';
			}

			&:not(:empty):after {
				content: ']';
			}
		}

		.message__sender {
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
