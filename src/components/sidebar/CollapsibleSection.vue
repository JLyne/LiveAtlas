<template>
	<section :class="{'sidebar__section': true, 'section--collapsed': collapsed}">
		<button type="button" class="section__heading"
		        @click.prevent="toggle" @keypress.prevent="handleKeypress" :title="title">
			<slot name="heading"></slot>
		</button>
		<ul class="section__content menu">
			<slot></slot>
		</ul>
	</section>
</template>

<script lang="ts">
	import {useStore} from "@/store";
	import {LiveAtlasSidebarSection} from "@/index";
	import {defineComponent} from "@vue/runtime-core";

	export default defineComponent({
		name: 'CollapsibleSection',

		props: {
			name: {
				type: Object as () => LiveAtlasSidebarSection,
				required: true,
			}
		},

		computed: {
			title(): string {
				return useStore().state.messages.toggleTitle;
			},

			collapsed(): boolean {
				return useStore().state.ui.collapsedSections.has(this.name);
			},
		},

		methods: {
			handleKeypress(e: KeyboardEvent) {
				if(e.key !== ' ' && e.key !== 'Enter') {
					return;
				}

				this.toggle();
			},

			toggle() {
				const store = useStore();

				if(this.collapsed) {
					store.state.ui.collapsedSections.delete(this.name);
				} else {
					store.state.ui.collapsedSections.add(this.name);
				}
			}
		}
	});
</script>
