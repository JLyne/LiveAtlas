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
	<button class="ui__element ui__button" type="button" :title="linkTitle"
          v-clipboard:copy="url" v-clipboard:success="copySuccess" v-clipboard:error="copyError">
		<SvgIcon name="link"></SvgIcon>
	</button>
</template>

<script lang="ts">
import {computed, defineComponent} from "vue";
import {useStore} from "@/store";
import {clipboardError, clipboardSuccess} from "@/util";
import SvgIcon from "@/components/SvgIcon.vue";
import '@/assets/icons/link.svg';

export default defineComponent({
	components: {SvgIcon},

	setup() {
		const store = useStore(),
			linkTitle = computed(() => store.state.messages.linkTitle),
			url = computed(() => window.location.href.split("#")[0] + store.getters.url);

		return {
			copySuccess: clipboardSuccess(store),
			copyError: clipboardError(store),
			linkTitle,
			url
		}
	},
})
</script>
