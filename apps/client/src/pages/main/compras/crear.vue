<route lang="yaml">
path: /main/compras/crear
meta:
  layout: MainLayout
  title: Nueva Compra
</route>

<script setup>
import CreateComprasView from '@/components/Views/compras/CreateComprasView.vue';
</script>

<template>
  <CreateComprasView />
</template>
