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
	<div id="ui">
		<div id="ui__top-center" class="ui__section">
			<ClockControl v-if="clockControlEnabled"></ClockControl>
		</div>

		<div id="ui__top-left" class="ui__section">
			<div class="ui__toolbar toolbar--vertical">
				<LoadingControl :leaflet="leaflet" :delay="500"></LoadingControl>
			</div>
		</div>

		<div id="ui__bottom-left" class="ui__section section--bottom">
			<div class="ui__toolbar toolbar--vertical">
				<LoginControl v-if="loginEnabled"></LoginControl>
				<ChatControl v-if="chatBoxEnabled"></ChatControl>
			</div>
			<div class="ui__toolbar">
				<LinkControl v-if="linkControlEnabled"></LinkControl>
				<CoordinatesControl v-if="coordinatesControlEnabled" :leaflet="leaflet"></CoordinatesControl>
			</div>
		</div>

		<div id="ui__top-right" class="ui__section section--right"></div>
		<div id="ui__bottom-right" class="ui__section section--right section--bottom"></div>
	</div>

	<!--		<LogoControl v-for="logo in logoControls" :key="JSON.stringify(logo)" :options="logo" :leaflet="leaflet"></LogoControl>-->
	<MapContextMenu v-if="contextMenuEnabled && leaflet" :leaflet="leaflet"></MapContextMenu>
</template>

<script lang="ts">
import {computed, defineComponent} from "vue";
import {useStore} from '@/store';
import CoordinatesControl from "@/components/map/control/CoordinatesControl.vue";
import ClockControl from "@/components/map/control/ClockControl.vue";
import LinkControl from "@/components/map/control/LinkControl.vue";
import ChatControl from "@/components/map/control/ChatControl.vue";
import LogoControl from "@/components/map/control/LogoControl.vue";
import MapContextMenu from "@/components/map/MapContextMenu.vue";
import LoginControl from "@/components/map/control/LoginControl.vue";
import LiveAtlasLeafletMap from "@/leaflet/LiveAtlasLeafletMap";
import LoadingControl from "@/components/map/control/LoadingControl.vue";

export default defineComponent({
	props: {
		leaflet: {
			type: Object as () => LiveAtlasLeafletMap,
			required: true,
		}
	},

	components: {
		LoadingControl,
		LogoControl,
		CoordinatesControl,
		LinkControl,
		ClockControl,
		LoginControl,
		ChatControl,
		MapContextMenu
	},

	setup() {
		const store = useStore(),
			contextMenuEnabled = computed(() => !store.state.ui.disableContextMenu),
			coordinatesControlEnabled = computed(() => store.getters.coordinatesControlEnabled),
			clockControlEnabled = computed(() => store.getters.clockControlEnabled),
			linkControlEnabled = computed(() => store.state.components.linkControl),
			chatBoxEnabled = computed(() => store.state.components.chatBox),
			loginEnabled = computed(() => store.state.components.login),

			logoControls = computed(() => store.state.components.logoControls);

		return {
			contextMenuEnabled,
			coordinatesControlEnabled,
			clockControlEnabled,
			linkControlEnabled,
			chatBoxEnabled,
			loginEnabled,
			logoControls,
		}
	}
});
</script>

<style lang="scss">
	@import '../scss/placeholders';

	#ui {
		position: fixed;
		top: 0;
		left: 0;
		box-sizing: border-box;
		height: 100vh; /* Use explicit height to make safari happy */
		width: 100vw;
		pointer-events: none;
		display: grid;
		grid-template-columns: 1fr min-content 1fr;
		grid-template-rows: 1fr 1fr;
		z-index: 1003;
		padding: var(--ui-element-spacing);
	}

	.ui__section {
		display: grid;
		grid-gap: var(--ui-element-spacing);
		align-items: start;
		justify-items: start;

		&.section--right {
			justify-items: end;

			@media (max-width: 480px) {
				.ui__toolbar {
					flex-direction: row;
					grid-auto-flow: row;
				}
			}
		}

		&.section--bottom {
			align-items: end;
		}
	}

	.ui__toolbar {
		display: grid;
		grid-gap: var(--ui-element-spacing);
		grid-auto-flow: column;
		align-items: inherit;
		justify-items: inherit;

		&.toolbar--vertical {
			flex-direction: column;
			grid-auto-flow: row;
		}
	}

	.ui__element {
		box-sizing: border-box;

		@media print {
			display: none !important;
		}
	}

	.ui__button,
	.ui__panel {
		box-shadow: var(--box-shadow);
	}

	.ui__button {
		@extend %button;
		pointer-events: auto;
		width: var(--ui-button-size);
		height: var(--ui-button-size);
		line-height: 3.5rem;
	}

	.ui__panel {
		@extend %panel;
	}

	.ui__group {
		display: flex;
		flex-direction: inherit;
		box-shadow: var(--box-shadow);
		border-radius: var(--border-radius);

		.ui__button {
			box-shadow: none;
			border-radius: calc(var(--border-radius) - 0.2rem);

			&:not(:first-child) {
				border-top-left-radius: 0;
				border-top-right-radius: 0;
			}

			&:not(:last-child) {
				border-bottom: 0.1rem solid var(--border-color);
				border-bottom-left-radius: 0;
				border-bottom-right-radius: 0;
			}
		}
	}

	#ui__top-center {
		grid-row: 1;
		grid-column: 2;
	}

	#ui__top-left {
		grid-row: 1;
		grid-column: 1;
	}

	#ui__bottom-left {
		grid-row: -1;
		grid-column: 1;
	}

	#ui__bottom-right {
		grid-row: -1;
		grid-column: -1;
	}
</style>
