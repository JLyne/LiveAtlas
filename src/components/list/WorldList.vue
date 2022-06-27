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
	<RadioList v-if="worlds.size" name="map" aria-labelledby="maps-heading">
		<WorldListItem :world="world" v-for="[name, world] in worlds" :key="`${prefix}_${currentServer}_${name}`"></WorldListItem>
	</RadioList>
</template>

<script lang="ts">
import WorldListItem from './WorldListItem.vue';
import {defineComponent} from 'vue';
import RadioList from "@/components/util/RadioList.vue";
import {LiveAtlasWorldDefinition} from "@/index";
import {useStore} from "@/store";
import {computed} from "@vue/runtime-core";

export default defineComponent({
	name: 'WorldList',
	components: {
		RadioList,
		WorldListItem
	},

	props: {
		prefix: {
			type: String,
			default: 'map',
		},
		worlds: {
			type: Object as () => Map<string, LiveAtlasWorldDefinition>,
			required: true,
		}
	},

	setup() {
		const store = useStore(),
			currentServer = computed(() => store.state.currentServer ? store.state.currentServer.id : undefined);

		return {
			currentServer
		}
	}
});
</script>
