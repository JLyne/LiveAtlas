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
	<li :class="{'server': true, 'server--selected': server.id === currentServer}">
		<button type="button" :class="{'active': server.id === currentServer}"
			:title="server.label || server.id" @click="setCurrentServer(server.id)">{{ server.label || server.id }}
		</button>
	</li>
</template>

<script lang="ts">
import {useStore} from "@/store";
import {defineComponent} from 'vue';
import {MutationTypes} from "@/store/mutation-types";
import {LiveAtlasServerDefinition} from "@/index";

export default defineComponent({
	name: 'ServerListItem',
	props: {
		server: {
			type: Object as () => LiveAtlasServerDefinition,
			required: true
		}
	},

	computed: {
		currentServer(): string | undefined {
			return useStore().state.currentServer;
		}
	},

	methods: {
		setCurrentServer(serverId: string) {
			useStore().commit(MutationTypes.SET_CURRENT_SERVER, serverId);
		}
	}
});
</script>

<style lang="scss" scoped>
	@import '../../scss/placeholders';

	.server {
		height: 3.2rem;

		button {
			@extend %button;
			text-align: left;
			display: block;
			height: 100%;
			width: 100%;
			border-radius: 0.5rem;
		}
	}
</style>
