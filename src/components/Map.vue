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
	<div class="map" :style="{backgroundColor: mapBackground }" v-bind="$attrs" :aria-label="mapTitle">
		<template v-if="leaflet">
			<TileLayer v-for="[name, map] in maps" :key="name" :options="map" :leaflet="leaflet"></TileLayer>

			<TileLayerOverlay v-for="[name, overlay] in overlays" :key="name" :options="overlay" :leaflet="leaflet"></TileLayerOverlay>
			<PlayersLayer v-if="playerMarkersEnabled" :leaflet="leaflet"></PlayersLayer>
			<MarkerSetLayer v-for="[name, markerSet] in markerSets" :key="name" :markerSet="markerSet" :leaflet="leaflet"></MarkerSetLayer>

			<LogoControl v-for="logo in logoControls" :key="JSON.stringify(logo)" :options="logo" :leaflet="leaflet"></LogoControl>
			<CoordinatesControl v-if="coordinatesControlEnabled" :leaflet="leaflet"></CoordinatesControl>
			<LinkControl v-if="linkControlEnabled" :leaflet="leaflet"></LinkControl>
			<ClockControl v-if="clockControlEnabled" :leaflet="leaflet"></ClockControl>

			<LoginControl v-if="loginEnabled" :leaflet="leaflet"></LoginControl>
			<ChatControl v-if="chatBoxEnabled" :leaflet="leaflet"></ChatControl>
		</template>
	</div>

	<MapContextMenu v-if="contextMenuEnabled && leaflet" :leaflet="leaflet"></MapContextMenu>
	<div class="coordinate-input">
  		<label>X: <input type="number" v-model.number="inputX" /></label>
  		<label>Y: <input type="number" v-model.number="inputY" /></label>
  		<label>Z: <input type="number" v-model.number="inputZ" /></label>
  	<button @click="goToCoordinates">Go</button>
	</div>

	<div class="waypoint-input">
  		<label>
    		New Waypoint Name:
    		<input type="text" v-model="newWaypointName" />
  		</label>
  		<button @click="addWaypoint">Add Waypoint</button>
	</div>

	<div class="waypoints-list">
  		<h3>Saved Waypoints</h3>
  		<ul>
    		<li v-for="(wp, index) in waypoints" :key="wp.name">
      			<strong>{{ wp.name }}</strong>
      			<button @click="goToWaypoint(wp)">Go</button>
      			<button @click="removeWaypoint(index)">Remove</button>
    		</li>
  		</ul>
	</div>


</template>

<script lang="ts">
import { computed, ref, defineComponent, onMounted } from "vue";
import {CRS, LatLng, LatLngBounds, PanOptions, ZoomPanOptions} from 'leaflet';
import {LiveAtlasLocation, LiveAtlasPlayer, LiveAtlasMapViewTarget} from "@/index";
import {useStore} from '@/store';
import {MutationTypes} from "@/store/mutation-types";
import TileLayer from "@/components/map/layer/TileLayer.vue";
import PlayersLayer from "@/components/map/layer/PlayersLayer.vue";
import MarkerSetLayer from "@/components/map/layer/MarkerSetLayer.vue";
import CoordinatesControl from "@/components/map/control/CoordinatesControl.vue";
import ClockControl from "@/components/map/control/ClockControl.vue";
import LinkControl from "@/components/map/control/LinkControl.vue";
import ChatControl from "@/components/map/control/ChatControl.vue";
import LogoControl from "@/components/map/control/LogoControl.vue";
import LiveAtlasLeafletMap from "@/leaflet/LiveAtlasLeafletMap";
import {LoadingControl} from "@/leaflet/control/LoadingControl";
import MapContextMenu from "@/components/map/MapContextMenu.vue";
import LoginControl from "@/components/map/control/LoginControl.vue";
import TileLayerOverlay from "@/components/map/layer/TileLayerOverlay.vue";

