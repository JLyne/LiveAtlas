<template>
	<div class="map" :style="{'background-color': mapBackground }">
		<MapLayer v-for="[name, map] in maps" :key="name" :map="map" :name="name" :leaflet="leaflet"></MapLayer>
		<PlayersLayer v-if="playerMarkersEnabled" :leaflet="leaflet"></PlayersLayer>
		<MarkerSetLayer v-for="[name, markerSet] in markerSets" :key="name" :markerSet="markerSet" :leaflet="leaflet"></MarkerSetLayer>

		<LogoControl v-for="(logo, index) in logoControls" :key="index" :options="logo" :leaflet="leaflet"></LogoControl>
		<CoordinatesControl v-if="coordinatesControlEnabled" :leaflet="leaflet"></CoordinatesControl>
		<LinkControl v-if="linkControlEnabled" :leaflet="leaflet"></LinkControl>
		<ClockControl v-if="clockControlEnabled" :leaflet="leaflet"></ClockControl>
	</div>
</template>

<script lang="ts">
import {defineComponent, computed} from "@vue/runtime-core";
import L from 'leaflet';
import '@/leaflet/map';
import {useStore} from '@/store';
import MapLayer from "@/components/map/layer/MapLayer.vue";
import PlayersLayer from "@/components/map/layer/PlayersLayer.vue";
import MarkerSetLayer from "@/components/map/layer/MarkerSetLayer.vue";
import CoordinatesControl from "@/components/map/control/CoordinatesControl.vue";
import ClockControl from "@/components/map/control/ClockControl.vue";
import LinkControl from "@/components/map/control/LinkControl.vue";
import LogoControl from "@/components/map/control/LogoControl.vue";
import {MutationTypes} from "@/store/mutation-types";
import {DynmapPlayer} from "@/dynmap";
import {ActionTypes} from "@/store/action-types";

export default defineComponent({
	components: {
		MapLayer,
		PlayersLayer,
		MarkerSetLayer,
		CoordinatesControl,
		ClockControl,
		LinkControl,
		LogoControl
	},

	setup() {
		const store = useStore(),
			leaflet = undefined as L.Map | undefined,

			maps = computed(() => store.state.maps),
			markerSets = computed(() => store.state.markerSets),
			configuration = computed(() => store.state.configuration),

			playerMarkersEnabled = computed(() => store.getters.playerMarkersEnabled),
			coordinatesControlEnabled = computed(() => store.getters.coordinatesControlEnabled),
			clockControlEnabled = computed(() => store.getters.clockControlEnabled),
			linkControlEnabled = computed(() => store.state.components.linkControl),
			logoControls = computed(() => store.state.components.logoControls),

			currentWorld = computed(() => store.state.currentWorld),
			currentMap = computed(() => store.state.currentMap),
			currentProjection = computed(() => store.state.currentProjection),
			following = computed(() => store.state.following),

			mapBackground = computed((): string => {
				//TODO: day/night
				const currentMap = useStore().state.currentMap;

				return currentMap && currentMap.background ? currentMap.background : 'transparent';
			});

		return {
			leaflet,
			maps,
			markerSets,
			configuration,
			playerMarkersEnabled,
			coordinatesControlEnabled,
			clockControlEnabled,
			linkControlEnabled,
			logoControls,
			following,
			mapBackground,
			currentWorld,
			currentMap,
			currentProjection
		}
	},

	watch: {
		following: {
			handler(newValue, oldValue) {
				if (newValue) {
					this.updateFollow(newValue, !oldValue || newValue.account !== oldValue.account);
				}
			},
			deep: true
		},
		currentWorld(newValue) {
			if(newValue) {
				useStore().dispatch(ActionTypes.GET_MARKER_SETS, undefined);
			}
		},
		configuration: {
			handler(newValue) {
				console.log(newValue.defaultZoom);
				if(this.leaflet) {
					this.leaflet.setZoom(newValue.defaultZoom, {
						animate: false,
						noMoveStart: true,
					});
				}
			},
			deep: true,
		}
	},

	mounted() {
		this.leaflet = new L.Map(this.$el, Object.freeze({
			zoom: this.configuration.defaultZoom,
			center: new L.LatLng(0, 0),
			fadeAnimation: false,
			zoomAnimation: true,
			zoomControl: true,
			preferCanvas: true,
			attributionControl: false,
			crs: L.CRS.Simple,
			worldCopyJump: false,
			markerZoomAnimation: false,
		}));

		this.leaflet.addControl(new L.Control.Layers({}, {},{
			position: 'topleft',
		}));

		this.leaflet.on('moveend', () => {
			const location = this.currentProjection.latLngToLocation(this.leaflet!.getCenter(), 64),
				locationString = `${Math.round(location.x)},${Math.round(location.y)},${Math.round(location.z)}`,
				url = `#${this.currentWorld!.name};${this.currentMap!.name};${locationString}`;

			window.history.replaceState({
				location,
				world: this.currentWorld!.name,
				map: this.currentMap!.name,
			}, '', url);
		})
	},

	methods: {
		updateFollow(player: DynmapPlayer, newFollow: boolean) {
			const store = useStore(),
				currentWorld = store.state.currentWorld;

			if(!this.leaflet) {
				console.warn('Map isn\'t initialized yet. Ignoring follow');
			}

			if(!player.location.world) {
				console.error('Player isn\'t in a world somehow');
				return;
			}

			if(!currentWorld || currentWorld.name !== player.location.world) {
				const followMapName = store.state.configuration.followMap,
					world = store.state.worlds.get(player.location.world);

				if(!world) {
					console.error('Player isn\'t in a known world somehow');
					return;
				}

				let map = followMapName && world.maps.has(followMapName)
					? world.maps.get(followMapName)
					: world.maps.entries().next().value[1]

				if(map !== store.state.currentMap) {
					console.log(`Switching map to match player ${world.name} ${map.name}`);
					store.commit(MutationTypes.SET_CURRENT_MAP, {worldName: world.name, mapName: map.name});
				}
			}

			this.leaflet!.panTo(store.state.currentProjection.locationToLatLng(player.location));

			if(newFollow) {
				console.log(`Setting zoom for new follow ${store.state.configuration.followZoom}`);
				this.leaflet!.setZoom(store.state.configuration.followZoom);
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