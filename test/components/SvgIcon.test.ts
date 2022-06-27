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
import SVGIcon from '../../src/Components/SVGIcon.vue';

describe('SVGIcon', async () => {
	it('exists', () => {
		expect(SVGIcon).toBeTruthy()
	});

	const wrapper = mount(SVGIcon, {
		props: {
			name: 'maps',
		},
	});

	it('displays the correct icon', () => {
		expect(wrapper.find('use').attributes().href).toEqual('#icon--maps');
	});

	it('has the correct classname', () => {
		expect(wrapper.element.classList.contains('svg-icon--maps')).toBeTruthy();
	});

	it('displays the correct icon when updated', async () => {
		await wrapper.setProps({
			name: 'servers',
		});
		expect(wrapper.find('use').attributes().href).toEqual('#icon--servers');
	});

	it('has the correct classname when updated', () => {
		expect(wrapper.element.classList.contains('svg-icon--servers')).toBeTruthy();
	});

	it('doesn\'t render <title> when not provided', () => {
		expect(wrapper.find('title').exists()).toBeFalsy();
	});

	it('renders <title> when provided', async () => {
		await wrapper.setProps({
			title: 'test icon title',
		});
		expect(wrapper.text()).toContain('test icon title');
	});
});
