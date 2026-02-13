/**
 * plugins/index.js
 *
 * Automatically included in `./src/main.js`
 */

// Plugins
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { QuillEditor } from '@vueup/vue-quill'
import { vMaska } from 'maska/vue'
import router from '@/router'
import pinia from '@/stores'
import vuetify from './vuetify'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

export function registerPlugins(app) {

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // staleTime: 1000 * 60 * 5, // 5 minutes
      }
    }
  })

  app
    .use(vuetify)
    .use(router)
    .use(pinia)
    .use(VueQueryPlugin, { queryClient })
    .use(VueQueryPlugin, { queryClient })
    .component('QuillEditor', QuillEditor)
    .directive('maska', vMaska)
}
