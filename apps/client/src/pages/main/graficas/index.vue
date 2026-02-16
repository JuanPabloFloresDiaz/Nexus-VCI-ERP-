<route lang="yaml">
meta:
  layout: MainLayout
  requiresAuth: true
  roles: ['Administrador', 'SuperAdministrador'] 
  title: 'Gráficas'
</route>

<script setup>
  import GraficasView from '@/components/Views/graficas/GraficasView.vue';
</script>

<template>
  <GraficasView />
</template>
