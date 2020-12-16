/*
 * Copyright 2020 James Lyne
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

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
