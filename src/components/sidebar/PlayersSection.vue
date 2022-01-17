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
			<PlayerList :players="players" :search="searchEnabled" aria-labelledby="players-heading">
			</PlayerList>
		</template>
	</SidebarSection>
</template>

<script lang="ts">
import {computed, defineComponent} from "@vue/runtime-core";
import {useStore} from "@/store";
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

			searchEnabled = computed(() => store.state.ui.playersSearch),

			players = computed(() => store.state.sortedPlayers),
			maxPlayers = computed(() => store.state.maxPlayers || 0);

		return {
			messageHeading,
			searchEnabled,
			players,
			maxPlayers
		}
	}
});
</script>

<style lang="scss" scoped>
	::v-deep(.menu) {
		scroll-margin-top: 8.2rem;
	}
</style>
