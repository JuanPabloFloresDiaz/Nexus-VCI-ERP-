<route lang="yaml">
meta:
  layout: MainLayout
  title: Gestión de Empresas
</route>

<template>
  <component :is="activeView" />
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import EmpresasView from '@/components/Views/empresas/EmpresasView.vue';
import PerfilEmpresaView from '@/components/Views/empresas/PerfilEmpresaView.vue';

const authStore = useAuthStore();

const activeView = computed(() => {
  if (authStore.isSuperAdmin) {
    return EmpresasView;
  }
  return PerfilEmpresaView;
});
</script>
