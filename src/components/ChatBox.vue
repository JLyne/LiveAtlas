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
	<section class="chatbox">
		<ul class="chatbox__messages" role="log" aria-live="polite" aria-relevant="additions">
			<ChatMessage v-for="message in chatMessages" :key="message.timestamp" :message="message"></ChatMessage>
			<li v-if="!chatMessages.length" class="message message--skeleton" role="none">{{ messageNoMessages }}</li>
		</ul>
		<form v-if="sendingEnabled" class="chatbox__form" @submit.prevent="sendMessage">
			<div role="alert" v-if="sendingError" class="chatbox__error">{{ sendingError }}</div>
			<input ref="chatInput" v-model="enteredMessage" class="chatbox__input" type="text" :maxlength="maxMessageLength"
					:placeholder="messagePlaceholder"  :disabled="sendingMessage">
			<button type="submit" class="chatbox__send" :disabled="!enteredMessage || sendingMessage">{{ messageSend }}</button>
		</form>
		<button type="button" v-if="loginRequired" class="chatbox__login" @click="login">{{ messageLogin }}</button>
	</section>
</template>

<script lang="ts">
	import {defineComponent, ref, computed, watch} from "vue";
	import {useStore} from "@/store";
  import {ActionTypes} from "@/store/action-types";
  import ChatMessage from "@/components/chat/ChatMessage.vue";
	import ChatError from "@/errors/ChatError";

	export default defineComponent({
		components: {
			ChatMessage
		},
		setup() {
			const store = useStore(),
				componentSettings = computed(() => store.state.components.chatBox),
				chatBoxVisible = computed(() => store.state.ui.visibleElements.has('chat')),

				loginRequired = computed(() => {
					return store.state.components.chatSending && store.state.components.chatSending.loginRequired
						&& !store.state.loggedIn;
				}),
				sendingEnabled = computed(() => store.state.components.chatSending && !loginRequired.value),
				maxMessageLength = computed(() => store.state.components.chatSending?.maxLength),

				chatInput = ref<HTMLInputElement | null>(null),
				enteredMessage = ref<string>(""),
				sendingMessage = ref<boolean>(false),
				sendingError = ref<string | null>(null),

				chatMessages = computed(() => {
					if(componentSettings.value!.messageHistory) {
						return store.state.chat.messages.slice(0, componentSettings.value!.messageHistory);
					} else {
						return store.state.chat.messages;
					}
				}),

				messageSend = computed(() => store.state.messages.chatSend),
				messagePlaceholder = computed(() => store.state.messages.chatPlaceholder),
				messageNoMessages = computed(() => store.state.messages.chatNoMessages),
				messageLogin = computed(() => store.state.messages.chatLogin),

				sendMessage = async () => {
					const message = enteredMessage.value.trim().substring(0, maxMessageLength.value);

					if(!message) {
						return;
					}

					sendingMessage.value = true;
					sendingError.value = null;

					try {
						await store.dispatch(ActionTypes.SEND_CHAT_MESSAGE, message);
						enteredMessage.value = "";
						sendingError.value = null;
					} catch(e) {
						if(e instanceof ChatError) {
							sendingError.value = e.message;
						} else {
							sendingError.value = store.state.messages.chatErrorUnknown;
						}
					} finally {
						sendingMessage.value = false;

						requestAnimationFrame(() => chatInput.value!.focus());
					}
				},

				login = () => store.dispatch(ActionTypes.LOGIN, null);

			watch(chatBoxVisible, newValue => {
				if(newValue && sendingEnabled.value) {
					requestAnimationFrame(() => chatInput.value!.focus());
				}
			});

			return {
				chatInput,
				enteredMessage,
				sendMessage,
				login,
				chatMessages,
				loginRequired,
				sendingEnabled,
				sendingMessage,
				sendingError,
				maxMessageLength,
				messageLogin,
				messageSend,
				messageNoMessages,
				messagePlaceholder,
			}
		}
	})
</script>

<style lang="scss">
	@import '../scss/placeholders';

	.chatbox {
		@extend %panel;
		display: flex;
		box-sizing: border-box;

		.chatbox__messages {
			display: flex;
			flex-direction: column-reverse;
			list-style: none;
			overflow: auto;
			margin: 0;
			padding: 0;

			.message {
				font-size: 1.6rem;
				line-height: 1.9rem;

				& + .message {
					margin-bottom: 0.5rem
				}

				&.message--skeleton {
					font-style: italic;
					color: var(--text-subtle);
				}
			}
		}

		.chatbox__form {
			display: flex;
			flex-wrap: wrap;
			align-items: stretch;
			margin: 1.5rem -1.5rem -1.5rem;

			.chatbox__input {
				border-bottom-left-radius: var(--border-radius);
				flex-grow: 1;
			}

			.chatbox__send {
				padding-left: 1rem;
				padding-right: 1rem;
				border-radius: 0 0 var(--border-radius) 0;
			}

			.chatbox__error {
				background-color: var(--background-error);
				color: var(--text-emphasis);
				font-size: 1.6rem;
				padding: 0.5rem 1rem;
				line-height: 2rem;
				width: 100%;
			}
		}

		.chatbox__login {
			font-size: 1.6rem;
			padding: 1.2rem;
			background-color: var(--background-light);
			color: var(--text-subtle);
			margin: 1.5rem -1.5rem -1.5rem;
			text-align: left;
			border-top-left-radius: 0;
			border-top-right-radius: 0;
		}

		@media (max-width: 400px), (max-height: 480px) {
			max-width: calc(100% - 7rem);
		}

		@media (max-width: 320px) {
			.chatbox__messages .message + .message {
				margin-bottom: 0.7rem;
			}
		}
	}
</style>
