<!--
  - Copyright 2022 James Lyne
  -
  - Licensed under the Apache License, Version 2.0 (the "License");
  - you may not use this file except in compliance with the License.
  - You may obtain a copy of the License at
  -
  - http://www.apache.org/licenses/LICENSE-2.0
  -
  - Unless required by applicable law or agreed to in writing, software
  - distributed under the License is distributed on an "AS IS" BASIS,
  - WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  - See the License for the specific language governing permissions and
  - limitations under the License.
  -->

<template>
	<form :class="{'form': true, 'form--invalid': invalid}" @submit.prevent="login" ref="form" novalidate>
		<h3>{{ loginHeading }}</h3>

		<div class="form__group">
			<label for="login-username" class="form__label" >{{ usernameLabel }}</label>
			<input id="login-username" type="text" name="username" autocomplete="username"
             v-model="loginUsername" required ref="usernameField"/>
		</div>

		<div class="form__group">
			<label for="login-password" class="form__label" >{{ passwordLabel }}</label>
			<input id="login-password" type="password" name="password" autocomplete="current-password"
             v-model="loginPassword" required/>
		</div>

		<div v-if="error" role="alert" aria-live="assertive" class="form__group alert">{{ error }}</div>

		<div class="form__group">
			<button type="submit" :disabled="submitting">{{ loginSubmit }}</button>
		</div>
	</form>
</template>

<script lang="ts">
import {defineComponent, watch, onMounted, computed, nextTick, ref} from "vue";
import {notify} from "@kyvg/vue3-notification";
import {useStore} from "@/store";
import {ActionTypes} from "@/store/action-types";
import {MutationTypes} from "@/store/mutation-types";

export default defineComponent({
	setup() {
		const store = useStore(),
			form = ref<HTMLFormElement | null>(null),
			usernameField = ref<HTMLFormElement | null>(null),

			loginModalVisible = computed(() => store.state.ui.visibleModal === 'login'),

			heading = computed(() => store.state.messages.loginHeading),
			loginHeading = computed(() => store.state.messages.loginHeading),
			usernameLabel = computed(() => store.state.messages.loginUsernameLabel),
			passwordLabel = computed(() => store.state.messages.loginPasswordLabel),
			loginSubmit = computed(() => store.state.messages.loginSubmit),
			loginSuccess = computed(() => store.state.messages.loginSuccess),

			loginUsername = ref(''),
			loginPassword = ref(''),

			submitting = ref(false),
			invalid = ref(false),
			error = ref(null);

		const focusUsername = () => usernameField.value!.focus();

		watch(loginModalVisible, visible => {
			if(visible) {
				nextTick(focusUsername);
			} else {
				loginUsername.value = '';
				loginPassword.value = '';
			}
		});

		onMounted(() => {
			if(loginModalVisible.value) {
				nextTick(focusUsername);
			}
		})

		const login = async () => {
			error.value = null;
			invalid.value = !form.value!.reportValidity();

			if(invalid.value) {
				return;
			}

			try {
				submitting.value = true;

				await store.dispatch(ActionTypes.LOGIN, {
					username: loginUsername.value,
					password: loginPassword.value,
				});

				store.commit(MutationTypes.HIDE_UI_MODAL, 'login');
				notify(loginSuccess.value);
			} catch(e: any) {
				error.value = e;
			} finally {
				submitting.value = false;
			}
		};
		return {
			form,
			usernameField,

			heading,
			loginHeading,
			usernameLabel,
			passwordLabel,
			loginSubmit,

			loginUsername,
			loginPassword,

			submitting,
			invalid,
			error,

			login,
		};
	}
});
</script>
