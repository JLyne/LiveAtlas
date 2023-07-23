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
import {PlayerMarker as BluemapPlayerMarker} from "bluemap/BlueMap";
import {LiveAtlasChat, LiveAtlasPlayer, LiveAtlasPlayerMarker} from "@/index";

export class PlayerMarker extends BluemapPlayerMarker implements LiveAtlasPlayerMarker {

    constructor(player: LiveAtlasPlayer) {
        super("bm-player-" + player.uuid!, player.uuid!);
    }

    update(player: LiveAtlasPlayer) {
        this.updateFromData({
            position: player.location,
            rotation: player.rotation,
            name: player.name,
        });
    }

    destroy() {

    }

    disable() {
        this.data.visible = false;
    }

    enable() {
        this.data.visible = true;
    }

    toggle() {
        this.data.visible = !this.data.visible;
    }

    showChat(chat: LiveAtlasChat[]) {
        //Not supported by bluemap
    }
}