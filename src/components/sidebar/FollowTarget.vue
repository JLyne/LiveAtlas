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
	<section class="sidebar__section following">
		<h2>Following</h2>

		<div :class="{'following__target': true, 'following__target--hidden': target.hidden}">
			<img width="32" height="32" class="target__icon" :src="image" alt="" />
			<span class="target__info">
				<span class="target__name" v-html="target.name"></span>
				<span class="target__status" v-show="target.hidden">Currently hidden</span>
			</span>
			<button class="target__unfollow" type="button" :title="`Stop following this player`"
				@click.prevent="unfollow"
				@keydown="onKeydown">Unfollow</button>
		</div>
	</section>
</template>

<script lang="ts">
import {DynmapPlayer} from "@/dynmap";
import {useStore} from "@/store";
import {MutationTypes} from "@/store/mutation-types";
import {defineComponent, onMounted, ref, watch} from "@vue/runtime-core";
import Util from '@/util';

const defaultImage = require('@/assets/images/player_face.png');

export default defineComponent({
	name: 'FollowTarget',
	props: {
		target: {
			type: Object as () => DynmapPlayer,
			required: true
		}
	},
	setup(props) {
		const store = useStore(),
			image = ref(defaultImage),
			account = ref(props.target.account),

			unfollow = () => {
				useStore().commit(MutationTypes.CLEAR_FOLLOW_TARGET, undefined);
			},
			onKeydown = (e: KeyboardEvent) => {
				if(e.key !== ' ') {
					return;
				}

				unfollow();
			},
			updatePlayerImage = () => {
				image.value = defaultImage;

				if(store.state.components.playerMarkers && store.state.components.playerMarkers.showSkinFaces) {
					Util.getMinecraftHead(props.target, '16').then((result) => image.value = result.src).catch(() => {});
				}
			};

		watch(account, () => updatePlayerImage());
		onMounted(() => updatePlayerImage());

		return {
			image,
			onKeydown,
			unfollow
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
				top: 2rem;
				right: 1.5rem;
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