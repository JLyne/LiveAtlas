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
	<fieldset class="menu" role="radiogroup" @keydown="onKeydown">
		<slot></slot>
	</fieldset>
</template>

<script lang="ts">
import {defineComponent} from 'vue';

export default defineComponent({
	name: 'RadioList',

	setup() {
	},

	methods: {
		onKeydown(e: KeyboardEvent) {
			if(e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
				const fieldset = e.currentTarget as HTMLFieldSetElement,
					position = Array.from(fieldset.elements).indexOf(e.target as HTMLElement);

				if(position < 0) {
					return;
				}

				let newPosition = (e.key === 'ArrowUp' || e.key === 'ArrowLeft') ? position - 1 : position + 1;

				if(newPosition < 0) {
					newPosition = fieldset.elements.length - 1;
				} else if (newPosition >= fieldset.elements.length) {
					newPosition = 0;
				}

				(fieldset.elements[newPosition] as HTMLElement).focus();
				e.preventDefault();
			} else if(e.key === 'Enter') {
				if(e.target instanceof HTMLInputElement && e.target.type === 'radio') {
					e.target.click();
				}
			}
		}
	}
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

