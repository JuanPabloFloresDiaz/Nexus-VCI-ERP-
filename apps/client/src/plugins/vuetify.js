/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Composables
import { createVuetify } from 'vuetify'

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    defaultTheme: 'nexusTheme',
    themes: {
      nexusTheme: {
        dark: false,
        colors: {
          primary: '#1E293B', // Slate - Blue Tech
          secondary: '#3B82F6', // Action Blue
          accent: '#F59E0B', // Gold Sand
          error: '#E11D48', // Rosewood
          info: '#0EA5E9', // Sky
          success: '#10B981', // Emerald
          warning: '#FBBF24', // Amber
          background: '#F8FAFC', // Slate 50
          surface: '#FFFFFF',
        },
      },
    },
  },
})
