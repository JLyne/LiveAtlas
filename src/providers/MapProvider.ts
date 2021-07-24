import {LiveAtlasMapProvider, LiveAtlasServerDefinition, LiveAtlasWorldDefinition} from "@/index";
import {useStore} from "@/store";
import {watch} from "vue";
import {computed} from "@vue/runtime-core";

export default abstract class MapProvider implements LiveAtlasMapProvider {
	protected readonly store = useStore();

	protected constructor(config: LiveAtlasServerDefinition) {
		const currentWorld = computed(() => this.store.state.currentWorld);

		watch(currentWorld, (newValue) => {
			if(newValue) {
				this.loadWorldConfiguration(newValue);
			}
		});
	}

	abstract loadServerConfiguration(): Promise<void>;
	abstract loadWorldConfiguration(world: LiveAtlasWorldDefinition): Promise<void>;
	abstract sendChatMessage(message: string): void;
	abstract startUpdates(): void;
	abstract stopUpdates(): void;
	abstract destroy(): void;

	protected static async fetchJSON(url: string, signal: AbortSignal) {
		let response, json;

		try {
			response = await fetch(url, {signal});
		} catch(e) {
			if(e instanceof DOMException && e.name === 'AbortError') {
				console.warn(`Request aborted (${url}`);
				throw e;
			} else {
				console.error(e);
			}

			throw new Error(`Network request failed`);
		}

		if (!response.ok) {
			throw new Error(`Network request failed (${response.statusText || 'Unknown'})`);
		}

		try {
			json = await response.json();
		} catch(e) {
			if(e instanceof DOMException && e.name === 'AbortError') {
				console.warn(`Request aborted (${url}`);
				throw e;
			} else {
				throw new Error('Request returned invalid json');
			}
		}

		return json;
	}
}
