<template>
  <router-view />
</template>

<script setup>
  import { useHead } from '@unhead/vue'
  import { watch, onMounted } from 'vue'
  import { useTheme } from 'vuetify'
  import { useAuth } from '@/hooks/useAuth'

  useHead({
    titleTemplate: '%s | Nexus VCI',
    meta: [
      { name: 'description', content: 'Sistema ERP para gestión empresarial' },
      { property: 'og:title', content: 'Nexus VCI ERP' },
      { property: 'og:description', content: 'Sistema ERP para gestión empresarial' },
    ],
  })

  const theme = useTheme()
  const { currentTheme } = useAuth()

  // Sincronizar tema de Vuetify con el estado global de config
  const applyTheme = (newTheme) => {
    if (newTheme) {
      theme.global.name.value = newTheme
    } else {
      theme.global.name.value = 'nexusTheme' // fallback
    }
  }

  // Vigilar cambios en la sesión (ej. después de login normal)
  watch(() => currentTheme.value, (newTheme) => {
    applyTheme(newTheme)
  })

  // Aplicar tema al iniciar la app (usando la persistencia de Pinia/localStorage)
  onMounted(() => {
    applyTheme(currentTheme.value)
  })
</script>
