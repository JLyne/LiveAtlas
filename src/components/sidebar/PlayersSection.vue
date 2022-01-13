<!--
  - Copyright 2022 James Lyne
  -
  - Licensed under the Apache License, Version 2.0 (the "License");
  - you may not use this file except in compliance with the License.
  - You may obtain a copy of the License at
  -
  - http://www.apache.org/licenses/LICENSE-2.0
  -
  - Unless required by applicable law or agreed to in writing, software
  - distributed under the License is distributed on an "AS IS" BASIS,
  - WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  - See the License for the specific language governing permissions and
  - limitations under the License.
  -->

<template>
	<SidebarSection name="players" class="players">
		<template v-slot:heading>{{ messageHeading }}</template>
		<template v-slot:default>
			<input v-if="players && searchEnabled" id="players__search" type="text" name="search"
			       v-model="searchQuery" :placeholder="messagePlayersSearchPlaceholder" @keydown="onKeydown">
			<PlayerList v-if="filteredPlayers.length" :players="filteredPlayers" aria-labelledby="players-heading"></PlayerList>
			<div v-else-if="searchQuery" class="section__skeleton">{{ messageSkeletonPlayersSearch }}</div>
			<div v-else class="section__skeleton">{{ messageSkeletonPlayers }}</div>
		</template>
	</SidebarSection>
</template>

<script lang="ts">
import {computed, defineComponent} from "@vue/runtime-core";
import {useStore} from "@/store";
import {ref} from "vue";
import SidebarSection from "@/components/sidebar/SidebarSection.vue";
import PlayerList from "@/components/list/PlayerList.vue";

export default defineComponent({
	components: {
		PlayerList,
		SidebarSection,
	},

	setup() {
		const store = useStore(),
			messageHeading = computed(() => store.getters.playersHeading),
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
			maxPlayers = computed(() => store.state.maxPlayers || 0),

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
			position: sticky;
			top: 4.8rem;
			z-index: 3;

			& + .section__skeleton {
				margin-top: 0;
			}
		}
	}
</style>
