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
	<input :id="`server-${server.id}`" type="radio" name="server" v-bind:value="server.id" v-model="currentServer">
	<label :for="`server-${server.id}`">{{ server.label || server.id }}</label>
</template>

<script lang="ts">
import {computed, defineComponent} from 'vue';
import {LiveAtlasServerDefinition} from "@/index";
import {useStore} from "@/store";
import {MutationTypes} from "@/store/mutation-types";

export default defineComponent({
	name: 'ServerListItem',
	props: {
		server: {
			type: Object as () => LiveAtlasServerDefinition,
			required: true
		}
	},

	setup() {
		const store = useStore(),
			currentServer = computed({
				get: () => store.state.currentServer ? store.state.currentServer.id : undefined,
				set: (value) => value && store.commit(MutationTypes.SET_CURRENT_SERVER, value)
			})

		return {
			currentServer,
		}
	}
});
</script>
