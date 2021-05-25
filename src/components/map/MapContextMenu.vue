<template>
	<nav id="map-context-menu" v-show="menuVisible" ref="menuElement" :style="style">
		<div tabindex="0" ref="focusMover" class="focus-mover" aria-label="Context menu"></div>
		<ul class="menu" role="menu">
			<li role="none">
				<button type="button" role="menuitem" v-clipboard:copy="locationCopy"
				        v-clipboard:success="copySuccess"
				        v-clipboard:error="copyError">{{ locationLabel }}
				</button>
			</li>
			<li role="none">
				<button type="button" role="menuitem"
				        v-clipboard:copy="url"
				        v-clipboard:success="copySuccess"
				        v-clipboard:error="copyError">{{ messageCopyLink }}
				</button>
			</li>
			<li role="none">
				<button type="button" role="menuitem" @click.prevent="pan">{{ messageCenterHere }}</button>
			</li>
			<WorldListItem v-if="currentWorld" :world="currentWorld"></WorldListItem>
		</ul>
	</nav>
</template>

<script lang="ts">
import DynmapMap from "@/leaflet/DynmapMap";
import {computed, defineComponent, onMounted, onUnmounted, watch} from "@vue/runtime-core";
import {LeafletMouseEvent} from "leaflet";
import {useStore} from "@/store";
import WorldListItem from "@/components/sidebar/WorldListItem.vue";
import {ref} from "vue";
import {getUrlForLocation} from "@/util";
import {notify} from "@kyvg/vue3-notification";
import {nextTick} from 'vue';

export default defineComponent({
	name: "MapContextMenu",
	components: {WorldListItem},
	props: {
		leaflet: {
			type: Object as () => DynmapMap,
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
			focusMover = ref<HTMLInputElement | null>(null),
			menuVisible = computed(() => !!event.value),

			currentProjection = computed(() => store.state.currentProjection),
			currentWorld = computed(() => store.state.currentWorld),
			currentMap = computed(() => store.state.currentMap),
			currentZoom = computed(() => store.state.currentZoom),

			location = computed(() => {
				if (!event.value) {
					return {x: 0, y: 0, z: 0}
				}

				return currentProjection.value.latLngToLocation(event.value.latlng, 64);
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
				if (!currentWorld.value || !currentMap.value) {
					return '';
				}

				const url = new URL(window.location.href);
				url.hash = getUrlForLocation(currentWorld.value, currentMap.value, location.value, currentZoom.value);

				return url;
			}),

			style = computed(() => {
				if (!menuElement.value || !event.value) {
					return {};
				}

				//Don't position offscreen
				const x = Math.min(
					window.innerWidth - menuElement.value.offsetWidth - 10,
					event.value.originalEvent.clientX
					),
					y = Math.min(
						window.innerHeight - menuElement.value.offsetHeight - 10,
						event.value.originalEvent.clientY
					);

				return {
					'transform': `translate(${x}px, ${y}px)`
				}
			});

		const handleEsc = (e: KeyboardEvent) => {
				if (e.key === "Escape" && menuVisible.value) {
					closeContextMenu();
					props.leaflet.getContainer().focus();
				}
			},
			closeContextMenu = () => {
				event.value = null;
			},
			pan = () => {
				if (event.value) {
					props.leaflet.panTo(event.value.latlng);
					props.leaflet.getContainer().focus();
				}
			},
			copySuccess = () => notify('Copied to clipboard'),
			copyError = (e: Error) => {
				notify({ type: 'error', text:'Unable to copy to clipboard'});
				console.error('Error copying to clipboard', e);
			};

		watch(menuVisible, value => {
			if(value) {
				nextTick(() => focusMover.value && focusMover.value.focus());
			}
		})

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

		watch(event, value => {
			if(value) {
				props.leaflet.closePopup();
				props.leaflet.closeTooltip();
			}
		});

		return {
			messageCopyLink,
			messageCenterHere,

			copySuccess,
			copyError,

			menuVisible,
			menuElement,
			focusMover,
			url,

			locationLabel,
			locationCopy,
			currentWorld,
			style,

			pan,
		}
	},
})
</script>

<style lang="scss" scoped>
	#map-context-menu {
		background-color: var(--background-base);
		box-shadow: var(--box-shadow);
		color: var(--text-base);
		border-radius: var(--border-radius);
		position: fixed;
		z-index: 150;
		padding: 0.5rem;
		min-width: 15rem;
		max-width: 22.5rem;
		top: 0;
		left: 0;

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
		}
	}
</style>