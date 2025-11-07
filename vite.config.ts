import { fileURLToPath, URL } from 'node:url'
import VueRouter from 'unplugin-vue-router/vite'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    VueRouter({}),
    vue(),
    vueDevTools(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  optimizeDeps:{
    include:['tslib'],
  },
  build:{
    rollupOptions:{
      external:['tslib'],
    }
  },
  resolve: {
    alias: {
      '@':path.resolve(__dirname,'./src')
    },
  },
})
