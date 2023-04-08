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
	<RadioList name="server" aria-labelledby="servers-heading">
		<ServerListItem :server="server" v-for="[name, server] in servers" :key="name"></ServerListItem>
	</RadioList>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {LiveAtlasServerDefinition} from "@/index";
import ServerListItem from './ServerListItem.vue';
import RadioList from "@/components/util/RadioList.vue";

export default defineComponent({
	name: 'ServerList',
	components: {
		RadioList,
		ServerListItem
	},

	props: {
		servers: {
			type: Object as () => Map<string, LiveAtlasServerDefinition>,
			required: true
		}
	}
});
</script>
