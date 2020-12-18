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
	<li :class="{'player': true, 'player--hidden' : !!player.hidden, 'player--other-world': otherWorld}">
		<img width="16" height="16" class="player__icon" :src="playerImage" alt="" />
		<button class="player__name" type="button" :title="title"
				:disbled="player.hidden"
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
	computed: {
		otherWorld(): boolean {
			const store = useStore();
			return store.state.configuration.grayHiddenPlayers
				&& (!store.state.currentWorld || store.state.currentWorld.name !== this.player.location.world);
		},
		title(): string {
			if(this.player.hidden) {
				return 'This player is currently hidden from the map\nDouble-click to follow player when they become visible';
			} else if(this.otherWorld) {
				return 'This player is in another world.\nClick to center on player\nDouble-click to follow player';
			} else {
				return 'Click to center on player\nDouble-click to follow player';
			}
		}
	},
	methods: {
		follow() {
			useStore().commit(MutationTypes.SET_FOLLOW_TARGET, this.player);
		},
		pan() {
			if(!this.player.hidden) {
				useStore().commit(MutationTypes.CLEAR_FOLLOW_TARGET, undefined);
				useStore().commit(MutationTypes.SET_PAN_TARGET, this.player);
			}
		},
		onKeydown(e: KeyboardEvent) {
			if(e.key !== ' ' && e.key !== 'Enter') {
				return;
			}

			if(e.shiftKey) {
				this.follow();
			} else {
				if(!this.player.hidden) {
					this.pan();
				}
			}
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

		&.player--hidden {
			.player__icon {
				filter: grayscale(1);
				opacity: 0.5;
			}

			.player__name {
				cursor: not-allowed;
			}

			color: #999999;
		}

		&.player--other-world {
			.player__icon {
				opacity: 0.5;
			}

			color: #999999;
		}
	}
</style>