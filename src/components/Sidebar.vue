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
					@click="toggleElement('maps')" :title="messageWorlds" :aria-label="messageWorlds">
				<SvgIcon name="maps"></SvgIcon>
			</button>
			<button :class="{'button--players': true, 'active': currentlyVisible.has('players')}"
					@click="toggleElement('players')" :title="messagePlayers" :aria-label="messagePlayers">
				<SvgIcon name="players"></SvgIcon>
			</button>
		</header>
		<div class="sidebar__content">
			<ServerList v-if="serverCount > 1" v-show="currentlyVisible.has('maps')"></ServerList>
			<WorldList v-if="mapCount > 1" v-show="currentlyVisible.has('maps')"></WorldList>
			<PlayerList v-if="previouslyVisible.has('players')" v-show="currentlyVisible.has('players')"></PlayerList>
			<FollowTarget v-if="following" v-show="followActive" :target="following"></FollowTarget>
		</div>
	</aside>
</template>

<script lang="ts">
import {defineComponent, computed} from "@vue/runtime-core";
import PlayerList from './sidebar/PlayerList.vue';
import WorldList from './sidebar/WorldList.vue';
import ServerList from "@/components/sidebar/ServerList.vue";
import FollowTarget from './sidebar/FollowTarget.vue';
import {useStore} from "@/store";
import SvgIcon from "@/components/SvgIcon.vue";
import {MutationTypes} from "@/store/mutation-types";
import "@/assets/icons/players.svg";
import "@/assets/icons/maps.svg";
import {LiveAtlasUIElement} from "@/index";

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
			currentlyVisible = computed(() => store.state.ui.visibleElements),
			previouslyVisible = computed(() => store.state.ui.previouslyVisibleElements),
			smallScreen = computed(() => store.state.ui.smallScreen),
			mapCount = computed(() => store.state.maps.size),
			serverCount = computed(() => store.state.servers.size),
			following = computed(() => store.state.followTarget),

			messageWorlds = computed(() => store.state.messages.worldsHeading),
			messagePlayers = computed(() => store.state.messages.playersHeading),

			toggleElement = (element: LiveAtlasUIElement) => {
				store.commit(MutationTypes.TOGGLE_UI_ELEMENT_VISIBILITY, element);
			},

			followActive = computed(() => {
				//Show following alongside playerlist on small screens
				return (!smallScreen.value && following)
					|| (smallScreen.value && currentlyVisible.value.has('players'));
			});

		return {
			mapCount,
			serverCount,
			currentlyVisible,
			previouslyVisible,
			toggleElement,
			followActive,
			following,
			messageWorlds,
			messagePlayers,
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
			font-size: 2rem;
			cursor: pointer;
			user-select: none;
			padding: 1.5rem 1.5rem 1rem;
			margin: -1.5rem -1.5rem 0;
			background-color: transparent;
			color: inherit;
			text-align: left;
			display: flex;
			align-items: center;

			&:hover, &:focus-visible, &.focus-visible, &:active {
				background-color: transparent;
				color: inherit;
			}

			.svg-icon {
				margin-left: auto;
				width: 1.5rem;
                height: 1.5rem;
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
			.section__heading {
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