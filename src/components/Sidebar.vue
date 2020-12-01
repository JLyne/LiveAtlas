<template>
	<aside class="sidebar">
		<header class="sidebar__buttons">
			<button :class="{'button--maps': true, 'active': mapsActive}"
					@click="mapsActive = !mapsActive" title="Map list" aria-label="Map list"></button>
			<button :class="{'button--players': true, 'active': playersActive}"
					@click="playersActive = !playersActive" title="Player list" aria-label="Player list"></button>
		</header>
		<WorldList v-show="mapsActive"></WorldList>
		<PlayerList v-show="playersActive"></PlayerList>
		<FollowTarget v-if="following" :target="following"></FollowTarget>
	</aside>
</template>

<script lang="ts">
import {defineComponent, ref, computed} from "@vue/runtime-core";
import PlayerList from './sidebar/PlayerList.vue';
import WorldList from './sidebar/WorldList.vue';
import FollowTarget from './sidebar/FollowTarget.vue';
import {useStore} from "@/store";

export default defineComponent({
	components: {
		PlayerList,
		FollowTarget,
		WorldList,
	},

	setup() {
		const store = useStore();
		let mapsActive = ref(false),
			playersActive = ref(false),
			following = computed(() => store.state.following);

		return {
			mapsActive,
			playersActive,
			following
		}
	}
})

</script>

<style lang="scss">
@import '../scss/variables';
@import '../scss/placeholders';

.sidebar {
	position: fixed;
	z-index: 120;
	top: 0;
	right: 0;
	bottom: 0;
	display: flex;
	flex-direction: column;
	padding: 1rem;
	width: 23rem;
	will-change: transform;

	.sidebar__buttons {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: flex-end;
		margin-bottom: 1rem;

		button {
			width: 5rem;
			height: 5rem;
			background-size: 3.2rem;
			background-position: center;
			background-repeat: no-repeat;

			& + button {
				margin-left: 1rem;
			}
		}

		.button--maps {
			background-image: url('./../assets/images/world 1.png');
		}

		.button--players {
			background-image: url('./../assets/images/people.png');
		}
	}

	.sidebar__section {
		@extend %panel;
		flex: 0 1 auto;
		min-height: 15vh;
		margin-bottom: 1rem;

		&:last-child {
			margin-bottom: 0;
		}

		.section__heading {
			font-size: 2rem;
			margin-bottom: 1rem;
		}

		.section__content {
			flex-shrink: 1;
			min-height: 0;
			overflow: auto;
			will-change: transform;
		}
	}
}
</style>