<route lang="yaml">
path: /main/almacenes
meta:
  layout: MainLayout
  title: Gestión de Almacenes
</route>

<script setup>
  import { computed } from 'vue';
  import AlmacenesEmpresaView from '@/components/Views/almacenes/AlmacenesEmpresaView.vue';
  import AlmacenesView from '@/components/Views/almacenes/AlmacenesView.vue';
  import { useAuthStore } from '@/stores/auth';

  const authStore = useAuthStore();
  const userRole = computed(() => authStore.user?.rol);

  const isVendor = computed(() => userRole.value === 'Vendedor');
</script>

<template>
  <AlmacenesEmpresaView v-if="isVendor" />
  <AlmacenesView v-else />
</template>
