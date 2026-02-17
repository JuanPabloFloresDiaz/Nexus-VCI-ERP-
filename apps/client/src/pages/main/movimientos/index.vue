<route lang="yaml">
path: /main/movimientos
meta:
  layout: MainLayout
  title: Movimientos de Inventario
</route>

<script setup>
  import { computed } from 'vue';
  import MovimientosEmpresaView from '@/components/Views/movimientos/MovimientosEmpresaView.vue';
  import MovimientosView from '@/components/Views/movimientos/MovimientosView.vue';
  import { useAuthStore } from '@/stores/auth';

  const authStore = useAuthStore();
  const userRole = computed(() => authStore.user?.rol);

  const isVendor = computed(() => userRole.value === 'Vendedor');
</script>

<template>
  <MovimientosEmpresaView v-if="isVendor" />
  <MovimientosView v-else />
</template>
