<template>
	<section class="sidebar__section">
		<span class="section__heading">{{ heading }}</span>
		<ul class="section__content">
			<WorldListItem :world="world" v-for="[name, world] in worlds" :key="name"></WorldListItem>
		</ul>
	</section>
</template>

<script lang="ts">
import WorldListItem from './WorldListItem.vue';
import {defineComponent} from 'vue';
import {useStore} from "@/store";

export default defineComponent({
	name: 'WorldList',
	components: {
		WorldListItem
	},

	computed: {
		heading() {
			return useStore().state.messages.mapTypes;
		},

		worlds() {
			return useStore().state.worlds;
		}
	},
});

</script>

<style scoped>

</style>