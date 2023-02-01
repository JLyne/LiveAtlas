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

window.config = {
 url : {
  configuration: 'http://dynmap.local/standalone/MySQL_configuration.php',
  update: 'http://dynmap.local/standalone/MySQL_update.php?world={world}&ts={timestamp}',
  sendmessage: 'http://dynmap.local/standalone/MySQL_sendmessage.php',
  login: 'http://dynmap.local/standalone/MySQL_login.php',
  register: 'http://dynmap.local/standalone/MySQL_register.php',
  tiles: 'http://dynmap.local/standalone/MySQL_tiles.php?tile=',
  markers: 'http://dynmap.local/standalone/MySQL_markers.php?marker='
 }
};
