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
	<section class="sidebar__section" v-if="servers.size > 1">
		<span class="section__heading">{{ heading }}</span>
		<ul class="section__content">
			<ServerListItem :server="server" v-for="[name, server] in servers" :key="name"></ServerListItem>
		</ul>
	</section>
</template>

<script lang="ts">
import ServerListItem from './ServerListItem.vue';
import {defineComponent} from 'vue';
import {useStore} from "@/store";

export default defineComponent({
	name: 'ServerList',
	components: {
		ServerListItem
	},

	computed: {
		heading() {
			return useStore().state.messages.serversHeading;
		},

		servers() {
			return useStore().state.servers;
		}
	},
});

</script>

<style scoped>

</style>