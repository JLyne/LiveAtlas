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