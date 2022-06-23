/*
 * Copyright 2022 James Lyne
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { mount } from '@vue/test-utils';
import PlayerImage from '@/Components/PlayerImage.vue';
import {getDefaultPlayerImage, getPlayerImage} from "@/util/images";
import {useTestImageProvider} from "../helpers";

describe('PlayerImage', async () => {
	it('exists', () => {
		expect(PlayerImage).toBeTruthy()
	});

	const player = {
		name: 'gamer',
		displayName: 'Gamer',
		armor: 10,
		health: 10,
		sort: 1,
		hidden: false,
		location: {
			x: 0,
			y: 0,
			z: 0,
		}
	},
		wrapper = mount(PlayerImage, {
			props: { player },
		});

	it('displays the default image', () => {
		expect(wrapper.element.getAttribute('src')).toEqual(getDefaultPlayerImage())
	});
});
