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
	<form :class="{'form': true, 'form--invalid': invalid}" @submit.prevent="register" ref="form" novalidate>
		<h3>{{ messageHeading }}</h3>
		<p>{{ messageDescription }}</p>

		<div class="form__group">
			<label for="register-username" class="form__label" >{{ messageUsernameLabel }}</label>
			<input id="register-username" type="text" name="username" autocomplete="username"
			       v-model="valueUsername" required />
		</div>

		<div class="form__group">
			<label for="register-password" class="form__label" >{{ messagePasswordLabel }}</label>
			<input id="register-password" type="password" name="password" autocomplete="new-password"
			       v-model="valuePassword" required />
		</div>

		<div class="form__group">
			<label for="register-confirm-password" class="form__label">{{ messageConfirmPasswordLabel }}</label>
			<input id="register-confirm-password" type="password" name="confirm_password"
			       autocomplete="new-password" v-model="valuePassword2" required ref="confirmPasswordField"
			       />
		</div>

		<div class="form__group">
			<label for="register-code" class="form__label">{{ messageRegisterCodeLabel }}</label>
			<input id="register-code" type="tel" name="code" minlength="9" maxlength="9" v-model="valueCode" required />
		</div>

		<div v-if="error" role="alert" aria-live="assertive" class="form__group alert">{{ error }}</div>

		<div class="form__group">
			<button type="submit" :disabled="submitting">{{ messageSubmit }}</button>
		</div>
	</form>
</template>

<script lang="ts">
import {defineComponent, watch} from "@vue/runtime-core";
import {useStore} from "@/store";
import {computed, ref} from "vue";
import {ActionTypes} from "@/store/action-types";
import {MutationTypes} from "@/store/mutation-types";

export default defineComponent({
	setup() {
		const store = useStore(),
			form = ref<HTMLFormElement | null>(null),
			confirmPasswordField = ref<HTMLInputElement | null>(null),

			loginModalVisible = computed(() => store.state.ui.visibleModal === 'login'),

			messageUsernameLabel = computed(() => store.state.messages.loginUsernameLabel),
			messagePasswordLabel = computed(() => store.state.messages.loginPasswordLabel),
			messageConfirmPasswordLabel = computed(() => store.state.messages.registerConfirmPasswordLabel),
			messageRegisterCodeLabel = computed(() => store.state.messages.registerCodeLabel),

			messageHeading = computed(() => store.state.messages.registerHeading),
			messageDescription = computed(() => store.state.messages.registerDescription),
			messageSubmit = computed(() => store.state.messages.registerSubmit),
			messagePasswordMismatch = computed(() => store.state.messages.registerErrorVerifyFailed),

			valueUsername = ref(''),
			valuePassword = ref(''),
			valuePassword2 = ref(''),
			valueCode = ref(''),

			submitting = ref(false),
			invalid = ref(false),
			error = ref(null);

		watch(loginModalVisible, (newValue) => {
			if(!newValue) {
				valueUsername.value = '';
				valuePassword.value = '';
				valuePassword2.value = '';
				valueCode.value = '';
			}
		});

		const checkPasswords = () => {
			if(valuePassword.value !== valuePassword2.value) {
				confirmPasswordField.value!.setCustomValidity(messagePasswordMismatch.value)
			} else {
				confirmPasswordField.value!.setCustomValidity('');
			}
		}

		const register = async () => {
			error.value = null;
			checkPasswords();
			invalid.value = !form.value!.reportValidity();

			if(invalid.value) {
				return;
			}

			try {
				submitting.value = true;

				await store.dispatch(ActionTypes.REGISTER, {
					username: valueUsername.value,
					password: valuePassword.value,
					code: valueCode.value,
				});

				store.commit(MutationTypes.HIDE_UI_MODAL, 'login');
			} catch(e: any) {
				error.value = e;
			} finally {
				submitting.value = false;
			}
		}

		return {
			form,
			confirmPasswordField,

			messageHeading,
			messageDescription,
			messageUsernameLabel,
			messagePasswordLabel,
			messageConfirmPasswordLabel,
			messageRegisterCodeLabel,
			messageSubmit,

			valueUsername,
			valuePassword,
			valuePassword2,
			valueCode,

			submitting,
			invalid,
			error,

			register
		};
	}
});
</script>

<style lang="scss" scoped>
	p {
		white-space: pre-line;
	}
</style>
