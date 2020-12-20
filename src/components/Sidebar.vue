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
	<aside class="sidebar">
		<header class="sidebar__buttons">
			<button v-if="mapCount > 1" :class="{'button--maps': true, 'active': mapsActive}"
					@click="mapsActive = !mapsActive" title="Map list" aria-label="Map list">
				<SvgIcon name="maps"></SvgIcon>
			</button>
			<button :class="{'button--players': true, 'active': playersActive}"
					@click="playersActive = !playersActive" title="Player list" aria-label="Player list">
				<SvgIcon name="players"></SvgIcon>
			</button>
<!--			<button :class="{'button&#45;&#45;settings': true, 'active': settingsActive}"-->
<!--					@click="settingsActive = !settingsActive" title="Settings" aria-label="Settings">-->
<!--				<SvgIcon name="settings"></SvgIcon>-->
<!--			</button>-->
		</header>
		<WorldList v-if="mapCount > 1" v-show="mapsActive"></WorldList>
		<PlayerList v-show="playersActive"></PlayerList>
		<FollowTarget v-if="following" :target="following"></FollowTarget>
	</aside>
</template>

<script lang="ts">
import {defineComponent, ref, computed} from "@vue/runtime-core";
import PlayerList from './sidebar/PlayerList.vue';
import WorldList from './sidebar/WorldList.vue';
import FollowTarget from './sidebar/FollowTarget.vue';
import {useStore} from "@/store";
import SvgIcon from "@/components/SvgIcon.vue";

export default defineComponent({
	components: {
		SvgIcon,
		PlayerList,
		FollowTarget,
		WorldList,
	},

	setup() {
		const store = useStore();
		let mapsActive = ref(false),
			playersActive = ref(false),
			settingsActive = ref(false),
			mapCount = computed(() => store.state.maps.size),
			following = computed(() => store.state.followTarget);

		return {
			mapCount,
			mapsActive,
			playersActive,
			settingsActive,
			following
		}
	}
})

</script>

<style lang="scss">
@import '../scss/variables';
@import '../scss/placeholders';

.sidebar {
	position: fixed;
	z-index: 120;
	top: 0;
	right: 0;
	bottom: 0;
	display: flex;
	flex-direction: column;
	padding: 1rem;
	width: 23rem;
	font-size: 1.5rem;
	will-change: transform;
	pointer-events: none;

	ul, ol, li {
		padding: 0;
		list-style: none;
		margin: 0;
	}

	.sidebar__buttons {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: flex-end;
		margin-bottom: 1rem;
		pointer-events: auto;

		button {
			width: 5rem;
			height: 5rem;

			& + button {
				margin-left: 1rem;
			}
		}

		@media (max-width: 30rem) {
			flex-direction: column;
			align-items: flex-end;
			margin: 0;
			position: absolute;
			right: 0.5rem;
			top: 0.5rem;

			button + button {
				margin-left: 0;
				margin-top: 1rem;
			}
		}
	}

	.sidebar__section {
		@extend %panel;
		flex: 0 1 auto;
		min-height: 10rem;
		margin-bottom: 1rem;
		pointer-events: auto;

		&:last-child {
			margin-bottom: 0;
		}

		.section__heading {
			font-size: 2rem;
			margin-bottom: 1rem;
		}

		.section__content {
			flex-shrink: 1;
			min-height: 0;
			overflow: auto;
			will-change: transform;
		}
	}

	@media (max-width: 30rem), (max-height: 30rem) {
		padding: 0.5rem;
	}

	@media (max-width: 30rem) {
		padding-right: 6.5rem;
	}

	@media (max-width: 20rem) {
		box-sizing: border-box;
		width: 100%;
	}
}
</style>