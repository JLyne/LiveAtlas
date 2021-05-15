import { ComponentCustomProperties } from 'vue'
import {State, Store} from "@/store";

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