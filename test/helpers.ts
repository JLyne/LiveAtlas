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

import {useStore} from "@/store";
import {MutationTypes} from "@/store/mutation-types";
import {getDefaultPlayerImage} from "@/util/images";
import {LiveAtlasDimension, LiveAtlasWorldDefinition, PlayerImageQueueEntry} from "../src";
import LiveAtlasMapDefinition from "../src/model/LiveAtlasMapDefinition";

export const enablePlayerMarkers = () => {
	useStore().commit(MutationTypes.SET_COMPONENTS, {
      players: {
        markers: {
          hideByDefault: false,
          layerName: 'Players',
          imageSize: 'large',
          layerPriority: 0,
          showHealth: true,
          showArmor: true,
          showYaw: false,
        },
        showImages: true,
        grayHiddenPlayers: true,
        imageUrl: getDefaultPlayerImage,
      }
    });
};

/**
 * Clears any test servers added to the store
 */
export const clearServers = () => {
    useStore().commit(MutationTypes.SET_SERVERS, new Map());
};

/**
 * Adds a test Dynmap server definition to the store, optionally setting it as the current server
 * @param setAsCurrent
 */
export const addDynmapServer = (setAsCurrent: boolean) => {
    const store = useStore(),
        servers = new Map(store.state.servers),
        id = `dynmap_${servers.size}`;

    servers.set(id, {
        id,
        label: `Dynmap ${servers.size}`,
        dynmap: {
            configuration: 'configuration',
            update: 'update',
            sendmessage: 'sendMessage',
            login: 'login',
            register: 'register',
            tiles: 'tiles',
            markers: 'markers',
        }
    })

    useStore().commit(MutationTypes.SET_SERVERS, servers);

    if(setAsCurrent) {
        useStore().commit(MutationTypes.SET_CURRENT_SERVER, id);
    }
};

/**
 * Adds a test Pl3xmap server definition to the store, optionally setting it as the current server
 * @param setAsCurrent
 */
export const addPl3xmapServer = (setAsCurrent: boolean) => {
    const store = useStore(),
        servers = new Map(store.state.servers),
        id = `pl3xmap_${servers.size}`;

    servers.set(id, {
        id,
        label: `Pl3xmap ${servers.size}`,
        pl3xmap: 'pl3xmap',
    });

    useStore().commit(MutationTypes.SET_SERVERS, servers);

    if(setAsCurrent) {
        useStore().commit(MutationTypes.SET_CURRENT_SERVER, id);
    }
};

/**
 * Adds a test Overviewer server definition to the store, optionally setting it as the current server
 * @param setAsCurrent
 */
export const addOverviewerServer = (setAsCurrent: boolean) => {
    const store = useStore(),
        servers = new Map(store.state.servers),
        id = `overviewer_${servers.size}`;

    servers.set(id, {
        id,
        label: `Overviewer ${servers.size}`,
        overviewer: 'overviewer',
    });

    useStore().commit(MutationTypes.SET_SERVERS, servers);

    if(setAsCurrent) {
        useStore().commit(MutationTypes.SET_CURRENT_SERVER, id);
    }
};

/**
 * Clears any test worlds added to the store
 */
export const clearWorlds = () => {
    useStore().commit(MutationTypes.SET_WORLDS, [])
}

/**
 * Adds a test world to the store with the given dimension and number of test maps
 * @param dimension
 * @param mapCount
 */
export const addWorld = (dimension: LiveAtlasDimension, mapCount: number) => {
    const store = useStore(),
        worlds = [...store.state.worlds.values()],
        world: LiveAtlasWorldDefinition = {
			name: `${dimension}_${worlds.length}`,
			displayName: `${dimension} ${worlds.length}`,
			dimension,
			seaLevel: 64,
			maps: new Set()
		};

    for(let i = 0; i < mapCount; i++) {
        world.maps.add(new LiveAtlasMapDefinition({
            name: `map_${i}`,
            world,
            baseUrl: 'test/',
            tileSize: 128,
            imageFormat: 'png',
            nativeZoomLevels: 1
        }));
    }

    worlds.push(world);
    store.commit(MutationTypes.SET_WORLDS, worlds);
};

export const useDefaultImageProvider = () => {
    const store = useStore();

    store.commit(MutationTypes.SET_COMPONENTS, {
        players: Object.assign({
            imageUrl: getDefaultPlayerImage
        }, store.state.components.players)
    });
}

export const useTestImageProvider = (): (entry: PlayerImageQueueEntry) => string => {
    const provider = (entry: PlayerImageQueueEntry) => `/test/${entry.name}`,
        store = useStore();

    store.commit(MutationTypes.SET_COMPONENTS, {
        players: Object.assign({
            imageUrl: provider
        }, store.state.components.players)
    });

    return provider;
}
