import {
	createStore,
	Store as VuexStore,
	// createLogger,
	CommitOptions, DispatchOptions,
} from 'vuex';

import {getters, Getters} from "@/store/getters";
import {mutations, Mutations} from "@/store/mutations";
import {state, State} from "@/store/state";
import {actions, Actions} from "@/store/actions";

export type Store = Omit<
	VuexStore<State>,
	"commit" | "getters" | "dispatch"
	> & {
	commit<K extends keyof Mutations, P extends Parameters<Mutations[K]>[1]>(
		key: K,
		payload: P,
		options?: CommitOptions,
	):ReturnType<Mutations[K]>;
} & {
	getters: {
		[K in keyof Getters]: ReturnType<Getters[K]>
	};
} & {
	dispatch<K extends keyof Actions>(
		key: K,
		payload: Parameters<Actions[K]>[1],
		options?: DispatchOptions
	):ReturnType<Actions[K]>;
};


export const store = createStore({
	state,
	mutations,
	getters,
	actions,
	// plugins: [createLogger()],
});

// define your own `useStore` composition function
export function useStore() {
  return store as Store;
}
