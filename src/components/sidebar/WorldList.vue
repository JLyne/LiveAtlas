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
	<CollapsibleSection name="maps">
		<template v-slot:heading>{{ heading }}</template>
		<template v-slot:default>
			<RadioList class="section__content">
				<WorldListItem :world="world" v-for="[name, world] in worlds" :key="`${prefix}_${currentServer.id}_${name}`"></WorldListItem>
				<div v-if="!worlds.size" class="section__skeleton" aria-disabled="true" role="radio">{{ skeletonWorlds }}</div>
			</RadioList>
		</template>
	</CollapsibleSection>
</template>

<script lang="ts">
import WorldListItem from './WorldListItem.vue';
import {defineComponent} from 'vue';
import {useStore} from "@/store";
import CollapsibleSection from "@/components/sidebar/CollapsibleSection.vue";
import RadioList from "@/components/util/RadioList.vue";

export default defineComponent({
	name: 'WorldList',
	components: {
		RadioList,
		CollapsibleSection,
		WorldListItem
	},

	computed: {
		heading() {
			return useStore().state.messages.worldsHeading;
		},

		skeletonWorlds() {
			return useStore().state.messages.worldsSkeleton;
		},

		worlds() {
			return useStore().state.worlds;
		},

		currentServer() {
			return useStore().state.currentServer;
		}
	}
});
</script>
