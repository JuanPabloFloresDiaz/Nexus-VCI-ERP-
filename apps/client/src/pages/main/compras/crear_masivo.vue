<route lang="yaml">
path: /main/compras/crear-masivo
meta:
  layout: MainLayout
  title: Carga Masiva de Compras
</route>

<script setup>
  import BulkCreateComprasView from '@/components/Views/compras/BulkCreateComprasView.vue';
</script>

<template>
  <BulkCreateComprasView />
</template>
