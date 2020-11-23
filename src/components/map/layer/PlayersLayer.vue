<template>
	<PlayerMarker v-for="[account, player] in players" :key="account" :player="player"></PlayerMarker>
</template>

<script lang="ts">
import PlayerMarker from "@/components/map/marker/PlayerMarker.vue";
import {defineComponent} from "@vue/runtime-core";
import {useStore} from "@/store";

export default defineComponent({
	components: {
		PlayerMarker
	},

	data() {
		return {
		}
	},

	computed: {
		players() {
			return useStore().state.players;
		},
	},

	mounted() {

	},

	unmounted() {
	},

	render() {
		return null;
	}
})
</script>

<style scoped>

</style>