<route lang="yaml">
path: /main/categorizacion/editar/:id
meta:
  layout: MainLayout
  title: Editar Categoría
</route>

<script setup>
  import UpdateCategorizacionView from '@/components/Views/categorizacion/UpdateCategorizacionView.vue';
</script>

<template>
  <UpdateCategorizacionView />
</template>
