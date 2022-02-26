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

import {LiveAtlasGlobalConfig, LiveAtlasServerDefinition} from "@/index";
import ConfigurationError from "@/errors/ConfigurationError";
import {DynmapUrlConfig} from "@/dynmap";
import {useStore} from "@/store";
import MapProvider from "@/providers/MapProvider";
import DynmapMapProvider from "@/providers/DynmapMapProvider";

const expectedConfigVersion = 1,
	registeredProviders: Map<string, new (config: any) => MapProvider> = new Map(),
	serverProviders: Map<string, MapProvider> = new Map();

/**
 * Registers the given {@link MapProvider} with the given id
 * Server entries in {@link LiveAtlasGlobalConfig} with the given id will use the given MapProvider
 * @param {string} id The id
 * @param {new (config: any) => MapProvider} provider The MapProvider
 */
export const registerMapProvider = (id: string, provider: new (config: any) => MapProvider) => {
	if(registeredProviders.has(id)) {
		throw new TypeError(`${id} is already registered`);
	}

	registeredProviders.set(id, provider);
}

/**
 * Gets the MapProvider for the given server
 * @param {string} server Name of the server
 * @returns The MapProvider, if one exists
 */
export const getServerMapProvider = (server: string): MapProvider | undefined => {
	return serverProviders.get(server);
}

/**
 * Attempts to load server definitions from the provided config object
 * @param {Object} config Config object to load server definitions from
 * @returns Map of loaded servers
 * @see {@link loadConfig}
 * @private
 */
const loadLiveAtlasConfig = (config: any): Map<string, LiveAtlasServerDefinition> => {
	const check = '\nCheck your server configuration in index.html is correct.',
		result = new Map<string, LiveAtlasServerDefinition>();

	if (!Object.keys(config).length) {
		throw new ConfigurationError(`No servers defined. ${check}`);
	}

	for (const server in config) {
		if (!Object.hasOwnProperty.call(config, server)) {
			continue;
		}

		const serverConfig = config[server];
		let foundProvider = false;

		for (const mapProvider of registeredProviders) {
			if(serverConfig && Object.hasOwnProperty.call(serverConfig, mapProvider[0])) {
				try {
					serverProviders.set(server, new mapProvider[1](serverConfig[mapProvider[0]]));
				} catch(e: any) {
					e.message = `Server "${server}": ${e.message}. ${check}`;
					throw e;
				}

				result.set(server, serverConfig);
				foundProvider = true;
			}
		}

		if(!foundProvider) {
			throw new ConfigurationError(`Server "${server}": No configuration found for any supported map type. ${check}`);
		}

		serverConfig.id = server;
	}

	return result;
};

/**
 * Attempts to load a Dynmap server definition from the given object
 * @param {Object} config Config object to load from
 * @see {@link loadConfig}
 * @private
 */
const loadDefaultConfig = (config: DynmapUrlConfig): Map<string, LiveAtlasServerDefinition> => {
	const check = '\nCheck your standalone/config.js file exists and is being loaded correctly.';
	const result = new Map<string, LiveAtlasServerDefinition>();
	result.set('dynmap', {
		id: 'dynmap',
		label: 'dynmap',
		dynmap: config
	});

	try {
		serverProviders.set('dynmap', new DynmapMapProvider(config));
	} catch (e: any) {
		e.message = `${e.message}. ${check}`;
		throw e;
	}

	return result;
};

/**
 * Attempts to load server definitions from the provided config object
 * If no servers definitions are present in the object, an attempt will be made to load a Dynmap server definition from
 * a global dynmap config object defined by standalone/config.js
 * @param {Object} config Config object to load server definitions from
 * @returns Map of loaded servers
 * @private
 */
export const loadConfig = (config: LiveAtlasGlobalConfig): Map<string, LiveAtlasServerDefinition> => {
	if (!config) {
		throw new ConfigurationError(`No configuration found.\nCheck for any syntax errors in your configuration in index.html. Your browser console may contain additional information.`);
	}

	if (config.version !== expectedConfigVersion) {
		throw new ConfigurationError(`Configuration version mismatch.\nUse a fresh copy of index.html from your current LiveAtlas version (${useStore().state.version}) and reapply any customisations.`);
	}

	if (typeof config.servers !== 'undefined') {
		return loadLiveAtlasConfig(config.servers);
	}

	return loadDefaultConfig(window.config?.url || null);
};

