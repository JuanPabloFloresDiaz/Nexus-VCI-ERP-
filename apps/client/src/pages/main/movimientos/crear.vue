<route lang="yaml">
path: /main/movimientos/crear
meta:
  layout: MainLayout
  title: Registrar Movimiento
</route>

<script setup>
  import CreateMovimientosView from '@/components/Views/movimientos/CreateMovimientosView.vue';
</script>

<template>
  <CreateMovimientosView />
</template>
