<route lang="yaml">
path: /main/almacenes/editar/:id
meta:
  layout: MainLayout
  title: Editar Almacén
</route>

<script setup>
  import UpdateAlmacenesView from '@/components/Views/almacenes/UpdateAlmacenesView.vue';
  import { useRoute } from 'vue-router';
  
  const route = useRoute();
</script>

<template>
  <UpdateAlmacenesView :id="route.params.id" />
</template>
