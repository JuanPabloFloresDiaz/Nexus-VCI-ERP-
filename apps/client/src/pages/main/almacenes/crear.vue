<route lang="yaml">
path: /main/almacenes/crear
meta:
  layout: MainLayout
  title: Crear Almacén
</route>

<script setup>
  import CreateAlmacenesView from '@/components/Views/almacenes/CreateAlmacenesView.vue';
</script>

<template>
  <CreateAlmacenesView />
</template>
