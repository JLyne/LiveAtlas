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
	<section class="chat">
		<ul class="chat__messages">
			<li class="message" v-for="message in chat" :key="message.timestamp">{{ message.message || 'aaaa' }}</li>
		</ul>
	</section>
</template>

<script lang="ts">
	import {defineComponent, computed} from "@vue/runtime-core";
	import {useStore} from "@/store";

	export default defineComponent({
		setup() {
			const store = useStore(),
				chat = computed(() => store.state.chat);

			return {
				chat,
			}
		}
	})
</script>

<style lang="scss">

</style>