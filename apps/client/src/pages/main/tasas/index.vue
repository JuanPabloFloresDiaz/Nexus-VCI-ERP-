<route lang="yaml">
path: /main/tasas
meta:
  layout: MainLayout
  title: Gestión de Tasas
</route>

<script setup>
  import TasasCambioView from '@/components/Views/Tasas/TasasCambioView.vue';
</script>

<template>
  <TasasCambioView />
</template>