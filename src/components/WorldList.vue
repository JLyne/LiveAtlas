<template>
	<fieldset class="section">
		<legend>Map Types</legend>
<!--		<div class="scrollup" style="display: block;"></div>-->
		<ul class="list content worldlist">
			<WorldListItem :world="world" v-for="[name, world] in worlds" :key="name"></WorldListItem>
		</ul>
<!--		<div class="scrolldown" style="display: block;"></div>-->
	</fieldset>
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
		worlds() {
			return useStore().state.worlds;
		}
	},
});

</script>

<style scoped>

</style>