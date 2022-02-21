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
	<svg :class="className" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
		<title v-if="title">{{ title }}</title>
		<use :xlink:href="iconPath"/>
	</svg>
</template>

<script>
import {computed} from "vue";

export default {
	name: 'svg-icon',

	props: {
		name: {
			type: String,
			required: true
		},

		title: {
			type: String,
			default: null
		}
	},

	setup(props) {
		const iconPath = computed(() => `#icon--${props.name}`),
			className = computed(() => `svg-icon svg-icon--${props.name}`);

		return {
			iconPath,
			className
		}
	}
};
</script>

<style>
	.svg-icon {
		pointer-events: none;
		fill: currentColor;
		height: 24px;
		width: 24px;
	}
</style>
