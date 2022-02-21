<!--
  - Copyright 2022 James Lyne
  -
  - Licensed under the Apache License, Version 2.0 (the "License");
  - you may not use this file except in compliance with the License.
  - You may obtain a copy of the License at
  -
  - http://www.apache.org/licenses/LICENSE-2.0
  -
  - Unless required by applicable law or agreed to in writing, software
  - distributed under the License is distributed on an "AS IS" BASIS,
  - WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  - See the License for the specific language governing permissions and
  - limitations under the License.
  -->

<template>
	<input :id="`player-${player.name}`" type="radio" name="player" v-bind:value="player.name" v-model="followTarget"
	       @click.prevent="onInputClick" />
	<label :for="`player-${player.name}`"
	       :class="{'player': true, 'player--hidden' : !!player.hidden, 'player--other-world': otherWorld}" :title="title"
	       @click.prevent="onLabelClick">
		<PlayerImage v-if="imagesEnabled" :player="player" width="16" height="16" class="player__icon" aria-hidden="true"></PlayerImage>
		<span class="player__name" v-html="player.displayName"></span>
	</label>
</template>

<script lang="ts">
import {defineComponent, computed} from 'vue';
import {useStore} from "@/store";
import {MutationTypes} from "@/store/mutation-types";
import {LiveAtlasPlayer} from "@/index";
import PlayerImage from "@/components/PlayerImage.vue";

export default defineComponent({
	name: 'PlayerListItem',
	components: {PlayerImage},
	props: {
		player: {
			type: Object as () => LiveAtlasPlayer,
			required: true
		}
	},
	setup(props) {
		const store = useStore(),
			imagesEnabled = computed(() => store.state.components.players.showImages),

			otherWorld = computed(() => {
				return store.state.components.players.grayHiddenPlayers
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

			followTarget = computed(() => store.state.followTarget?.name),

			pan = () => {
				if(!props.player.hidden) {
					store.commit(MutationTypes.SET_VIEW_TARGET, {location: props.player.location});
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

		return {
			imagesEnabled,
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
		display: flex !important;
		align-items: center;

		.player__icon {
			position: relative;
			pointer-events: none;
			z-index: 2;
			padding-right: 1.5rem;
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
