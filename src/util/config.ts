/*
 * Copyright 2021 James Lyne
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

const validateLiveAtlasConfiguration = (config: any): Map<string, LiveAtlasServerDefinition> => {
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

		if (!serverConfig || serverConfig.constructor !== Object || !Object.keys(serverConfig).length) {
			throw new ConfigurationError(`Server '${server}': Configuration missing. ${check}`);
		}

		serverConfig.id = server;

		if(typeof serverConfig.pl3xmap !== 'undefined') {
			serverConfig.type = 'pl3xmap';
		} else if(typeof serverConfig.dynmap !== 'undefined') {
			if (!serverConfig.dynmap || serverConfig.dynmap.constructor !== Object) {
				throw new ConfigurationError(`Server '${server}': Dynmap configuration object missing. ${check}`);
			}

			if (!serverConfig.dynmap.configuration) {
				throw new ConfigurationError(`Server '${server}': Dynmap configuration URL missing. ${check}`);
			}

			if (!serverConfig.dynmap.update) {
				throw new ConfigurationError(`Server '${server}': Dynmap update URL missing. ${check}`);
			}

			if (!serverConfig.dynmap.markers) {
				throw new ConfigurationError(`Server '${server}': Dynmap markers URL missing. ${check}`);
			}

			if (!serverConfig.dynmap.tiles) {
				throw new ConfigurationError(`Server '${server}': Dynmap tiles URL missing. ${check}`);
			}

			if (!serverConfig.dynmap.sendmessage) {
				throw new ConfigurationError(`Server '${server}': Dynmap sendmessage URL missing. ${check}`);
			}

			serverConfig.type = 'dynmap';
		} else {
			throw new ConfigurationError(`Server '${server}': No Dynmap or Pl3xmap configuration defined. ${check}`);
		}

		result.set(server, serverConfig);
	}

	return result;
};

const validateDynmapConfiguration = (config: DynmapUrlConfig): Map<string, LiveAtlasServerDefinition> => {
	const check = '\nCheck your standalone/config.js file exists and is being loaded correctly.';

	if (!config) {
		throw new ConfigurationError(`Dynmap configuration is missing. ${check}`);
	}

	if (!config.configuration) {
		throw new ConfigurationError(`Dynmap configuration URL is missing. ${check}`);
	}

	if (!config.update) {
		throw new ConfigurationError(`Dynmap update URL is missing. ${check}`);
	}

	if (!config.markers) {
		throw new ConfigurationError(`Dynmap markers URL is missing. ${check}`);
	}

	if (!config.tiles) {
		throw new ConfigurationError(`Dynmap tiles URL is missing. ${check}`);
	}

	if (!config.sendmessage) {
		throw new ConfigurationError(`Dynmap sendmessage URL is missing. ${check}`);
	}

	const result = new Map<string, LiveAtlasServerDefinition>();
	result.set('dynmap', {
		id: 'dynmap',
		label: 'dynmap',
		type: 'dynmap',
		dynmap: config
	});

	return result;
};

export const getServerDefinitions = (config: LiveAtlasGlobalConfig): Map<string, LiveAtlasServerDefinition> => {
	if (!config) {
		throw new ConfigurationError(`Configuration object is missing`);
	}

	if (typeof config.servers !== 'undefined') {
		return validateLiveAtlasConfiguration(config.servers);
	}

	return validateDynmapConfiguration(window.config?.url || null);
};

