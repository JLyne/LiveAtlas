// noinspection JSUnusedGlobalSymbols

import { defineConfig } from 'vite';
import { resolve } from 'path';
import vue from '@vitejs/plugin-vue';
import svgSpritePlugin from "vite-plugin-svg-sprite-component";
import analyze from 'rollup-plugin-analyzer';

export default defineConfig({
  plugins: [vue(), analyze(), svgSpritePlugin({
    symbolId: (name) => `icon--${name}`,
  })],
  base: './',
  server: {
    port: 8080
  },
  resolve: {
    alias: [
      {
        find: '@',
        replacement: resolve(__dirname, 'src')
      }
    ]
  },
  build: {
    chunkSizeWarningLimit: 600,
    assetsDir: 'live-atlas/assets'
  }
});