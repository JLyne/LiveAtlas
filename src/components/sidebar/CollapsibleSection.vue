<template>
	<section :class="{'sidebar__section': true, 'section--collapsible': true, 'section--collapsed': collapsed}">
		<button :id="`${name}-heading`" type="button" class="section__heading"
		        @click.prevent="toggle" :title="title"
		        :aria-expanded="!collapsed" :aria-controls="`${name}-content`">
			<span>
				<slot name="heading"></slot>
			</span>
			<SvgIcon name="arrow"></SvgIcon>
		</button>
		<div :id="`${name}-content`" role="region" :aria-labelledby="`${name}-heading`" :aria-hidden="collapsed">
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
