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
	<section class="sidebar" role="none" ref="sidebar">
		<button ref="maps-button" v-if="mapCount > 1 || serverCount > 1" type="button"
            class="ui__element ui__button button--maps" data-section="maps"
            :title="mapCount > 1 ? messageWorlds : messageServers"
            :aria-label="mapCount > 1 ? messageWorlds : messageServers"
            :aria-expanded="mapsVisible"
            @click="handleSectionClick" @keydown="handleSectionKeydown">
			<SvgIcon ref="maps-icon" :name="mapCount > 1 ? 'maps' : 'servers'"></SvgIcon>
		</button>
		<button ref="markers-button" v-if="markerUIEnabled" type="button"
            class="ui__element ui__button button--markers" data-section="markers"
            :title="messageMarkers"
            :aria-label="messageMarkers"
            :aria-expanded="markersVisible"
            @click="handleSectionClick" @keydown="handleSectionKeydown">
			<SvgIcon name="marker_point"></SvgIcon>
		</button>
		<button ref="players-button" v-if="playerMakersEnabled" type="button"
            class="ui__element ui__button button--players" data-section="players"
            :title="messagePlayers" :aria-label="messagePlayers" :aria-expanded="playersVisible"
            @click="handleSectionClick" @keydown="handleSectionKeydown">
			<SvgIcon name="players"></SvgIcon>
		</button>

		<div class="sidebar__content" ref="sidebar" @keydown="handleSidebarKeydown">
			<ServersSection v-if="serverCount > 1" :hidden="!mapsVisible"></ServersSection>
			<WorldsSection v-if="mapCount > 1" :hidden="!mapsVisible"></WorldsSection>
			<MarkersSection v-if="previouslyVisible.has('markers')" :hidden="!markersVisible"></MarkersSection>
			<PlayersSection v-if="playerMakersEnabled && previouslyVisible.has('players')" :hidden="!playersVisible"></PlayersSection>
			<FollowTargetSection v-if="following" :hidden="!followVisible" :target="following"></FollowTargetSection>
		</div>
	</section>
</template>

<script lang="ts">
import {computed, defineComponent, nextTick, ref, watch} from "vue";
import {LiveAtlasSidebarSection} from "@/index";
import {useStore} from "@/store";
import {MutationTypes} from "@/store/mutation-types";
import FollowTargetSection from './sidebar/FollowTargetSection.vue';
import PlayersSection from "@/components/sidebar/PlayersSection.vue";
import ServersSection from "@/components/sidebar/ServersSection.vue";
import WorldsSection from "@/components/sidebar/WorldsSection.vue";
import MarkersSection from "@/components/sidebar/MarkersSection.vue";
import SvgIcon from "@/components/SvgIcon.vue";
import {handleKeyboardEvent} from "@/util/events";
import {focus} from "@/util";
import "@/assets/icons/players.svg";
import "@/assets/icons/maps.svg";
import "@/assets/icons/servers.svg";
import "@/assets/icons/marker_point.svg";

export default defineComponent({
	components: {
		MarkersSection,
		WorldsSection,
		ServersSection,
		PlayersSection,
		FollowTargetSection,
		SvgIcon,
	},

	setup() {
		const store = useStore(),
			sidebar = ref<HTMLElement | null>(null),

			firstLoad = computed(() => store.state.firstLoad),
			currentlyVisible = computed(() => store.state.ui.visibleElements),
			previouslyVisible = computed(() => store.state.ui.previouslyVisibleElements),
			smallScreen = computed(() => store.state.ui.smallScreen),
			mapCount = computed(() => store.state.maps.size),
			serverCount = computed(() => store.state.servers.size),
			following = computed(() => store.state.followTarget),

			messageWorlds = computed(() => store.state.messages.worldsHeading),
			messageServers = computed(() => store.state.messages.serversHeading),
			messageMarkers = computed(() => store.state.messages.markersHeading),
			messagePlayers = computed(() => store.getters.playersHeading),

			markerUIEnabled = computed(() => store.getters.markerUIEnabled),
			playerMakersEnabled = computed(() => store.getters.playerMarkersEnabled),

			playersVisible = computed(() => currentlyVisible.value.has('players')),
			mapsVisible = computed(() => currentlyVisible.value.has('maps')),
			markersVisible = computed(() => currentlyVisible.value.has('markers')),
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

			const sectionHeadings: HTMLElement[] = Array.from(sidebar.value!
				.querySelectorAll('.sidebar__section:not([hidden]) .section__heading button'));
			handleKeyboardEvent(e, sectionHeadings);
		};

		//Show sections on ArrowDown from button
		const handleSectionKeydown = (e: KeyboardEvent) => {
			const section = (e.target as HTMLElement).dataset.section as LiveAtlasSidebarSection;

			if(e.key === 'ArrowDown' && section) {
				if(currentlyVisible.value.has(section)) {
					focusSection(section);
				} else {
					store.commit(MutationTypes.SET_UI_ELEMENT_VISIBILITY, {
						element: section,
						state: true
					});
				}
			}
		};

		const handleSectionClick = (e: MouseEvent) => {
			const section = (e.target as HTMLElement).dataset.section as LiveAtlasSidebarSection;

			if(section) {
				store.commit(MutationTypes.TOGGLE_UI_ELEMENT_VISIBILITY, section);
			}
		}

		//Move focus when sidebar sections become visible
		const focusSection = (section: LiveAtlasSidebarSection) => focus(`[data-section=${section}] .section__heading button`);

		//Focus sidebar sections when they become visible, except on initial load
		watch(playersVisible, newValue => newValue && !firstLoad.value && nextTick(() => focusSection('players')));
		watch(mapsVisible, newValue => newValue && !firstLoad.value && nextTick(() => focusSection('maps')));
		watch(markersVisible, newValue => newValue && !firstLoad.value && nextTick(() => focusSection('markers')));

		return {
			sidebar,

			mapCount,
			serverCount,
			following,

			messageWorlds,
			messageServers,
			messageMarkers,
			messagePlayers,

			previouslyVisible,
			playersVisible,
			mapsVisible,
			markersVisible,
			followVisible,
			playerMakersEnabled,
			markerUIEnabled,

			handleSidebarKeydown,
			handleSectionKeydown,
			handleSectionClick,
		}
	},
});

</script>

<style lang="scss">
.sidebar {
	display: grid;
	grid-gap: var(--ui-element-spacing);
	grid-auto-flow: inherit;
	font-size: 1.5rem;
	will-change: transform;
	pointer-events: none;

	ul, ol, li {
		padding: 0;
		list-style: none;
		margin: 0;
	}

	.sidebar__content {
		position: fixed;
		top: 100%;
		right: 0;
		max-height: calc(100vh - var(--ui-button-size) - (var(--ui-element-spacing) * 3)); /* Viewport height - top buttons and bottom padding */
		display: flex;
		flex-direction: column;
		min-height: 0;
		overflow: auto;
		pointer-events: auto;
		margin-right: -0.5rem;
		margin-top: var(--ui-element-spacing);
		padding: 0.3rem 0.5rem 0 0.3rem;
		width: 26rem;
        align-items: flex-end;
		overscroll-behavior: contain;
		will-change: transform;

		&:not(:hover):not(:focus-within) {
			scrollbar-color: var(--background-base) transparent;
		}

		&:not(:hover):not(:focus-within)::-webkit-scrollbar-thumb {
			background-color: var(--background-base);
		}
	}
}
</style>
