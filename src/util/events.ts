/*
 * Copyright 2021 James Lyne
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

const navigationKeys = new Set<string>([
	'ArrowUp',
	'ArrowDown',
	'ArrowLeft',
	'ArrowRight',
	'Home',
	'End'
]);

export const handleKeyboardEvent = (e: KeyboardEvent, elements: HTMLElement[]) => {
	if(!e.target) {
		return;
	}

	if(navigationKeys.has(e.key)) {
		const position = elements.indexOf(e.target as HTMLElement);

		if(position < 0) {
			return;
		}

		let newPosition = position;

		switch(e.key) {
			case 'ArrowUp':
			case 'ArrowLeft':
				newPosition = position - 1;
				break;

			case 'ArrowDown':
			case 'ArrowRight':
				newPosition = position + 1;
				break;

			case 'Home':
				newPosition = 0;
				break;

			case 'End':
				newPosition = elements.length - 1;
				break;
		}

		if(newPosition < 0) {
			newPosition = elements.length - 1;
		} else if(newPosition >= elements.length) {
			newPosition = 0;
		}

		(elements[newPosition] as HTMLElement).focus();
		e.preventDefault();
	} else if(e.key === 'Enter' && e.target) {
		const mouseEvent = new MouseEvent('click', {
			ctrlKey: e.ctrlKey,
			shiftKey: e.shiftKey,
			metaKey: e.metaKey,
			altKey: e.altKey,
			bubbles: true,
		});

		e.target.dispatchEvent(mouseEvent);
		e.preventDefault();
	}
}
