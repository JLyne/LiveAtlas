/*
 * Copyright 2023 James Lyne
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

import AbstractMapProvider from "@/providers/AbstractMapProvider";
import LeafletMapRenderer from "@/renderers/LeafletMapRenderer";
import {LiveAtlasMapLayer, LiveAtlasMarkerSet, LiveAtlasMarkerSetLayer} from "@/index";
import LiveAtlasMapDefinition from "@/model/LiveAtlasMapDefinition";

export default abstract class LeafletMapProvider extends AbstractMapProvider {
    declare readonly renderer: LeafletMapRenderer;

    protected constructor(name: string, config: any, renderer: LeafletMapRenderer) {
        super(name, config, renderer);
    }

    abstract getBaseMapLayer(options: LiveAtlasMapDefinition): LiveAtlasMapLayer;

    getOverlayMapLayer(set: LiveAtlasMarkerSet): LiveAtlasMapLayer {
        throw new TypeError("Provider does not support overlay map layers");
    }

    getMarkerSetLayer(set: LiveAtlasMarkerSet): LiveAtlasMarkerSetLayer {
        return this.renderer.createMarkerSetLayer(set);
    }

    loadServerConfiguration(): Promise<void> {
        return Promise.resolve(undefined);
    }
}