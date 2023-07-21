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
	<input ref="searchInput" v-if="search && unfilteredTotal" id="markers__search" class="section__search" type="text"
         name="search" :value="searchQuery" :placeholder="messageMarkersSearchPlaceholder"
         @keydown="(e: KeyboardEvent) => e.stopImmediatePropagation()" @input="onSearchInput">
	<RadioList v-if="markers.size" name="marker" v-bind="$attrs" @keydown="onListKeydown">
		<MarkerListItem v-for="[id, marker] in markers" :key="id" :marker="marker" :id="id"></MarkerListItem>
		<button type="button" ref="showMoreButton" v-if="viewLimit < total" @click.prevent="showMore">{{ messageShowMore }}</button>
	</RadioList>
	<div v-else-if="searchQuery" class="section__skeleton" v-bind="$attrs">{{ messageSkeletonMarkersSearch }}</div>
	<div v-else class="section__skeleton" v-bind="$attrs">{{ messageSkeletonMarkers }}</div>
</template>

<script lang="ts">
import {defineComponent, onMounted, reactive, ref, computed, onUnmounted, watch} from 'vue';
import debounce from 'lodash.debounce';
import {LiveAtlasMarkerSet, LiveAtlasMarker} from "@/index";
import {DynmapMarkerUpdate} from "@/dynmap";
import {useStore} from "@/store";
import {nonReactiveState} from "@/store/state";
import {registerSetUpdateHandler, unregisterSetUpdateHandler} from "@/leaflet/util/markers";
import RadioList from "@/components/util/RadioList.vue";
import MarkerListItem from "@/components/list/MarkerListItem.vue";

export default defineComponent({
	name: 'MarkerList',
	components: {
		MarkerListItem,
		RadioList,
	},

	props: {
		markerSet: {
			type: Object as () => LiveAtlasMarkerSet,
			required: true
		},
		search: {
			type: Boolean,
			default: true,
		}
	},

	setup(props) {
		let focusFrame = 0;

		const store = useStore(),
			messageShowMore = computed(() => store.state.messages.showMore),
			messageMarkersSearchPlaceholder = computed(() => store.state.messages.markersSearchPlaceholder),
			messageSkeletonMarkersSearch = computed(() => store.state.messages.markersSearchSkeleton),
			messageSkeletonMarkers = computed(() => store.state.messages.markersSetSkeleton),
			setContents = nonReactiveState.markers.get(props.markerSet.id)!,
			searchQuery = ref(""),
			markers = ref<Map<string, LiveAtlasMarker>>(new Map()),
			showMoreButton = ref<HTMLButtonElement | null>(null),
			total = ref(0),
			unfilteredTotal = ref(0),
			viewLimit = ref(50),
			searchInput = ref<HTMLInputElement | null>(null);

		const onListKeydown = (e: KeyboardEvent) => {
			if(e.key === 'f' && e.ctrlKey) {
				e.preventDefault();
				searchInput.value!.focus();
			}
		}

		const getMarkers = () => {
			markers.value.clear();

			if(!setContents) {
				return;
			}

			unfilteredTotal.value = setContents.size;
			let count = 0;

			setContents.forEach((marker, id) => {
				if(searchQuery.value && !marker.tooltip.toLowerCase().includes(searchQuery.value)) {
					return;
				}

				count++;

				if(count < viewLimit.value) {
					markers.value.set(id, reactive(marker));
				}
			});

			total.value = count;
		};

		const showMore = () => {
			const lastLabel = (showMoreButton.value as HTMLButtonElement).previousElementSibling as HTMLLabelElement;
			viewLimit.value += 50;
			//Focus first new list item
			focusFrame = requestAnimationFrame(() => (lastLabel.nextElementSibling as HTMLInputElement).focus());
		};

		const handleUpdate = (update: DynmapMarkerUpdate) => {
			unfilteredTotal.value = setContents.size;

			if(update.removed ||
				(searchQuery.value && !update.payload.tooltip.toLowerCase().includes(searchQuery.value))) {
				markers.value.delete(update.id);
			} else if(markers.value.has(update.id) || markers.value.size < viewLimit.value) {
				markers.value.set(update.id, update.payload);
			}
		};

		const onSearchInput = (e: Event) => {
			searchQuery.value = (e.target as HTMLInputElement).value.toLowerCase();
		};

		const debouncedSearch = debounce(() => {
			viewLimit.value = 50;
			getMarkers();
			searchInput.value!.nextElementSibling!.scrollIntoView();
		}, 100);

		getMarkers();
		watch(viewLimit, () => getMarkers());
		watch(searchQuery, () => debouncedSearch());

		onMounted(() => registerSetUpdateHandler(handleUpdate, props.markerSet.id));
		onUnmounted(() => {
			if(focusFrame) {
				cancelAnimationFrame(focusFrame);
			}

			debouncedSearch.cancel();
			unregisterSetUpdateHandler(handleUpdate, props.markerSet.id);
		});

		return {
			messageShowMore,
			messageMarkersSearchPlaceholder,
			messageSkeletonMarkersSearch,
			messageSkeletonMarkers,
			searchQuery,
			markers,
			showMoreButton,
			viewLimit,
			total,
			unfilteredTotal,
			searchInput,
			showMore,
			onListKeydown,
			onSearchInput
		}
	}
});
</script>
