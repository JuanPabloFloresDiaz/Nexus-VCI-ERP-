<route lang="yaml">
meta:
  layout: MainLayout
  title: Productos
</route>

<script setup>
  import { computed } from 'vue';
  import ProductosEmpresaView from '@/components/Views/productos/ProductosEmpresaView.vue';
  import ProductosView from '@/components/Views/productos/ProductosView.vue';
  import { useAuth } from '@/hooks/useAuth';

  const { isSuperAdmin, isAdmin } = useAuth();
  const isManager = computed(() => isSuperAdmin.value || isAdmin.value);
</script>

<template>
  <ProductosView v-if="isManager" />
  <ProductosEmpresaView v-else />
</template>
