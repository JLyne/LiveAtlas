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

interface LiveAtlasServerDefinition extends DynmapUrlConfig {
	id: string
	label?: string
}