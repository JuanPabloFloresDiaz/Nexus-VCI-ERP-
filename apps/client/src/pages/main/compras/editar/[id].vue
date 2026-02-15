<route lang="yaml">
path: /main/compras/editar/[id]
meta:
  layout: MainLayout
  title: Editar Compra
</route>

<script setup>
import UpdateComprasView from '@/components/Views/compras/UpdateComprasView.vue';
import { useRoute } from 'vue-router';

const route = useRoute();
</script>

<template>
  <UpdateComprasView :id="route.params.id" />
</template>
