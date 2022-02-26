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

import defaultImage from "@/assets/images/player_face.png";
import {PlayerImageQueueEntry, LiveAtlasPlayer, LiveAtlasPlayerImageSize} from "@/index";
import {useStore} from "@/store";

const playerImageCache = new Map<string, HTMLImageElement>(),
	playerImageUnresolvedCache = new Map<string, Promise<HTMLImageElement>>(),
	playerImagesLoading = new Set<string>(),

	playerImageQueue: PlayerImageQueueEntry[] = [];

/**
 * Returns the corresponding pixel size for the given {@see LiveAtlasPlayerImageSize}
 * @param {LiveAtlasPlayerImageSize} imageSize The image size to get the pixel size for
 * @returns The pixel size
 */
export const getImagePixelSize = (imageSize: LiveAtlasPlayerImageSize) => {
	switch (imageSize) {
		case 'large':
		case 'body':
			return 32;

		case 'small':
		default:
			return 16;
	}
}

/**
 * Creates an {@see HTMLImageElement} containing an image representing the given {@see LiveAtlasPlayer}
 * at the given {@see LiveAtlasPlayerImageSize} and ensures it has loaded successfully
 *
 * If an image has previously been loaded for the same player and image size, a cached copy of the image element
 * will be returned; Otherwise an attempt will be made to load the player image from the URL specified by the current
 * {@see LiveAtlasMapProvider}
 *
 * The number of concurrent image loads is limited and additional loads will be queued. If this method is called
 * with the same player and image size multiple times, the load will only be queued once and the same element will be
 * returned for all calls.
 *
 * @param {LiveAtlasPlayer} player The player to retrieve the image for
 * @param {LiveAtlasPlayerImageSize} size The image size to retrieve
 * @returns {Promise<HTMLImageElement>} A promise which will resolve to a {@see HTMLImageElement} with the loaded player
 * image as the src. The promise will reject if the image fails to load
 */
export const getPlayerImage = (player: LiveAtlasPlayer | string, size: LiveAtlasPlayerImageSize): Promise<HTMLImageElement> => {
	const account = typeof player === 'string' ? player : player.name,
		uuid = typeof player === 'string' ? undefined : player.uuid,
		cacheKey = `${account}-${size}`;

	if (playerImageCache.has(cacheKey)) {
		return Promise.resolve(playerImageCache.get(cacheKey) as HTMLImageElement);
	}

	if (playerImageUnresolvedCache.has(cacheKey)) {
		return playerImageUnresolvedCache.get(cacheKey) as Promise<HTMLImageElement>;
	}

	const promise = new Promise((resolve, reject) => {
		const faceImage = new Image();

		faceImage.onload = function () {
			playerImageCache.set(cacheKey, faceImage);
			playerImagesLoading.delete(cacheKey);
			tickPlayerImageQueue();
			resolve(faceImage);
		};

		faceImage.onerror = function (e) {
			console.warn(`Failed to retrieve face of ${account} with size ${size}!`);
			playerImagesLoading.delete(cacheKey);
			tickPlayerImageQueue();
			reject(e);
		};

		playerImageQueue.push({
			name: account,
			uuid,
			size,
			cacheKey,
			image: faceImage,
		});
	}).finally(() => playerImageUnresolvedCache.delete(cacheKey)) as Promise<HTMLImageElement>;

	playerImageUnresolvedCache.set(cacheKey, promise);
	tickPlayerImageQueue();

	return promise;
}

/**
 * Returns the default "Steve" player image. This image can be used as a placeholder whilst waiting for
 * {@see getPlayerImage} to complete
 * @returns The default player image
 */
export const getDefaultPlayerImage = () => {
	return defaultImage;
}

/**
 * Ticks the player image load queue, starting additional image loads if any are queued and the concurrent load limit
 * hasn't been hit
 */
const tickPlayerImageQueue = () => {
	if (playerImagesLoading.size > 8 || !playerImageQueue.length) {
		return;
	}

	const image = playerImageQueue.pop() as PlayerImageQueueEntry;

	playerImagesLoading.add(image.cacheKey);
	image.image.src = useStore().state.components.players.imageUrl(image);

	tickPlayerImageQueue();
}

/**
 * Clears the player image cache
 * Future calls to {@see getPlayerImage} will result in fresh image loads
 */
export const clearPlayerImageCache = () => {
	playerImageCache.clear();
}
