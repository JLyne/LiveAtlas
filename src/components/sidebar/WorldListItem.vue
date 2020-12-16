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

<template>
	<li class="world">
		<span class="world__name">{{ world.title }}</span>
		<ul class="world__maps">
			<li :class="{'map': true, 'map--selected': map === currentMap}" v-for="[name, map] in world.maps" :key="name">
				<button type="button" :title="map.title" @click="setCurrentMap(map.name)" :aria-label="map.title">
					<SvgIcon :name="getMapIcon(map)"></SvgIcon>
				</button>
			</li>
		</ul>
	</li>
</template>

<script lang="ts">
import {useStore} from "@/store";
import {DynmapWorldMap, DynmapWorld} from "@/dynmap";
import {defineComponent} from 'vue';
import {MutationTypes} from "@/store/mutation-types";
import SvgIcon from "@/components/SvgIcon.vue";

export default defineComponent({
	name: 'WorldListItem',
	components: {SvgIcon},
	props: {
		world: {
			type: Object as () => DynmapWorld,
			required: true
		}
	},

	computed: {
		currentMap(): DynmapWorldMap | undefined {
			return useStore().state.currentMap;
		}
	},

	methods: {
		getMapIcon(map: DynmapWorldMap): string {
			let worldType: string,
				mapType: string;

			if (this.world.name.endsWith('_nether') || (this.world.name == 'DIM-1')) {
				worldType = 'nether';
				mapType = (map.name == 'nether') ? 'surface' : 'flat';
			} else if (this.world.name.endsWith('the_end') || (this.world.name == 'DIM1')) {
				worldType = 'the_end';
				mapType = (map.name == 'the_end') ? 'surface' : 'flat';
			} else {
				worldType = 'world';
				mapType = ['surface', 'flat', 'biome', 'cave'].includes(map.name) ? map.name : 'flat';
			}

			return `block_${worldType}_${mapType}`;
		},
		setCurrentMap(mapName: string) {
			useStore().commit(MutationTypes.SET_CURRENT_MAP, {
				worldName: this.world.name,
				mapName
			});
		}
	}
});
</script>

<style lang="scss" scoped>
	.world {
		display: flex;
		align-items: center;
		margin-bottom:  .5rem;

		.world__maps {
			display: flex;
			align-items: center;
			margin-left: auto;
			padding-left: 1rem;
			padding-right: 0.2rem;
		}
	}

	.map {
		width: 3.2rem;
		height: 3.2rem;

		button {
			display: block;
			height: 100%;
			width: 100%;
			border-radius: 0.5rem;
		}

		& + .map {
			margin-left: 0.5rem;
		}
	}
</style>
