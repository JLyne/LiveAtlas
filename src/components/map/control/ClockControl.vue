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
	<div :class="{'clock': true, 'ui__element': true, 'ui__panel': digital}">
		<div class="clock__sun" :style="sunStyle">
			<SvgIcon :name="sunIcon"></SvgIcon>
		</div>
		<div class="clock__moon" :style="moonStyle">
			<SvgIcon :name="moonIcon"></SvgIcon>
		</div>
		<div v-if="showTime" :class="{'clock__time': true, 'day': minecraftTime?.day, 'night': minecraftTime?.night}">
			{{ formattedTime }}
		</div>
	</div>
</template>

<script lang="ts">
import {computed, defineComponent} from "vue";
import {useStore} from "@/store";
import SvgIcon from "@/components/SvgIcon.vue";
import {getMinecraftTime} from "@/util";

import "@/assets/icons/clock_moon.svg";
import "@/assets/icons/clock_moon_rain.svg";
import "@/assets/icons/clock_moon_storm.svg";
import "@/assets/icons/clock_sun.svg";
import "@/assets/icons/clock_sun_rain.svg";
import "@/assets/icons/clock_sun_storm.svg";

export default defineComponent({
	components: {SvgIcon},
	setup() {
		const store = useStore(),
			componentSettings = computed(() => store.state.components.clockControl),
			digital = computed(() => componentSettings.value!.showTimeOfDay && !componentSettings.value!.showWeather && componentSettings.value!.showDigitalClock),
			showTime = computed(() => componentSettings.value!.showDigitalClock),

			worldState = computed(() => store.state.currentWorldState),
			minecraftTime = computed(() => worldState.value.timeOfDay ? getMinecraftTime(worldState.value.timeOfDay) : undefined),

			formattedTime = computed(() => {
				if (minecraftTime.value) {
					return [
						minecraftTime.value.hours.toString().padStart(2, '0'),
						minecraftTime.value.minutes.toString().padStart(2, '0')
					].join(':');
				} else {
					return '';
				}
			}),

			sunAngle = computed(() => {
				const timeOfDay = minecraftTime.value?.serverTime || 0;

				if (timeOfDay > 23100 || timeOfDay < 12900) {
					//day mode
					let movedTime = timeOfDay + 900;
					movedTime = (movedTime >= 24000) ? movedTime - 24000 : movedTime;
					//Now we have 0 -> 13800 for the day period
					//Divide by 13800*2=27600 instead of 24000 to compress day
					return ((movedTime) / 27600 * 2 * Math.PI);
				} else {
					//night mode
					const movedTime = timeOfDay - 12900;
					//Now we have 0 -> 10200 for the night period
					//Divide by 10200*2=20400 instead of 24000 to expand night
					return Math.PI + ((movedTime) / 20400 * 2 * Math.PI);
				}
			}),
			moonAngle = computed(() => sunAngle.value + Math.PI),

			sunStyle = computed(() => {
				if (typeof worldState.value.timeOfDay !== 'undefined') {
					return {'transform': 'translate(' + Math.round(-50 * Math.cos(sunAngle.value)) + 'px, ' + Math.round(-50 * Math.sin(sunAngle.value)) + 'px)'};
				} else {
					return {'transform': 'translate(-150px, -150px)'};
				}
			}),

			moonStyle = computed(() => {
				if (typeof worldState.value.timeOfDay !== 'undefined') {
					return {'transform': 'translate(' + Math.round(-50 * Math.cos(moonAngle.value)) + 'px, ' + Math.round(-50 * Math.sin(moonAngle.value)) + 'px)'};
				} else {
					return {'transform': 'translate(-150px, -150px)'};
				}
			}),

			sunIcon = computed(() => {
				if (componentSettings.value!.showWeather) {
					if (worldState.value.thundering) {
						return 'clock_sun_storm';
					} else if (worldState.value.raining) {
						return 'clock_sun_rain';
					}
				}

				return 'clock_sun';
			}),

			moonIcon = computed(() => {
				if (componentSettings.value!.showWeather) {
					if (worldState.value.thundering) {
						return 'clock_moon_storm';
					} else if (worldState.value.raining) {
						return 'clock_moon_rain';
					}
				}

				return 'clock_moon';
			});

		return {
			digital,
			showTime,

			minecraftTime,
			formattedTime,

			sunStyle,
			moonStyle,

			sunIcon,
			moonIcon
		}
	}
})
</script>

<style lang="scss" scoped>
	@import '../../../scss/placeholders';

	.clock {
		@extend %panel;
		position: relative;
		width: 15rem;
		height: 6rem;
		font-family: monospace;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.5rem 2rem;
		overflow: hidden;

		.clock__time {
			text-align: center;
			font-size: 2rem;
			line-height: 2rem;
			margin-top: auto;
			background-color: var(--background-base);
			z-index: 1;
			padding: 0.1rem 0.1rem 0;
			border-radius: 0.3rem;

			&.night {
				color: var(--text-night);
			}

			&.day {
				color: var(--text-day);
			}

			&.night, &.day {
				transition: color 8s 8s linear;
			}
		}

		.clock__sun,
		.clock__moon {
			position: absolute;
			top: 0;
			bottom: 0;
			left: 0;
			right: 0;

			svg {
				width: 15rem;
				height: 12rem;
			}
		}

		&.clock--digital {
			justify-content: center;
			height: var(--ui-button-size);
			width: auto;

			.clock__sun,
			.clock__moon {
				display: none;
			}

			.clock__time {
				margin: 0;
				font-size: 3rem;
			}
		}

		@media (max-width: 480px), (max-height: 480px) {
			transform: scale(calc((1/6)*5));
			transform-origin: top center
		}
	}
	</style>
