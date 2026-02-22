<route lang="yaml">
path: /main/divisas
meta:
  layout: MainLayout
  title: Gestión de Divisas
</route>

<script setup>
  import DivisasView from '@/components/Views/divisas/DivisasView.vue';
</script>

<template>
  <DivisasView />
</template>