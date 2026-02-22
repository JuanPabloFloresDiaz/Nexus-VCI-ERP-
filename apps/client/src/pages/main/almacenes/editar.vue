<route lang="yaml">
path: /main/almacenes/editar/:id
meta:
  layout: MainLayout
  title: Editar Almacén
</route>

<script setup>
  import { useRoute } from 'vue-router';
  import UpdateAlmacenesView from '@/components/Views/almacenes/UpdateAlmacenesView.vue';
  
  const route = useRoute();
</script>

<template>
  <UpdateAlmacenesView :id="route.params.id" />
</template>
