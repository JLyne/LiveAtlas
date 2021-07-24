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
	<CollapsibleSection name="players" class="players">
		<template v-slot:heading>{{ messageHeading }} [{{ players.length }}/{{ maxPlayers }}]</template>
		<template v-slot:default>
			<div class="section__content">
				<input v-if="players && searchEnabled" id="players__search" type="text" name="search"
				       v-model="searchQuery" :placeholder="messagePlayersSearchPlaceholder" @keydown="onKeydown">
				<RadioList v-if="filteredPlayers.length" aria-labelledby="players-heading">
					<PlayerListItem v-for="player in filteredPlayers" :key="player.name"
					                :player="player"></PlayerListItem>
				</RadioList>
				<div v-else-if="searchQuery" class="section__skeleton">{{ messageSkeletonPlayersSearch }}</div>
				<div v-else class="section__skeleton">{{ messageSkeletonPlayers }}</div>
			</div>
		</template>
	</CollapsibleSection>
</template>

<script lang="ts">
import PlayerListItem from "./PlayerListItem.vue";
import {computed, defineComponent} from "@vue/runtime-core";
import {useStore} from "@/store";
import CollapsibleSection from "@/components/sidebar/CollapsibleSection.vue";
import RadioList from "@/components/util/RadioList.vue";
import {ref} from "vue";

export default defineComponent({
	components: {
		RadioList,
		CollapsibleSection,
		PlayerListItem
	},

	setup() {
		const store = useStore(),
			messageHeading = computed(() => store.state.messages.playersHeading),
			messageSkeletonPlayers = computed(() => store.state.messages.playersSkeleton),
			messageSkeletonPlayersSearch = computed(() => store.state.messages.playersSearchSkeleton),
			messagePlayersSearchPlaceholder = computed(() => store.state.messages.playersSearchPlaceholder),

			searchEnabled = computed(() => store.state.ui.playersSearch),
			searchQuery = ref(""),

			players = computed(() => store.state.sortedPlayers),
			filteredPlayers = computed(() => {
				const query = searchQuery.value.toLowerCase();

				return query ? store.state.sortedPlayers.filter(p => {
					return p.name.toLowerCase().indexOf(query) > -1;
				}) : store.state.sortedPlayers;
			}),
			maxPlayers = computed(() => store.state.configuration.maxPlayers),

			onKeydown = (e: KeyboardEvent) => {
				e.stopImmediatePropagation();
			};

		return {
			messageHeading,
			messageSkeletonPlayers,
			messageSkeletonPlayersSearch,
			messagePlayersSearchPlaceholder,

			searchEnabled,
			searchQuery,

			players,
			filteredPlayers,
			maxPlayers,
			onKeydown
		}
	}
});
</script>

<style lang="scss" scoped>
	.players {
		#players__search {
			margin-bottom: 1.5rem;
			padding: 0.5rem 1rem;
			box-sizing: border-box;
			width: 100%;

			& + .section__skeleton {
				margin-top: 0;
			}
		}
	}
</style>
