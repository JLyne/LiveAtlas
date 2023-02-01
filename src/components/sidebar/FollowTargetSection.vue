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
	<section class="sidebar__section following">
		<h2>{{ heading }}</h2>

		<div :class="{'following__target': true, 'following__target--hidden': target.hidden}">
			<PlayerImage v-if="imagesEnabled" :player="target" class="target__icon" width="48" height="48"></PlayerImage>
			<span class="target__name" v-html="target.displayName"></span>
			<span class="target__status">{{ status }}</span>
			<span class="target__location" v-clipboard:copy="location"
			      v-clipboard:success="copySuccess"
			      v-clipboard:error="copyError">{{ location }}&#8288;</span>
			<button class="target__unfollow" type="button" :title="messageUnfollowTitle"
				@click.prevent="unfollow" :aria-label="messageUnfollow">
				<SvgIcon name="cross"></SvgIcon>
			</button>
		</div>
	</section>
</template>

<script lang="ts">
import {computed, defineComponent} from "vue";
import {LiveAtlasPlayer} from "@/index";
import {useStore} from "@/store";
import {MutationTypes} from "@/store/mutation-types";
import {clipboardError, clipboardSuccess} from '@/util';
import SvgIcon from "@/components/SvgIcon.vue";
import "@/assets/icons/cross.svg";
import PlayerImage from "@/components/PlayerImage.vue";

export default defineComponent({
	name: 'FollowTargetSection',
	components: {PlayerImage, SvgIcon},
	props: {
		target: {
			type: Object as () => LiveAtlasPlayer,
			required: true
		}
	},
	setup(props) {
		const store = useStore(),
			imagesEnabled = computed(() => store.state.components.players.showImages),

			heading = computed(() => store.state.messages.followingHeading),
			messageUnfollow = computed(() => store.state.messages.followingUnfollow),
			messageUnfollowTitle = computed(() => store.state.messages.followingTitleUnfollow),
			messageHidden = computed(() => store.state.messages.followingHidden),

			status = computed(() => {
				if (props.target.hidden) {
					return messageHidden.value;
				}

				const world = store.state.worlds.get(props.target.location.world || '');
				return world ? world.displayName : messageHidden.value;
			}),

			location = computed(() => {
				if (props.target.hidden) {
					return '';
				}

				return `${Math.floor(props.target.location.x)}, ${props.target.location.y}, ${Math.floor(props.target.location.z)}`;
			}),

			unfollow = () => {
				store.commit(MutationTypes.CLEAR_FOLLOW_TARGET, undefined);
			};

		return {
			imagesEnabled,
			unfollow,
			heading,
			messageUnfollow,
			messageUnfollowTitle,
			messageHidden,
			status,
			location,
			copySuccess: clipboardSuccess(store),
			copyError: clipboardError(store),
		}
	},
});
</script>

<style lang="scss" scoped>
	.sidebar__section.following {
		margin-top: auto;
		flex: 0 0 auto;
		position: sticky;
		bottom: 0.2rem;
		z-index: 3;

		.following__target {
			display: grid;
			grid-template-columns: min-content 1fr;
			grid-template-rows: 1fr min-content min-content min-content 1fr;
			grid-template-areas: "icon ." "icon name" "icon status" "icon location" "icon .";
			grid-auto-flow: column;
			align-items: center;

			.target__unfollow {
				position: absolute;
				top: 1.5rem;
				right: 1rem;
				width: 2.5rem;
				height: 2.5rem;

				&:before {
					content: '';
					position: absolute;
					display: block;
					top: -1rem;
					right: -1rem;
					bottom: -1rem;
					left: -1rem;
				}
			}

			.target__icon {
				margin-right: 2rem;
				grid-area: icon;
			}

			.target__name {
				grid-area: name;
			}

			.target__status {
				grid-area: status;
				font-size: 1.3rem;
			}

			.target__location {
				grid-area: location;
				font-family: monospace;
				cursor: pointer;
			}

			&.following__target--hidden {
				.target__icon {
					filter: grayscale(1);
					opacity: 0.5;
				}
			}

			> * {
				text-overflow: ellipsis;
				white-space: nowrap;
				overflow: hidden;
			}
		}

		@media (max-width: 480px), (max-height: 480px) {
			margin-top: 0;
		}
	}
</style>
