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
	<CollapsibleSection name="players">
		<template v-slot:heading>{{ heading }} [{{ players.length }}/{{ maxPlayers }}]</template>
		<template v-slot:default>
			<RadioList class="section__content" v-if="players.length" aria-labelledby="players-heading">
				<PlayerListItem v-for="player in players" :key="player.account" :player="player"></PlayerListItem>
			</RadioList>
			<div v-else class="section__content section__skeleton">{{ skeletonPlayers }}</div>
		</template>
	</CollapsibleSection>
</template>

<script lang="ts">
import PlayerListItem from "./PlayerListItem.vue";
import {defineComponent} from "@vue/runtime-core";
import {useStore} from "@/store";
import CollapsibleSection from "@/components/sidebar/CollapsibleSection.vue";
import RadioList from "@/components/util/RadioList.vue";

export default defineComponent({
	components: {
		RadioList,
		CollapsibleSection,
		PlayerListItem
	},

	computed: {
		heading() {
			return useStore().state.messages.playersHeading;
		},

		skeletonPlayers() {
			return useStore().state.messages.playersSkeleton;
		},

		players() {
			return useStore().state.sortedPlayers;
		},

		maxPlayers(): number {
			return useStore().state.configuration.maxPlayers;
		}
	}
});
</script>
