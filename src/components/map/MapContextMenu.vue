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
	<nav role="none" id="map-context-menu" ref="menuElement" :style="style" @keydown="handleKeydown">
		<ul class="menu" role="menu">
			<li role="none">
				<!--suppress HtmlUnknownAttribute -->
				<button type="button" role="menuitem" v-clipboard:copy="locationCopy"
                v-clipboard:success="copySuccess"
                v-clipboard:error="copyError">{{ locationLabel }}
				</button>
			</li>
			<li role="none">
				<!--suppress HtmlUnknownAttribute -->
				<button type="button" role="menuitem"
                v-clipboard:copy="url"
                v-clipboard:success="copySuccess"
                v-clipboard:error="copyError">{{ messageCopyLink }}
				</button>
			</li>
			<li role="none">
				<button type="button" role="menuitem" @click.prevent="pan">{{ messageCenterHere }}</button>
			</li>
			<WorldListItem v-if="currentMap && mapCount > 1" :world="currentMap.appendedWorld || currentMap.world" name="context"></WorldListItem>
		</ul>
	</nav>
</template>

<script lang="ts">
import {computed, defineComponent, onMounted, onUnmounted, watch, CSSProperties, ref, nextTick} from "vue";
import {LeafletMouseEvent} from "leaflet";
import {useStore} from "@/store";
import LiveAtlasLeafletMap from "@/leaflet/LiveAtlasLeafletMap";
import WorldListItem from "@/components/list/WorldListItem.vue";
import {clipboardError, clipboardSuccess, getUrlForLocation} from "@/util";
import {handleKeyboardEvent} from "@/util/events";

