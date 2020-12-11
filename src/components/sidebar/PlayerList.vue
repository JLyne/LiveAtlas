<template>
	<section class="sidebar__section">
		<span class="section__heading">{{ heading }} [{{ players.size }}/{{ maxPlayers }}]</span>
		<ul class="section__content">
			<PlayerListItem v-for="[account, player] in players" :key="account" :player="player"></PlayerListItem>
		</ul>
	</section>
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
		heading() {
			return useStore().state.messages.players;
		},

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