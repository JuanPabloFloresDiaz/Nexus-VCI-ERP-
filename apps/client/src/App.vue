<template>
  <router-view />
</template>

<script setup>
  import { useHead } from '@unhead/vue'

  useHead({
    titleTemplate: '%s | Nexus VCI',
    meta: [
      { name: 'description', content: 'Sistema ERP para gestión empresarial' },
      { property: 'og:title', content: 'Nexus VCI ERP' },
      { property: 'og:description', content: 'Sistema ERP para gestión empresarial' },
    ],
  })
</script>
