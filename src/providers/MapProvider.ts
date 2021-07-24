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

	abstract destroy(): void;
	abstract loadServerConfiguration(): Promise<void>;
	abstract loadWorldConfiguration(world: LiveAtlasWorldDefinition): Promise<void>;
	abstract sendChatMessage(message: string): void;
	abstract startUpdates(): void;
	abstract stopUpdates(): void;
}
