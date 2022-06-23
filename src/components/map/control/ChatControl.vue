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
	<div class="chat">
		<button class="ui__element ui__button" type="button" :title="buttonTitle" :aria-expanded="chatVisible"
            @click.prevent.stop="handleClick"
				@keydown.right.prevent.stop="handleKeydown">
			<SvgIcon name="chat"></SvgIcon>
		</button>
		<ChatBox v-show="chatVisible"></ChatBox>
	</div>
</template>

<script lang="ts">
import {computed, defineComponent} from "vue";
import {useStore} from "@/store";
import {MutationTypes} from "@/store/mutation-types";
import SvgIcon from "@/components/SvgIcon.vue";
import ChatBox from "@/components/ChatBox.vue";
import "@/assets/icons/chat.svg";

export default defineComponent({
	components: {
		ChatBox,
		SvgIcon,
	},

	setup() {
		const store = useStore(),
			chatVisible = computed(() => store.state.ui.visibleElements.has('chat')),
			buttonTitle = computed(() => store.state.messages.chatTitle);

		const handleClick = () => store.commit(MutationTypes.TOGGLE_UI_ELEMENT_VISIBILITY, 'chat'),
			handleKeydown = () =>
				store.commit(MutationTypes.SET_UI_ELEMENT_VISIBILITY, {element: 'chat', state: true});

		return {
			buttonTitle,
			chatVisible,

			handleClick,
			handleKeydown
		}
	},

	render() {
		return null;
	}
})
</script>

<style lang="scss" scoped>
	.chat {
		position: relative;

		.chatbox {
			pointer-events: auto;
			position: absolute;
			bottom: 0;
			width: 50rem;
			max-width: calc(100vw - 8rem);
			max-height: 20rem;
			left: calc(100% + var(--ui-element-spacing));
		}
	}
</style>
