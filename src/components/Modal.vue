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
	<div :class="{'modal': true, 'modal--visible': visible}" role="dialog" :id="`modal--${id}`"
	     :aria-labelledby="`${id}__heading`" aria-modal="true" @click="onClick" ref="modal">
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

export default defineComponent({
	props: {
		id: {
			required: true,
			type: String,
		}
	},
	setup(props) {
		const store = useStore(),
			modal = ref<HTMLElement | null>(null),
			visible = computed(() => store.state.ui.visibleModal === props.id);

		const onKeydown = (e: KeyboardEvent) => {
			if(visible.value && e.key === 'Escape') {
				store.commit(MutationTypes.HIDE_UI_MODAL, props.id as LiveAtlasUIModal);
				e.preventDefault();
			}
		};

		const onClick = (e: MouseEvent) => {
			if(e.target === modal.value) {
				store.commit(MutationTypes.HIDE_UI_MODAL, props.id as LiveAtlasUIModal);
			}
		};

		onMounted(() => {
			window.addEventListener('keydown', onKeydown);
		});
		onUnmounted(() => {
			window.addEventListener('keydown', onKeydown);
		});

		return {
			visible,
			modal,
			onClick,
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
		align-items: flex-start;
		justify-content: center;
		padding: 10vh 1rem;
		background-color: rgba(0, 0, 0, 0.8);
		overflow: auto;

		&.modal--visible {
			display: flex;
		}

		.modal__content {
			@extend %panel;
			max-width: 80rem;
			width: 100%;
		}
	}
</style>
