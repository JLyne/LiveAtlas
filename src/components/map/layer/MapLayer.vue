<script lang="ts">
import {defineComponent, onMounted, onUnmounted, computed, watch} from "@vue/runtime-core";
import {DynmapMap} from "@/dynmap";
import {Map} from 'leaflet';
import {useStore} from "@/store";
import {HDMapType} from "@/leaflet/mapType/HDMapType";
import {MutationTypes} from "@/store/mutation-types";

export default defineComponent({
	props: {
		name: {
			type: String,
			required: true
		},
		map: {
			type: Object as () => DynmapMap,
			required: true
		},
		leaflet: {
			type: Object as () => Map,
			required: true,
		}
	},

	setup(props) {
		const store = useStore(),
			layer = new HDMapType({
				errorTileUrl: 'images/blank.png',
				mapSettings: Object.freeze(JSON.parse(JSON.stringify(props.map))),
			}),
			active = computed(() => props.map === store.state.currentMap),

			enableLayer = () => {
				useStore().commit(MutationTypes.SET_CURRENT_PROJECTION, layer.getProjection());
				props.leaflet.addLayer(layer);
				props.leaflet.panTo(layer.getProjection().locationToLatLng(props.map.world.center), {
					noMoveStart: true,
					animate: false,
				});
			},

			disableLayer = () => layer.remove();

		watch(active, (newValue) => newValue ? enableLayer() : disableLayer());

		onMounted(() => {
			if(active.value) {
				enableLayer();
			}
		});

		onUnmounted(() => disableLayer());
	},

	render() {
		return null;
	},
});
</script>
