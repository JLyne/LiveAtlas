<template>
	<li class="player">
		<img width="16" height="16" class="player__icon" src="images/player_face.png" alt="" />
		<button class="player__name" type="button" title="Click to center on player&#10;Double-click to follow player"
				@click.prevent="pan"
				@keydown="onKeydown"
				@dblclick.prevent="follow">{{ player.name }}</button>
	</li>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {DynmapPlayer} from "@/dynmap";
import {useStore} from "@/store";
import {MutationTypes} from "@/store/mutation-types";

export default defineComponent({
	name: 'PlayerListItem',
	props: {
		player: {
			type: Object as () => DynmapPlayer,
			required: true
		}
	},
	methods: {
		follow() {
			useStore().commit(MutationTypes.FOLLOW_PLAYER, this.player);
		},
		pan() {
			useStore().commit(MutationTypes.FOLLOW_PLAYER, this.player);
			useStore().commit(MutationTypes.CLEAR_FOLLOW, undefined);
		},
		onKeydown(e: KeyboardEvent) {
			if(e.key !== ' ') {
				return;
			}

			e.shiftKey ? this.follow() : this.pan();
		}
	}
});
</script>

<style lang="scss" scoped>
	.player {
		position: relative;
		display: block;
		line-height: 3rem;

		.player__icon {
			position: absolute;
			display: block;
			top: 0;
			bottom: 0;
			left: 0.7rem;
			pointer-events: none;
			margin: auto;
		}

		.player__name {
			padding: 0.5rem 0 0.4rem 3rem;
			text-align: left;
			margin: 0;
			width: 100%;
			height: 100%;
		}
	}
</style>