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
				<SvgIcon v-if="collapsible" name="arrow"></SvgIcon>
			</button>
		</h2>
		<div :id="`${name}-content`" class="section__content" :aria-hidden="collapsed">
			<slot></slot>
		</div>
	</section>
</template>

<script lang="ts">
import {defineComponent, computed} from "vue";
import {LiveAtlasSidebarSection} from "@/index";
import {useStore} from "@/store";
import SvgIcon from "@/components/SvgIcon.vue";
import '@/assets/icons/arrow.svg';
import {MutationTypes} from "@/store/mutation-types";

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
			smallScreen = computed(() => store.state.ui.smallScreen);

		const toggle = () => {
			if(!props.collapsible) {
				return;
			}

			store.commit(MutationTypes.TOGGLE_SIDEBAR_SECTION_COLLAPSED_STATE, props.name);
		}

		return {
			title,
			collapsed,
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
		max-width: 26rem;
		flex: 0 0 auto;

		&[hidden] {
			display: none;
		}

		.section__heading {
			cursor: pointer;
			user-select: none;
			text-align: left;
			align-items: center;
			position: sticky;
			top: -0.2rem;
			background-color: inherit;
			z-index: 3;
			border-radius: inherit;
			margin: -1.5rem -1.5rem 0;

			&, button {
				padding: 1.5rem;
			}

			button {
				text-overflow: ellipsis;
				white-space: nowrap;
				overflow: hidden;
				display: flex;
				font-size: 2rem;
				background-color: transparent;
				font-weight: 400;
				color: inherit;
				width: calc(100% + 3rem);
				align-items: center;
				text-shadow: var(--text-shadow);
				padding: 1rem 1.5rem;
				line-height: 1.5;
				margin: -1.5rem;

				.svg-icon {
					margin-left: auto;
					width: 1.5rem;
					height: 1.5rem;
				}
			}

			&:hover, &:focus-visible, &.focus-visible, &:active {
				background-color: inherit;
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

		.section__search {
			margin-bottom: 1.5rem;
			padding: 0.5rem 1rem;
			box-sizing: border-box;
			width: 100%;
			position: sticky;
			top: 4.8rem;
			z-index: 3;
			box-shadow: 0 1.5rem 0.5em var(--background-base);

			& + .section__skeleton {
				margin-top: 0;
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

				.section__heading, .section__heading button {
					margin-bottom: -1.5rem;
				}

				.section__content {
					display: none;
				}
			}
		}

		@media (max-width: 320px) {
			box-sizing: border-box;
			width: 100%;
		}
	}
</style>
