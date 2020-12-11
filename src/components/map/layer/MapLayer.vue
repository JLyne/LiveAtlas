<script lang="ts">
import {defineComponent, onMounted, onUnmounted, computed, watch} from "@vue/runtime-core";
import {DynmapWorldMap} from "@/dynmap";
import {Map} from 'leaflet';
import {useStore} from "@/store";
import {HDMapType} from "@/leaflet/mapType/HDMapType";
import {MutationTypes} from "@/store/mutation-types";
import {ActionTypes} from "@/store/action-types";

export default defineComponent({
	props: {
		name: {
			type: String,
			required: true
		},
		map: {
			type: Object as () => DynmapWorldMap,
			required: true
		},
		leaflet: {
			type: Object as () => Map,
			required: true,
		}
	},

	setup(props) {
		let updateFrame = 0,
			stopUpdateWatch: Function;

		const store = useStore(),
			layer = new HDMapType({
				errorTileUrl: 'images/blank.png',
				mapSettings: Object.freeze(JSON.parse(JSON.stringify(props.map))),
			}),
			pendingUpdates = computed(() => !!store.state.pendingTileUpdates.length),
			active = computed(() => props.map === store.state.currentMap),

			enableLayer = () => {
				useStore().commit(MutationTypes.SET_CURRENT_PROJECTION, layer.getProjection());
				props.leaflet.addLayer(layer);
				props.leaflet.panTo(layer.getProjection().locationToLatLng(props.map.world.center), {
					noMoveStart: true,
					animate: false,
				});

				stopUpdateWatch = watch(pendingUpdates, (newValue, oldValue) => {
					if(newValue && !oldValue && !updateFrame) {
						handlePendingUpdates();
					}
				});
			},

			disableLayer = () => {
				layer.remove();

				if(stopUpdateWatch) {
					stopUpdateWatch();
				}
			},

			handlePendingUpdates = () => {
				useStore().dispatch(ActionTypes.POP_TILE_UPDATES, 10).then(updates => {
					for(const update of updates) {
						console.log('Updating tile ' + update.name);
						layer.updateNamedTile(update.name, update.timestamp);
					}

					if(pendingUpdates.value) {
						console.log('More updates left, scheduling frame');
						// eslint-disable-next-line no-unused-vars
						updateFrame = requestAnimationFrame(() => handlePendingUpdates());
					} else {
						updateFrame = 0;
					}
				});
			};

		watch(active, (newValue) => newValue ? enableLayer() : disableLayer());

		onMounted(() => {
			if(active.value) {
				enableLayer();
			}
		});

		onUnmounted(() => {
			disableLayer();

			if(updateFrame) {
				cancelAnimationFrame(updateFrame);
			}
		});
	},

	render() {
		return null;
	},
});
</script>
