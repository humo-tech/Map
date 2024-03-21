import { defineConfig } from 'astro/config'
import cesium from 'vite-plugin-cesium'

import vue from '@astrojs/vue'

// https://astro.build/config
export default defineConfig({
  site: 'https://humo-tech.github.io/',
  base: '/Map',
  server: {
    host: '0.0.0.0',
  },
  integrations: [vue()],
  vite: {
    plugins: [cesium({})],
  },
})
