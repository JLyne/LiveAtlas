import {State, Store} from "@/store";
import {DynmapUrlConfig} from "@/dynmap";

declare module "*.png" {
   const value: any;
   export = value;
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module '@vue/runtime-core' {
	// provide typings for `this.$store`
	interface ComponentCustomProperties {
		$store: Store<State>
	}
}

interface LiveAtlasServerDefinition {
	id: string
	label?: string
}

interface LiveAtlasDynmapServerDefinition extends LiveAtlasServerDefinition {
	type: 'dynmap',
	dynmap: DynmapUrlConfig,
}

interface LiveAtlasMessageConfig {
	chatPlayerJoin: string;
	chatPlayerQuit: string;
	chatAnonymousJoin: string;
	chatAnonymousQuit: string;
	chatNoMessages: string;
	chatLogin: string;
	chatLoginLink: string;
	chatSend: string;
	chatErrorNotAllowed: string;
	chatErrorRequiresLogin: string;
	chatErrorCooldown: string;
	chatErrorDisabled: string;
	chatErrorUnknown: string;
	headingServers: string;
	headingWorlds: string;
	headingPlayers: string;
}