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
	<RadioList v-if="players.length">
		<PlayerListItem v-for="player in players" :key="player.name" :player="player"></PlayerListItem>
	</RadioList>
</template>

<script lang="ts">
import PlayerListItem from "./PlayerListItem.vue";
import {defineComponent} from "@vue/runtime-core";
import RadioList from "@/components/util/RadioList.vue";
import {LiveAtlasPlayer} from "@/index";

export default defineComponent({
	components: {
		RadioList,
		PlayerListItem
	},
	props: {
		players: {
			type: Object as () => LiveAtlasPlayer[],
			required: true,
		}
	}
});
</script>
