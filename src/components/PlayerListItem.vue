<template>
	<li class="player">
		<span class="playerIcon" title="Follow player">
			<img src="images/player_face.png">
		</span>
		<a href="#" title="Center on player">{{ player.name }}</a>
	</li>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {DynmapPlayer} from "@/dynmap";

export default defineComponent({
	name: 'PlayerListItem',
	props: {
		player: Object as () => DynmapPlayer,
	}
});
</script>

<style scoped>

</style>