export default defineComponent({
	name: "MapContextMenu",
	components: {WorldListItem},
	props: {
		leaflet: {
			type: Object as () => LiveAtlasLeafletMap,
			required: true,
		}
	},

	setup(props) {
		const store = useStore(),
			event = ref<LeafletMouseEvent | null>(null),
			lastMouseMoveEvent = ref<LeafletMouseEvent | null>(null),

			messageCopyLink = computed(() => store.state.messages.contextMenuCopyLink),
			messageCenterHere = computed(() => store.state.messages.contextMenuCenterHere),

			menuElement = ref<HTMLInputElement | null>(null),
			menuVisible = computed(() => !!event.value),

			currentMap = computed(() => store.state.currentMap),
			currentZoom = computed(() => store.state.currentZoom),
			mapCount = computed(() => {
				if(!currentMap.value) {
					return 0;
				}

				//Use appendedWorld if present for map list
				return currentMap.value?.appendedWorld ?
					currentMap.value?.appendedWorld.maps.size : currentMap.value.world.maps.size;
			}),

			location = computed(() => {
				if (!event.value || !currentMap.value) {
					return {x: 0, y: 0, z: 0}
				}

				return currentMap.value.latLngToLocation(event.value.latlng, 64);
			}),

			//Label for location button
			locationLabel = computed(() => {
				return `X: ${Math.round(location.value.x)}, Z: ${Math.round(location.value.z)}`;
			}),

			//Location text to copy
			locationCopy = computed(() => {
				return `${Math.round(location.value.x)}, ${Math.round(location.value.z)}`;
			}),

			//Url to copy
			url = computed(() => {
				if (!currentMap.value) {
					return '';
				}

				const url = new URL(window.location.href);
				url.hash = getUrlForLocation(currentMap.value, location.value, currentZoom.value);

				return url;
			}),

			style = computed(() => {
				if (!event.value) {
					return {
						'visibility': 'hidden',
						'left': '-1000px',
					} as CSSProperties;
				}

				//Don't position offscreen
				const x = Math.min(
					window.innerWidth - menuElement.value!.offsetWidth - 10,
					event.value.originalEvent.clientX
					),
					y = Math.min(
						window.innerHeight - menuElement.value!.offsetHeight - 10,
						event.value.originalEvent.clientY
					);

				return {
					'transform': `translate(${x}px, ${y}px)`
				}
			});

		const handleEsc = (e: KeyboardEvent) => {
			if (e.key === "Escape" && menuVisible.value) {
				closeContextMenu();
			}
		};

		const handleKeydown = (e: KeyboardEvent) => {
			handleKeyboardEvent(e, Array.from(menuElement.value!.querySelectorAll('button, input')));
		}

		const focusFirstItem = () => {
			if(menuElement.value) {
				const firstItem = menuElement.value.querySelector('button');

				if(firstItem) {
					firstItem.focus();
				}
			}
		};

		const closeContextMenu = () => event.value = null;

		const pan = () => {
			if (event.value) {
				props.leaflet.panTo(event.value.latlng);
				props.leaflet.getContainer().focus();
			}
		}

		watch(event, value => {
			if(value) {
				props.leaflet.closePopup();
				nextTick(() => menuElement.value && focusFirstItem());
			}
		});

		onMounted(() => {
			window.addEventListener('click', closeContextMenu);
			window.addEventListener('keyup', handleEsc);
		});

		onUnmounted(() => {
			window.removeEventListener('click', closeContextMenu);
			window.removeEventListener('keyup', handleEsc);
		});

		props.leaflet.on('movestart', closeContextMenu);
		props.leaflet.on('zoomstart', closeContextMenu);

		props.leaflet.on('contextmenu', (e: LeafletMouseEvent) => {
			//Ignore right-clicks on controls
			if(e.originalEvent.target && (e.originalEvent.target as HTMLElement).closest('.leaflet-control')) {
				return;
			}

			e.originalEvent.stopImmediatePropagation();
			e.originalEvent.preventDefault();
			event.value = e;
		});

		//Sometimes contextmenu events don't fire from leaflet for some reason
		//As a workaround listen on the window and then use the last mousemove event for positioning
		props.leaflet.on('mousemove', (e: LeafletMouseEvent) => {
			lastMouseMoveEvent.value = e;
		});

		window.addEventListener('contextmenu', e => {
			if(e.target && e.target instanceof HTMLElement && e.target.classList.contains('leaflet-zoom-animated')) {
				e.preventDefault();
				e.stopImmediatePropagation();

				if(lastMouseMoveEvent.value) {
					event.value = lastMouseMoveEvent.value;
				}
			}
		});

		return {
			messageCopyLink,
			messageCenterHere,

			copySuccess: clipboardSuccess(store),
			copyError: clipboardError(store),

			menuVisible,
			menuElement,
			url,

			locationLabel,
			locationCopy,
			currentMap,
			mapCount,
			style,

			pan,
			handleKeydown,
		}
	},
})
</script>

<style lang="scss" scoped>
	#map-context-menu {
		position: fixed;
		z-index: 110;
		min-width: 15rem;
		max-width: 22.5rem;
		top: 0;
		left: 0;

		ul {
			background-color: var(--background-base);
			box-shadow: var(--box-shadow);
			color: var(--text-base);
			border-radius: var(--border-radius);
			padding: 0.5rem;
			position: relative;
			z-index: 1;
		}

		::v-deep(.world) {
			padding: 0.2rem 0 0.2rem 0.8rem;
			margin-bottom: 0;

			li {
				width: 2.8rem;
				height: 2.8rem;
			}
		}

		@media screen and (max-width: 767px) {
			bottom: 0.5rem;
			top: auto;
			left: 0;
			right: 0;
			margin: auto;
			width: 90vw;
			max-width: 40rem;
			overflow: auto;
			transform: none !important;

			&:before {
				content: '';
				position: fixed;
				top: auto;
				right: 0;
				bottom: 0;
				left: 0;
				display: block;
				height: 40rem;
				background-image: linear-gradient(0deg, var(--background-dark), transparent);
				z-index: -1;
			}
		}
	}
</style>
