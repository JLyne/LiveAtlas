import { ComponentCustomProperties } from 'vue'
import {State, Store} from "@/store";

declare module '@vue/runtime-core' {
	// provide typings for `this.$store`
	interface ComponentCustomProperties {
		$store: Store<State>
	}
}