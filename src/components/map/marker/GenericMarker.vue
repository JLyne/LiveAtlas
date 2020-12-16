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
import {LayerGroup, Marker} from 'leaflet';
import {DynmapMarker} from "@/dynmap";
import {useStore} from "@/store";
import {DynmapIcon} from "@/leaflet/icon/DynmapIcon";

export default defineComponent({
	props: {
		options: {
			type: Object as () => DynmapMarker,
			required: true
		},
		layerGroup: {
			type: Object as () => LayerGroup,
			required: true
		}
	},

	setup(props) {
		const store = useStore(),
			markerSettings = computed(() => store.state.components.markers),
			currentProjection = computed(() => store.state.currentProjection),
			projectedPosition = computed(() => store.state.currentProjection.locationToLatLng(props.options.location)),
			visible = ref(false),

			marker = undefined as Marker | undefined;

		return {
			marker,
			visible,
			projectedPosition,
			markerSettings,
			currentProjection,
		}
	},

	watch: {
		currentProjection() {
			this.marker!.setLatLng(this.currentProjection.locationToLatLng(this.options.location));
		}
	},

	mounted() {
		this.marker = new Marker(this.currentProjection.locationToLatLng(this.options.location), {
			icon: new DynmapIcon({
				icon: this.options.icon,
				label: this.options.label,
				iconSize: this.options.dimensions,
				showLabel: true,
				isHtml: this.options.isHTML,
			}),
			// maxZoom: this.options.maxZoom,
			// minZoom: this.options.minZoom,
		});

		this.layerGroup.addLayer(this.marker);
	},

	unmounted() {
		if(this.marker) {
			this.layerGroup.removeLayer(this.marker);
		}
	},

	render() {
		return null;
	}
})
</script>

<style scoped>

</style>