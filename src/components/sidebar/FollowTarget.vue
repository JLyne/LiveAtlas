<template>
	<section class="sidebar__section following">
		<h2>Following</h2>

		<div class="following__target">
			<img width="32" height="32" class="target__icon" src="images/player_face.png" alt="" />
			<span class="target__name">{{ target.name }}</span>
			<button class="target__unfollow" type="button" :title="`Unfollow ${target.name}`"
				@click.prevent="unfollow"
				@keydown="onKeydown">Unfollow</button>
		</div>
	</section>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {DynmapPlayer} from "@/dynmap";
import {useStore} from "@/store";
import {MutationTypes} from "@/store/mutation-types";

export default defineComponent({
	name: 'FollowTarget',
	props: {
		target: {
			type: Object as () => DynmapPlayer,
			required: true
		}
	},
	methods: {
		unfollow() {
			useStore().commit(MutationTypes.CLEAR_FOLLOW, undefined);
		},
		onKeydown(e: KeyboardEvent) {
			if(e.key !== ' ') {
				return;
			}

			this.unfollow();
		}
	}
});
</script>

<style lang="scss" scoped>
	.sidebar__section.following {
		margin-top: auto;
		min-height: 0;
		flex: 0 0 auto;

		.following__target {
			display: flex;
			align-items: center;

			.target__unfollow {
				position: absolute;
				top: 2rem;
				right: 1.5rem;
			}

			.target__name {
				margin-left: 2rem;
			}
		}
	}
</style>