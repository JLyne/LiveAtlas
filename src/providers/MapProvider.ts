import {
	HeadQueueEntry,
	LiveAtlasMapProvider,
	LiveAtlasServerDefinition,
	LiveAtlasWorldDefinition
} from "@/index";
import {useStore} from "@/store";
import {computed, watch} from "@vue/runtime-core";
import {WatchStopHandle} from "vue";

export default abstract class MapProvider implements LiveAtlasMapProvider {
	protected readonly store = useStore();
	protected readonly config: LiveAtlasServerDefinition;
	private readonly currentWorldUnwatch: WatchStopHandle;

	protected constructor(config: LiveAtlasServerDefinition) {
		this.config = config;
		const currentWorld = computed(() => this.store.state.currentWorld);

		this.currentWorldUnwatch = watch(currentWorld, (newValue) => {
			if (newValue) {
				this.populateWorld(newValue);
			}
		});
	}

	abstract loadServerConfiguration(): Promise<void>;
	abstract populateWorld(world: LiveAtlasWorldDefinition): Promise<void>;
	abstract sendChatMessage(message: string): void;

	abstract startUpdates(): void;
	abstract stopUpdates(): void;

	abstract getPlayerHeadUrl(head: HeadQueueEntry): string;
    abstract getTilesUrl(): string;
    abstract getMarkerIconUrl(icon: string): string;

	destroy() {
		this.currentWorldUnwatch();
	}

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
