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
	<section :class="{'sidebar__section': true, 'section--collapsible': true, 'section--collapsed': collapsed}">
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
		<div :id="`${name}-content`" :aria-hidden="collapsed">
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

	export default defineComponent({
		name: 'CollapsibleSection',
		components: {SvgIcon},
		props: {
			name: {
				type: String as () => LiveAtlasSidebarSection,
				required: true,
			}
		},

		computed: {
			title(): string {
				return useStore().state.messages.toggleTitle;
			},

			collapsed(): boolean {
				return useStore().state.ui.sidebar.collapsedSections.has(this.name);
			},
		},

		methods: {
			toggle() {
				useStore().commit(MutationTypes.TOGGLE_SIDEBAR_SECTION_COLLAPSED_STATE, this.name);
			}
		}
	});
</script>

<style lang="scss" scoped>
	.section--collapsible {
		.section__heading .svg-icon {
			transform: rotate(180deg);
		}

		&.section--collapsed {
			.section__heading .svg-icon {
				transform: none;
			}
		}
	}
</style>
