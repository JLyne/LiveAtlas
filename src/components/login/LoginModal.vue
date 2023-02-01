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
	<BaseModal id="login" :closeable="!required" :backdrop="!required">
		<template v-slot:header>
			<h2 id="login__heading">{{ heading }}</h2>
		</template>
		<LoginForm></LoginForm>
		<RegisterForm></RegisterForm>
	</BaseModal>
</template>

<script lang="ts">
import {computed, defineComponent} from "vue";
import {useStore} from "@/store";
import LoginForm from "@/components/login/LoginForm.vue";
import RegisterForm from "@/components/login/RegisterForm.vue";
import BaseModal from "@/components/BaseModal.vue";

export default defineComponent({
	components: {BaseModal, RegisterForm, LoginForm},
	props: {
		required: {
			default: false,
			type: Boolean,
		}
	},
	setup() {
		const store = useStore(),
			heading = computed(() => store.state.messages.loginTitle);

		return {
			heading
		};
	}
});
</script>

<style lang="scss" scoped>
	#modal--login {
		::v-deep(.modal__content) {
			display: flex;
			flex-direction: row;
			flex-wrap: wrap;
			align-items: flex-start;
			justify-content: space-between;
		}

		#login__error {
			width: 100%;
			text-align: center;
			margin-bottom: 2rem;
		}

		.form {
			width: calc(50% - 1.5rem);
			box-sizing: border-box;
		}

		@media (max-width: 600px) {
			flex-direction: column;

			.form {
				width: 100%;
			}
		}
	}
</style>
