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
			<button v-if="mapCount > 1" :class="{'button--maps': true, 'active':currentlyVisible.has('maps')}"
					@click="toggleElement('maps')" title="Map list" aria-label="Map list">
				<SvgIcon name="maps"></SvgIcon>
			</button>
			<button :class="{'button--players': true, 'active': currentlyVisible.has('players')}"
					@click="toggleElement('players')" title="Player list" aria-label="Player list">
				<SvgIcon name="players"></SvgIcon>
			</button>
<!--			<button :class="{'button&#45;&#45;settings': true, 'active': currentlyVisible.has('settings'))}"-->
<!--					@click="toggleElement('settings')" title="Settings" aria-label="Settings">-->
<!--				<SvgIcon name="settings"></SvgIcon>-->
<!--			</button>-->
		</header>
		<WorldList v-if="mapCount > 1" v-show="currentlyVisible.has('maps')"></WorldList>
		<PlayerList v-if="previouslyVisible.has('players')" v-show="currentlyVisible.has('players')"></PlayerList>
		<FollowTarget v-if="following" v-show="followActive" :target="following"></FollowTarget>
	</aside>
</template>

<script lang="ts">
import {defineComponent, computed} from "@vue/runtime-core";
import PlayerList from './sidebar/PlayerList.vue';
import WorldList from './sidebar/WorldList.vue';
import FollowTarget from './sidebar/FollowTarget.vue';
import {useStore} from "@/store";
import SvgIcon from "@/components/SvgIcon.vue";
import {MutationTypes} from "@/store/mutation-types";
import {DynmapUIElement} from "@/dynmap";
import "@/assets/icons/players.svg";
import "@/assets/icons/maps.svg";

export default defineComponent({
	components: {
		SvgIcon,
		PlayerList,
		FollowTarget,
		WorldList,
	},

	setup() {
		const store = useStore(),
			currentlyVisible = computed(() => store.state.ui.visibleElements),
			previouslyVisible = computed(() => store.state.ui.previouslyVisibleElements),
			smallScreen = computed(() => store.state.ui.smallScreen),
			mapCount = computed(() => store.state.maps.size),
			following = computed(() => store.state.followTarget),

			toggleElement = (element: DynmapUIElement) => {
				store.commit(MutationTypes.TOGGLE_UI_ELEMENT_VISIBILITY, element);
			},

			followActive = computed(() => {
				//Show following alongside playerlist on small screens
				return (!smallScreen.value && following)
					|| (smallScreen.value && currentlyVisible.value.has('players'));
			});

		return {
			mapCount,
			currentlyVisible,
			previouslyVisible,
			toggleElement,
			followActive,
			following,
		}
	}
})

</script>

<style lang="scss">
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

		@media (max-width: 480px) {
			flex-direction: column;
			align-items: flex-end;
			margin: 0;
			position: absolute;
			right: 1rem;
			top: 1rem;

			button + button {
				margin-left: 0;
				margin-top: 1rem;
			}
		}

		@media (max-width: 400px) {
			right: 0.5rem;
			top: 0.5rem;
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
			margin-bottom: 1rem;

			&:last-child {
				margin-bottom: 0;
			}
		}

		.section__skeleton {
			font-style: italic;
			color: var(--text-disabled);
			text-align: center;
			align-self: center;
			margin-top: 1rem;
		}
	}

	@media (max-width: 480px) {
		padding-right: 7rem;
	}

	@media (max-width: 400px), (max-height: 480px) {
		padding-top: 0.5rem;
		padding-bottom: 0.5rem;
		padding-left: 0.5rem;
	}

	@media (max-width: 400px) {
		padding-right: 6.5rem;
	}

	@media (max-width: 320px) {
		box-sizing: border-box;
		width: 100%;
	}

	@media print {
		display: none;
	}
}
</style>