<script setup>
  import ClientesView from '@/components/Views/clientes/ClientesView.vue';
</script>

<route lang="yaml">
path: /main/clientes
meta:
  layout: MainLayout
  title: Gestión de Clientes
</route>

<template>
  <ClientesView />
</template>
