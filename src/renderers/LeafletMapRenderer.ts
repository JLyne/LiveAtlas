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

import AbstractMapRenderer from "@/renderers/AbstractMapRenderer";
import {LiveAtlasMapViewTarget} from "@/index";

export default class LeafletMapRenderer extends AbstractMapRenderer {

    constructor() {
        super();
    }
    init(element: HTMLElement): void {

    }

    destroy(): void {

    }

    focus(): void {

    }

    setView(target: LiveAtlasMapViewTarget): void {

    }

    zoomIn(): void {
    }

    zoomOut(): void {
    }
}