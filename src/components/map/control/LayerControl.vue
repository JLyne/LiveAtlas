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
	<div class="layers">
		<button ref="button" type="button" class="ui__element ui__button" title="Layers" :aria-expanded="listVisible"
            @click.prevent="toggleList"
            @keydown.right.prevent.stop="toggleList">
			<SvgIcon name="layers"></SvgIcon>
		</button>

		<section ref="list" :hidden="!listVisible" class="ui__element ui__panel layers__list"
             :style="listStyle" @keydown="handleListKeydown">
			<div class="layers__base"></div>
			<div class="layers__overlays">
				<label v-for="layer in overlayLayers" :key="stamp(layer.layer)" class="layer checkbox">
					<input type="checkbox" :checked="layer.enabled" @keydown.space.prevent="toggleLayer(layer.layer)"
                 @input.prevent="toggleLayer(layer.layer)">
					<SvgIcon name="checkbox"></SvgIcon>
					<span>{{ layer.name }}</span>
				</label>
			</div>
		</section>
	</div>
</template>

<script lang="ts">
import {computed, defineComponent, onUnmounted, watch, nextTick, onMounted, ref} from "vue";
import {stamp} from "leaflet";
import {useStore} from "@/store";
import {MutationTypes} from "@/store/mutation-types";
import SvgIcon from "@/components/SvgIcon.vue";

import {toggleLayer} from "@/util/layers";
import {handleKeyboardEvent} from "@/util/events";
import '@/assets/icons/layers.svg';
import '@/assets/icons/checkbox.svg';

export default defineComponent({
	components: {SvgIcon},

	setup() {
		const store = useStore(),
			overlayLayers = computed(() => store.state.sortedLayers.filter(layer => layer.overlay)),
			baseLayers = computed(() => store.state.sortedLayers.filter(layer => !layer.overlay)),
			listVisible = computed(() => store.state.ui.visibleElements.has('layers')),
			listStyle = ref({'max-height': 'auto'}),

			button = ref<HTMLButtonElement|null>(null),
			list = ref<HTMLElement|null>(null);

		const toggleList = () => listVisible.value ? closeList() : openList();

		const openList = () =>
			store.commit(MutationTypes.SET_UI_ELEMENT_VISIBILITY, {element: 'layers', state: true});

		const closeList = () =>
			store.commit(MutationTypes.SET_UI_ELEMENT_VISIBILITY, {element: 'layers', state: false});

		const handleListKeydown = (event: KeyboardEvent) => {
			if(event.key === 'ArrowLeft') {
				closeList();
				event.preventDefault();
				return;
			}

			const elements = Array.from((list.value as HTMLElement).querySelectorAll('input')) as HTMLElement[];
			handleKeyboardEvent(event as KeyboardEvent, elements);
		}

		const handleResize = () => {
			const y = button.value!.getBoundingClientRect().y;

			//Limit height to remaining vertical space
			//Avoid covering bottom bar
			listStyle.value['max-height'] = `calc(100vh - ${(y + 10 + 60)}px)`;
		};

		watch(listVisible, visible => {
			if(visible) {
				const firstCheckbox = (list.value as HTMLElement).querySelector('.checkbox');

				if(firstCheckbox instanceof HTMLElement) {
					nextTick(() => firstCheckbox.focus());
				}
			} else {
				nextTick(() => (button.value as HTMLButtonElement).focus());
			}
		});

		onMounted(() => {
			window.addEventListener('resize', handleResize);
			handleResize();
		});
		onUnmounted(() => window.addEventListener('resize', handleResize));

		return {
			overlayLayers,
			baseLayers,
			listVisible,
			listStyle,

			button,
			list,

			toggleList,
			openList,
			closeList,
			handleListKeydown,
			toggleLayer,
			stamp
		}
	}
})
</script>

<style lang="scss" scoped>
	@import '../../../scss/placeholders';

	.layers {
		width: auto;
		border: none;
		color: var(--text-base);
		position: relative;

		.layers__list[hidden] {
			display: none;
		}

		.layers__list {
			@extend %panel;
			position: absolute;
			top: 0;
			left: calc(var(--ui-element-spacing) + var(--ui-button-size));
			overflow: auto;
			max-width: calc(100vw - 14rem);
			box-sizing: border-box;
			font-size: 1.5rem;
			line-height: 1;
			pointer-events: auto;

			@media screen and (max-width: 400px) {
				max-width: calc(100vw - 13rem);
			}

			.layers__overlays {
				width: 100%;
				max-width: 30rem;
			}

			.layer {
				cursor: pointer;
				padding: 0.8rem 0 0.7rem;

				&:first-child {
					margin-top: -0.4rem;
				}

				&:last-child {
					margin-bottom: -0.4rem;
				}
			}
		}
	}
</style>
