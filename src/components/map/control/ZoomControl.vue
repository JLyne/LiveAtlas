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
	<div class="zoom ui__element ui__group">
		<button class="ui__button" type="button" title="Zoom in" aria-label="Zoom in"
            :disabled="!canZoomIn" @click.prevent="zoomIn">
			<span aria-hidden="true">+</span>
		</button>
		<button class="ui__button" type="button" title="Zoom out" aria-label="Zoom out"
            :disabled="!canZoomOut" @click.prevent="zoomOut">
			<span aria-hidden="true">−</span>
		</button>
	</div>
</template>

<script lang="ts">
  import {defineComponent, onUnmounted, onMounted, ref} from "vue";
	import LiveAtlasLeafletMap from "@/leaflet/LiveAtlasLeafletMap";

	export default defineComponent({
		props: {
			leaflet: {
				type: Object as () => LiveAtlasLeafletMap,
				required: true,
			}
		},

		setup(props) {
			const canZoomIn = ref<boolean>(false),
				canZoomOut = ref<boolean>(false);

			const zoomIn = () => props.leaflet.zoomIn();
			const zoomOut = () => props.leaflet.zoomOut();

			const updateZoom = () => {
				canZoomIn.value = props.leaflet.getZoom() < props.leaflet.getMaxZoom();
				canZoomOut.value = props.leaflet.getZoom() > props.leaflet.getMinZoom();
			}

			onMounted(() => {
				updateZoom();
				props.leaflet.on('zoom', updateZoom);
			});

			onUnmounted(() => props.leaflet.off('zoom', updateZoom));

			return {
				canZoomIn,
				canZoomOut,

				zoomIn,
				zoomOut,
			}
		}
	});
</script>

<style lang="scss" scoped>
	.zoom {
		@media (max-width: 480px) and (pointer: coarse), (max-height: 480px) and (pointer: coarse), (max-height: 400px) {
			display: none;
		}

		.ui__button {
			font-family: sans-serif;
			font-weight: bold;
			font-size: 2.2rem;
			text-indent: 0.1rem;
		}
	}
</style>