export default defineComponent({
	components: {
		TileLayerOverlay,
		MapContextMenu,
		TileLayer,
		PlayersLayer,
		MarkerSetLayer,
		CoordinatesControl,
		ClockControl,
		LinkControl,
		ChatControl,
		LogoControl,
		LoginControl
	},

	setup() {
		const inputX = ref(0);
		const inputY = ref(64);
		const inputZ = ref(0);

		function goToCoordinates() {
  			if (!currentMap.value || !leaflet) return;
  
 			const latlng = currentMap.value.locationToLatLng({x: inputX.value, y: inputY.value, z: inputZ.value});
  			leaflet.value.setView(latlng, leaflet.getZoom());
		}

		const newWaypointName = ref("");
		interface Waypoint {
			name: string;
			location: LiveAtlasLocation;
		}
		const waypoints = ref<Waypoint[]>([]);

		// Load from localStorage
		onMounted(() => {
  			const saved = localStorage.getItem("waypoints");
  			if (saved) waypoints.value = JSON.parse(saved);
		});

		function saveWaypoints() {
  			localStorage.setItem("waypoints", JSON.stringify(waypoints.value));
		}

		function addWaypoint() {
			if (!newWaypointName.value.trim()) return;
  			const exists = waypoints.value.some(wp => wp.name === newWaypointName.value);
  			if (exists) return alert("Waypoint name already exists");

  			const location = currentMap.value.latLngToLocation(leaflet.getCenter(), 64);
  			waypoints.value.push({ name: newWaypointName.value.trim(), location });
  			newWaypointName.value = "";
  			saveWaypoints();
		}

		function goToWaypoint(wp: {name: string, location: LiveAtlasLocation}) {
  			if (!currentMap.value || !leaflet) return;
  			const latlng = currentMap.value.locationToLatLng(wp.location);
  			leaflet.value.setView(latlng, leaflet.getZoom());
		}

		function removeWaypoint(index: number) {
  			waypoints.value.splice(index, 1);
  			saveWaypoints();
		}

		function setView(target: LiveAtlasMapViewTarget) {
			const latlng = currentMap.value?.locationToLatLng(target.location);
			if (latlng && leaflet.value) {
				leaflet.value.setView(latlng, leaflet.value.getZoom(), target.options);
			}
		}

		watch(viewTarget, (newValue) => {
			if (newValue && currentWorld.value && newValue.location.world === currentWorld.value.name) {
				store.commit(MutationTypes.CLEAR_VIEW_TARGET, undefined);
			}

			if (newValue && leaflet.value) {
				setView(newValue);
			}
		}, { deep: true });

		watch(currentMap, (newValue, oldValue) => {
  			if (newValue) {
    			store.state.currentMapProvider!.populateMap(newValue);

    			if (leaflet.value) {
      				let viewTarget = scheduledView.value;

      				if (!viewTarget && oldValue) {
        			viewTarget = {
          				location: oldValue.latLngToLocation(leaflet.value.getCenter(), 64) as LiveAtlasLocation
        			};
      } else if (!viewTarget) {
        	viewTarget = { location: { x: 0, y: 64, z: 0, world: newValue.name } }; // fallback
      	}

      leaflet.value.setView(
        currentMap.value.locationToLatLng(viewTarget.location),
        leaflet.value.getZoom()
      );
    }
  }
		});


		const store = useStore();
		const leaflet = ref<LiveAtlasLeafletMap | null>(null);

		onMounted(() => {
			leaflet.value = new LiveAtlasLeafletMap(store, mapContainerRef, config);
		});

			const maps = computed(() => store.state.maps);
			const overlays = computed(() => store.state.currentMap?.overlays);
			const markerSets = computed(() => store.state.markerSets);
			const configuration = computed(() => store.state.configuration);

			const playerMarkersEnabled = computed(() => store.getters.playerMarkersEnabled);
			const coordinatesControlEnabled = computed(() => store.getters.coordinatesControlEnabled);
			const clockControlEnabled = computed(() => store.getters.clockControlEnabled);
			const linkControlEnabled = computed(() => store.state.components.linkControl);
			const chatBoxEnabled = computed(() => store.state.components.chatBox);
			const loginEnabled = computed(() => store.state.components.login);
			const contextMenuEnabled = computed(() => !store.state.ui.disableContextMenu);
			const logoControls = computed(() => store.state.components.logoControls);

			const currentWorld = computed(() => store.state.currentWorld);
			const currentMap = computed(() => store.state.currentMap);
			const mapBackground = computed(() => store.getters.mapBackground);

			const followTarget = computed(() => store.state.followTarget);
			const viewTarget = computed(() => store.state.viewTarget);
			const parsedUrl = computed(() => store.state.parsedUrl);

			//Location and zoom to pan to upon next projection change
			const scheduledView = ref<LiveAtlasMapViewTarget|null>(null);

			const mapTitle = computed(() => store.state.messages.mapTitle);

			return {
  				leaflet, maps, overlays, markerSets, configuration,
  				playerMarkersEnabled, coordinatesControlEnabled,
  				clockControlEnabled, linkControlEnabled, chatBoxEnabled,
  				loginEnabled, contextMenuEnabled, logoControls,
  				followTarget, viewTarget, parsedUrl, mapBackground,
  				currentWorld, currentMap, scheduledView, mapTitle,
  				inputX, inputY, inputZ, goToCoordinates,
  				newWaypointName, waypoints, addWaypoint, goToWaypoint, removeWaypoint
			};


	},

	watch: {
		followTarget: {
			handler(newValue, oldValue) {
				if (newValue) {
					this.updateFollow(newValue, !oldValue || newValue.name !== oldValue.name);
				}
			},
			deep: true
		},

		currentWorld(newValue, oldValue) {
			const store = useStore();

			if(newValue) {
				store.state.currentMapProvider!.populateWorld(newValue);
				let viewTarget = this.scheduledView || {} as LiveAtlasMapViewTarget;

				// Abort if follow target is present, to avoid panning twice
				if(store.state.followTarget && store.state.followTarget.location.world === newValue.name) {
					return;
				// Abort if pan target is present, to avoid panning to the wrong place.
				// Also clear it to allow repeated panning.
				} else if(store.state.viewTarget && store.state.viewTarget.location.world === newValue.name) {
					store.commit(MutationTypes.CLEAR_VIEW_TARGET, undefined);
					return;
				// Otherwise pan to url location, if present
				} else if(store.state.parsedUrl?.location) {
					viewTarget.location = store.state.parsedUrl.location;

					//Determine initial zoom
					if(!oldValue) {
						if(typeof store.state.parsedUrl?.zoom !== 'undefined') { //Zoom from URL
							viewTarget.zoom = store.state.parsedUrl?.zoom;
						} else if(typeof store.state.currentMap?.defaultZoom !== 'undefined') { //Map default zoom
							viewTarget.zoom = store.state.currentMap?.defaultZoom;
						} else { //Global default zoom
							viewTarget.zoom = store.state.configuration.defaultZoom;
						}
					}

					store.commit(MutationTypes.CLEAR_PARSED_URL, undefined);
				// Otherwise pan to world center
				} else {
					viewTarget.location = store.state.currentMap?.center || newValue.center;
				}

				if(viewTarget.zoom == null) {
					if(typeof store.state.currentMap?.defaultZoom !== 'undefined') { //Map default zoom
						viewTarget.zoom = store.state.currentMap?.defaultZoom;
					} else { //Global default zoom
						viewTarget.zoom = store.state.configuration.defaultZoom;
					}
				}

				//Set pan location for when the projection changes
				this.scheduledView = viewTarget;
			}
		},
		parsedUrl: {
			handler(newValue) {
				if(!newValue || !this.currentMap || !this.leaflet) {
					return;
				}

				this.setView({
					location: {...newValue.location, world: newValue.world},
					map: newValue.map,
					zoom: newValue.zoom,
					options: {
						animate: false,
						noMoveStart: true,
					}
				});
			},
			deep: true,
		}
	},

	mounted() {
		this.leaflet = new LiveAtlasLeafletMap(this.$el.nextElementSibling, Object.freeze({
			zoom: this.configuration.defaultZoom,
			center: new LatLng(0, 0),
			fadeAnimation: false,
			zoomAnimation: true,
			zoomControl: true,
			preferCanvas: true,
			attributionControl: false,
			crs: CRS.Simple,
			worldCopyJump: false,
			// markerZoomAnimation: false,
		})) as LiveAtlasLeafletMap;

		window.addEventListener('keydown', this.handleKeydown);

		this.leaflet.createPane('vectors');

		this.leaflet.addControl(new LoadingControl({
			position: 'topleft',
			delayIndicator: 500,
		}));

		this.leaflet.on('moveend', () => {
			if(this.currentMap) {
				useStore().commit(MutationTypes.SET_CURRENT_LOCATION, this.currentMap
					.latLngToLocation(this.leaflet!.getCenter(), 64));
			}
		});

		this.leaflet.on('zoomend', () => {
			useStore().commit(MutationTypes.SET_CURRENT_ZOOM, this.leaflet!.getZoom());
		});
	},

	unmounted() {
		window.removeEventListener('keydown', this.handleKeydown);
		this.leaflet.remove();
	},

	methods: {
		handleKeydown(e: KeyboardEvent) {
			if(e.key === 'Escape') {
				e.preventDefault();
				this.leaflet.getContainer().focus();
			}
		},
		setView(target: LiveAtlasMapViewTarget) {
			const store = useStore(),
				currentWorld = store.state.currentWorld,
				currentMap = store.state.currentMap?.name,
				targetWorld = target.location.world ? store.state.worlds.get(target.location.world) : currentWorld;

			if(!this.leaflet) {
				console.warn('Ignoring setView as leaflet not initialised');
				return;
			}

			if(!targetWorld) {
				console.warn(`Ignoring setView with unknown world ${target.location.world}`);
				return;
			}

			if(targetWorld && (targetWorld !== currentWorld) || (target.map && currentMap !== target.map)) {
				const map = store.state.maps.get(`${targetWorld.name}_${target.map}`),
					mapName = map ? map.name : targetWorld.maps.values().next().value.name;

				this.scheduledView = target;

				try {
					store.commit(MutationTypes.SET_CURRENT_MAP, {worldName: targetWorld!.name, mapName});
				} catch(e) {
					//Clear scheduled move if change fails
					console.warn(`Failed to handle map setView`, e);
					this.scheduledView = null;
				}
			} else {
				console.debug('Moving to', JSON.stringify(target));
				if(typeof target.zoom !== 'undefined') {
					this.leaflet!.setZoom(target.zoom, target.options as ZoomPanOptions);
				}

				if('min' in target.location) { // Bounds
					this.leaflet!.fitBounds(new LatLngBounds(
						store.state.currentMap?.locationToLatLng(target.location.min) as LatLng,
						store.state.currentMap?.locationToLatLng(target.location.max) as LatLng,
					), target.options);
				} else { // Location
					const location = store.state.currentMap?.locationToLatLng(target.location) as LatLng;
					this.leaflet!.panTo(location, target.options as PanOptions);
				}
			}
		},
		updateFollow(player: LiveAtlasPlayer, newFollow: boolean) {
			const store = useStore(),
				currentWorld = store.state.currentWorld;

			let map = undefined;

			if(player.hidden) {
				console.warn(`Cannot follow ${player.name}. Player is hidden from the map.`);
				return;
			}

			if(!currentWorld || currentWorld.name !== player.location.world || newFollow) {
				map = store.state.configuration.followMap;
			}
			this.setView({
				location: player.location,
				map,
				zoom: (newFollow) ? store.state.configuration.followZoom : undefined,
			});
		}
	}
})
</script>

<style lang="scss" scoped>
	@import '../scss/_mixins.scss';

	.map {
		width: 100%;
		height: 100%;
		background: transparent;
		z-index: 0;
		cursor: default;
		box-sizing: border-box;
		position: relative;

		&:focus:before {
			content: '';
			position: absolute;
			top: 0;
			right: 0;
			bottom: 0;
			left: 0;
			border: 0.2rem solid var(--outline-focus);
			display: block;
			z-index: 2000;
			pointer-events: none;
		}

		@include focus-reset {
			&:before {
				content: none;
			}
		}
	}

	.coordinate-input, .waypoint-input {
	margin: 1rem 0;
	display: flex;
	gap: 0.5rem;
	align-items: center;
  }
  
  .waypoints-list ul {
	list-style: none;
	padding: 0;
  }
  
  .waypoints-list li {
	margin-bottom: 0.5rem;
  }
</style>
