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
		<img width="16" height="16" class="player__icon" :src="image" alt="" />
		<button class="player__name" type="button" :title="title"
				:disbled="player.hidden"
				@click.prevent="pan"
				@keydown="onKeydown"
				@dblclick.prevent="follow" v-html="player.name"></button>
	</li>
</template>

<script lang="ts">
import {defineComponent, computed, ref, onMounted} from 'vue';
import {DynmapPlayer} from "@/dynmap";
import {useStore} from "@/store";
import {MutationTypes} from "@/store/mutation-types";
import {getMinecraftHead} from '@/util';
import defaultImage from '@/assets/images/player_face.png';

export default defineComponent({
	name: 'PlayerListItem',
	props: {
		player: {
			type: Object as () => DynmapPlayer,
			required: true
		}
	},
	setup(props) {
		const store = useStore(),
			otherWorld = computed(() => {
				return store.state.configuration.grayHiddenPlayers
					&& (!store.state.currentWorld || store.state.currentWorld.name !== props.player.location.world);
			}),

			title = computed(() => {
				if(props.player.hidden) {
					return store.state.messages.playersTitleHidden;
				} else if(otherWorld.value) {
					return store.state.messages.playersTitleOtherWorld;
				} else {
					return store.state.messages.playersTitle;
				}
			}),

			pan = () => {
				if(!props.player.hidden) {
					store.commit(MutationTypes.CLEAR_FOLLOW_TARGET, undefined);
					store.commit(MutationTypes.SET_PAN_TARGET, props.player);
				}
			},

			follow = () => store.commit(MutationTypes.SET_FOLLOW_TARGET, props.player),

			onKeydown = (e: KeyboardEvent) => {
				if(e.key !== ' ' && e.key !== 'Enter') {
					return;
				}

				if(e.shiftKey) {
					follow();
				} else {
					if(!props.player.hidden) {
						pan();
					}
				}
			};

		let image = ref(defaultImage);

		onMounted(() => {
			if(store.state.components.playerMarkers && store.state.components.playerMarkers.showSkinFaces) {
				getMinecraftHead(props.player, '16').then((result) => image.value = result.src).catch(() => {});
			}
		});

		return {
			image,
			title,
			otherWorld,
			pan,
			follow,
			onKeydown
		}
	},

});
</script>

<style lang="scss" scoped>
	.player {
		position: relative;
		display: block;
		line-height: 3rem;
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;

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
			min-height: 3.2rem;
		}

		&.player--hidden {
			.player__icon {
				filter: grayscale(1);
				opacity: 0.5;
			}

			.player__name {
				cursor: not-allowed;
			}

			.player__name {
				color: var(--text-disabled);
			}
		}

		&.player--other-world {
			.player__icon {
				opacity: 0.5;
			}

			.player__name {
				color: var(--text-disabled);
			}
		}
	}
</style>