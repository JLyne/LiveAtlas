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
	<SidebarSection v-if="markerSets.size" name="markers" class="markers">
		<template v-slot:heading>{{ heading }}</template>
		<template v-slot:default>
			<MarkerSetList :markerSets="markerSets" aria-labelledby="markers-heading"></MarkerSetList>
		</template>
	</SidebarSection>
</template>

<script lang="ts">
import {computed, defineComponent} from 'vue';
import {useStore} from "@/store";
import SidebarSection from "@/components/sidebar/SidebarSection.vue";
import MarkerSetList from "@/components/list/MarkerSetList.vue";

export default defineComponent({
	name: 'MarkersSection',
	components: {
		MarkerSetList,
		SidebarSection,
	},

	setup() {
		const store = useStore(),
			heading = computed(() => store.state.messages.markersHeading),
			markerSets = computed(() => store.state.markerSets);

		return {
			heading,
			markerSets
		}
	}
});
</script>

<style lang="scss" scoped>
	::v-deep(.menu), ::v-deep(.menu input) {
		scroll-margin-top: 14.4rem;
		scroll-margin-bottom: 6.5rem;
	}

	::v-deep(.section__search) {
		top: 9rem;
	}
</style>
