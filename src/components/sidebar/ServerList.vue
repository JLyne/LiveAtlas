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
	<SidebarSection v-if="servers.size > 1" name="servers">
		<template v-slot:heading>{{ heading }}</template>
		<template v-slot:default>
			<RadioList aria-labelledby="servers-heading">
				<ServerListItem :server="server" v-for="[name, server] in servers" :key="name"></ServerListItem>
			</RadioList>
		</template>
	</SidebarSection>
</template>

<script lang="ts">
import ServerListItem from './ServerListItem.vue';
import {computed, defineComponent} from 'vue';
import {useStore} from "@/store";
import SidebarSection from "@/components/sidebar/SidebarSection.vue";
import RadioList from "@/components/util/RadioList.vue";

export default defineComponent({
	name: 'ServerList',
	components: {
		RadioList,
		SidebarSection,
		ServerListItem
	},

	setup() {
		const store = useStore(),
			heading = computed(() => store.state.messages.serversHeading),
			servers = computed(() => store.state.servers);

		return {
			heading,
			servers
		}
	}
});
</script>
