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
	<section class="sidebar" role="none" ref="sidebar">
		<header class="sidebar__buttons">
			<button v-if="mapCount > 1" :class="{'button--maps': true}" @click="toggleMaps" :title="messageWorlds"
					:aria-label="messageWorlds" :aria-expanded="mapsVisible">
				<SvgIcon name="maps"></SvgIcon>
			</button>
			<button :class="{'button--players': true}" @click="togglePlayers" :title="messagePlayers"
					:aria-label="messagePlayers" :aria-expanded="playersVisible">
				<SvgIcon name="players"></SvgIcon>
			</button>
		</header>
		<div class="sidebar__content" @keydown="handleSidebarKeydown">
			<ServerList v-if="serverCount > 1" v-show="mapsVisible"></ServerList>
			<WorldList v-if="mapCount > 1" v-show="mapsVisible"></WorldList>
			<PlayerList id="players" v-if="previouslyVisible.has('players')" v-show="playersVisible"></PlayerList>
			<FollowTarget v-if="following" v-show="followVisible" :target="following"></FollowTarget>
		</div>
	</section>
</template>

<script lang="ts">
import {computed, defineComponent} from "@vue/runtime-core";
import PlayerList from './sidebar/PlayerList.vue';
import WorldList from './sidebar/WorldList.vue';
import ServerList from "@/components/sidebar/ServerList.vue";
import FollowTarget from './sidebar/FollowTarget.vue';
import {useStore} from "@/store";
import SvgIcon from "@/components/SvgIcon.vue";
import {MutationTypes} from "@/store/mutation-types";
import "@/assets/icons/players.svg";
import "@/assets/icons/maps.svg";
import {nextTick, ref, watch} from "vue";
import {handleKeyboardEvent} from "@/util/events";
import {focus} from "@/util";

export default defineComponent({
	components: {
		ServerList,
		SvgIcon,
		PlayerList,
		FollowTarget,
		WorldList,
	},

	setup() {
		const store = useStore(),
			sidebar = ref<HTMLElement | null>(null),

			currentlyVisible = computed(() => store.state.ui.visibleElements),
			previouslyVisible = computed(() => store.state.ui.previouslyVisibleElements),
			smallScreen = computed(() => store.state.ui.smallScreen),
			mapCount = computed(() => store.state.maps.size),
			serverCount = computed(() => store.state.servers.size),
			following = computed(() => store.state.followTarget),

			messageWorlds = computed(() => store.state.messages.worldsHeading),
			messagePlayers = computed(() => store.state.messages.playersHeading),

			playersVisible = computed(() => currentlyVisible.value.has('players')),
			mapsVisible = computed(() => currentlyVisible.value.has('maps')),
			followVisible = computed(() => {
				//Show following alongside playerlist on small screens
				return (!smallScreen.value && following.value)
					|| (smallScreen.value && playersVisible.value);
			});

		//Arrow key section navigation
		const handleSidebarKeydown = (e: KeyboardEvent) => {
			if(!e.target || !(e.target as HTMLElement).matches('.section__heading button')) {
				return;
			}

			const sectionHeadings: HTMLElement[] = Array.from(sidebar.value!.querySelectorAll('.section__heading button'));
			handleKeyboardEvent(e, sectionHeadings);
		};

		const togglePlayers = () => store.commit(MutationTypes.TOGGLE_UI_ELEMENT_VISIBILITY, 'players');
		const toggleMaps = () => store.commit(MutationTypes.TOGGLE_UI_ELEMENT_VISIBILITY, 'maps');

		//Move focus when sidebar sections become visible
		const focusMaps = () => focus('.section__heading button');
		const focusPlayers = () => focus('#players-heading');

		watch(playersVisible, newValue => newValue && nextTick(() => focusPlayers()));
		watch(mapsVisible, newValue => newValue && nextTick(() => focusMaps()));

		return {
			sidebar,

			mapCount,
			serverCount,
			following,

			messageWorlds,
			messagePlayers,

			previouslyVisible,
			playersVisible,
			mapsVisible,
			followVisible,

			handleSidebarKeydown,
			togglePlayers,
			toggleMaps
		}
	},
});

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
		align-self: flex-end;

		button {
			width: 5rem;
			height: 5rem;
			box-shadow: var(--box-shadow);

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

	.sidebar__content {
		position: relative;
		display: flex;
		flex-direction: column;
		flex-shrink: 1;
		min-height: 0;
		overflow: auto;
		pointer-events: auto;
		margin-right: -0.5rem;
		padding: 0.2rem 0.5rem 0 0.2rem;
		width: 24rem;
        align-items: flex-end;
		overscroll-behavior: contain;

		&:not(:hover):not(:focus-within) {
			scrollbar-color: var(--background-base) transparent;
		}

		&:not(:hover):not(:focus-within)::-webkit-scrollbar-thumb {
			background-color: var(--background-base);
		}
	}

	.sidebar__section {
		@extend %panel;
		margin-bottom: 1rem;
		box-sizing: border-box;
		width: 100%;
		max-width: 23rem;
		flex: 0 0 auto;

		.section__heading {
			cursor: pointer;
			user-select: none;
			text-align: left;
			align-items: center;
			margin: 0;

			button {
				display: flex;
				font-size: 2rem;
				padding: 1.5rem 1.5rem 1rem;
				margin: -1.5rem -1.5rem 0;
				background-color: transparent;
				color: inherit;
				width: calc(100% + 3rem);
				align-items: center;

				.svg-icon {
					margin-left: auto;
					width: 1.5rem;
					height: 1.5rem;
				}
			}

			&:hover, &:focus-visible, &.focus-visible, &:active {
				background-color: transparent;
				color: inherit;
			}
		}

		.section__content {
			padding: 0 0.5rem;
			margin: 0 -.5rem 1rem;

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

		&.section--collapsed {
			.section__heading button {
				padding-bottom: 1.5rem;
				margin-bottom: -1.5rem;
			}

			.section__content {
				display: none;
			}
		}

		@media (max-width: 320px) {
			box-sizing: border-box;
			width: 100%;
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

	@media print {
		display: none;
	}
}
</style>