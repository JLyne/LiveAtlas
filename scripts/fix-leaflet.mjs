// @ts-check
import pkgJson from '../node_modules/leaflet/package.json';

import { writeFileSync } from 'fs';

writeFileSync(
  './node_modules/leaflet/package.json',
  JSON.stringify({
    ...pkgJson,
    module: 'dist/leaflet-src.esm.js',
  }, null, 2));