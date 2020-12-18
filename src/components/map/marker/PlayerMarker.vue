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
				if(this.currentWorld && newValue.location.world === this.currentWorld.name) {
					if(!this.visible) {
						this.enableLayer();
					} else {
						this.marker!.setLatLng(this.currentProjection.locationToLatLng(newValue.location));
						this.marker!.getIcon().update();
					}
				} else if(this.visible) {
					this.disableLayer();
				}
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
			if(this.marker && !this.visible) {
				this.layerGroup.addLayer(this.marker);
				this.marker.setLatLng(this.currentProjection.locationToLatLng(this.player.location));
				this.visible = true;
			}
		},
		disableLayer() {
			if(this.marker && this.visible) {
				this.layerGroup.removeLayer(this.marker);
				this.visible = false;
			}
		},
	}
})
</script>

<style scoped>

</style>