<route lang="yaml">
path: /main/compras/editar/[id]
meta:
  layout: MainLayout
  title: Editar Compra
</route>

<script setup>
  import { useRoute } from 'vue-router';
  import UpdateComprasView from '@/components/Views/compras/UpdateComprasView.vue';

  const route = useRoute();
</script>

<template>
  <UpdateComprasView :id="route.params.id" />
</template>
