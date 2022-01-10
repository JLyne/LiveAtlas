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
	<section :class="{
		'sidebar__section': true,
		'section--collapsible': collapsible,
		'section--collapsed': collapsed
	}" :data-section="name">
		<h2 class="section__heading">
			<button :id="`${name}-heading`" type="button"
			        @click.prevent="toggle" :title="title"
			        :aria-expanded="!collapsed" :aria-controls="`${name}-content`">
				<span>
					<slot name="heading"></slot>
				</span>
				<SvgIcon name="arrow"></SvgIcon>
			</button>
		</h2>
		<div :id="`${name}-content`" class="section__content" :aria-hidden="collapsed">
			<slot></slot>
		</div>
	</section>
</template>

<script lang="ts">
import {useStore} from "@/store";
import {LiveAtlasSidebarSection} from "@/index";
import {defineComponent} from "@vue/runtime-core";
import SvgIcon from "@/components/SvgIcon.vue";
import '@/assets/icons/arrow.svg';
import {MutationTypes} from "@/store/mutation-types";
import {computed, ref} from "vue";

export default defineComponent({
	name: 'SidebarSection',
	components: {SvgIcon},
	props: {
		name: {
			type: String as () => LiveAtlasSidebarSection,
			required: true,
		},
		collapsible: {
			type: Boolean,
			required: false,
			default: true,
		}
	},

	setup(props) {
		const store = useStore(),
			title = computed(() => store.state.messages.toggleTitle),
			collapsed = computed(() => store.state.ui.sidebar[props.name].collapsed),
			customPosition = computed(() => store.state.ui.sidebar[props.name].customPosition),
			customSize = computed(() => store.state.ui.sidebar[props.name].customSize),
			smallScreen = computed(() => store.state.ui.smallScreen),

			offsetX = ref(0),
			offsetY = ref(0);

		const toggle = () => {
			if(!props.collapsible) {
				return;
			}

			store.commit(MutationTypes.TOGGLE_SIDEBAR_SECTION_COLLAPSED_STATE, props.name);
		}

		return {
			title,
			collapsed,
			customPosition,
			customSize,
			smallScreen,
			toggle,
		}
	}
});
</script>

<style lang="scss">
	@import '../../scss/placeholders';

	.sidebar__section {
		@extend %panel;
		margin-bottom: var(--ui-element-spacing);
		box-sizing: border-box;
		width: 100%;
		max-width: 25rem;
		flex: 0 0 auto;

		.section__heading {
			cursor: pointer;
			user-select: none;
			text-align: left;
			align-items: center;
			margin: 0;

			button {
				display: flex;
				font-size: 2rem;
				padding: 1.5rem 1.5rem 1rem;
				margin: -1.5rem -1.5rem 0;
				background-color: transparent;
				font-weight: 400;
				color: inherit;
				width: calc(100% + 3rem);
				align-items: center;
				text-shadow: var(--text-shadow);

				.svg-icon {
					margin-left: auto;
					width: 1.5rem;
					height: 1.5rem;
				}
			}

			&:hover, &:focus-visible, &.focus-visible, &:active {
				background-color: transparent;
			}
		}

		.section__content {
			padding: 0 0.5rem;
			margin: 0 -.5rem 1rem;
			min-width: 0;
			position: relative;

			&:last-child {
				margin-bottom: 0;
			}
		}

		.section__skeleton {
			font-style: italic;
			color: var(--text-disabled);
			text-align: center;
			align-self: center;
			margin-top: 1rem;
		}

		&.section--collapsible {
			.section__heading .svg-icon {
				transform: rotate(180deg);
			}

			&.section--collapsed {
				.section__heading .svg-icon {
					transform: none;
				}

				.section__heading button {
					padding-bottom: 1.5rem;
					margin-bottom: -1.5rem;
				}

				.section__content {
					display: none;
				}
			}

			.section__content {
				display: flex;
				flex-direction: column;
				align-items: stretch;
				flex-shrink: 1;
				min-height: 0;
				overflow-y: auto;
				overflow-x: hidden;
			}
		}

		@media (max-width: 320px) {
			box-sizing: border-box;
			width: 100%;
		}
	}
</style>
