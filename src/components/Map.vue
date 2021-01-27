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
	<div class="map" :style="{'background-color': mapBackground }">
		<MapLayer v-for="[name, map] in maps" :key="name" :map="map" :name="name" :leaflet="leaflet"></MapLayer>
		<PlayersLayer v-if="playerMarkersEnabled" :leaflet="leaflet"></PlayersLayer>
		<MarkerSetLayer v-for="[name, markerSet] in markerSets" :key="name" :markerSet="markerSet" :leaflet="leaflet"></MarkerSetLayer>

		<LogoControl v-for="(logo, index) in logoControls" :key="index" :options="logo" :leaflet="leaflet"></LogoControl>
		<CoordinatesControl v-if="coordinatesControlEnabled" :leaflet="leaflet"></CoordinatesControl>
		<LinkControl v-if="linkControlEnabled" :leaflet="leaflet"></LinkControl>
		<ClockControl v-if="clockControlEnabled" :leaflet="leaflet"></ClockControl>
		<ChatControl v-if="chatBoxEnabled" :leaflet="leaflet"></ChatControl>
	</div>
</template>

<script lang="ts">
import {computed, ref, defineComponent} from "@vue/runtime-core";
import {CRS, LatLng} from 'leaflet';
import {useStore} from '@/store';
import MapLayer from "@/components/map/layer/MapLayer.vue";
import PlayersLayer from "@/components/map/layer/PlayersLayer.vue";
import MarkerSetLayer from "@/components/map/layer/MarkerSetLayer.vue";
import CoordinatesControl from "@/components/map/control/CoordinatesControl.vue";
import ClockControl from "@/components/map/control/ClockControl.vue";
import LinkControl from "@/components/map/control/LinkControl.vue";
import ChatControl from "@/components/map/control/ChatControl.vue";
import LogoControl from "@/components/map/control/LogoControl.vue";
import {MutationTypes} from "@/store/mutation-types";
import {Coordinate, DynmapPlayer} from "@/dynmap";
import {ActionTypes} from "@/store/action-types";
import DynmapMap from "@/leaflet/DynmapMap";
import {LoadingControl} from "@/leaflet/control/LoadingControl";

