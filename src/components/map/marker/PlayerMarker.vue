<script lang="ts">
import {defineComponent, computed, ref} from "@vue/runtime-core";
import {LayerGroup} from 'leaflet';
import {DynmapPlayer} from "@/dynmap";
import {useStore} from "@/store";
import {PlayerMarker} from "@/leaflet/marker/PlayerMarker";

export default defineComponent({
	props: {
		player: {
			type: Object as () => DynmapPlayer,
			required: true
		},
		layerGroup: {
			type: Object as () => LayerGroup,
			required: true
		}
	},

	setup() {
		const store = useStore(),
			componentSettings = computed(() => store.state.components.playerMarkers),
			currentProjection = computed(() => store.state.currentProjection),
			currentWorld = computed(() => store.state.currentWorld),
			visible = ref(false),

			marker = undefined as PlayerMarker | undefined;

		return {
			marker,
			visible,
			componentSettings,
			currentProjection,
			currentWorld,
		}
	},

	watch: {
		player: {
			deep: true,
			handler(newValue) {
				if(this.visible) {
					this.marker!.setLatLng(this.currentProjection.locationToLatLng(newValue.location));

					// if(this.following) {
					//
					// }
				}

				this.marker!.getIcon().update();
			},
		},
		currentWorld(newValue) {
			if(newValue.name === this.player.location.world) {
				this.enableLayer();
			} else if(this.visible) {
				this.disableLayer();
			}
		},
		currentProjection() {
			this.marker!.setLatLng(this.currentProjection.locationToLatLng(this.player.location));
		}
	},

	mounted() {
		this.marker = new PlayerMarker(this.player, {
			smallFace: this.componentSettings!.smallFaces,
			showSkinFace: this.componentSettings!.showSkinFaces,
			showBody: this.componentSettings!.showBodies,
			showHealth: this.componentSettings!.showHealth,
			interactive: false,
			pane: 'players',
		});

		if(this.currentWorld && this.currentWorld.name === this.player.location.world) {
			this.enableLayer();
		}
	},

	unmounted() {
		if(this.marker) {
			this.layerGroup.removeLayer(this.marker);
		}
	},

	render() {
		return null;
	},

	methods: {
		enableLayer() {
			// console.log('Enabling marker for ' + this.player.name);

			if(this.marker) {
				this.layerGroup.addLayer(this.marker);
				this.marker.setLatLng(this.currentProjection.locationToLatLng(this.player.location));
				this.visible = true;
			}
		},
		disableLayer() {
			// console.log('Disabling marker for ' + this.player.name);

			if(this.marker) {
				this.layerGroup.removeLayer(this.marker);
				this.visible = false;
			}
		},
	}
})
</script>

<style scoped>

</style>