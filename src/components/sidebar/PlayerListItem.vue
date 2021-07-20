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
	<input :id="`player-${player.account}`" type="radio" name="player" v-bind:value="player.account" v-model="followTarget"
	       @click.prevent="onInputClick" />
	<label :for="`player-${player.account}`"
	       :class="{'player': true, 'player--hidden' : !!player.hidden, 'player--other-world': otherWorld}" :title="title"
	       @click.prevent="onLabelClick">
		<img width="16" height="16" class="player__icon" :src="image" alt="" aria-hidden="true" />
		<span class="player__name" v-html="player.name"></span>
	</label>
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
					&& !props.player.hidden
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

			followTarget = computed(() => store.state.followTarget ? store.state.followTarget.account : undefined),

			pan = () => {
				if(!props.player.hidden) {
					store.commit(MutationTypes.CLEAR_FOLLOW_TARGET, undefined);
					store.commit(MutationTypes.SET_PAN_TARGET, props.player);
				}
			},

			follow = () => store.commit(MutationTypes.SET_FOLLOW_TARGET, props.player),

			onInputClick = (e: MouseEvent) => {
				e.preventDefault();

				if(e.shiftKey) {
					follow();
				} else {
					pan();
				}
			},

			onLabelClick = (e: MouseEvent) => {
				if(e.shiftKey || e.detail === 2) {
					follow();
				} else {
					pan();
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
			followTarget,
			onInputClick,
			onLabelClick
		}
	},

});
</script>

<style lang="scss" scoped>
	@import '../../scss/mixins';

	.player {
		.player__icon {
			position: absolute;
			display: block;
			top: 0;
			bottom: 0;
			left: 0.7rem;
			pointer-events: none;
			margin: auto;
			z-index: 2;
		}

		.player__name {
			padding-left: 2.7rem;
		}

		&.player--hidden:not(:hover),
		&.player--other-world:not(:hover) {
			.player__name {
				opacity: 0.5;
			}
		}

		&.player--hidden {
			.player__icon {
				filter: grayscale(1);
			}
		}

		&:hover, &:focus, &:active {
			.player__name ::v-deep(span) {
				color: inherit !important;
			}
		}
	}
</style>
