<template>
	<li class="world subsection">
		{{ world.title }}
		<ul class="maplist sublist">
			<li :class="{'map': true, 'item': true, 'selected': map === currentMap}" style="background: rgb(0, 0, 0);" v-for="map in world.maps" :key="map.name">
				<a :title="map.title" href="#" class="maptype" :style="{'background-image': `url(${getMapIcon(map)})`}" @click="setCurrentMap(map.name)">{{ map.name }}</a>
			</li>
		</ul>
	</li>
</template>

<script lang="ts">
import {MutationTypes, useStore} from "@/store";
import {DynmapMap, DynmapWorld} from "@/dynmap";
import {defineComponent} from 'vue';

export default defineComponent({
	name: 'WorldListItem',
	props: {
		world: {
			type: Object as () => DynmapWorld,
			required: true
		}
	},

	computed: {
		currentMap(): DynmapMap | undefined {
			return useStore().state.currentMap;
		}
	},

	methods: {
		getMapIcon(map: DynmapMap): string {
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

			return `images/block_${worldType}_${mapType}.png`;
		},
		setCurrentMap(map: string) {
			useStore().commit(MutationTypes.SET_CURRENT_MAP, {
				world: this.world.name,
				map
			});
		}
	}
});
</script>

<style scoped>

</style>