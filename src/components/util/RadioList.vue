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
	<fieldset class="menu" role="radiogroup" @keydown="onKeydown">
		<!-- Always have a checked item to fix https://bugzilla.mozilla.org/show_bug.cgi?id=1413213 -->
		<input type="radio" :name="name" checked data-ignore @focus="moveFocus">
		<slot></slot>
	</fieldset>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {handleKeyboardEvent} from "@/util/events";

export default defineComponent({
	name: 'RadioList',

	props: {
		name: {
			type: String,
			required: true
		}
	},

	setup() {
		const onKeydown = (e: KeyboardEvent) => {
			handleKeyboardEvent(e, Array.from((e.currentTarget as HTMLFieldSetElement).elements) as HTMLElement[])
		};

		const moveFocus = (e: FocusEvent) => {
			((e.target as HTMLElement).nextElementSibling as HTMLElement).focus();
		};

		return {
			onKeydown,
			moveFocus
		}
	},
});
</script>

<style lang="scss">
	@import '../../scss/mixins';

	fieldset {
		appearance: none;
		border: none;
		margin: 0;
		padding: 0;
	}
</style>

