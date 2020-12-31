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

<template>
	<section class="chat">
		<ul class="chat__messages">
			<ChatMessage v-for="message in chat" :key="message.timestamp" :message="message"></ChatMessage>
		</ul>
	</section>
</template>

<script lang="ts">
	import {defineComponent, computed} from "@vue/runtime-core";
	import {useStore} from "@/store";
	import ChatMessage from "@/components/chat/ChatMessage.vue";

	export default defineComponent({
		components: {
			ChatMessage
		},
		setup() {
			const store = useStore(),
				chat = computed(() => store.state.chat);

			return {
				chat,
			}
		}
	})
</script>

<style lang="scss">
	@import '../scss/variables';
	@import '../scss/placeholders';

	.chat {
		@extend %panel;
		position: absolute;
		bottom: 7rem;
		left: 7rem;
		width: 50rem;
		max-width: calc(100% - 8rem);
		max-height: 20rem;
		display: flex;
		box-sizing: border-box;

		.chat__messages {
			display: flex;
			flex-direction: column-reverse;
			list-style: none;
			overflow: auto;
			margin: 0;
			padding: 0;

			.message {
				font-size: 1.6rem;

				& + .message {
					margin-bottom: 0.5rem
				}
			}
		}

		@media (max-width: 25rem), (max-height: 30rem) {
			bottom: 6.5rem;
			left: 6.5rem;
			max-width: calc(100% - 7rem);
		}

		@media (max-width: 20rem) {
			.chat__messages .message + .message {
				margin-bottom: 0.7rem;
			}
		}
	}
</style>