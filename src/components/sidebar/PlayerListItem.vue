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
	<li class="player">
		<img width="16" height="16" class="player__icon" :src="playerImage" alt="" />
		<button class="player__name" type="button" title="Click to center on player&#10;Double-click to follow player"
				@click.prevent="pan"
				@keydown="onKeydown"
				@dblclick.prevent="follow" v-html="player.name"></button>
	</li>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {DynmapPlayer} from "@/dynmap";
import {useStore} from "@/store";
import {MutationTypes} from "@/store/mutation-types";

const playerImage = require('@/assets/images/player_face.png');

export default defineComponent({
	name: 'PlayerListItem',
	props: {
		player: {
			type: Object as () => DynmapPlayer,
			required: true
		}
	},
	data() {
		return {
			playerImage: playerImage,
		}
	},
	methods: {
		follow() {
			useStore().commit(MutationTypes.SET_FOLLOW_TARGET, this.player);
		},
		pan() {
			useStore().commit(MutationTypes.CLEAR_FOLLOW_TARGET, undefined);
			useStore().commit(MutationTypes.SET_PAN_TARGET, this.player);
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
			z-index: 1;
		}

		.player__name {
			padding: 0.8rem 0 0.7rem 3.5rem;
			text-align: left;
			margin: 0;
			width: 100%;
			height: 100%;
		}
	}
</style>