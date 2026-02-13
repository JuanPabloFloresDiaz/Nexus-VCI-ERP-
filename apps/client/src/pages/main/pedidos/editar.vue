<route lang="yaml">
path: /main/pedidos/editar/:id
meta:
  layout: MainLayout
  title: Editar Pedido
</route>

<script setup>
  import UpdatePedidosView from '@/components/Views/pedidos/UpdatePedidosView.vue';
</script>

<template>
  <UpdatePedidosView />
</template>
