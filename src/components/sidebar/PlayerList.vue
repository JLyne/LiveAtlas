<!--
  - Copyright 2020 James Lyne
  -
  -    Licensed under the Apache License, Version 2.0 (the "License");
  -    you may not use this file except in compliance with the License.
  -    You may obtain a copy of the License at
  -
  -      http://www.apache.org/licenses/LICENSE-2.0
  -
  -    Unless required by applicable law or agreed to in writing, software
  -    distributed under the License is distributed on an "AS IS" BASIS,
  -    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  -    See the License for the specific language governing permissions and
  -    limitations under the License.
  -->

<template>
	<section class="sidebar__section sidebar__section--players">
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

<style scoped lang="scss">
	.sidebar__section.sidebar__section--players {
		flex-shrink: 10;
	}
</style>