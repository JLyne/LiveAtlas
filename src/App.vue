<!--
  - Copyright 2021 James Lyne
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
	<Map></Map>
	<ChatBox v-if="chatBoxEnabled" v-show="chatBoxEnabled && chatVisible"></ChatBox>
	<LoginModal v-if="loginEnabled" v-show="loginModalVisible" :required="loginRequired"></LoginModal>
	<Sidebar></Sidebar>
	<notifications position="bottom center" :speed="250" :max="3" :ignoreDuplicates="true" classes="notification" />
</template>

<script lang="ts">
import {computed, defineComponent, onBeforeUnmount, onMounted, onUnmounted, ref, watch} from 'vue';
import Map from './components/Map.vue';
import Sidebar from './components/Sidebar.vue';
import ChatBox from './components/ChatBox.vue';
import {useStore} from "@/store";
import {ActionTypes} from "@/store/action-types";
import {parseUrl} from '@/util';
import {hideSplash, showSplash, showSplashError} from '@/util/splash';
import {MutationTypes} from "@/store/mutation-types";
import {LiveAtlasServerDefinition, LiveAtlasUIElement} from "@/index";
import LoginModal from "@/components/login/LoginModal.vue";
import {notify} from "@kyvg/vue3-notification";

export default defineComponent({
	name: 'App',
	components: {
		Map,
		Sidebar,
		ChatBox,
		LoginModal
	},

	setup() {
		let loadingTimeout = 0;

		const store = useStore(),
			title = computed(() => store.getters.pageTitle),
			currentUrl = computed(() => store.getters.url),
			currentServer = computed(() => store.state.currentServer),
			configurationHash = computed(() => store.state.configurationHash),
			chatBoxEnabled = computed(() => store.state.components.chatBox),
			chatVisible = computed(() => store.state.ui.visibleElements.has('chat')),

			loggedIn = computed(() => store.state.loggedIn), //Whether the user is currently logged in
			loginRequired = computed(() => store.state.loginRequired), //Whether logging is required to view the current server
			loginEnabled = computed(() => store.state.components.login || loginRequired.value), //Whether logging in is enabled for the current server

			//Hide the login modal if we are logged out on a login-required server, but the server list is open
			//Allows switching servers without the modal overlapping
			loginModalVisible = computed(() => store.state.ui.visibleModal === 'login'
				&& (!loginRequired.value || !store.state.ui.visibleElements.has('maps'))),

			loading = ref(false),
			loadingAttempts = ref(0),

			loadConfiguration = async () => {
				try {
					clearTimeout(loadingTimeout);
					showSplash(!loadingAttempts.value);
					loading.value = true;

					await store.dispatch(ActionTypes.STOP_UPDATES, undefined);
					store.commit(MutationTypes.RESET, undefined);
					await store.dispatch(ActionTypes.LOAD_CONFIGURATION, undefined);
					await store.dispatch(ActionTypes.START_UPDATES, undefined);

					requestAnimationFrame(() => {
						hideSplash();

						const map = document.getElementById('#app');

						if(map) {
							(map as HTMLElement).focus();
						}
					});
				} catch(e: any) {
					//Request was aborted, probably because another server was selected before the request finished. Don't retry
					if(e instanceof DOMException && e.name === 'AbortError') {
						return;
					}

					//Logging in is required
					if(loginRequired.value) {
						return;
					}

					//Any other errors
					const error = `Failed to load server configuration for '${store.state.currentServer!.id}'`;
					console.error(`${error}:`, e);
					showSplashError(`${error}\n${e}`, false, ++loadingAttempts.value);

					clearTimeout(loadingTimeout);
					loadingTimeout = setTimeout(() => loadConfiguration(), 1000);
				} finally {
					loading.value = false;
				}
			},

			handleUrl = () => {
				const parsedUrl = parseUrl();

				if(parsedUrl) {
					//Remove legacy url if one was parsed
					if(parsedUrl.legacy) {
						const url = new URL(window.location.href);
						url.searchParams.delete('worldname'); //Dynmap
						url.searchParams.delete('world'); //Pl3xmap
						url.searchParams.delete('mapname');
						url.searchParams.delete('x');
						url.searchParams.delete('y');
						url.searchParams.delete('z');
						url.searchParams.delete('zoom');
						history.replaceState({}, '', url.toString());
					}

					store.commit(MutationTypes.SET_PARSED_URL, parsedUrl);
				}
			},

			onResize = () => {
				store.commit(MutationTypes.SET_SMALL_SCREEN, window.innerWidth < 480 || window.innerHeight < 500);
			},

			onKeydown = (e: KeyboardEvent) => {
				if(!e.ctrlKey || !e.shiftKey) {
					return;
				}

				let element: LiveAtlasUIElement;

				//Disable shortcuts if modal is open - except login required to allow server list toggling
				if(store.state.ui.visibleModal && !loginRequired.value) {
					return;
				}

				switch(e.key) {
					case 'M':
						element = 'maps';
						break;
					case 'C':
						element = 'chat';
						break;
					case 'P':
						element = 'players';
						break;
					case 'L':
						element = 'layers';
						break;
					default:
						return;
				}

				e.preventDefault();
				store.commit(MutationTypes.TOGGLE_UI_ELEMENT_VISIBILITY, element);
			},

			onUrlChange = () => {
				const parsedUrl = parseUrl();

				if(parsedUrl) {
					store.commit(MutationTypes.SET_PARSED_URL, parsedUrl);
				}
			};

		watch(title, (title) => document.title = title);
		watch(currentUrl, (url) => window.history.replaceState({}, '', url));
		watch(currentServer, (newServer?: LiveAtlasServerDefinition) => {
			if(!newServer) {
				return;
			}

			loadingAttempts.value = 0;
			window.history.replaceState({}, '', newServer.id);
			loadConfiguration();
		}, {deep: true});
		watch(configurationHash, async (newHash, oldHash) => {
			if(newHash && oldHash) {
				await loadConfiguration();
			}
		});
		watch(loggedIn, async () => {
			if(!loading.value) {
				console.log('Login state changed. Reloading configuration');
				await loadConfiguration();
			}
		});
		watch(loginRequired, (newValue) => {
			if(newValue) {
				store.commit(MutationTypes.SET_UI_ELEMENT_VISIBILITY, {
					element: 'maps',
					state: false,
				});
				store.commit(MutationTypes.SHOW_UI_MODAL, 'login');
				notify('Login required');
				showSplashError('Login required', true, 1);
			} else {
				store.commit(MutationTypes.HIDE_UI_MODAL, 'login');
			}
		})

		onMounted(() => loadConfiguration());
		onBeforeUnmount(() => {
			store.dispatch(ActionTypes.STOP_UPDATES, undefined);
			clearTimeout(loadingTimeout);
		});

		handleUrl();
		onResize();

		onMounted(() => {
			window.addEventListener('resize', onResize);
			window.addEventListener('keydown', onKeydown);
			window.addEventListener('hashchange', onUrlChange);
		});
		onUnmounted(() => {
			window.addEventListener('resize', onResize);
			window.addEventListener('keydown', onKeydown);
			window.addEventListener('hashchange', onUrlChange);
		});

		return {
			chatBoxEnabled,
			chatVisible,
			loginEnabled,
			loginRequired,
			loginModalVisible
		}
	},
});
</script>
