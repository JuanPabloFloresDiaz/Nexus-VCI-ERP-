<route lang="yaml">
path: /main/productos/editar/:id
meta:
  layout: MainLayout
  title: Editar Producto
</route>

<script setup>
  import UpdateProductosView from '@/components/Views/productos/UpdateProductosView.vue';
</script>

<template>
  <UpdateProductosView />
</template>
