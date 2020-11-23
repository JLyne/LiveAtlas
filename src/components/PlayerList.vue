<template>
	<fieldset class="section">
		<legend>Players [{{ players.size }}/{{ maxPlayers }}]</legend>
<!--		<div class="scrollup" style="display: block;"></div>-->
		<ul class="list content playerlist">
			<PlayerListItem v-for="[account, player] in players" :key="account" :player="player"></PlayerListItem>
		</ul>
<!--		<div class="scrolldown" style="display: block;"></div>-->
	</fieldset>
</template>

<script lang="ts">
import PlayerListItem from "./PlayerListItem.vue";
import {defineComponent} from "@vue/runtime-core";
import {useStore} from "@/store";

export default defineComponent({
	components: {
		PlayerListItem
	},

	computed: {
		players() {
			return useStore().state.players;
		},

		maxPlayers(): number {
			return useStore().state.configuration.maxPlayers;
		}
	},
});
</script>

<style scoped>

</style>