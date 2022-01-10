<!--
  - Copyright 2021 James Lyne
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
	<SidebarSection name="maps">
		<template v-slot:heading>{{ heading }}</template>
		<template v-slot:default>
			<RadioList v-if="worlds.size" aria-labelledby="maps-heading">
				<WorldListItem :world="world" v-for="[name, world] in worlds" :key="`${prefix}_${currentServer}_${name}`"></WorldListItem>
			</RadioList>
			<div v-else class="section__skeleton">{{ skeleton }}</div>
		</template>
	</SidebarSection>
</template>

<script lang="ts">
import WorldListItem from './WorldListItem.vue';
import {computed, defineComponent} from 'vue';
import {useStore} from "@/store";
import RadioList from "@/components/util/RadioList.vue";
import SidebarSection from "@/components/sidebar/SidebarSection.vue";

export default defineComponent({
	name: 'WorldList',
	components: {
		SidebarSection,
		RadioList,
		WorldListItem
	},

	props: {
		prefix: {
			type: String,
			default: 'map',
		}
	},

	setup() {
		const store = useStore(),
			heading = computed(() => store.state.messages.worldsHeading),
			skeleton = computed(() => store.state.messages.worldsSkeleton),
			worlds = computed(() => store.state.worlds),
			currentServer = computed(() => store.state.currentServer ? store.state.currentServer.id : undefined);

		return {
			heading,
			skeleton,
			worlds,
			currentServer
		}
	}
});
</script>
