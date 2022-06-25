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
	<div class="ui__element ui__button logo">
		<a v-if="options.url" :href="options.url" :aria-label="options.text">
			<img v-if="options.image" :src="options.image" :alt="options.text" />
			<template v-else>{{ options.text }}</template>
		</a>
		<template v-else>
			<img v-if="options.image" :src="options.image" :alt="options.text" />
			<template v-else>{{ options.text }}</template>
		</template>
	</div>
</template>

<script lang="ts">
import {defineComponent} from "vue";
import {LogoControlOptions} from "@/index";

export default defineComponent({
	props: {
		options: {
			type: Object as () => LogoControlOptions,
			required: true,
		}
	}
});
</script>

<style lang="scss" scoped>
	.logo {
		flex-shrink: 0;
		width: auto;
		min-width: var(--ui-button-size);
		padding: 0;

		a {
			box-sizing: border-box;
			height: 100%;
			padding: 0.8rem 0.8rem 0.7rem;
			display: flex;
			align-items: center;
			justify-content: center;
		}
	}
</style>
