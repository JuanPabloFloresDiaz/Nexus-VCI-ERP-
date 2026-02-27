/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Composables
import { createVuetify } from 'vuetify'
// Styles
import '@mdi/font/css/materialdesignicons.css'

import 'vuetify/styles'

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    defaultTheme: 'nexusTheme', // Se mantiene el default por seguridad pre-login
    themes: {
      // TEMAS PRINCIPALES (nexusTheme, darkTheme, oceanTheme) ---
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
      darkTheme: {
        dark: true,
        colors: {
          primary: '#38BDF8', // Light Blue
          secondary: '#818CF8', // Indigo 400 
          accent: '#FCD34D', // Amber 300
          error: '#F43F5E', // Rose
          info: '#38BDF8', // Light Blue
          success: '#34D399', // Emerald 400
          warning: '#FBBF24', // Amber 400
          background: '#020617', // Slate 950
          surface: '#1E293B', // Slate 800
        },
      },
      oceanTheme: {
        dark: false,
        colors: {
          primary: '#0369A1', // Sky 700
          secondary: '#0EA5E9', // Sky 500
          accent: '#0D9488', // Teal 600
          error: '#EF4444', // Red 500
          info: '#38BDF8', // Light Blue 400
          success: '#10B981', // Emerald 500
          warning: '#F59E0B', // Amber 500
          background: '#F0F9FF', // Sky 50
          surface: '#FFFFFF',
        },
      },
      // --- NUEVOS TEMAS ---
      /** * Tema Industrial
       * Uso de Negro, Rojo y Amarillo con un toque moderno
       */
      industrialTheme: {
        dark: false,
        colors: {
          primary: '#1A1A1A',     // Negro Carbón (Dominante)
          secondary: '#B91C1C',   // Rojo Intenso (Acentos)
          accent: '#FACC15',      // Amarillo (Detalles/Alertas)
          error: '#991B1B',
          info: '#3F3F46',
          success: '#15803D',
          warning: '#EAB308',
          background: '#F4F4F5',  // Zinc 100
          surface: '#FFFFFF',
        },
      },
      /**
             * Tema Nature (Verde Foresta)
             * Ideal para empresas agrícolas, ecológicas o de salud.
             */
      natureTheme: {
        dark: false,
        colors: {
          primary: '#166534',     // Green 800
          secondary: '#22C55E',   // Green 500
          accent: '#84CC16',      // Lime 500
          error: '#DC2626',
          info: '#06B6D4',
          success: '#10B981',
          warning: '#F59E0B',
          background: '#F0FDF4',  // Green 50
          surface: '#FFFFFF',
        },
      },

      /**
       * Tema Crimson (Rojo Corporativo)
       * Un rojo sobrio, no tan chillante, tipo "Banco" o "Logística".
       */
      crimsonTheme: {
        dark: false,
        colors: {
          primary: '#991B1B',     // Red 800
          secondary: '#EF4444',   // Red 500
          accent: '#475569',      // Slate 600 (Gris azulado para balancear el rojo)
          error: '#B91C1C',
          info: '#2563EB',
          success: '#059669',
          warning: '#D97706',
          background: '#FEF2F2',  // Red 50
          surface: '#FFFFFF',
        },
      },

      /**
       * Tema Earth (Café / Madera)
       * Muy elegante para consultorías, mueblerías o despachos legales.
       */
      earthTheme: {
        dark: false,
        colors: {
          primary: '#451A03',     // Amber 950 (Café profundo)
          secondary: '#92400E',   // Amber 800
          accent: '#D97706',      // Amber 600
          error: '#991B1B',
          info: '#075985',
          success: '#166534',
          warning: '#CA8A04',
          background: '#FFFBEB',  // Amber 50
          surface: '#FFFFFF',
        },
      },
      /**
       * Tema Majestad (Púrpura / Luxury)
       * Ideal para marcas de alta gama, diseño o servicios VIP.
       */
      royalTheme: {
        dark: false,
        colors: {
          primary: '#581C87',     // Purple 900
          secondary: '#A855F7',   // Purple 500
          accent: '#EC4899',      // Pink 500
          error: '#BE123C',
          info: '#6366F1',
          success: '#22C55E',
          warning: '#EAB308',
          background: '#FAF5FF',  // Purple 50
          surface: '#FFFFFF',
        },
      },

      /**
       * Tema Carbono (Gris Sofisticado)
       * Un look minimalista y serio, excelente para tecnología de datos o arquitectura.
       */
      carbonTheme: {
        dark: false,
        colors: {
          primary: '#334155',     // Slate 700
          secondary: '#64748B',   // Slate 500
          accent: '#0F172A',      // Slate 900
          error: '#E11D48',
          info: '#334155',
          success: '#475569',
          warning: '#94A3B8',
          background: '#F1F5F9',  // Slate 100
          surface: '#FFFFFF',
        },
      },
    },
  },
},
)
