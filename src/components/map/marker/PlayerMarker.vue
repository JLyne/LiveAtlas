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

<script lang="ts">
import {defineComponent, computed, ref, onMounted, onUnmounted} from "@vue/runtime-core";
import {LayerGroup} from 'leaflet';
import {useStore} from "@/store";
import {PlayerMarker} from "@/leaflet/marker/PlayerMarker";
import {Popup} from "leaflet";
import {LiveAtlasChat, LiveAtlasPlayer} from "@/index";

export default defineComponent({
	props: {
		player: {
			type: Object as () => LiveAtlasPlayer,
			required: true
		},
		layerGroup: {
			type: Object as () => LayerGroup,
			required: true
		}
	},

	setup(props) {
		let chatBalloonCutoff = 0; //Not reactive to avoid unnecessary playerChat recalculations

		const store = useStore(),
			componentSettings = computed(() => store.state.components.playerMarkers),
			currentMap = computed(() => store.state.currentMap),
			currentWorld = computed(() => store.state.currentWorld),
			chatBalloonsEnabled = computed(() => store.state.components.chatBalloons),

			//Whether the marker is currently visible
			markerVisible = ref(false),

			//The player marker
			marker = new PlayerMarker(props.player, {
				smallFace: componentSettings.value!.smallFaces,
				showSkinFace: componentSettings.value!.showSkinFaces,
				showBody: componentSettings.value!.showBodies,
				showHealth: componentSettings.value!.showHealth,
				interactive: false,
				pane: 'players',
			}),

			//Popup for chat messages, if chat balloons are enabled
			chatBalloon = new Popup({
				autoClose: false,
				autoPan: false,
				keepInView: false,
				closeButton: false,
				closeOnEscapeKey: false,
				closeOnClick: false,
				className: 'leaflet-popup--chat',
				minWidth: 0,
			}),

			chatBalloonVisible = ref(false),

			//Timeout for closing the chat balloon
			chatBalloonTimeout = ref(0),

			//Cutoff time for chat messages
			//Only messages newer than this time will be shown in the chat balloon
			//Used to prevent old seen messages reappearing in some situations

			//Chat messages to show in the popup
			playerChat = computed(() => {
				const messages: LiveAtlasChat[] = [];

				if(!chatBalloonsEnabled.value) {
					return messages;
				}

				for(const message of store.state.chat.messages) {
					//Stop looking if we reach messages we've already seen
					if(message.timestamp <= chatBalloonCutoff) {
						break;
					}

					//Limit to 5 messages
					if(messages.length === 5) {
						break;
					}

					if(message.type === 'chat' && message.playerAccount === props.player.name) {
						messages.push(message);
					}
				}

				//If no suitable messages are found, set the cutoff to the newest messages timestamp
				//This prevents searching the whole message list again for players who don't chat
				if(!messages.length && store.state.chat.messages.length) {
					chatBalloonCutoff = store.state.chat.messages[0].timestamp;
				}

				return messages;
			}),

			updateChatBalloon = () => {
				const content = playerChat.value.reduceRight<string>((previousValue, currentValue) => {
					return previousValue + `<span>${currentValue.message}</span>`;
				}, '');

				//Update balloon if content has changed
				if(content != chatBalloon.getContent() || !chatBalloonVisible.value) {
					chatBalloon.setContent(content);

					if(!chatBalloonVisible.value) {
						props.layerGroup.addLayer(chatBalloon);
						chatBalloonVisible.value = true;

						//Set cutoff to oldest visible message
						chatBalloonCutoff = playerChat.value[playerChat.value.length - 1].timestamp - 1;
					}

					//Reset close timer
					if(chatBalloonTimeout.value) {
						clearTimeout(chatBalloonTimeout.value);
					}

					chatBalloonTimeout.value = setTimeout(() => closeChatBalloon(), 8000);
				}
			},

			closeChatBalloon = () => {
				props.layerGroup.removeLayer(chatBalloon);
				chatBalloonVisible.value = false;

				//Prevent showing any currently visible chat messages again
				if(playerChat.value[0]) {
					chatBalloonCutoff = playerChat.value[0].timestamp;
				}
			},

			enableLayer = () => {
				if(currentMap.value && !markerVisible.value) {
					const latLng = currentMap.value.locationToLatLng(props.player.location);

					props.layerGroup.addLayer(marker);
					marker.setLatLng(latLng);
					chatBalloon.setLatLng(latLng);
					markerVisible.value = true;

					//Prevent showing chat messages which were sent while the player was hidden
					chatBalloonCutoff = new Date().getTime();
				}
			},
			disableLayer = () => {
				if(markerVisible.value) {
					props.layerGroup.removeLayer(marker);
					props.layerGroup.removeLayer(chatBalloon);
					markerVisible.value = false;

					closeChatBalloon();

					if(chatBalloonTimeout.value) {
						clearTimeout(chatBalloonTimeout.value);
					}
				}
			};

		onMounted(() => {
			if(currentMap.value && currentWorld.value!.name === props.player.location.world) {
				enableLayer();
			}
		});

		onUnmounted(() => disableLayer());

		return {
			componentSettings,
			currentMap,
			currentWorld,
			chatBalloonsEnabled,

			marker,
			markerVisible,

			chatBalloon,
			playerChat,
			updateChatBalloon,

			enableLayer,
			disableLayer
		}
	},

	watch: {
		player: {
			deep: true,
			handler(newValue) {
				if(this.currentMap && newValue.location.world === this.currentWorld!.name) {
					if(!this.markerVisible) {
						this.enableLayer();
					} else {
						const latLng = this.currentMap.locationToLatLng(newValue.location);

						this.marker.setLatLng(latLng);
						this.chatBalloon.setLatLng(latLng);
						this.marker.getIcon().update();
					}
				} else if(this.markerVisible) {
					this.disableLayer();
				}
			},
		},
		playerChat(newValue: LiveAtlasChat[]) {
			if(!this.chatBalloonsEnabled || !this.markerVisible || !newValue.length) {
				return;
			}

			this.updateChatBalloon();
		},
		currentWorld(newValue) {
			if(newValue && newValue.name === this.player.location.world) {
				this.enableLayer();
			} else if(this.markerVisible) {
				this.disableLayer();
			}
		},
		currentMap(newValue) {
			if(newValue) {
				const latLng = newValue.locationToLatLng(this.player.location);

				this.marker.setLatLng(latLng);
				this.chatBalloon.setLatLng(latLng);
			}
		}
	},

	render() {
		return null;
	},
})
</script>
