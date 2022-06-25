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
	<div class="ui__element ui__panel location">
		<span class="value coordinates" :data-label="componentSettings.label">{{ formattedCoordinates }}</span>
		<span v-if="componentSettings.showChunk" class="value chunk"
          :data-label="chunkLabel">{{ formattedChunk }}</span>
		<span v-if="componentSettings.showRegion" class="value region"
          :data-label="regionLabel">{{ formattedRegion }}</span>
	</div>
</template>

<script lang="ts">
import {computed, defineComponent, onUnmounted, watch, onMounted, ref} from "vue";
import {LeafletMouseEvent} from "leaflet";
import {Coordinate} from "@/index";
import {useStore} from "@/store";
import LiveAtlasLeafletMap from "@/leaflet/LiveAtlasLeafletMap";

export default defineComponent({
	props: {
		leaflet: {
			type: Object as () => LiveAtlasLeafletMap,
			required: true,
		}
	},

	setup(props) {
		const store = useStore(),
			componentSettings = computed(() => store.state.components.coordinatesControl),
			currentMap = computed(() => store.state.currentMap),

			chunkLabel = computed(() => store.state.messages.locationChunk),
			regionLabel = computed(() => store.state.messages.locationRegion),

			coordinates = ref<Coordinate|null>(null),

			formattedCoordinates = computed(() => {
				if(coordinates.value) {
					const x = Math.round(coordinates.value.x).toString().padStart(5, ' '),
					y = coordinates.value.y.toString().padStart(3, ' '),
					z = Math.round(coordinates.value.z).toString().padStart(5, ' ');

					return componentSettings.value!.showY ? `${x}, ${y}, ${z}` : `${x}, ${z}`;
				} else {
					return componentSettings.value!.showY ? '-----, ---, -----' : '-----, -----';
				}
			}),

			formattedChunk = computed(() => {
				if(coordinates.value) {
					const chunkX = Math.floor(coordinates.value.x / 16).toString().padStart(4, ' '),
						chunkZ = Math.floor(coordinates.value.z / 16).toString().padStart(4, ' ');

					return `${chunkX}, ${chunkZ}`;
				} else {
					return '----, ----'
				}
			}),

			formattedRegion = computed(() => {
				if(coordinates.value) {
					const regionX = Math.floor(coordinates.value.x / 512).toString().padStart(3, ' '),
						regionZ = Math.floor(coordinates.value.z / 512).toString().padStart(3, ' ');

					return `r.${regionX}, ${regionZ}.mca`;
				} else {
					return '--------------';
				}
			});

		const onMouseMove = (event: LeafletMouseEvent) => {
			if (!store.state.currentMap) {
				return;
			}

			coordinates.value = store.state.currentMap.latLngToLocation(event.latlng, store.state.currentWorld!.seaLevel + 1);
		}

		const onMouseOut = () => coordinates.value = null;

		watch(currentMap, newValue => {
			if(!newValue) {
				coordinates.value = null;
			}
		});

		onMounted(() => {
			props.leaflet.on('mousemove', onMouseMove);
			props.leaflet.on('mouseout', onMouseOut);
		});

		onUnmounted(() => {
			props.leaflet.off('mousemove', onMouseMove);
			props.leaflet.off('mouseout', onMouseOut);
		});

		return {
			componentSettings,
			chunkLabel,
			regionLabel,
			formattedCoordinates,
			formattedChunk,
			formattedRegion
		}
	}
})
</script>

<style lang="scss" scoped>
	.location {
		display: flex;
		align-items: center;
		padding: 0.6rem 1.5rem;
		flex-direction: row;

		.value {
			line-height: 1;
			font-family: monospace;
			white-space: pre;
			font-size: 2rem;

			&[data-label]:before {
				content: attr(data-label);
				display: block;
				line-height: 1;
				margin-bottom: 0.5rem;
				font-size: 1.25rem;
				font-family: Raleway, sans-serif;;
			}

			& + .value {
				margin-left: 2rem;
			}
		}

		@media (max-width: 600px) {
			.region {
				display: none;
			}
		}

		@media (max-width: 480px), (max-height: 480px) {
			.value {
				font-size: 1.6rem;
			}
		}

		@media (max-width: 384px) {
			.chunk {
				display: none;
			}
		}
	}
</style>
