<template>
	<li class="world">
		<span class="world__name">{{ world.title }}</span>
		<ul class="world__maps">
			<li :class="{'map': true, 'map--selected': map === currentMap}" v-for="[name, map] in world.maps" :key="name">
				<button type="button" :title="map.title" :style="{'background-image': `url(${getMapIcon(map)})`}"
						@click="setCurrentMap(map.name)" :aria-label="map.title"></button>
			</li>
		</ul>
	</li>
</template>

<script lang="ts">
import {useStore} from "@/store";
import {DynmapMap, DynmapWorld} from "@/dynmap";
import {defineComponent} from 'vue';
import {MutationTypes} from "@/store/mutation-types";

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
			background-position: center;
			background-repeat: no-repeat;
			background-size: 2.4rem;
		}

		& + .map {
			margin-left: 0.5rem;
		}
	}
</style>