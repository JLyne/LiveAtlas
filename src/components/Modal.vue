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
	<div :class="{'modal': true, 'modal--visible': visible, 'modal--backdrop': backdrop}"
	     role="dialog" :id="`modal--${id}`" :aria-labelledby="`${id}__heading`" aria-modal="true"
	     @click="onBackdropClick" ref="modal">
		<div class="modal__header">
			<slot name="header"></slot>
			<button v-if="closeable" class="modal__close" type="button" @click="close" :aria-label="messageClose">
				<SvgIcon name="cross"></SvgIcon>
			</button>
		</div>
		<div class="modal__content">
			<slot></slot>
		</div>
	</div>
</template>

<script lang="ts">
import {defineComponent, onMounted, onUnmounted} from "@vue/runtime-core";
import {useStore} from "@/store";
import {MutationTypes} from "@/store/mutation-types";
import {LiveAtlasUIModal} from "@/index";
import {computed, ref} from "vue";
import SvgIcon from "@/components/SvgIcon.vue";

export default defineComponent({
	components: {SvgIcon},
	props: {
		id: {
			required: true,
			type: String,
		},
		closeable: {
			default: true,
			type: Boolean,
		},
		backdrop: {
			default: true,
			type: Boolean,
		}
	},
	setup(props) {
		const store = useStore(),
			modal = ref<HTMLElement | null>(null),
			messageClose = computed(() => store.state.messages.closeTitle),
			visible = computed(() => store.state.ui.visibleModal === props.id);

		const onKeydown = (e: KeyboardEvent) => {
			if(props.closeable && visible.value && e.key === 'Escape') {
				close();
				e.preventDefault();
				e.stopImmediatePropagation();
			}
		};

		const onBackdropClick = (e: MouseEvent) => {
			if(props.closeable && e.target === modal.value) {
				close();
			}
		};

		const close = () => props.closeable && store.commit(MutationTypes.HIDE_UI_MODAL, props.id as LiveAtlasUIModal);

		onMounted(() => {
			window.addEventListener('keydown', onKeydown);
		});
		onUnmounted(() => {
			window.removeEventListener('keydown', onKeydown);
		});

		return {
			visible,
			modal,
			onBackdropClick,
			close,
			messageClose
		}
	}
});
</script>

<style lang="scss">
	@import '../scss/placeholders';

	.modal {
		position: fixed;
		z-index: 120;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		display: none;
		align-items: center;
		flex-direction: column;
		justify-content: flex-start;
		padding: 10vh 1rem;
		overflow: auto;
		pointer-events: none;
		cursor: default;

		&.modal--backdrop {
			pointer-events: auto;
			background-color: rgba(0, 0, 0, 0.8);
		}

		&.modal--visible {
			display: flex;
		}

		.modal__header,
		.modal__content {
			@extend %panel;
			max-width: 80rem;
			box-sizing: border-box;
			width: 100%;
			padding: 2rem;
			pointer-events: auto;
		}

		.modal__header {
			border-bottom-left-radius: 0;
			border-bottom-right-radius: 0;
			position: relative;
			padding: 2rem 3rem 0;
			text-align: center;
		}

		.modal__close {
			position: absolute;
			top: 0;
			right: 0;
			padding: 1rem;
			width: 3.5rem;
            height: 3.5rem;
			display: block;
			border-top-left-radius: 0;
			border-bottom-right-radius: 0;

			.svg-icon {
				width: 1.5rem !important;
				height: 1.5rem !important;
			}
		}

		.modal__content {
			border-top-left-radius: 0;
			border-top-right-radius: 0;
		}
	}
</style>
