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
  import EmpresasView from '@/components/Views/empresas/EmpresasView.vue';
  import PerfilEmpresaView from '@/components/Views/empresas/PerfilEmpresaView.vue';
  import { useAuthStore } from '@/stores/auth';

  const authStore = useAuthStore();

  const activeView = computed(() => {
    if (authStore.isSuperAdmin) {
      return EmpresasView;
    }
    return PerfilEmpresaView;
  });
</script>
