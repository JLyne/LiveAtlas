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
	<SidebarSection v-if="servers.size > 1" name="servers">
		<template v-slot:heading>{{ heading }}</template>
		<template v-slot:default>
			<ServerList :servers="servers" aria-labelledby="servers-heading"></ServerList>
		</template>
	</SidebarSection>
</template>

<script lang="ts">
import {computed, defineComponent} from 'vue';
import {useStore} from "@/store";
import SidebarSection from "@/components/sidebar/SidebarSection.vue";
import ServerList from "@/components/list/ServerList.vue";

export default defineComponent({
	name: 'ServersSection',
	components: {
		ServerList,
		SidebarSection,
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
