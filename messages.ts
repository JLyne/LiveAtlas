/*
 * Copyright 2022 James Lyne
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export const globalMessages = [
	'chatNoMessages',
	'chatTitle',
	'chatLogin',
	'chatSend',
	'chatPlaceholder',
	'chatErrorDisabled',
	'chatErrorUnknown',
	'serversHeading',
	'markersHeading',
	'markersSkeleton',
	'markersSetSkeleton',
	'markersUnnamed',
	'markersSearchPlaceholder',
	'markersSearchSkeleton',
	'worldsSkeleton',
	'playersSkeleton',
	'playersTitle',
	'playersTitleHidden',
	'playersTitleOtherWorld',
	'playersSearchPlaceholder',
	'playersSearchSkeleton',
	'followingHeading',
	'followingUnfollow',
	'followingTitleUnfollow',
	'followingHidden',
	'linkTitle',
	'loadingTitle',
	'locationRegion',
	'locationChunk',
	'contextMenuCopyLink',
	'contextMenuCenterHere',
	'toggleTitle',
	'mapTitle',
	'layersTitle',
	'copyToClipboardSuccess',
	'copyToClipboardError',
	'loginTitle',
	'loginHeading',
	'loginUsernameLabel',
	'loginPasswordLabel',
	'loginSubmit',
	'loginErrorUnknown',
	'loginErrorDisabled',
	'loginErrorIncorrect',
	'loginSuccess',
	'registerHeading',
	'registerDescription',
	'registerConfirmPasswordLabel',
	'registerCodeLabel',
	'registerSubmit',
	'registerErrorUnknown',
	'registerErrorDisabled',
	'registerErrorVerifyFailed',
	'registerErrorIncorrect',
	'logoutTitle',
	'logoutErrorUnknown',
	'logoutSuccess',
	'closeTitle',
	'showMore',
	'day',
	'night',
	'nightDay',
] as const;

export const serverMessages = [
	'chatPlayerJoin',
	'chatPlayerQuit',
	'chatAnonymousJoin',
	'chatAnonymousQuit',
	'chatErrorNotAllowed',
	'chatErrorRequiresLogin',
	'chatErrorCooldown',
	'worldsHeading',
	'playersHeading',
] as const;