export default defineComponent({
	components: {
		MapLayer,
		PlayersLayer,
		MarkerSetLayer,
		CoordinatesControl,
		ClockControl,
		LinkControl,
		ChatControl,
		LogoControl
	},

	setup() {
		const store = useStore(),
			leaflet = undefined as DynmapMap | undefined,

			maps = computed(() => store.state.maps),
			markerSets = computed(() => store.state.markerSets),
			configuration = computed(() => store.state.configuration),

			playerMarkersEnabled = computed(() => store.getters.playerMarkersEnabled),
			coordinatesControlEnabled = computed(() => store.getters.coordinatesControlEnabled),
			clockControlEnabled = computed(() => store.getters.clockControlEnabled),
			linkControlEnabled = computed(() => store.state.components.linkControl),
			chatBoxEnabled = computed(() => store.state.components.chatBox),
			logoControls = computed(() => store.state.components.logoControls),

			currentWorld = computed(() => store.state.currentWorld),
			currentMap = computed(() => store.state.currentMap),
			currentProjection = computed(() => store.state.currentProjection),
			mapBackground = computed(() => store.getters.mapBackground),

			followTarget = computed(() => store.state.followTarget),
			panTarget = computed(() => store.state.panTarget),

			//Location and zoom to pan to upon next projection change
			scheduledPan = ref<Coordinate|null>(null),
			scheduledZoom = ref<number|null>(null);

		return {
			leaflet,
			maps,
			markerSets,
			configuration,
			playerMarkersEnabled,
			coordinatesControlEnabled,
			clockControlEnabled,
			linkControlEnabled,
			chatBoxEnabled,
			logoControls,
			followTarget,
			panTarget,
			mapBackground,
			currentWorld,
			currentMap,
			currentProjection,
			scheduledPan,
			scheduledZoom
		}
	},

	watch: {
		followTarget: {
			handler(newValue, oldValue) {
				if (newValue) {
					this.updateFollow(newValue, !oldValue || newValue.account !== oldValue.account);
				}
			},
			deep: true
		},
		panTarget(newValue) {
			if(newValue) {
				//Immediately clear if on the correct world, to allow repeated panning
				if(this.currentWorld && newValue.location.world === this.currentWorld.name) {
					useStore().commit(MutationTypes.CLEAR_PAN_TARGET, undefined);
				}

				this.updateFollow(newValue, false);
			}
		},
		currentProjection(newValue, oldValue) {
			if(this.leaflet && newValue && oldValue) {
				const panTarget = this.scheduledPan || oldValue.latLngToLocation(this.leaflet.getCenter(), 64);

				if(this.scheduledZoom) {
					this.leaflet!.setZoom(this.scheduledZoom, {
						animate: false,
					});
				}

				this.leaflet.panTo(newValue.locationToLatLng(panTarget), {
					animate: false,
					noMoveStart: true,
				});

				this.scheduledZoom = null;
				this.scheduledPan = null;
			}
		},
		currentWorld(newValue, oldValue) {
			const store = useStore();

			if(newValue) {
				let location: Coordinate | null = this.scheduledPan;

				store.dispatch(ActionTypes.GET_MARKER_SETS, undefined);

				//Abort if follow target is present, to avoid panning twice
				if(store.state.followTarget && store.state.followTarget.location.world === newValue.name) {
					return;
				//Abort if pan target is present, to avoid panning to the wrong place.
				// Also clear it to allow repeated panning.
				} else if(store.state.panTarget && store.state.panTarget.location.world === newValue.name) {
					store.commit(MutationTypes.CLEAR_PAN_TARGET, undefined);
					return;
				//Otherwise pan to url location, if present and if we have just loaded
				} else if(!oldValue && store.state.parsedUrl.location) {
					location = store.state.parsedUrl.location;
				//Otherwise pan to world center
				} else {
					location = newValue.center;
				}

				if(!oldValue) {
					this.scheduledZoom = typeof store.state.parsedUrl.zoom !== 'undefined' ?
						store.state.parsedUrl.zoom : store.state.configuration.defaultZoom;
				}

				//Set pan location for when the projection changes
				this.scheduledPan = location;
			}
		}
	},

	mounted() {
		this.leaflet = new DynmapMap(this.$el, Object.freeze({
			zoom: this.configuration.defaultZoom,
			center: new LatLng(0, 0),
			fadeAnimation: false,
			zoomAnimation: true,
			zoomControl: true,
			layerControl: true,
			preferCanvas: true,
			attributionControl: false,
			crs: CRS.Simple,
			worldCopyJump: false,
			// markerZoomAnimation: false,
		}));

		this.leaflet.createPane('vectors');

		this.leaflet.addControl(new LoadingControl({
			position: 'topleft',
			delayIndicator: 500,
		}));

		this.leaflet.on('moveend', () => {
			useStore().commit(MutationTypes.SET_CURRENT_LOCATION, this.currentProjection.latLngToLocation(this.leaflet!.getCenter(), 64));
		});

		this.leaflet.on('zoomend', () => {
			useStore().commit(MutationTypes.SET_CURRENT_ZOOM, this.leaflet!.getZoom());
		});
	},

	methods: {
		updateFollow(player: DynmapPlayer, newFollow: boolean) {
			const store = useStore(),
				followMapName = store.state.configuration.followMap,
				currentWorld = store.state.currentWorld;

			let targetWorld = null;

			if(!this.leaflet) {
				console.warn(`Cannot follow ${player.account}. Map not yet initialized.`);
				return;
			}

			if(player.hidden) {
				console.warn(`Cannot follow ${player.account}. Player is hidden from the map.`);
				return;
			}

			if(!player.location.world) {
				console.warn(`Cannot follow ${player.account}. Player isn't in a known world.`);
				return;
			}

			if(!currentWorld || currentWorld.name !== player.location.world) {
				targetWorld = store.state.worlds.get(player.location.world);
			} else {
				targetWorld = currentWorld;
			}

			if (!targetWorld) {
				console.warn(`Cannot follow ${player.account}. Player isn't in a known world.`);
				return;
			}

			let map = followMapName && targetWorld.maps.has(followMapName)
				? targetWorld.maps.get(followMapName)
				: targetWorld.maps.entries().next().value[1]

			if(map !== store.state.currentMap && (targetWorld !== currentWorld || newFollow)) {
				this.scheduledPan = player.location;

				if(newFollow) {
					console.log(`Setting zoom for new follow ${store.state.configuration.followZoom}`);
					this.scheduledZoom = store.state.configuration.followZoom;
				}

				console.log(`Switching map to match player ${targetWorld.name} ${map.name}`);
				store.commit(MutationTypes.SET_CURRENT_MAP, {worldName: targetWorld.name, mapName: map.name});
			} else {
				this.leaflet!.panTo(store.state.currentProjection.locationToLatLng(player.location));

				if(newFollow) {
					console.log(`Setting zoom for new follow ${store.state.configuration.followZoom}`);
					this.leaflet!.setZoom(store.state.configuration.followZoom);
				}
			}
		}
	}
})
</script>

<style scoped>
	.map {
		width: 100%;
		height: 100%;
		background: #000;
		z-index: 0;
	}
</style>