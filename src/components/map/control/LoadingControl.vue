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
  -
  - Portions of this file are taken from Leaflet.loading:
  -
  - Copyright (c) 2013 Eric Brelsford
  -
  - Permission is hereby granted, free of charge, to any person obtaining a copy
  - of this software and associated documentation files (the "Software"), to deal
  - in the Software without restriction, including without limitation the rights
  - to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  - copies of the Software, and to permit persons to whom the Software is
  - furnished to do so, subject to the following conditions:
  -
  - The above copyright notice and this permission notice shall be included in
  - all copies or substantial portions of the Software.

  - THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  - IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  - FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  - AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  - LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  - OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  - THE SOFTWARE.
-->

<template>
	<div class="ui__element ui__button loading" :title="loadingTitle" :hidden="!showIndicator">
		<SvgIcon name="loading"></SvgIcon>
	</div>
</template>

<script lang="ts">
  import {computed, defineComponent, onUnmounted, watch, onMounted, ref} from "vue";
  import {Layer, LayerEvent, LeafletEvent, TileLayer} from "leaflet";
	import {useStore} from "@/store";
	import SvgIcon from "@/components/SvgIcon.vue";
	import LiveAtlasLeafletMap from "@/leaflet/LiveAtlasLeafletMap";
	import '@/assets/icons/loading.svg';

	export default defineComponent({
		components: {SvgIcon},

		props: {
			leaflet: {
				type: Object as () => LiveAtlasLeafletMap,
				required: true,
			},
			delay: {
				type: Number,
				default: 0
			}
		},

		setup(props) {
			const store = useStore(),
				loadingTitle = computed(() => store.state.messages.loadingTitle),
				dataLoaders = ref<Set<number>>(new Set()),
				showIndicator = ref<boolean>(false);

			let delayIndicatorTimeout: ReturnType<typeof setTimeout> | null = null;

			const addLayerListeners = () => {
				// Add listeners for begin and end of load to any layers already
				// on the map
				props.leaflet.eachLayer((layer: Layer) => {
					if(!(layer instanceof TileLayer)) {
						return;
					}

					if(layer.isLoading()) {
						dataLoaders.value.add((layer as any)._leaflet_id);
					}

					layer.on('loading', handleLoading);
					layer.on('load', handleLoad);
				});

				// When a layer is added to the map, add listeners for begin and
				// end of load
				props.leaflet.on('layeradd', layerAdd);
				props.leaflet.on('layerremove', layerRemove);
			};

			const removeLayerListeners = () => {
				// Remove listeners for begin and end of load from all layers
				props.leaflet.eachLayer((layer: Layer) => {
					if(!(layer instanceof TileLayer)) {
						return;
					}

					dataLoaders.value.delete((layer as any)._leaflet_id);

					layer.off('loading', handleLoading);
					layer.off('load', handleLoad);
				});

				// Remove layeradd/layerremove listener from map
				props.leaflet.off('layeradd', layerAdd);
				props.leaflet.off('layerremove', layerRemove);
			};

			const layerAdd = (e: LayerEvent) => {
				if(!(e.layer instanceof TileLayer)) {
					return;
				}

				try {
					if(e.layer.isLoading()) {
						handleLoading(e);
					}

					e.layer.on('loading', handleLoading);
					e.layer.on('load', handleLoad);
				} catch (exception) {
					console.warn('L.Control.Loading: Tried and failed to add ' +
						' event handlers to layer', e.layer);
					console.warn('L.Control.Loading: Full details', exception);
				}
			};

			const layerRemove = (e: LayerEvent) => {
				if(!(e.layer instanceof TileLayer)) {
					return;
				}

				handleLoad(e);

				try {
					e.layer.off('loading', handleLoading);
					e.layer.off('load', handleLoad);
				} catch (exception) {
					console.warn('L.Control.Loading: Tried and failed to remove ' +
						'event handlers from layer', e.layer);
					console.warn('L.Control.Loading: Full details', exception);
				}
			};

			const handleLoading = (e: LeafletEvent) => dataLoaders.value.add(getEventId(e))
			const handleLoad = (e: LeafletEvent) => dataLoaders.value.delete(getEventId(e));

			const getEventId = (e: any) => {
				if (e.id) {
					return e.id;
				} else if (e.layer) {
					return e.layer._leaflet_id;
				}
				return e.target._leaflet_id;
			};

			watch(dataLoaders, (newValue) => {
				if(props.delay) { // If we are delaying showing the indicator
					if(newValue.size > 0) {
						// If we're not already waiting for that delay, set up a timeout.
						if(!delayIndicatorTimeout) {
							setTimeout(() => showIndicator.value = true)
						}
					} else {
						// If removing this loader means we're in no danger of loading,
						// clear the timeout. This prevents old delays from instantly
						// triggering the indicator.
						showIndicator.value = false;
						clearTimeout(Number(delayIndicatorTimeout));
						delayIndicatorTimeout = null;
					}
					return;
				} else {
					// Otherwise update the indicator immediately
					showIndicator.value = !!newValue.size;
				}
			}, {deep: true});

			onMounted(() => {
				// Add listeners to the map for (custom) dataloading and dataload
				// events, eg, for AJAX calls that affect the map but will not be
				// reflected in the above layer events.
				props.leaflet.on('dataloading', handleLoading);
				props.leaflet.on('dataload', handleLoad);

				addLayerListeners();
			});

			onUnmounted(() => {
				props.leaflet.off('dataloading', handleLoading);
				props.leaflet.off('dataload', handleLoad);

				removeLayerListeners();
			});

			return {
				loadingTitle,
				dataLoaders,
				showIndicator
			}
		}
	});
</script>

<style lang="scss" scoped>
	.loading {
		cursor: wait;
		animation: fade 0.3s linear;
		animation-fill-mode: forwards;

		&:hover, &:active, &:focus {
			background-color: var(--background-base);
		}

		&[hidden] {
			display: none;
		}
	}
</style>
