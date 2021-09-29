<!--
  - Copyright 2021 James Lyne
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
			<img width="32" height="32" class="target__icon" :src="image" alt="" />
			<span class="target__info">
				<span class="target__name" v-html="target.displayName"></span>
				<span class="target__status" v-show="target.hidden">{{ messageHidden }}</span>
			</span>
			<button class="target__unfollow" type="button" :title="messageUnfollowTitle"
				@click.prevent="unfollow" :aria-label="messageUnfollow">
				<SvgIcon name="cross"></SvgIcon>
			</button>
		</div>
	</section>
</template>

<script lang="ts">
import {useStore} from "@/store";
import {MutationTypes} from "@/store/mutation-types";
import {computed, defineComponent, onMounted, ref, watch} from "@vue/runtime-core";
import {getMinecraftHead} from '@/util';
import defaultImage from '@/assets/images/player_face.png';
import {LiveAtlasPlayer} from "@/index";
import SvgIcon from "@/components/SvgIcon.vue";
import "@/assets/icons/cross.svg";

export default defineComponent({
	name: 'FollowTarget',
	components: {SvgIcon},
	props: {
		target: {
			type: Object as () => LiveAtlasPlayer,
			required: true
		}
	},
	setup(props) {
		const store = useStore(),
			image = ref(defaultImage),
			account = ref(props.target.name),

			heading = computed(() => store.state.messages.followingHeading),
			messageUnfollow = computed(() => store.state.messages.followingUnfollow),
			messageUnfollowTitle = computed(() => store.state.messages.followingTitleUnfollow),
			messageHidden = computed(() => store.state.messages.followingHidden),

			unfollow = () => {
				store.commit(MutationTypes.CLEAR_FOLLOW_TARGET, undefined);
			},
			updatePlayerImage = async () => {
				image.value = defaultImage;

				if(store.state.components.playerMarkers && store.state.components.playerMarkers.showSkins) {
					try {
						const result = await getMinecraftHead(props.target, 'small');
						image.value = result.src;
					} catch (e) {}
				}
			};

		watch(account, () => updatePlayerImage());
		onMounted(() => updatePlayerImage());

		return {
			image,
			unfollow,
			heading,
			messageUnfollow,
			messageUnfollowTitle,
			messageHidden,
		}
	},
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

			.target__info {
				margin-left: 2rem;
				display: flex;
				flex-direction: column;
				justify-content: flex-start;

				.target__status {
					font-size: 1.3rem;
				}
			}

			&.following__target--hidden {
				.target__icon {
					filter: grayscale(1);
					opacity: 0.5;
				}
			}
		}

		@media (max-width: 480px), (max-height: 480px) {
			margin-top: 0;
		}
	}
</style>
