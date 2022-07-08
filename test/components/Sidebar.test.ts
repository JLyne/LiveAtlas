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
// @vitest-environment jsdom

import {mount, VueWrapper} from '@vue/test-utils';
import Sidebar from '../../src/components/Sidebar.vue';
import {addDynmapServer, addWorld, clearServers, clearWorlds, enablePlayerMarkers} from "../helpers";
import {nextTick} from "vue";
import {useStore} from "@/store";
import {MutationTypes} from "@/store/mutation-types";

describe('Sidebar', () => {
  it('exists', () => {
    expect(Sidebar).toBeTruthy()
  });

  let component: VueWrapper;

  beforeEach(async () => {
    clearServers();
    clearWorlds();

    //Add single dynmap server with single world
    addDynmapServer(true);
    addWorld('overworld', 1);

    const host = document.createElement('div');
    document.body.appendChild(host);

    component = mount(Sidebar, {
      attachTo: host,
    });

    useStore().commit(MutationTypes.SET_LOADED, undefined);

    await nextTick();
  });

  describe('Maps button', () => {
    it('not shown when single map and server exist', () =>
        expect(component.find({ref: 'maps-button'}).exists()).toBeFalsy());

    it('shown with server icon when multiple servers exist with single map', async () => {
      addDynmapServer(false); //Extra server

      await nextTick();

      expect(component.find({ref: 'maps-button'}).exists()).toBeTruthy();
      expect(component.getComponent({ref: 'maps-icon'}).props('name')).toBe("servers");
    });

    it('shown with map icon when multiple worlds defined', async () => {
      addWorld('overworld', 1); //Extra world

      await nextTick();

      expect(component.find({ref: 'maps-button'}).exists()).toBeTruthy();
      expect(component.getComponent({ref: 'maps-icon'}).props('name')).toBe("maps");
    });

    it('shown with map icon when single world with multiple maps defined', async () => {
      clearWorlds();
      addWorld('overworld', 2); //World with 2 maps

      await nextTick();

      expect(component.find({ref: 'maps-button'}).exists()).toBeTruthy();
      expect(component.getComponent({ref: 'maps-icon'}).props('name')).toBe("maps");
    });
  });

  describe('Players button', () => {
    it('not shown when player markers are disabled', () => {
      expect(component.find({ref: 'players-button'}).exists()).toBeFalsy();
    });

    it('shown when player markers are enabled', async () => {
      enablePlayerMarkers();
      await nextTick();

      expect(component.find({ref: 'players-button'}).exists()).toBeTruthy();
    });

    it('moves focus to players section on down arrow press', async () => {
      const button = component.find({ref: 'players-button'});
      (button.element as HTMLElement).focus();
      await button.trigger('keydown', {key: 'ArrowDown'})

      expect(document.activeElement!.id).toEqual('players-heading');
    });
  });
});
